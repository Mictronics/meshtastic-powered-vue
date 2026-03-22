import { createSharedComposable } from '@vueuse/core';
import { shallowRef } from 'vue';
import { openDB, type IDBPDatabase, type IDBPTransaction, type IDBPObjectStore, type StoreNames } from 'idb';
import JSZip from "jszip";
import { toByteArray, fromByteArray } from "base64-js";

const IDB_NAME = import.meta.env.VITE_APP_NAME;
const CURRENT_STORE_VERSION = 1;
export const IDB_CONNECTION_STORE = "Connections";
export const IDB_DEVICE_STORE = "Devices";
export const IDB_MESSAGE_STORE = "Messages";
export const IDB_NODESDB_STORE = "NodeDBs";
export const IDB_APP_STORE = "App";

const stores = [IDB_CONNECTION_STORE, IDB_DEVICE_STORE, IDB_MESSAGE_STORE, IDB_NODESDB_STORE];
const INDEX_NAME = 'by-id';
const INDEX_KEY = 'id';
const STORE_OPTIONS = { keyPath: 'id' };
const INDEX_OPTIONS = { unique: true };

/**
 * A database upgrade function for a specific version.
 * It receives the opened `IDBPDatabase`, the previous version, the new version and the transaction.
 */
type DBUpgradeFn<T> = (
    db: IDBPDatabase<T>,
    oldVersion: number,
    newVersion: number | null,
    tx: IDBPTransaction<T, StoreNames<T>[], 'versionchange'>
) => void | Promise<void>;

/**
 * Describes a single schema step for a specific version.
 */
type DBScheme<T> = {
    version: number;
    upgrade: DBUpgradeFn<T>;
};

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

        // Sort schemes ascending by version to apply them in order
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

    async function clearAllStores(): Promise<void> {
        const database = await db.value;

        const storeNames = Array.from(database.objectStoreNames);
        if (!storeNames.length) return;

        const tx = database.transaction(storeNames, 'readwrite');

        for (const name of storeNames) {
            tx.objectStore(name).clear();
        }

        await tx.done;
    }

    const getAllEntries = async (store: IDBPObjectStore<any, any, any, any>) => {
        const result: { key: IDBValidKey; value: any }[] = [];

        let cursor = await store.openCursor();

        while (cursor) {
            result.push({
                key: cursor.key,
                value: cursor.value,
            });
            cursor = await cursor.continue();
        }

        return result;
    }

    const extractSchema = (db: IDBPDatabase<any>) => {
        const stores: any[] = [];

        for (const storeName of Array.from(db.objectStoreNames)) {
            const tx = db.transaction(storeName, "readonly");
            const store = tx.objectStore(storeName);

            const indexes: any[] = [];

            for (const indexName of Array.from(store.indexNames)) {
                const index = store.index(indexName);

                indexes.push({
                    name: index.name,
                    keyPath: index.keyPath,
                    unique: index.unique,
                    multiEntry: index.multiEntry,
                });
            }

            stores.push({
                name: store.name,
                keyPath: store.keyPath,
                autoIncrement: store.autoIncrement,
                indexes,
            });
        }

        return {
            name: db.name,
            version: db.version,
            stores,
        };
    }

    const exportBackup = async () => {
        const database = await db.value;
        const zip = new JSZip();

        const schema = extractSchema(database);
        zip.file("_meta.json", JSON.stringify(schema, null, 2));

        for (const storeName of Array.from(database.objectStoreNames)) {
            const tx = database.transaction(storeName, "readonly");
            const store = tx.objectStore(storeName);

            const all = await getAllEntries(store);
            await tx.done;

            zip.file(`${storeName}.json`, JSON.stringify(all, deserialize, 2));
        }

        const blob = await zip.generateAsync({
            type: "blob",
            compression: "DEFLATE",
            compressionOptions: { level: 9 },
            comment: "Generated by meshtastic-powered-vue"
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${IDB_NAME}-backup.zip`;
        a.click();
        URL.revokeObjectURL(url);
    }

    const recreateFromSchema = async (schema: any): Promise<IDBPDatabase<any>> => {
        return openDB(schema.name, schema.version, {
            upgrade(db) {
                for (const storeDef of schema.stores) {
                    let store: IDBPObjectStore<any, any, any, any>;

                    if (!db.objectStoreNames.contains(storeDef.name)) {
                        store = db.createObjectStore(storeDef.name, {
                            keyPath: storeDef.keyPath ?? undefined,
                            autoIncrement: storeDef.autoIncrement,
                        });
                    } else {
                        store = (db as any).transaction.objectStore(storeDef.name);
                    }

                    for (const idx of storeDef.indexes) {
                        if (!store.indexNames.contains(idx.name)) {
                            store.createIndex(idx.name, idx.keyPath, {
                                unique: idx.unique,
                                multiEntry: idx.multiEntry,
                            });
                        }
                    }
                }
            },
        });
    }

    const restoreBackup = async (file: File) => {
        const zip = await JSZip.loadAsync(file);
        const metaFile = zip.file("_meta.json");
        if (!metaFile) throw new Error("Invalid backup: missing _meta.json");

        const schema = JSON.parse(await metaFile.async("string"));

        (await db.value).close();
        await new Promise<void>((resolve, reject) => {
            const req = indexedDB.deleteDatabase(schema.name);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });

        const newDb = await recreateFromSchema(schema);
        for (const storeDef of schema.stores) {
            const file = zip.file(`${storeDef.name}.json`);
            if (!file) continue;

            const content = JSON.parse(
                await file.async("string"),
                serialize
            );
            const tx = newDb.transaction(storeDef.name, "readwrite");
            const store = tx.objectStore(storeDef.name);

            for (const item of content) {
                const value = { ...item.value };
                const hasInlineKey = store.keyPath !== null && store.keyPath !== undefined;

                if (hasInlineKey) {
                    // inject key if needed
                    if (typeof store.keyPath === "string" && item.key !== undefined) {
                        if (value[store.keyPath] === undefined) {
                            value[store.keyPath] = item.key;
                        }
                    }
                    await store.put(value); // ✅ no key param
                } else {
                    await store.put(value, item.key); // ✅ key required
                }
            }
            await tx.done;
        }
        db.value = Promise.resolve(newDb);
    }

    function deserialize(_key: string, value: any) {
        if (typeof value === "bigint") {
            return {
                __type: "BigInt",
                value: value.toString(),
            };
        }

        if (value instanceof Date) {
            return { __type: "Date", value: value.toISOString() };
        }

        if (value instanceof Uint8Array) {
            return {
                __type: "Uint8Array",
                value: fromByteArray(value),
            };
        }

        return value;
    }

    function serialize(_key: string, value: any) {
        if (value && value.__type === "BigInt") {
            return BigInt(value.value);
        }

        if (value && value.__type === "Date") return new Date(value.value);

        if (value && value.__type === "Uint8Array") {
            return toByteArray(value.value);
        }

        return value;
    }

    return {
        put,
        get,
        insertIntoStore,
        updateStore,
        deleteFromStore,
        getAllFromStore,
        getFromStore,
        clearAllStores,
        exportBackup,
        restoreBackup,
    };
});