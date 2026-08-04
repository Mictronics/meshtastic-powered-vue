import { ref, computed } from 'vue'
import { createSharedComposable } from '@vueuse/core';
import { toBinary } from "@bufbuild/protobuf";
import { Protobuf } from "@meshtastic/core";
import { useDeviceStore } from '@/composables/stores/device/useDeviceStore';
import { useGlobalToast } from '@/composables/useGlobalToast';
import type { MeterItem } from 'primevue/metergroup';

type SavePhase =
    | 'idle'
    | 'channels'
    | 'configs'
    | 'modules'
    | 'commit'
    | 'admin'
    | 'finalizing';

type SaveFailure = {
    type: 'channel' | 'config' | 'module' | 'admin';
    item: unknown;
    error: unknown;
};

type PhaseProgress = {
    done: number;
    total: number;
};

export const useConfigSave = createSharedComposable(() => {
    const deviceStore = useDeviceStore();
    const device = computed(() => deviceStore.device.value);
    const connection = computed(() => device.value?.connection);
    const toast = useGlobalToast();
    const isSaving = ref(false);
    const phase = ref<SavePhase>('idle');
    const failures = ref<SaveFailure[]>([]);

    const progressFor = (phase: SavePhase) => {
        const p = phaseProgress.value[phase];
        if (!p || p.total === 0) return 0;
        return Math.round((p.done / p.total) * 100);
    };

    const meters = computed<MeterItem[]>(() => [
        {
            label: 'Channels',
            value: progressFor('channels'),
            color: '#60a5fa',
        },
        {
            label: 'Configs',
            value: progressFor('configs'),
            color: '#34d399',
        },
        {
            label: 'Modules',
            value: progressFor('modules'),
            color: '#fbbf24',
        },
        {
            label: 'Admin',
            value: progressFor('admin'),
            color: '#f87171',
        },
    ]);

    const phaseProgress = ref<Record<SavePhase, PhaseProgress>>({
        channels: { done: 0, total: 0 },
        configs: { done: 0, total: 0 },
        modules: { done: 0, total: 0 },
        admin: { done: 0, total: 0 },
        commit: { done: 0, total: 1 },
        idle: { done: 0, total: 0 },
        finalizing: { done: 0, total: 1 }
    });

    const trySave = async <T,>(
        type: SaveFailure['type'],
        item: T,
        failedSet: Set<T> | undefined,
        fn: () => Promise<number> | undefined,
    ) => {
        try {
            await fn();
        } catch (error) {
            failures.value.push({ type, item, error });
            failedSet?.add(item);
        }
    };

    const save = async () => {
        if (isSaving.value) return;
        isSaving.value = true;
        failures.value = [];

        try {
            const channelChanges = device.value?.getAllChannelChanges();
            const configChanges = device.value?.getAllConfigChanges();
            const moduleConfigChanges = device.value?.getAllModuleConfigChanges();
            const adminMessages = device.value?.getAllQueuedAdminMessages();

            if (!channelChanges || !configChanges || !moduleConfigChanges || !adminMessages) {
                throw new Error('Missing pending configuration changes.');
            }

            const failedChannels = new Set<Protobuf.Channel.Channel>();
            const failedConfigs = new Set<Protobuf.Config.Config>();
            const failedModuleConfigs = new Set<Protobuf.ModuleConfig.ModuleConfig>();

            phaseProgress.value.channels = {
                done: 0,
                total: channelChanges.length,
            };
            await Promise.all(
                channelChanges.map(async (channel) => {
                    await trySave('channel', channel, failedChannels, () =>
                        connection.value?.setChannel(channel),
                    );
                    phaseProgress.value.channels.done++;
                }),
            );

            phaseProgress.value.configs = {
                done: 0,
                total: configChanges.length,
            };
            await Promise.all(
                configChanges.map(async (newConfig) => {
                    await trySave('config', newConfig, failedConfigs, () =>
                        connection.value?.setConfig(newConfig),
                    );
                    phaseProgress.value.configs.done++;
                }),
            );

            phaseProgress.value.modules = {
                done: 0,
                total: moduleConfigChanges.length,
            };
            await Promise.all(
                moduleConfigChanges.map(async (newModuleConfig) => {
                    await trySave('module', newModuleConfig, failedModuleConfigs, () =>
                        connection.value?.setModuleConfig(newModuleConfig),
                    );
                    phaseProgress.value.modules.done++;
                }),
            );

            // Send queued admin messages after configs are committed
            phaseProgress.value.admin = {
                done: 0,
                total: adminMessages.length,
            };
            if (adminMessages.length > 0) {
                await Promise.all(
                    adminMessages.map(async (message) => {
                        try {
                            await connection.value?.sendPacket(
                                toBinary(Protobuf.Admin.AdminMessageSchema, message),
                                Protobuf.Portnums.PortNum.ADMIN_APP,
                                "self",
                            );
                        } catch (error) {
                            failures.value.push({ type: 'admin', item: message, error });
                        }
                        phaseProgress.value.admin.done++;
                    }),
                );
            }

            const succeededChannels = channelChanges.filter((c) => !failedChannels.has(c));
            const succeededConfigs = configChanges.filter((c) => !failedConfigs.has(c));
            const succeededModuleConfigs = moduleConfigChanges.filter((c) => !failedModuleConfigs.has(c));
            const hasSuccessfulConfig = succeededConfigs.length > 0 || succeededModuleConfigs.length > 0;

            phaseProgress.value.commit = {
                done: 0,
                total: 1,
            };
            if (hasSuccessfulConfig) {
                await connection.value?.commitEditSettings();
            }
            phaseProgress.value.commit.done++;

            // Only mirror locally and clear the pending-change entry for items that actually
            // succeeded on the device - a failed item stays staged so it isn't silently dropped.
            phaseProgress.value.finalizing = {
                done: 0,
                total: 1,
            };
            succeededChannels.forEach((newChannel) => {
                device.value?.addChannel(newChannel);
                device.value?.removeChange({ type: 'channel', index: newChannel.index });
            });
            succeededConfigs.forEach((newConfig) => {
                device.value?.setConfig(newConfig);
                if (newConfig.payloadVariant.case) {
                    device.value?.removeChange({ type: 'config', variant: newConfig.payloadVariant.case });
                }
            });
            succeededModuleConfigs.forEach((newModuleConfig) => {
                device.value?.setModuleConfig(newModuleConfig);
                if (newModuleConfig.payloadVariant.case) {
                    device.value?.removeChange({ type: 'moduleConfig', variant: newModuleConfig.payloadVariant.case });
                }
            });
            phaseProgress.value.finalizing.done++;

            if (failures.value.length) {
                toast.add({
                    severity: 'warn',
                    summary: 'Partial save',
                    detail: `${failures.value.length} item${failures.value.length === 1 ? '' : 's'} failed to save; those changes are still pending.`,
                    life: 6000,
                });
            } else {
                // Admin messages have no per-item key to remove individually, so they're only cleared
                // on a fully successful save (a resend of an already-applied one is harmless).
                device.value?.clearAllChanges();
                toast.add({
                    severity: 'success',
                    summary: 'Configuration saved',
                    detail: 'Configuration saved successfully.',
                    life: 3000,
                });
            }
        } catch (err) {
            toast.add({
                severity: 'error',
                summary: 'Configuration error',
                detail: `Saving configuration failed: ${err}.`,
                life: 5000,
            });
        } finally {
            isSaving.value = false;
        }
    }

    return {
        save,
        isSaving,
        phase,
        meters,
        failures,
    };
});
