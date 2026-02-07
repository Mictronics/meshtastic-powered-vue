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

    const trySave = async (
        type: SaveFailure['type'],
        item: unknown,
        fn: () => Promise<number> | undefined,
    ) => {
        try {
            await fn();
        } catch (error) {
            failures.value.push({ type, item, error });
        }
    };

    const save = async () => {
        if (isSaving.value) return;
        isSaving.value = true;

        try {
            const channelChanges = device.value?.getAllChannelChanges();
            const configChanges = device.value?.getAllConfigChanges();
            const moduleConfigChanges = device.value?.getAllModuleConfigChanges();
            const adminMessages = device.value?.getAllQueuedAdminMessages();

            if (!channelChanges || !configChanges || !moduleConfigChanges || !adminMessages) {
                throw new Error('Missing pending configuration changes.');
            }

            phaseProgress.value.channels = {
                done: 0,
                total: channelChanges.length,
            };
            await Promise.all(
                channelChanges.map(async (channel) => {
                    await trySave('channel', channel, () =>
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
                    await trySave('config', newConfig, () =>
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
                    await trySave('module', newModuleConfig, () =>
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
                        await trySave('module', message, () =>
                            connection.value?.sendPacket(
                                toBinary(Protobuf.Admin.AdminMessageSchema, message),
                                Protobuf.Portnums.PortNum.ADMIN_APP,
                                "self",
                            ),
                        );
                        phaseProgress.value.admin.done++;
                    }),
                );
            }

            const hasSuccessfulConfig =
                configChanges.length > failures.value.filter(f => f.type === 'config').length ||
                moduleConfigChanges.length > failures.value.filter(f => f.type === 'module').length;

            phaseProgress.value.commit = {
                done: 0,
                total: 1,
            };
            if (hasSuccessfulConfig && (configChanges.length > 0 || moduleConfigChanges.length > 0)) {
                await connection.value?.commitEditSettings();
            }
            phaseProgress.value.commit.done++;

            phaseProgress.value.finalizing = {
                done: 0,
                total: 1,
            };
            channelChanges.forEach((newChannel) => {
                device.value?.addChannel(newChannel);
            });
            configChanges.forEach((newConfig) => {
                device.value?.setConfig(newConfig);
            });
            moduleConfigChanges.forEach((newModuleConfig) => {
                device.value?.setModuleConfig(newModuleConfig);
            });
            phaseProgress.value.finalizing.done++;

            device.value?.clearAllChanges();

            if (failures.value.length) {
                toast.add({
                    severity: 'warn',
                    summary: 'Partial save',
                    detail: `${failures.value.length} items failed to save.`,
                    life: 5000,
                });
            } else {
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
