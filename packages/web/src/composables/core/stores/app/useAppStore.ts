import {
    IDB_APP_STORE,
    useIndexedDB
} from "@/composables/core/stores/indexedDB";
import { reactive } from 'vue';
import { createSharedComposable, watchIgnorable } from "@vueuse/core";
import type { RasterSource } from "./types.ts";

/* https://stackoverflow.com/a/76247596/3731501 */

export interface IApp {
    selectedDeviceId: number;
    nodeNumToBeRemoved: number;
    nodeNumDetails: number;
    rasterSources: RasterSource[];
    isSideBarVisible: boolean;
}

export const useAppStore = createSharedComposable(() => {
    const appData = reactive<IApp>({
        selectedDeviceId: 0,
        rasterSources: [],
        nodeNumToBeRemoved: 0,
        nodeNumDetails: 0,
        isSideBarVisible: true,
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

    /*
    // Create our own deep watching proxy to handle IndexedDB stores of properties on change.
    type ChangeCallback = (path: string, newVal: any) => void
    function _reactive<T extends object>(target: T, onChange: ChangeCallback, base = ''): T {
        const handler: ProxyHandler<any> = {
            get(obj, prop, receiver) {
                const val = Reflect.get(obj, prop, receiver)
                // only proxy plain objects/arrays
                if (val && typeof val === 'object') {
                    const nextBase = base ? `${base}.${String(prop)}` : String(prop)
                    return _reactive(val, onChange, nextBase)
                }
                return val
            },

            set(obj, prop, value, receiver) {
                const path = base ? `${base}.${String(prop)}` : String(prop)
                const oldVal = obj[prop]
                const result = Reflect.set(obj, prop, value, receiver)
                if (oldVal !== value) onChange(path, value)
                return result
            },
        }
        return new Proxy(target as any, handler)
    }

    const _appData = {
        selectedDeviceId: 0,
        rasterSources: [],
        commandPaletteOpen: false,
        connectDialogOpen: false,
        nodeNumToBeRemoved: 0,
        nodeNumDetails: 0,
        isSideBarVisible: true,
    };

    const appData = _reactive<IApp>(_appData, (prop, n) => {
        console.log(`Changed: ${prop}`, 'new=', n)
        useIndexedDB().put(IDB_APP_STORE, n, prop);
    })
*/
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
        useIndexedDB().get(IDB_APP_STORE, 'nodeNumToBeRemoved').then((v) => {
            appData.nodeNumToBeRemoved = v || 0;
            ignorePrevAsyncUpdates();
        });
        useIndexedDB().get(IDB_APP_STORE, 'nodeNumDetails').then((v) => {
            appData.nodeNumDetails = v || 0;
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
