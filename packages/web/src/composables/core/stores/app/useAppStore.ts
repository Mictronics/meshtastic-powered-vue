import {
    IDB_APP_STORE,
    useIndexedDB
} from "@/composables/core/stores/indexedDB";
import { createGlobalState } from "@vueuse/core";
import { useGlobalToast, type ToastSeverity } from '@/composables/useGlobalToast';
import type { RasterSource } from "./types.ts";

export interface IApp {
    selectedDeviceId: number;
    nodeNumToBeRemoved: number;
    connectDialogOpen: boolean;
    nodeNumDetails: number;
    commandPaletteOpen: boolean;
    rasterSources: RasterSource[];

    addRasterSource: (source: RasterSource) => void;
    removeRasterSource: (index: number) => void;
}

class App implements IApp {
    private _selectedDeviceId: number;
    private _nodeNumToBeRemoved: number;
    private _connectDialogOpen: boolean;
    private _nodeNumDetails: number;
    private _commandPaletteOpen: boolean;
    private _rasterSources: RasterSource[];

    constructor() {
        this._selectedDeviceId = 0;
        this._rasterSources = [];
        this._commandPaletteOpen = false;
        this._connectDialogOpen = false;
        this._nodeNumToBeRemoved = 0;
        this._nodeNumDetails = 0;
        this.initFromDB();
    };

    private async initFromDB() {
        this._selectedDeviceId = await useIndexedDB().get(IDB_APP_STORE, 'selectedDeviceId') || 0;
        this._rasterSources = await useIndexedDB().get(IDB_APP_STORE, 'rasterSources') || [];
        this._commandPaletteOpen = await useIndexedDB().get(IDB_APP_STORE, 'commandPaletteOpen') || false;
        this._connectDialogOpen = await useIndexedDB().get(IDB_APP_STORE, 'connectDialogOpen') || false;
        this._nodeNumToBeRemoved = await useIndexedDB().get(IDB_APP_STORE, 'nodeNumToBeRemoved') || 0;
        this._nodeNumDetails = await useIndexedDB().get(IDB_APP_STORE, 'nodeNumDetails') || 0;
    }

    private toast(severity: ToastSeverity, detail: string, life?: number) {
        useGlobalToast().add({ severity, summary: 'App Database Error', detail, life: 5000 });
    }

    async putDB(prop: keyof IApp, value: any) {
        try {
            useIndexedDB().put(IDB_APP_STORE, value, prop);
        } catch (e: any) {
            this.toast('error', e.message);
        }
    };

    get selectedDeviceId(): number {
        return this._selectedDeviceId;
    }
    set selectedDeviceId(value: number) {
        this._selectedDeviceId = value;
        this.putDB('selectedDeviceId', value);
    }

    get nodeNumToBeRemoved(): number {
        return this._nodeNumToBeRemoved;
    }
    set nodeNumToBeRemoved(value: number) {
        this._nodeNumToBeRemoved = value;
        this.putDB('nodeNumToBeRemoved', value);
    }

    get rasterSources(): RasterSource[] {
        return this._rasterSources;
    }
    set rasterSources(value: RasterSource[]) {
        this._rasterSources = value;
        this.putDB('rasterSources', value);
    }

    addRasterSource(source: RasterSource) {
        this._rasterSources.push(source);
        this.putDB('rasterSources', this._rasterSources);
    };

    removeRasterSource(index: number) {
        this._rasterSources.splice(index, 1);
        this.putDB('rasterSources', this._rasterSources);
    };

    get commandPaletteOpen(): boolean {
        return this._commandPaletteOpen;
    }
    set commandPaletteOpen(value: boolean) {
        this._commandPaletteOpen = value;
        this.putDB('commandPaletteOpen', value);
    }

    get connectDialogOpen(): boolean {
        return this._connectDialogOpen;
    }
    set connectDialogOpen(value: boolean) {
        this._connectDialogOpen = value;
        this.putDB('connectDialogOpen', value);
    }

    get nodeNumDetails(): number {
        return this._nodeNumDetails;
    }
    set nodeNumDetails(value: number) {
        this._nodeNumDetails = value;
        this.putDB('nodeNumDetails', value);
    }
}

export const useAppStore = createGlobalState(() => {
    const appData = new App();
    return {
        appData,
    }
});
