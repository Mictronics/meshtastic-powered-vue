import {
    IDB_APP_STORE,
    useIndexedDB
} from "@/composables/core/stores/indexedDB";
import { reactive, toRaw } from 'vue';
import { createSharedComposable, watchIgnorable } from "@vueuse/core";
import type { RasterSource } from "./types.ts";
import type { SortState, ButtonKey } from "@/components/Dashboard/Pages/NodeView/types.ts";
import type { LngLatLike } from "maplibre-gl";

/* https://stackoverflow.com/a/76247596/3731501 */

export interface IApp {
    recentDeviceId: number;
    isSideBarVisible: boolean;
    sortState: Partial<Record<ButtonKey, SortState>>;
    lastReadPerChat: Record<string, number>;
    mapZoom: number;
    mapCenter: LngLatLike;
}

export const useAppStore = createSharedComposable(() => {
    const appData = reactive<IApp>({
        recentDeviceId: 0,
        isSideBarVisible: true,
        sortState: {},
        lastReadPerChat: {},
        mapZoom: 6,
        mapCenter: { lon: 10.447694, lat: 51.163361 },
    });

    const { ignorePrevAsyncUpdates } = watchIgnorable(appData, (n) => {
        // Write new value back into IndexedDB with property key.
        Object.entries(n).map(e => {
            useIndexedDB().put(IDB_APP_STORE, toRaw(e[1]), e[0]);
        });
    });

    /**
     * Init app store from IndexedDB but ignore watching the updates to avoid
     * writing values immediately back into database.
     */
    async function init() {
        useIndexedDB().get(IDB_APP_STORE, 'recentDeviceId').then((v) => {
            appData.recentDeviceId = v || 0;
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
        useIndexedDB().get(IDB_APP_STORE, 'lastReadPerChat').then((v) => {
            appData.lastReadPerChat = v || {};
            ignorePrevAsyncUpdates();
        });
        useIndexedDB().get(IDB_APP_STORE, 'mapZoom').then((v) => {
            appData.mapZoom = v || {};
            ignorePrevAsyncUpdates();
        });
        useIndexedDB().get(IDB_APP_STORE, 'mapCenter').then((v) => {
            appData.mapCenter = v || {};
            ignorePrevAsyncUpdates();
        });
    }

    function makeChatKey(type: 'direct' | 'broadcast', id: number) {
        return `${type}:${id}`;
    }

    function getLastRead(type: 'direct' | 'broadcast', id: number): number | undefined {
        return appData.lastReadPerChat[makeChatKey(type, id)];
    }

    function setLastRead(type: 'direct' | 'broadcast', id: number, ts: number) {
        appData.lastReadPerChat[makeChatKey(type, id)] = ts;
    }

    init();

    return {
        appData,
        getLastRead,
        setLastRead,
    }
});
