<template>
  <div class="pt-2">
    <div>
      <h4 class="scroll-m-20 text-xl tracking-tight font-medium">Wifi Settings</h4>
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

      <FormRow label="SSID" for-id="wifiSsid" description="SSID." :error="useGetError(v$.wifiSsid)">
        <InputText
          id="wifiSsid"
          class="dark:bg-slate-800 dark:text-slate-400"
          size="small"
          v-model="wifiSsid"
          type="text"
          minlength="0"
          maxlength="33"
          :invalid="v$.wifiSsid.$invalid"
          @blur="v$.wifiSsid.$touch()"
          :disabled="!wifiEnabled"
        />
      </FormRow>

      <FormRow
        label="PSK"
        for-id="wifiPsk"
        description="Network password."
        :error="useGetError(v$.onBatteryShutdownAfterSecs)"
      >
        <InputText
          id="wifiPsk"
          class="dark:bg-slate-800 dark:text-slate-400"
          size="small"
          v-model="wifiPsk"
          type="password"
          minlength="0"
          maxlength="64"
          :invalid="v$.wifiPsk.$invalid"
          @blur="v$.wifiPsk.$touch()"
          :disabled="!wifiEnabled"
        />
      </FormRow>
    </FormGrid>

    <div>
      <h4 class="scroll-m-20 text-xl tracking-tight font-medium">Network Settings</h4>
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
        :error="useGetError(v$.addressMode)"
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
          :invalid="v$.addressMode.$invalid"
          @blur="v$.addressMode.$touch()"
        />
      </FormRow>

      <FormRow label="IP" for-id="ip" description="IP Address." :error="useGetError(v$.ip)">
        <InputText
          id="ip"
          class="dark:bg-slate-800 dark:text-slate-400"
          size="small"
          v-model="ip"
          type="text"
          inputmode="numeric"
          placeholder="0.0.0.0"
          pattern="^((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)$"
          minlength="0"
          maxlength="15"
          :invalid="v$.ip.$invalid"
          @blur="v$.ip.$touch()"
        />
      </FormRow>

      <FormRow
        label="Gateway"
        for-id="gateway"
        description="Default Gateway."
        :error="useGetError(v$.gateway)"
      >
        <InputText
          id="gateway"
          class="dark:bg-slate-800 dark:text-slate-400"
          size="small"
          v-model="gateway"
          type="text"
          inputmode="numeric"
          placeholder="0.0.0.0"
          pattern="^((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)$"
          minlength="0"
          maxlength="15"
          :invalid="v$.gateway.$invalid"
          @blur="v$.gateway.$touch()"
        />
      </FormRow>

      <FormRow
        label="Subnet"
        for-id="subnet"
        description="Subnet Mask."
        :error="useGetError(v$.subnet)"
      >
        <InputText
          id="subnet"
          class="dark:bg-slate-800 dark:text-slate-400"
          size="small"
          v-model="subnet"
          type="text"
          inputmode="numeric"
          placeholder="0.0.0.0"
          pattern="^((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)$"
          minlength="0"
          maxlength="15"
          :invalid="v$.subnet.$invalid"
          @blur="v$.subnet.$touch()"
        />
      </FormRow>

      <FormRow label="DNS" for-id="ip" description="DNS server." :error="useGetError(v$.dns)">
        <InputText
          id="ip"
          class="dark:bg-slate-800 dark:text-slate-400"
          size="small"
          v-model="dns"
          type="text"
          inputmode="numeric"
          placeholder="0.0.0.0"
          pattern="^((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)$"
          minlength="0"
          maxlength="15"
          :invalid="v$.ip.$invalid"
          @blur="v$.dns.$touch()"
        />
      </FormRow>

      <FormRow
        label="Mesh via UDP"
        for-id="enabledProtocols"
        description="Mesh over UDP mode."
        :error="useGetError(v$.enabledProtocols)"
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
          :invalid="v$.enabledProtocols.$invalid"
          @blur="v$.enabledProtocols.$touch()"
        />
      </FormRow>

      <FormRow
        label="NTP Server"
        for-id="ntpServer"
        description="NTP server address."
        :error="useGetError(v$.ntpServer)"
      >
        <InputText
          id="ntpServer"
          class="dark:bg-slate-800 dark:text-slate-400"
          size="small"
          v-model="ntpServer"
          type="text"
          minlength="0"
          maxlength="33"
          :invalid="v$.ntpServer.$invalid"
          @blur="v$.ntpServer.$touch()"
        />
      </FormRow>

      <FormRow
        label="Rsyslog Server"
        for-id="rsyslogServer"
        description="Rsyslog server address."
        :error="useGetError(v$.rsyslogServer)"
      >
        <InputText
          id="rsyslogServer"
          class="dark:bg-slate-800 dark:text-slate-400"
          size="small"
          v-model="rsyslogServer"
          type="text"
          minlength="0"
          maxlength="33"
          :invalid="v$.rsyslogServer.$invalid"
          @blur="v$.rsyslogServer.$touch()"
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

defineProps<{
  v$: Validation;
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

const addressModeOptions = Object.entries(Protobuf.Config.Config_NetworkConfig_AddressMode)
  .filter(([_, value]) => typeof value === 'number')
  .map(([key, value]) => ({
    label: key.replaceAll('_', ' '),
    value: value as Protobuf.Config.Config_NetworkConfig_AddressMode,
  }));

const enabledProtocolsOptions = Object.entries(Protobuf.Config.Config_NetworkConfig_ProtocolFlags)
  .filter(([_, value]) => typeof value === 'number')
  .map(([key, value]) => ({
    label: key.replaceAll('_', ' '),
    value: value as Protobuf.Config.Config_NetworkConfig_ProtocolFlags,
  }));
</script>
