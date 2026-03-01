<template>
  <div class="pt-2">
    <div>
      <h4 class="scroll-m-20 text-xl tracking-tight font-medium">Wifi</h4>
      <p class="text-slate-400">Settings for the Wifi network</p>
      <p class="text-slate-400 text-xs">
        Some devices (ESP32) cannot use both Bluetooth and WiFi at the same time.
      </p>
    </div>
    <FormGrid>
      <FormRow
        label="Wifi enabled"
        for-id="wifiEnabled"
        description="Enable or disable the WiFi radio."
      >
        <ToggleSwitch input-id="wifiEnabled" v-model="wifiEnabled" />
      </FormRow>

      <FormRow
        label="SSID"
        for-id="wifiSsid"
        description="SSID."
        :error="useGetError(networkV$.wifiSsid)"
      >
        <InputText
          id="wifiSsid"
          class="dark:bg-slate-800 dark:text-slate-400 w-full"
          size="small"
          v-model="wifiSsid"
          type="text"
          minlength="0"
          maxlength="33"
          :invalid="networkV$.wifiSsid.$invalid"
          @blur="networkV$.wifiSsid.$touch()"
          :disabled="!wifiEnabled"
        />
      </FormRow>

      <FormRow
        label="PSK"
        for-id="wifiPsk"
        description="Network password."
        :error="useGetError(networkV$.onBatteryShutdownAfterSecs)"
      >
        <InputText
          id="wifiPsk"
          class="dark:bg-slate-800 dark:text-slate-400 w-full"
          size="small"
          v-model="wifiPsk"
          type="password"
          minlength="0"
          maxlength="64"
          :invalid="networkV$.wifiPsk.$invalid"
          @blur="networkV$.wifiPsk.$touch()"
          :disabled="!wifiEnabled"
        />
      </FormRow>
    </FormGrid>

    <div>
      <h4 class="scroll-m-20 text-xl tracking-tight font-medium">Network</h4>
      <p class="text-slate-400">General network settings.</p>
    </div>
    <FormGrid>
      <FormRow
        label="Ethernet enabled"
        for-id="ethEnabled"
        description="Enable or disable the Ethernet port."
      >
        <ToggleSwitch input-id="ethEnabled" v-model="ethEnabled" />
      </FormRow>

      <FormRow
        label="IP address mode"
        for-id="addrMode"
        description="Address assignment selection."
        :error="useGetError(networkV$.addressMode)"
      >
        <Select
          aria-labelledby="addrMode"
          class="dark:bg-slate-800 dark:text-slate-400 w-full"
          label-class="dark:bg-slate-800 dark:text-slate-400"
          size="small"
          v-model="addressMode"
          :options="addressModeOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Select address mode"
          :invalid="networkV$.addressMode.$invalid"
          @blur="networkV$.addressMode.$touch()"
        />
      </FormRow>

      <FormRow label="IP" for-id="ip" description="IP Address." :error="useGetError(ipV$.ip)">
        <InputText
          id="ip"
          class="dark:bg-slate-800 dark:text-slate-400 w-full"
          size="small"
          v-model="ip"
          type="text"
          inputmode="numeric"
          placeholder="0.0.0.0"
          pattern="^((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)$"
          minlength="0"
          maxlength="15"
          :invalid="ipV$.ip.$invalid"
          @blur="ipV$.ip.$touch()"
        />
      </FormRow>

      <FormRow
        label="Gateway"
        for-id="gateway"
        description="Default Gateway."
        :error="useGetError(ipV$.gateway)"
      >
        <InputText
          id="gateway"
          class="dark:bg-slate-800 dark:text-slate-400 w-full"
          size="small"
          v-model="gateway"
          type="text"
          inputmode="numeric"
          placeholder="0.0.0.0"
          pattern="^((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)$"
          minlength="0"
          maxlength="15"
          :invalid="ipV$.gateway.$invalid"
          @blur="ipV$.gateway.$touch()"
        />
      </FormRow>

      <FormRow
        label="Subnet"
        for-id="subnet"
        description="Subnet Mask."
        :error="useGetError(ipV$.subnet)"
      >
        <InputText
          id="subnet"
          class="dark:bg-slate-800 dark:text-slate-400 w-full"
          size="small"
          v-model="subnet"
          type="text"
          inputmode="numeric"
          placeholder="0.0.0.0"
          pattern="^((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)$"
          minlength="0"
          maxlength="15"
          :invalid="ipV$.subnet.$invalid"
          @blur="ipV$.subnet.$touch()"
        />
      </FormRow>

      <FormRow label="DNS" for-id="ip" description="DNS server." :error="useGetError(ipV$.dns)">
        <InputText
          id="ip"
          class="dark:bg-slate-800 dark:text-slate-400 w-full"
          size="small"
          v-model="dns"
          type="text"
          inputmode="numeric"
          placeholder="0.0.0.0"
          pattern="^((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)$"
          minlength="0"
          maxlength="15"
          :invalid="ipV$.ip.$invalid"
          @blur="ipV$.dns.$touch()"
        />
      </FormRow>

      <FormRow
        label="Mesh via UDP"
        for-id="enabledProtocols"
        description="Mesh over UDP mode."
        :error="useGetError(networkV$.enabledProtocols)"
      >
        <Select
          aria-labelledby="enabledProtocols"
          class="dark:bg-slate-800 dark:text-slate-400 w-full"
          label-class="dark:bg-slate-800 dark:text-slate-400"
          size="small"
          v-model="enabledProtocols"
          :options="enabledProtocolsOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Select UDP mode"
          :invalid="networkV$.enabledProtocols.$invalid"
          @blur="networkV$.enabledProtocols.$touch()"
        />
      </FormRow>

      <FormRow
        label="NTP Server"
        for-id="ntpServer"
        description="NTP server address."
        :error="useGetError(networkV$.ntpServer)"
      >
        <InputText
          id="ntpServer"
          class="dark:bg-slate-800 dark:text-slate-400 w-full"
          size="small"
          v-model="ntpServer"
          type="text"
          minlength="0"
          maxlength="33"
          :invalid="networkV$.ntpServer.$invalid"
          @blur="networkV$.ntpServer.$touch()"
        />
      </FormRow>

      <FormRow
        label="Rsyslog Server"
        for-id="rsyslogServer"
        description="Rsyslog server address."
        :error="useGetError(networkV$.rsyslogServer)"
      >
        <InputText
          id="rsyslogServer"
          class="dark:bg-slate-800 dark:text-slate-400 w-full"
          size="small"
          v-model="rsyslogServer"
          type="text"
          minlength="0"
          maxlength="33"
          :invalid="networkV$.rsyslogServer.$invalid"
          @blur="networkV$.rsyslogServer.$touch()"
        />
      </FormRow>
    </FormGrid>
  </div>
</template>

<script setup lang="ts">
import { Protobuf } from '@meshtastic/core';
import type { Validation } from '@vuelidate/core';
import FormGrid from '../components/FormGrid.vue';
import FormRow from '../components/FormRow.vue';
import { useGetError } from '@/composables/useGetError';
import { useEnumOptions } from '@/composables/useEnumOptions';

defineProps<{
  networkV$: Validation;
  ipV$: Validation;
}>();

const wifiEnabled = defineModel<boolean>('wifiEnabled');
const ethEnabled = defineModel<boolean>('ethEnabled');
const addressMode = defineModel<number>('addressMode');
const enabledProtocols = defineModel<number>('enabledProtocols');
const wifiSsid = defineModel<string>('wifiSsid');
const wifiPsk = defineModel<string>('wifiPsk');
const ntpServer = defineModel<string>('ntpServer');
const rsyslogServer = defineModel<string>('rsyslogServer');
const ip = defineModel<string>('ip');
const gateway = defineModel<string>('gateway');
const subnet = defineModel<string>('subnet');
const dns = defineModel<string>('dns');

const addressModeOptions = useEnumOptions(Protobuf.Config.Config_NetworkConfig_AddressMode);

const enabledProtocolsOptions = useEnumOptions(Protobuf.Config.Config_NetworkConfig_ProtocolFlags);
</script>
