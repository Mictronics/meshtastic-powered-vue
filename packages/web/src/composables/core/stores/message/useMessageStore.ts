import type { Types } from "@meshtastic/core";
import type { DBSchema } from "idb";
import {
    IDB_MESSAGE_STORE,
    useIndexedDB
} from "@/composables/core/stores/indexedDB";
import { createSharedComposable, watchThrottled } from '@vueuse/core'
import { toRaw, isReactive, ref, type DebuggerEvent } from 'vue'
import { useGlobalToast, type ToastSeverity } from '@/composables/useGlobalToast';
import { useEvictOldestEntries } from "@/composables/core/stores/utils/useEvictOldestEntries";
import { purgeUncloneableProperties } from "@/composables/core/stores/utils/purgeUncloneable";
import type {
    ChannelId,
    ClearMessageParams,
    ConversationId,
    GetMessagesParams,
    Message,
    MessageLogMap,
    NodeNum,
    SetMessageStateParams,
} from "@/composables/core/stores/message/types";

const MESSAGESTORE_RETENTION_NUM = 10;
const MESSAGELOG_RETENTION_NUM = 1000; // Max messages per conversation/channel

export enum MessageState {
    Ack = 0,
    Waiting,
    Failed,
}

export enum MessageType {
    Direct,
    Broadcast,
}

export function getConversationId(
    node1: NodeNum,
    node2: NodeNum,
): ConversationId {
    return [node1, node2].sort((a, b) => a - b).join(":");
}

export interface MessageBuckets {
    direct: { [key: ConversationId]: MessageLogMap };
    broadcast: { [K in ChannelId & (string | number)]: MessageLogMap }
}

export interface IMessageStore {
    id: number;
    myNodeNum: number | undefined;
    messages: MessageBuckets;
    drafts: { [K in Types.Destination & (string | number)]: string };

    set: (obj: Partial<IMessageStore>) => void;
    get: () => any;
    activeChat: number;
    chatType: MessageType;
    setNodeNum: (nodeNum: number) => void;
    saveMessage: (message: Message) => void;
    setMessageState: (params: SetMessageStateParams) => void;
    getMessages: (params: GetMessagesParams) => Message[];

    getDraft: (key: Types.Destination) => string;
    setDraft: (key: Types.Destination, message: string) => void;
    clearDraft: (key: Types.Destination) => void;
    //clearAllDrafts: (key: Types.Destination) => void;

    deleteAllMessages: () => void;
    clearMessageByMessageId: (params: ClearMessageParams) => void;
}

export interface MessageDatabase extends DBSchema {
    devices: {
        value: IMessageStore;
        key: number;
        indexes: { 'by-id': number };
    };
}

class MessageStore implements IMessageStore {
    id: number;
    myNodeNum: number | undefined;
    messages: MessageBuckets;
    drafts: { [K in Types.Destination & (string | number)]: string };;

    activeChat: number;
    chatType: MessageType;

    constructor(id: number, data?: Partial<IMessageStore>) {
        this.id = id;
        this.myNodeNum = data?.myNodeNum;
        this.messages = data?.messages ?? {
            direct: {},
            broadcast: {
                0: {},
                1: {},
                2: {},
                3: {},
                4: {},
                5: {},
                6: {},
                7: {},
            },
        };
        this.drafts = data?.drafts ?? {} as {
            [x: number]: string;
            self: string;
            broadcast: string;
        };
        this.activeChat = 0;
        this.chatType = MessageType.Broadcast;
    }

    set(obj: Partial<IMessageStore>) {
        Object.assign(this, obj);
    }

    get() {
        return Object.fromEntries(Object.entries(this));
    }

    setNodeNum(nodeNum: number) {
        this.myNodeNum = nodeNum;
        useMessageStore().cleanMessageStore(this.id, nodeNum);
    };

    saveMessage(message: Message) {
        let log: MessageLogMap | undefined;
        if (message.type === MessageType.Direct) {
            const conversationId = getConversationId(message.from, message.to);
            if (!this.messages.direct.hasOwnProperty(conversationId)) {
                this.messages.direct[conversationId] = {};
            }

            log = this.messages.direct[conversationId] || {};
            log[message.messageId] = message;
        } else if (message.type === MessageType.Broadcast) {
            const channelId = message.channel as ChannelId;
            if (!this.messages.broadcast.hasOwnProperty(channelId)) {
                this.messages.broadcast[channelId] = {};
            }

            log = this.messages.broadcast[channelId];
            log[message.messageId] = message;
        }

        if (log) {
            // Enforce retention limit
            useEvictOldestEntries(log, MESSAGELOG_RETENTION_NUM);
        }
    };

    setMessageState(params: SetMessageStateParams) {
        let messageLog: MessageLogMap | undefined;
        let targetMessage: Message | undefined;

        if (params.type === MessageType.Direct) {
            const conversationId = getConversationId(
                params.nodeA,
                params.nodeB,
            );
            messageLog = this.messages.direct[conversationId];
            if (messageLog) {
                targetMessage = messageLog[params.messageId];
            }
        } else {
            // Broadcast
            messageLog = this.messages.broadcast[params.channelId];
            if (messageLog) {
                targetMessage = messageLog[params.messageId];
            }
        }

        if (targetMessage) {
            targetMessage.state = params.newState ?? MessageState.Ack;
        } else {
            console.warn(
                `Message or conversation/channel not found for state update. Params: ${JSON.stringify(
                    params,
                )}`,
            );
        }
    };

    getMessages(params: GetMessagesParams): Message[] {
        let messageMap: MessageLogMap | undefined;

        if (params.type === MessageType.Direct) {
            const conversationId = getConversationId(params.nodeA, params.nodeB);
            messageMap = this.messages.direct[conversationId];
        } else {
            messageMap = this.messages.broadcast[params.channelId];
        }

        if (messageMap === undefined) {
            return [];
        }

        const messagesArray = Array.from(Object.values(messageMap));
        messagesArray.sort((a, b) => a.date - b.date);
        return messagesArray;
    };

    getDraft(key: Types.Destination) {
        return this.drafts[key] ?? "";
    };

    setDraft(key: Types.Destination, message: string) {
        this.drafts[key] = message;
    };

    clearDraft(key: Types.Destination) {
        delete this.drafts[key];
    };

    deleteAllMessages() {
        this.messages.direct = {};
        this.messages.broadcast = {
            0: {},
            1: {},
            2: {},
            3: {},
            4: {},
            5: {},
            6: {},
            7: {},
        };
    };

    clearMessageByMessageId(params: ClearMessageParams) {
        let messageLog: MessageLogMap | undefined;
        let parentMap: { [K in ConversationId & (string | number)]: MessageLogMap };
        let parentKey: ConversationId | ChannelId;

        if (params.type === MessageType.Direct) {
            parentKey = getConversationId(params.nodeA, params.nodeB);
            parentMap = this.messages.direct;
            messageLog = parentMap[parentKey];
        } else {
            // Broadcast
            parentKey = params.channelId;
            parentMap = this.messages.broadcast;
            messageLog = parentMap[parentKey];
        }

        if (messageLog) {
            const deleted = delete messageLog[params.messageId];
            if (deleted) {
                console.log(
                    `Deleted message ${params.messageId} from ${params.type} message ${parentKey}`,
                );
                // Clean up empty MessageLogMap and its entry in the parent map
                if (Object.entries(messageLog).length === 0) {
                    delete parentMap[parentKey];
                    console.log(`Cleaned up empty message entry for ${parentKey}`);
                }
            } else {
                console.warn(
                    `Message ${params.messageId} not found in ${params.type} chat ${parentKey} for deletion.`,
                );
            }
        } else {
            console.warn(
                `Message entry ${parentKey} not found for message deletion.`,
            );
        }
    };
}

export const useMessageStore = createSharedComposable(() => {
    const messageStore = ref<MessageStore>();

    watchThrottled(messageStore, (updated) => {
        // Write new value back into IndexedDB. Throttled to avoid writes on any change.
        if (isReactive(updated)) {
            updateMessageStore(toRaw(updated));
        }
    }, {
        deep: true,
        throttle: 3000
    })

    function toast(severity: ToastSeverity, detail: string, life?: number) {
        useGlobalToast().add({ severity, summary: 'Message Database Error', detail, life: life || 6000 });
    }

    async function getMessageStore(id: number) {
        if (messageStore.value?.id === id) {
            // Message store with id is already loaded.
            return messageStore.value;
        }
        try {
            // Try to load message store with id from database
            const msObj = await useIndexedDB().getFromStore(IDB_MESSAGE_STORE, id);
            // IndexedDB stores only Object data.
            if (msObj) {
                messageStore.value = new MessageStore(id, msObj);
                return messageStore.value;
            }
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            toast('error', msg);
        }
        // Not in database, create new one.
        return undefined;
    }

    async function addMessageStore(id: number): Promise<IMessageStore | undefined> {
        if (messageStore.value?.id === id) {
            // Message store with id already loaded
            return messageStore.value;
        }
        // Try to load from database
        let ms = await getMessageStore(id);
        if (ms) {
            // found
            return messageStore.value;
        }
        // Not in database, create new one
        ms = new MessageStore(id);

        try {
            const key = await useIndexedDB().insertIntoStore(IDB_MESSAGE_STORE, ms);
            if (typeof key === 'number') {
                const stored = await useIndexedDB().getFromStore(IDB_MESSAGE_STORE, key);
                if (stored) {
                    // IndexedDB stores only Object data.
                    // Keep class instance and just copy object data into.
                    ms.set(stored);
                    if (!(ms instanceof MessageStore)) {
                        throw new Error(`Added device is not an instance of MessageStore class.`);
                    }
                } else if (ms.id == null) {
                    ms.id = key;
                }
            }
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            toast('error', msg);
        }
        messageStore.value = ms;
        return ms;
    }

    async function updateMessageStore(ms: IMessageStore | undefined) {
        if (!ms) return;
        const o = ms.get();
        try {
            await useIndexedDB().updateStore(IDB_MESSAGE_STORE, o);
        } catch (e: any) {
            toast('error', e.message);
            purgeUncloneableProperties(ms);
        }
        return ms;
    }

    async function deleteMessageStore(id: number) {
        try {
            await useIndexedDB().deleteFromStore(IDB_MESSAGE_STORE, id);
            if (messageStore.value?.id === id) {
                messageStore.value = undefined;
            }
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            toast('error', msg);
        }
    }

    async function cleanMessageStore(id: number, myNodeNum: number) {
        try {
            const ms: Map<string | number, IMessageStore> = await useIndexedDB().getAllFromStore(IDB_MESSAGE_STORE);
            if (!messageStore.value) return;

            const idsToDelete: Array<number | string> = [];
            for (const [otherKey, oldStore] of ms.entries()) {
                const otherIdNum = typeof otherKey === 'string' ? Number(otherKey) : otherKey;
                if (otherIdNum === id || oldStore.myNodeNum !== myNodeNum) continue;
                // Adopt broadcast conversations
                if (oldStore.messages?.broadcast instanceof Map) {
                    for (const [channelId, logMap] of oldStore.messages.broadcast.entries()) {
                        messageStore.value.messages.broadcast[channelId as ChannelId] = logMap;
                    }
                }
                // Adopt direct conversations
                if (oldStore.messages?.direct instanceof Map) {
                    for (const [conversationId, logMap] of oldStore.messages.direct.entries()) {
                        messageStore.value.messages.direct[conversationId] = logMap;
                    }
                }
                // Adopt drafts
                if (oldStore.drafts instanceof Map) {
                    for (const [destination, draftText] of oldStore.drafts.entries()) {
                        messageStore.value.drafts[destination] = draftText;
                    }
                }
                idsToDelete.push(otherKey);
            }
            // Delete after iteration
            for (const key of idsToDelete) {
                await deleteMessageStore(typeof key === 'string' ? Number(key) : key);
            }
            const storesArray = Array.from(ms.values());
            while (storesArray.length > MESSAGESTORE_RETENTION_NUM) {
                const first = storesArray.shift()!;
                await deleteMessageStore(first.id);
            }
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            toast('error', msg);
        }
    }

    return {
        messageStore,
        addMessageStore,
        getMessageStore,
        updateMessageStore,
        deleteMessageStore,
        cleanMessageStore
    }
});
