<template>
  <Dialog
    v-model:visible="isVisible"
    modal
    pt:mask:class="backdrop-blur-sm"
    pt:root:class="dialog-max-w"
  >
    <template #closeicon>
      <IconCircleX />
    </template>
    <template #header>
      <div>
        <div class="text-lg font-bold">Add connection</div>
        <div class="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Choose a connection type and fill in the details
        </div>
      </div>
    </template>
    <div class="mt-6 mb-3">
      <FloatLabel>
        <InputText
          id="connectionName"
          :invalid="v$.connectionName.$error"
          fluid
          size="small"
          v-model="connectionName"
          @blur="v$.connectionName.$touch()"
        />
        <label for="connectionName">Name</label>
      </FloatLabel>
      <Message v-if="v$.connectionName.$invalid" severity="error" size="small" variant="simple">
        <p v-for="error of v$.connectionName.$errors" :key="error.$uid">
          {{ error.$message }}
        </p>
      </Message>
    </div>
    <Tabs :value="selectedTab" @update:value="handleTabChange">
      <TabList>
        <Tab value="http" as="div" class="flex items-center gap-2 tab-size">
          <IconGlobe :size="15" />
          <span class="whitespace-nowrap">HTTP</span>
        </Tab>
        <Tab value="bluetooth" as="div" class="flex items-center gap-2 tab-size">
          <IconBluetooth :size="15" />
          <span class="whitespace-nowrap">Bluetooth</span>
        </Tab>
        <Tab value="serial" as="div" class="flex items-center gap-2 tab-size">
          <IconCable :size="15" />
          <span class="whitespace-nowrap">Serial</span>
        </Tab>
      </TabList>
      <TabPanels>
        <TabPanel value="http" as="div">
          <InputGroup class="mt-8">
            <InputGroupAddon class="input-group-padding">
              <SelectButton
                size="small"
                v-model="httpType"
                :options="httpTypeOptions"
                :pt="{
                  pcToggleButton: {
                    root: { class: 'togglebutton-border' },
                  },
                }"
              />
            </InputGroupAddon>
            <FloatLabel>
              <InputText
                id="domainOrIp"
                :invalid="v$.connectionUrl.$error"
                fluid
                size="small"
                v-model="domainOrIp"
                @blur="v$.connectionUrl.$touch()"
              />
              <label for="domainOrIp">URL or IP</label>
            </FloatLabel>
          </InputGroup>
          <Message v-if="v$.connectionUrl.$invalid" severity="error" size="small" variant="simple">
            <p v-for="error of v$.connectionUrl.$errors" :key="error.$uid">
              {{ error.$message }}
            </p>
          </Message>
          <div class="flex items-center mt-4 gap-2">
            <Button
              severity="secondary"
              :disabled="v$.connectionUrl.$invalid"
              size="small"
              @click="testConnection"
            >
              <ProgressSpinner
                v-if="isTestPending"
                style="width: 15px; height: 15px"
                strokeWidth="5"
                fill="transparent"
              />
              <IconNetwork v-else :size="15" />
              Test connection
            </Button>
            <Message
              v-if="connectionStatus === ConnectionStatus.Connected"
              size="small"
              severity="success"
              variant="simple"
            >
              <div class="flex items-center gap-2">
                <IconCircleCheck :size="15" />
                Reachable
              </div>
            </Message>
            <Message
              v-else-if="connectionStatus === ConnectionStatus.Error"
              size="small"
              severity="error"
              variant="simple"
            >
              <div class="flex items-center gap-2">
                <IconCircleX :size="15" />
                Not reachable
              </div>
            </Message>
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            Test the connection before saving to verify the device is reachable.
          </p>
        </TabPanel>
        <TabPanel value="bluetooth" as="div">
          <Message v-if="isBluetoothSupported" size="small" severity="success">
            Web Bluetooth supported
          </Message>
          <Message v-else size="small" severity="error">Web Bluetooth not supported</Message>
          <div class="flex gap-2 items-center mt-4">
            <Button severity="secondary" size="small">
              <IconSquareMousePointer :size="15" />
              Select device
            </Button>
            <div class="text-sm text-slate-500 dark:text-slate-400 truncate">
              No device selected
            </div>
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Uses the Meshtastic Bluetooth service for discovery.
          </p>
          <Message severity="info" size="small">
            <div class="flex gap-2 items-center">
              <IconInfo />
              <div>
                This connection type requires
                <a
                  rel="noopener noreferrer"
                  href="https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API#browser_compatibility"
                  target="_blank"
                  class="underline-offset-4 underline"
                >
                  Web Bluetooth
                </a>
                . Please use a supported browser, like Chrome or Edge.
              </div>
            </div>
          </Message>
        </TabPanel>
        <TabPanel value="serial" as="div">
          <Message v-if="isSerialSupported" size="small" severity="success">
            Web Serial supported
          </Message>
          <Message v-else size="small" severity="error">Web Serial not supported</Message>
          <div class="flex gap-2 items-center mt-4">
            <Button severity="secondary" size="small" @click="requestSerialPort">
              <IconSquareMousePointer :size="15" />
              Select port
            </Button>
            <div class="text-sm text-slate-500 dark:text-slate-400 truncate">{{ serialPort }}</div>
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Selecting a port grants permission so the app can open it to connect.
          </p>
          <Message severity="info" size="small">
            <div class="flex gap-2 items-center">
              <IconInfo />
              <div>
                This connection type requires
                <a
                  rel="noopener noreferrer"
                  href="https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API#browser_compatibility"
                  target="_blank"
                  class="underline-offset-4 underline"
                >
                  Web Serial
                </a>
                . Please use a supported browser, like Chrome or Edge.
              </div>
            </div>
          </Message>
        </TabPanel>
      </TabPanels>
    </Tabs>

    <template #footer>
      <Button severity="secondary" size="small" :disabled="v$.$invalid" @click="addConnection">
        <IconSave :size="15" />
        Save connection
      </Button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useVuelidate } from '@vuelidate/core';
import { required, or, ipAddress } from '@vuelidate/validators';
import {
  ConnectionStatus,
  ConnectionType,
  type INewConnection,
} from '@/composables/core/stores/connection/types';
import { useConnectionStore } from '@/composables/core/stores/connection/useConnectionStore';
import { useConnection } from '@/composables/core/useConnection';
import { useUrlValidator } from '@/composables/useUrlValidator';

const connectionName = ref('');
const domainOrIp = ref('');
const httpType = ref('https://');
const httpTypeOptions = ref(['https://', 'http://']);
const isVisible = ref(false);
const isTestPending = ref(false);
const saveEnabled = ref(false);
const isBluetoothSupported = ref(useConnection().isBluetoothSupported());
const isSerialSupported = ref(useConnection().isSerialSupported());
const connectionStatus = ref(ConnectionStatus.Disconnected);
const connectionType = ref(ConnectionType.Http);
const selectedTab = ref<string | number>('http');
const newConnection = ref<INewConnection>({
  name: '',
  type: ConnectionType.Unknown,
});

let usbVendorId = 0;
let usbProductId = 0;
const serialPort = ref('Not port selected');

const connectionUrl = computed(() => httpType.value + domainOrIp.value);

const rules = {
  connectionName: { required },
  connectionUrl: { required, urlOrIp: or(useUrlValidator, ipAddress) },
};

const v$ = useVuelidate(rules, { connectionName, connectionUrl });

function open() {
  isVisible.value = true;
}

function close() {
  isVisible.value = false;
}

function addConnection() {
  v$.value.$touch();
  if (v$.value.$invalid) return;
  if (connectionType.value === ConnectionType.Http) {
    newConnection.value = {
      type: connectionType.value,
      name: connectionName.value,
      url: connectionUrl.value,
    };
  } else if (connectionType.value === ConnectionType.Bluetooth) {
    newConnection.value = {
      type: connectionType.value,
      name: connectionName.value,
      deviceId: '',
      deviceName: '',
      gattServiceUUID: '',
    };
  } else if (connectionType.value === ConnectionType.Serial) {
    newConnection.value = {
      type: connectionType.value,
      name: connectionName.value,
      usbVendorId: usbVendorId,
      usbProductId: usbProductId,
    };
  }
  useConnectionStore()
    .addConnection(newConnection.value)
    .then(() => {
      isVisible.value = false;
      connectionName.value = '';
      domainOrIp.value = '';
      httpType.value = 'https://';
      v$.value.$reset();
      saveEnabled.value = false;
    });
}

function testConnection() {
  isTestPending.value = true;
  connectionStatus.value = ConnectionStatus.Disconnected;
  useConnection()
    .testHttpConnection(connectionUrl.value)
    .then((result) => {
      isTestPending.value = false;
      if (result) {
        connectionStatus.value = ConnectionStatus.Connected;
      } else {
        connectionStatus.value = ConnectionStatus.Error;
      }
    });
}

function requestSerialPort() {
  useConnection()
    .requestSerialPortInfo()
    .then((info) => {
      if (info.usbVendorId && info.usbProductId) {
        usbVendorId = info.usbVendorId;
        usbProductId = info.usbProductId;
        const v = info.usbVendorId ? info.usbVendorId.toString(16) : '?';
        const p = info.usbProductId ? info.usbProductId.toString(16) : '?';
        serialPort.value = `USB ${v}:${p}`;
        saveEnabled.value = true;
      }
    });
}

function handleTabChange(value: string | number) {
  const val = String(value);
  selectedTab.value = val;
  if (val === 'http') {
    connectionType.value = ConnectionType.Http;
  } else if (val === 'bluetooth') {
    connectionType.value = ConnectionType.Bluetooth;
  } else if (val === 'serial') {
    connectionType.value = ConnectionType.Serial;
  }
}

defineExpose({ open, close });
</script>

<style scoped lang="css">
.tab-size {
  padding: 0.3em 1em !important;
}
.input-group-padding {
  padding: 0em 0.8em !important;
  width: 48% !important;
}
.dialog-max-w {
  max-width: 25% !important;
}
</style>
