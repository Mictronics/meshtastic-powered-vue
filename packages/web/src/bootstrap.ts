import { useIndexedDB } from '@/composables/stores/indexedDB';
import { useConnectionStore } from '@/composables/stores/connection/useConnectionStore';
import { useDeviceStore } from '@/composables/stores/device/useDeviceStore';
import { useMessageStore } from '@/composables/stores/message/useMessageStore';
import { useNodeDBStore } from '@/composables/stores/nodeDB/useNodeDBStore';
import { useAppStore } from '@/composables/stores/app/useAppStore';
import { useFormattedNodeDatabase } from '@/composables/stores/nodeDB/useFormattedNodeDatabase';
import { useConfirm } from './composables/useConfirmDialog';

export function bootstrapApp() {
    try {
        useConfirm();
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