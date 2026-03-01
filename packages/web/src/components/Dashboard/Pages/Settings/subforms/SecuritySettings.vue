<template>
  <div>
    <div>
      <h4 class="scroll-m-20 text-xl tracking-tight font-medium">Security</h4>
      <p class="text-slate-400">Settings for the Security configuration</p>
    </div>
    <FormGrid>
      <FormRow
        label="Private key"
        for-id="privateKey"
        description="Used to create a shared key with a remote device."
      >
        <FormKeyGenerator
          :initial-key="privateKeyInput"
          :initial-key-size="32"
          :error="useGetError(keysV$.privateKeyInput)"
          :fixed-key32="true"
          @update-key="onPrivateKeyUpdate"
        />
      </FormRow>

      <FormRow
        label="Public key"
        for-id="publicKey"
        description="Sent out to other nodes on the mesh to allow them to compute a shared secret key."
      >
        <FormKeyInput v-model:base64-key="publicKeyInput" :disabled="true" />
      </FormRow>
    </FormGrid>
    <div class="pt-2">
      <h4 class="scroll-m-20 text-xl tracking-tight font-medium">Administration</h4>
      <p class="text-slate-400">Settings for remote administration</p>
    </div>
    <FormGrid>
      <FormRow
        label="First administration key"
        for-id="firstAdminKey"
        description="First public key authorized to send admin messages to this node."
      >
        <FormKeyInput
          :error="useGetError(keysV$.adminKey0Input)"
          v-model:base64-key="adminKey0Input"
        />
      </FormRow>

      <FormRow
        label="Second administration key"
        for-id="secondAdminKey"
        description="Second public key authorized to send admin messages to this node."
      >
        <FormKeyInput
          :error="useGetError(keysV$.adminKey1Input)"
          v-model:base64-key="adminKey1Input"
        />
      </FormRow>

      <FormRow
        label="Third administration key"
        for-id="thirdAdminKey"
        description="Third public key authorized to send admin messages to this node."
      >
        <FormKeyInput
          :error="useGetError(keysV$.adminKey2Input)"
          v-model:base64-key="adminKey2Input"
        />
      </FormRow>

      <FormRow
        label="Managed mode"
        for-id="managedMode"
        description="If enabled, device configuration options are only able to be changed remotely by a remote node via administration messages. Do not enable this option unless at least one suitable remote administration node has been setup, and its public key is stored in one of the fields above."
      >
        <ToggleSwitch input-id="managedMode" v-model="isManaged" />
      </FormRow>

      <FormRow
        label="Allow legacy administration"
        for-id="legacyAdmin"
        description="Allow incoming device control over the insecure legacy administration channel."
      >
        <ToggleSwitch input-id="legacyAdmin" v-model="adminChannelEnabled" />
      </FormRow>
    </FormGrid>
    <div class="pt-2">
      <h4 class="scroll-m-20 text-xl tracking-tight font-medium">Logging</h4>
      <p class="text-slate-400">Settings for debug logging</p>
    </div>
    <FormGrid>
      <FormRow
        label="Enable Debug Log API"
        for-id="debugLog"
        description="Output live debug logging over serial, view and export position-redacted device logs over Bluetooth."
      >
        <ToggleSwitch input-id="debugLog" v-model="debugLogApiEnabled" />
      </FormRow>

      <FormRow
        label="Serial Output Enabled"
        for-id="serialOutput"
        description="Serial Console over the Stream API."
      >
        <ToggleSwitch input-id="serialOutput" v-model="serialEnabled" />
      </FormRow>
    </FormGrid>
  </div>
</template>
<script setup lang="ts">
import { ref, watch } from 'vue';
import FormGrid from '../components/FormGrid.vue';
import FormRow from '../components/FormRow.vue';
import useVuelidate from '@vuelidate/core';
import { useGetError } from '@/composables/useGetError';
import FormKeyInput from '../components/FormKeyInput.vue';
import FormKeyGenerator from '../components/FormKeyGenerator.vue';
import { useBase64KeyRules } from '@/composables/useBase64KeyValidator';
import { useBase64KeyField } from '@/composables/useBase64KeyField';

const privateKey = defineModel<Uint8Array>('privateKey');
const publicKey = defineModel<Uint8Array>('publicKey');
const adminKey0 = defineModel<Uint8Array>('adminKey0');
const adminKey1 = defineModel<Uint8Array>('adminKey1');
const adminKey2 = defineModel<Uint8Array>('adminKey2');
const isManaged = defineModel<boolean>('isManaged');
const adminChannelEnabled = defineModel<boolean>('adminChannelEnabled');
const debugLogApiEnabled = defineModel<boolean>('debugLogApiEnabled');
const serialEnabled = defineModel<boolean>('serialEnabled');

const privateKeyInput = useBase64KeyField(privateKey);
const publicKeyInput = useBase64KeyField(publicKey);
const adminKey0Input = useBase64KeyField(adminKey0);
const adminKey1Input = useBase64KeyField(adminKey1);
const adminKey2Input = useBase64KeyField(adminKey2);

const onPrivateKeyUpdate = (payload: { privateKey: string; publicKey: string; length: number }) => {
  privateKeyInput.value = payload.privateKey;
  publicKeyInput.value = payload.publicKey;
  keysV$.value.privateKeyInput.$touch();
};

const keysV$ = useVuelidate(
  {
    privateKeyInput: useBase64KeyRules(ref(32), 'Private key'),
    adminKey0Input: useBase64KeyRules(ref(32), 'First administration key'),
    adminKey1Input: useBase64KeyRules(ref(32), 'Second administration key'),
    adminKey2Input: useBase64KeyRules(ref(32), 'Third administration key'),
  },
  { privateKeyInput, adminKey0Input, adminKey1Input, adminKey2Input }
);

watch(privateKeyInput, () => keysV$.value.privateKeyInput.$touch());
watch(adminKey0Input, () => keysV$.value.adminKey0Input.$touch());
watch(adminKey1Input, () => keysV$.value.adminKey1Input.$touch());
watch(adminKey2Input, () => keysV$.value.adminKey2Input.$touch());
</script>
