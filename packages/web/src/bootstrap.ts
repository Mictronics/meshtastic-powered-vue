import { useIndexedDB } from '@/composables/core/stores/indexedDB';
import { useConnectionStore } from '@/composables/core/stores/connection/useConnectionStore';
import { useDeviceStore } from '@/composables/core/stores/device/useDeviceStore';
import { useMessageStore } from '@/composables/core/stores/message/useMessageStore';
import { useNodeDBStore } from '@/composables/core/stores/nodeDB/useNodeDBStore';
import { useAppStore } from '@/composables/core/stores/app/useAppStore';
import { useFormattedNodeDatabase } from '@/composables/core/utils/useFormattedNodeDatabase';

export function bootstrapApp() {
    try {
        useIndexedDB();
        useAppStore();
        useConnectionStore();
        useDeviceStore();
        useMessageStore();
        useNodeDBStore();
        useFormattedNodeDatabase();
    } catch (err) {
        console.error('App bootstrap failed:', err);
    }
}