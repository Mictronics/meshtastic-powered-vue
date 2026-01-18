import {
    IDB_APP_STORE,
    useIndexedDB
} from "@/composables/core/stores/indexedDB";
import { reactive } from 'vue';
import { createSharedComposable, watchIgnorable } from "@vueuse/core";
import type { RasterSource } from "./types.ts";
import type { SortState, ButtonKey } from "@/components/types.ts";

/* https://stackoverflow.com/a/76247596/3731501 */

export interface IApp {
    selectedDeviceId: number;
    rasterSources: RasterSource[];
    isSideBarVisible: boolean;
    sortState: Partial<Record<ButtonKey, SortState>>;
}

export const useAppStore = createSharedComposable(() => {
    const appData = reactive<IApp>({
        selectedDeviceId: 0,
        rasterSources: [],
        isSideBarVisible: true,
        sortState: {},
    });

    let prop: string = '';
    let newValue: any = null;
    const { ignorePrevAsyncUpdates } = watchIgnorable(appData, () => {
        // Write new value back into IndexedDB with property key.
        useIndexedDB().put(IDB_APP_STORE, newValue, prop);
    }, {
        onTrigger: (e) => {
            // Trigger is called prior watch callback.
            // Get property and new value of what has changed.
            if (e.type === 'set') {
                prop = e.key;
                newValue = e.newValue;
            }
        },
        deep: true,
    })

    /**
     * Init app store from IndexedDB but ignore watching the updates to avoid
     * writing values immediately back into database.
     */
    async function init() {
        useIndexedDB().get(IDB_APP_STORE, 'selectedDeviceId').then((v) => {
            appData.selectedDeviceId = v || 0;
            ignorePrevAsyncUpdates();
        });
        useIndexedDB().get(IDB_APP_STORE, 'rasterSources').then((v) => {
            appData.rasterSources = v || [];
            ignorePrevAsyncUpdates();
        });
        useIndexedDB().get(IDB_APP_STORE, 'sortState').then((v) => {
            appData.sortState = v || {};
            ignorePrevAsyncUpdates();
        });
        useIndexedDB().get(IDB_APP_STORE, 'isSideBarVisible').then((v) => {
            appData.isSideBarVisible = v;
            ignorePrevAsyncUpdates();
        });
    }

    function addRasterSource(source: RasterSource) {
        appData.rasterSources.push(source);
    };

    function removeRasterSource(index: number) {
        appData.rasterSources.splice(index, 1);
    };

    init();

    return {
        appData,
        addRasterSource,
        removeRasterSource
    }
});
