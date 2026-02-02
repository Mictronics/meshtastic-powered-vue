<template>
  <Fieldset pt:legend:class="fieldset-legend" class="m-1">
    <template #legend>
      <div class="flex items-center gap-4">
        <span class="font-bold">Radio</span>
        <SaveButton type="submit" :disabled="saveButtonDisable" @save-settings="onSaveSettings" />
      </div>
    </template>
    <Accordion value="0">
      <AccordionPanel value="0">
        <AccordionHeader>LoRa</AccordionHeader>
        <AccordionContent>
          <form class="text-sm" @submit.prevent="onSaveSettings">
            <div>
              <h4 class="scroll-m-20 text-xl tracking-tight font-medium">Mesh Settings</h4>
              <p class="text-slate-400">Settings for the LoRa mesh</p>
            </div>
            <div class="pt-2">
              <FormGrid>
                <span id="region" class="font-medium">Region</span>
                <Select
                  aria-labelledby="region"
                  class="dark:bg-slate-800 dark:text-slate-400"
                  size="small"
                />
                <p class="text-slate-400">Sets the region for your node</p>

                <span id="hopLimit" class="font-medium">Hop Limit</span>
                <Select
                  aria-labelledby="hopLimit"
                  class="dark:bg-slate-800 dark:text-slate-400"
                  size="small"
                />
                <p class="text-slate-400">Maximum number of hops</p>

                <label for="frequencySlot" class="font-medium">Frequency Slot</label>
                <InputText
                  id="frequencySlot"
                  class="dark:bg-slate-800 dark:text-slate-400"
                  size="small"
                />
                <p class="text-slate-400">LoRa frequency channel number</p>

                <label for="forwardMqtt" class="font-medium">Forward MQTT</label>
                <ToggleSwitch input-id="forwardMqtt" />
                <p class="text-slate-400">Forward MQTT messages over the mesh</p>

                <label for="allowMqtt" class="font-medium">Allow MQTT upload</label>
                <ToggleSwitch input-id="allowMqtt" />
                <p class="text-slate-400">
                  When enabled, the user approves the packet to be uploaded via MQTT. When disabled,
                  remote nodes are requested not to forward packets via MQTT.
                </p>
              </FormGrid>
            </div>
            <div class="pt-2">
              <div>
                <h4 class="scroll-m-20 text-xl tracking-tight font-medium">Waveform Settings</h4>
                <p class="text-slate-400">Settings for the LoRa waveform</p>
              </div>
              <FormGrid>
                <label for="usePreset" class="font-medium">Use Preset</label>
                <ToggleSwitch input-id="usePreset" />
                <p class="text-slate-400">Use one of the predefined modem presets.</p>

                <span id="modemPreset" class="font-medium">Modem Preset</span>
                <Select
                  aria-labelledby="modemPreset"
                  class="dark:bg-slate-800 dark:text-slate-400"
                  size="small"
                />
                <p class="text-slate-400">Modem preset to use.</p>

                <label for="bandwidth" class="font-medium">Bandwidth</label>
                <InputGroup>
                  <InputText
                    id="bandwidth"
                    class="dark:bg-slate-800 dark:text-slate-400"
                    size="small"
                  />
                  <InputGroupAddon class="">kHz</InputGroupAddon>
                </InputGroup>
                <p class="text-slate-400">Channel bandwidth in kHz</p>

                <label for="spreadingFactor" class="font-medium">Spreading Factor</label>
                <InputGroup>
                  <InputText
                    id="spreadingFactor"
                    class="dark:bg-slate-800 dark:text-slate-400"
                    size="small"
                  />
                  <InputGroupAddon class="">CPS</InputGroupAddon>
                </InputGroup>
                <p class="text-slate-400">Indicates the number of chirps per symbol.</p>

                <label for="codingRate" class="font-medium">Coding Rate</label>
                <InputText
                  id="codingRate"
                  class="dark:bg-slate-800 dark:text-slate-400"
                  size="small"
                />
                <p class="text-slate-400">The denominator of the coding rate.</p>
              </FormGrid>
            </div>
            <div class="pt-2">
              <div>
                <h4 class="scroll-m-20 text-xl tracking-tight font-medium">Radio Settings</h4>
                <p class="text-slate-400">Settings for the LoRa radio</p>
              </div>
              <FormGrid>
                <label for="transmitEnabled" class="font-medium">Transmit Enabled</label>
                <ToggleSwitch input-id="transmitEnabled" />
                <p class="text-slate-400">Enable/Disable transmit (TX) from the LoRa radio.</p>

                <label for="transmitPower" class="font-medium">Transmit Power</label>
                <InputGroup>
                  <InputText
                    id="transmitPower"
                    class="dark:bg-slate-800 dark:text-slate-400"
                    size="small"
                    type="number"
                    min="0"
                    max="27"
                  />
                  <InputGroupAddon class="">dBm</InputGroupAddon>
                </InputGroup>
                <p class="text-slate-400">Max transmit power.</p>

                <label for="dutyCycle" class="font-medium">Override Duty Cycle</label>
                <ToggleSwitch input-id="dutyCycle" />
                <p class="text-slate-400">Override Duty Cycle</p>

                <label for="frequencyOffset" class="font-medium">Frequency Offset</label>
                <InputGroup>
                  <InputText
                    id="frequencyOffset"
                    class="dark:bg-slate-800 dark:text-slate-400"
                    size="small"
                  />
                  <InputGroupAddon class="">Hz</InputGroupAddon>
                </InputGroup>
                <p class="text-slate-400">
                  Frequency offset to correct for crystal calibration errors.
                </p>

                <label for="overrideFrequency" class="font-medium">Override frequency</label>
                <InputGroup>
                  <InputText
                    id="overrideFrequency"
                    class="dark:bg-slate-800 dark:text-slate-400"
                    size="small"
                  />
                  <InputGroupAddon class="">MHz</InputGroupAddon>
                </InputGroup>
                <p class="text-slate-400">Override frequency.</p>

                <label for="boostedGain" class="font-medium">Boosted RX Gain</label>
                <ToggleSwitch input-id="boostedGain" />
                <p class="text-slate-400">Boosted RX Gain</p>
              </FormGrid>
            </div>
          </form>
        </AccordionContent>
      </AccordionPanel>
      <AccordionPanel value="1">
        <AccordionHeader>Channels</AccordionHeader>
        <AccordionContent></AccordionContent>
      </AccordionPanel>
      <AccordionPanel value="2">
        <AccordionHeader>Security</AccordionHeader>
        <AccordionContent></AccordionContent>
      </AccordionPanel>
    </Accordion>
  </Fieldset>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import FormGrid from './FormGrid.vue';
import SaveButton from './SaveButton.vue';

const saveButtonDisable = ref(true);
const onSaveSettings = () => {};
</script>

<style lang="css" scoped>
@keyframes bounce-3s {
  0%,
  20%,
  50%,
  80%,
  100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

.bounce-once {
  animation: bounce-3s 3s ease;
}
</style>
