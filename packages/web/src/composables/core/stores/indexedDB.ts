import { createSharedComposable } from '@vueuse/core';
import { shallowRef } from 'vue';
import { openDB, type IDBPDatabase, type IDBPTransaction, type IDBPObjectStore, type StoreNames } from 'idb';

export const IDB_NAME = import.meta.env.VITE_APP_NAME;
export const IDB_CONNECTION_STORE = "Connections";
export const IDB_DEVICE_STORE = "Devices";
export const IDB_MESSAGE_STORE = "Messages";
export const IDB_NODESDB_STORE = "NodeDBs";
export const IDB_APP_STORE = "App";
export const CURRENT_STORE_VERSION = 1;

const stores = [IDB_CONNECTION_STORE, IDB_DEVICE_STORE, IDB_MESSAGE_STORE, IDB_NODESDB_STORE];
const INDEX_NAME = 'by-id';
const INDEX_KEY = 'id';
const STORE_OPTIONS = { keyPath: 'id' };
const INDEX_OPTIONS = { unique: true };

/**
 * A database upgrade function for a specific version.
 * It receives the opened `IDBPDatabase`, the previous version, the new version and the transaction.
 */
export type DBUpgradeFn<T> = (
    db: IDBPDatabase<T>,
    oldVersion: number,
    newVersion: number | null,
    tx: IDBPTransaction<T, StoreNames<T>[], 'versionchange'>
) => void | Promise<void>;

/**
 * Describes a single schema step for a specific version.
 */
export type DBScheme<T> = {
    version: number;
    upgrade: DBUpgradeFn<T>;
};

/**
 * Safely create an object store if it does not already exist.
 */

/*
export async function openIndexedDB<T>(
    name: string,
    schemes: DBScheme<T>[] = [],
): Promise<IDBPDatabase<T>> {
    const versions = schemes.map(s => s.version);
    const maxVersion = versions.length ? Math.max(...versions) : 1;

    // sort schemes ascending by version to apply them in order
    const sorted = schemes.slice().sort((a, b) => a.version - b.version);

    const instance = await openDB<T>(name, maxVersion, {
        upgrade: async (dbInstance, oldVersion, newVersion, transaction) => {
            for (const scheme of sorted) {
                if (scheme.version > oldVersion && scheme.version <= (newVersion ?? maxVersion)) {
                    await scheme.upgrade(dbInstance, oldVersion, newVersion, transaction);
                }
            }
        },
        blocked() {
            // no-op; consumer may want to listen on window "versionchange" instead
        },
        blocking() {
            // no-op
        }
    });

    return instance;
}

export async function getIndexedDatabases(): Promise<IDBDatabaseInfo[]> {
    let indexedDBs = [];
    try {
        indexedDBs = await indexedDB.databases();
    } catch (err: any) {
        throw new Error(`Error retrieving databases: ${err.message}`);
    }
    return indexedDBs;
}

export async function insertIntoStore(
    db: IDBPDatabase<any>,
    storeName: string,
    value: any,
    opts?: { put?: boolean }
): Promise<IDBValidKey> {
    if (!db) {
        throw new Error('IndexedDB is not opened');
    }
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const result = opts?.put ? await (store as any).put(value) : await (store as any).add(value);
    await tx.done;
    return result as IDBValidKey;
}

export async function updateStore(
    db: IDBPDatabase<any>,
    storeName: string,
    value: any,
): Promise<IDBValidKey> {
    if (!db) {
        throw new Error('IndexedDB is not opened');
    }

    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const result = await (store as any).put(value);
    await tx.done;
    return result as IDBValidKey;
}

export async function deleteFromStore(
    db: IDBPDatabase<any>,
    storeName: string,
    id: number
): Promise<void> {
    if (!db) {
        throw new Error('IndexedDB is not opened');
    }

    const tx = db.transaction(storeName as string, 'readwrite');
    const store = tx.objectStore(storeName);
    await (store as any).delete(id);
    return tx.done;
}

export async function getAllFromStore(db: IDBPDatabase<any>, storeName: string): Promise<any> {
    if (!db) {
        throw new Error('IndexedDB is not opened');
    }
    const tx = db.transaction(storeName, "readonly");
    const all = await tx.objectStore(storeName).getAll();
    await tx.done;
    return new Map(all.map((o: any) => [o.id, o]));
}

export async function getFromStore(db: IDBPDatabase<any>, storeName: string, key: IDBValidKey): Promise<any> {
    if (!db) {
        throw new Error('IndexedDB is not opened');
    }
    const tx = db.transaction(storeName, 'readonly');
    const raw = await tx.objectStore(storeName).get(key as any);
    await tx.done;
    return raw;
}
*/
export const useIndexedDB = createSharedComposable(() => {
    const db = shallowRef(openIndexedDB(IDB_NAME, [
        { version: CURRENT_STORE_VERSION, upgrade: (db) => createObjectStoresIfNotExists(db) },
    ]));

    async function openIndexedDB<T>(
        name: string,
        schemes: DBScheme<T>[] = [],
    ): Promise<IDBPDatabase<T>> {
        const versions = schemes.map(s => s.version);
        const maxVersion = versions.length ? Math.max(...versions) : 1;

        // sort schemes ascending by version to apply them in order
        const sorted = schemes.slice().sort((a, b) => a.version - b.version);

        const instance = await openDB<T>(name, maxVersion, {
            upgrade: async (dbInstance, oldVersion, newVersion, transaction) => {
                for (const scheme of sorted) {
                    if (scheme.version > oldVersion && scheme.version <= (newVersion ?? maxVersion)) {
                        await scheme.upgrade(dbInstance, oldVersion, newVersion, transaction);
                    }
                }
            },
            blocked() {
                // no-op; consumer may want to listen on window "versionchange" instead
            },
            blocking() {
                // no-op
            }
        });

        return instance;
    }

    function createObjectStoresIfNotExists(
        db: IDBPDatabase<any>,
    ) {
        if (!db) {
            throw new Error('IndexedDB is not opened yet');
        }

        for (const name of stores) {
            if (!db.objectStoreNames.contains(name)) {
                const store = db.createObjectStore(name, STORE_OPTIONS);
                store.createIndex(INDEX_NAME, INDEX_KEY, INDEX_OPTIONS);
            }
        }
        if (!db.objectStoreNames.contains(IDB_APP_STORE)) {
            db.createObjectStore(IDB_APP_STORE);
        }
    }

    async function put(store: string, value: any, prop: any) {
        (await db.value).put(store, value, prop);
    }

    async function get(store: string, prop: any) {
        return (await db.value).get(store, prop);
    }

    async function insertIntoStore(
        storeName: string,
        value: any,
        key?: IDBValidKey,
        opts?: { put?: boolean }
    ): Promise<IDBValidKey> {
        const tx = (await db.value).transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const result = opts?.put ? await (store as IDBPObjectStore<unknown, [string], string, "readwrite">).put(value, key) : await (store as any).add(value);
        await tx.done;
        return result as IDBValidKey;
    }

    async function updateStore(
        storeName: string,
        value: any,
        key?: IDBValidKey,
    ): Promise<IDBValidKey> {
        const tx = (await db.value).transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const result = await (store as IDBPObjectStore<unknown, [string], string, "readwrite">).put(value, key);
        await tx.done;
        return result as IDBValidKey;
    }

    async function deleteFromStore(
        storeName: string,
        id: number
    ): Promise<void> {
        const tx = (await db.value).transaction(storeName as string, 'readwrite');
        const store = tx.objectStore(storeName);
        await (store as IDBPObjectStore<unknown, [string], string, "readwrite">).delete(id);
        return tx.done;
    }

    async function getAllFromStore(storeName: string): Promise<any> {
        const tx = (await db.value).transaction(storeName, "readonly");
        const all = await tx.objectStore(storeName).getAll();
        await tx.done;
        return new Map(all.map((o: any) => [o.id, o]));
    }

    async function getFromStore(storeName: string, key: IDBValidKey): Promise<any> {
        const tx = (await db.value).transaction(storeName, 'readonly');
        const raw = await tx.objectStore(storeName).get(key as any);
        await tx.done;
        return raw;
    }

    return {
        put,
        get,
        insertIntoStore,
        updateStore,
        deleteFromStore,
        getAllFromStore,
        getFromStore
    };
});