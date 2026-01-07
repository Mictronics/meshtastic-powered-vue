import type { Types } from "@meshtastic/core";
import type { DBSchema } from "idb";
import {
    IDB_MESSAGE_STORE,
    useIndexedDB
} from "@/composables/core/stores/indexedDB";
import { createSharedComposable } from '@vueuse/core'
import { shallowRef } from 'vue'
import { useGlobalToast, type ToastSeverity } from '@/composables/useGlobalToast';
import { useEvictOldestEntries } from "@/composables/core/stores/utils/useEvictOldestEntries";
import type {
    ChannelId,
    ClearMessageParams,
    ConversationId,
    GetMessagesParams,
    Message,
    MessageId,
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
    direct: Map<ConversationId, MessageLogMap>;
    broadcast: Map<ChannelId, MessageLogMap>;
}

type IMessageStoreData = {
    // Persisted data
    id: number;
    myNodeNum: number | undefined;
    messages: MessageBuckets;
    drafts: Map<Types.Destination, string>;
};

export interface IMessageStore extends IMessageStoreData {
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

export interface MessageStoreState {
    addMessageStore: (id: number) => MessageStore;
    removeMessageStore: (id: number) => void;
    getMessageStore: (id: number) => MessageStore | undefined;
    getMessageStores: () => MessageStore[];
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
    drafts: Map<Types.Destination, string>;

    activeChat: number;
    chatType: MessageType;

    constructor(id: number, data?: Partial<IMessageStoreData>) {
        this.id = id;
        this.myNodeNum = data?.myNodeNum;
        this.messages = data?.messages ?? {
            direct: new Map<ConversationId, MessageLogMap>(),
            broadcast: new Map<ChannelId, MessageLogMap>(),
        };
        this.drafts = data?.drafts ?? new Map<Types.Destination, string>();
        this.activeChat = 0;
        this.chatType = MessageType.Broadcast;
    }

    set(obj: Partial<MessageStore>) {
        Object.assign(this, obj);
    }

    setNodeNum(nodeNum: number | undefined) {
        const newStore = useMessageStore().messageStores.value.get(this.id);
        if (!newStore) {
            throw new Error(`No MessageStore found for id: ${this.id}`);
        }

        newStore.myNodeNum = nodeNum;

        for (const [otherId, oldStore] of useMessageStore().messageStores.value) {
            if (otherId === this.id || oldStore.myNodeNum !== nodeNum) {
                continue;
            }
            // Adopt broadcast conversations (reuses inner Map references)
            for (const [channelId, logMap] of oldStore.messages.broadcast) {
                newStore.messages.broadcast.set(channelId, logMap);
            }
            // Adopt direct conversations
            for (const [conversationId, logMap] of oldStore.messages.direct) {
                newStore.messages.direct.set(conversationId, logMap);
            }
            // Adopt drafts
            for (const [destination, draftText] of oldStore.drafts) {
                newStore.drafts.set(destination, draftText);
            }
            // Drop old store
            useMessageStore().messageStores.value.delete(otherId);
        }
    };

    saveMessage(message: Message) {
        const state = useMessageStore().messageStores.value.get(this.id);
        if (!state) {
            throw new Error(`No MessageStore found for id: ${this.id}`);
        }

        let log: MessageLogMap | undefined;
        if (message.type === MessageType.Direct) {
            const conversationId = getConversationId(message.from, message.to);
            if (!state.messages.direct.has(conversationId)) {
                state.messages.direct.set(
                    conversationId,
                    new Map<MessageId, Message>(),
                );
            }

            log = state.messages.direct.get(conversationId);
            log?.set(message.messageId, message);
        } else if (message.type === MessageType.Broadcast) {
            const channelId = message.channel as ChannelId;
            if (!state.messages.broadcast.has(channelId)) {
                state.messages.broadcast.set(
                    channelId,
                    new Map<MessageId, Message>(),
                );
            }

            log = state.messages.broadcast.get(channelId);
            log?.set(message.messageId, message);
        }

        if (log) {
            // Enforce retention limit
            useEvictOldestEntries(log, MESSAGELOG_RETENTION_NUM);
        }
    };

    setMessageState(params: SetMessageStateParams) {
        const state = useMessageStore().messageStores.value.get(this.id);
        if (!state) {
            throw new Error(`No MessageStore found for id: ${this.id}`);
        }

        let messageLog: MessageLogMap | undefined;
        let targetMessage: Message | undefined;

        if (params.type === MessageType.Direct) {
            const conversationId = getConversationId(
                params.nodeA,
                params.nodeB,
            );
            messageLog = state.messages.direct.get(conversationId);
            if (messageLog) {
                targetMessage = messageLog.get(params.messageId);
            }
        } else {
            // Broadcast
            messageLog = state.messages.broadcast.get(params.channelId);
            if (messageLog) {
                targetMessage = messageLog.get(params.messageId);
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
        const state = useMessageStore().messageStores.value.get(this.id);
        if (!state) {
            throw new Error(`No MessageStore found for id: ${this.id}`);
        }

        let messageMap: MessageLogMap | undefined;

        if (params.type === MessageType.Direct) {
            const conversationId = getConversationId(params.nodeA, params.nodeB);
            messageMap = state.messages.direct.get(conversationId);
        } else {
            messageMap = state.messages.broadcast.get(params.channelId);
        }

        if (messageMap === undefined) {
            return [];
        }

        const messagesArray = Array.from(messageMap.values());
        messagesArray.sort((a, b) => a.date - b.date);
        return messagesArray;
    };

    getDraft(key: Types.Destination) {
        const state = useMessageStore().messageStores.value.get(this.id);
        if (!state) {
            throw new Error(`No MessageStore found for id: ${this.id}`);
        }

        return state.drafts.get(key) ?? "";
    };

    setDraft(key: Types.Destination, message: string) {
        const state = useMessageStore().messageStores.value.get(this.id);
        if (!state) {
            throw new Error(`No MessageStore found for id: ${this.id}`);
        }
        state.drafts.set(key, message);
    };

    clearDraft(key: Types.Destination) {
        const state = useMessageStore().messageStores.value.get(this.id);
        if (!state) {
            throw new Error(`No MessageStore found for id: ${this.id}`);
        }
        state.drafts.delete(key);
    };

    deleteAllMessages() {
        const state = useMessageStore().messageStores.value.get(this.id);
        if (!state) {
            throw new Error(`No MessageStore found for id: ${this.id}`);
        }
        state.messages.direct = new Map<ConversationId, MessageLogMap>();
        state.messages.broadcast = new Map<ChannelId, MessageLogMap>();
    };

    clearMessageByMessageId(params: ClearMessageParams) {
        const state = useMessageStore().messageStores.value.get(this.id);
        if (!state) {
            throw new Error(`No MessageStore found for id: ${this.id}`);
        }

        let messageLog: MessageLogMap | undefined;
        let parentMap: Map<ConversationId | ChannelId, MessageLogMap>;
        let parentKey: ConversationId | ChannelId;

        if (params.type === MessageType.Direct) {
            parentKey = getConversationId(params.nodeA, params.nodeB);
            parentMap = state.messages.direct;
            messageLog = parentMap.get(parentKey);
        } else {
            // Broadcast
            parentKey = params.channelId;
            parentMap = state.messages.broadcast;
            messageLog = parentMap.get(parentKey);
        }

        if (messageLog) {
            const deleted = messageLog.delete(params.messageId);
            if (deleted) {
                console.log(
                    `Deleted message ${params.messageId} from ${params.type} message ${parentKey}`,
                );
                // Clean up empty MessageLogMap and its entry in the parent map
                if (messageLog.size === 0) {
                    parentMap.delete(parentKey);
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
    const messageStores = shallowRef<Map<number, MessageStore>>(new Map());

    function toast(severity: ToastSeverity, detail: string, life?: number) {
        useGlobalToast().add({ severity, summary: 'Message Database Error', detail, life: life || 6000 });
    }

    async function init() {
        messageStores.value = await getMessageStoresFromDatabase();
    }

    async function getMessageStoresFromDatabase() {
        try {
            const all = await useIndexedDB().getAllFromStore(IDB_MESSAGE_STORE);
            // IndexedDB stores only Object data.
            // Ensure that we return a map of MessageStore class instances.
            const msMap = new Map();
            all.forEach((value: any, key: any) => {
                const ms = new MessageStore(key, value);
                msMap.set(key, ms);
            });
            return msMap;
        } catch (e: any) {
            toast('error', e.message);
        }
        return new Promise<Map<number, MessageStore>>(() => { return new Map(); });
    }

    function getMessageStores() {
        return messageStores.value;
    };

    function getMessageStore(id: number) {
        return messageStores.value.get(id);
    };

    async function addMessageStore(id: number) {
        const existing = await getMessageStore(id);
        if (existing) {
            return existing;
        }

        const messageStore = new MessageStore(id);
        const draft = new Map(messageStores.value);
        draft.set(id, messageStore);
        useEvictOldestEntries(draft, MESSAGESTORE_RETENTION_NUM);
        messageStores.value = draft;

        try {
            const key = await useIndexedDB().insertIntoStore(IDB_MESSAGE_STORE, messageStore);
            if (typeof key === 'number') {
                const stored = await useIndexedDB().getFromStore(IDB_MESSAGE_STORE, key);
                if (stored) {
                    // IndexedDB stores only Object data.
                    // Keep class instance and just copy object data into.
                    messageStore.set(stored);
                    if (!(messageStore instanceof MessageStore)) {
                        throw new Error(`Added messageStore is not an instance of MessageStore class.`);
                    }
                } else if (messageStore.id == null) {
                    messageStore.id = key;
                }
            }
        } catch (e: any) {
            toast('error', e.message);
        }
        messageStores.value.set(id, messageStore);
        return messageStore;
    }

    async function updateMessageStore(store: IMessageStore) {
        try {
            await useIndexedDB().updateStore(IDB_MESSAGE_STORE, store);
            // reload revived value from the DB
            if (store.id != null) {
                const stored = await useIndexedDB().getFromStore(IDB_MESSAGE_STORE, store.id as any);
                if (messageStores.value.has(store.id))
                    messageStores.value.get(store.id)?.set(stored);
            }
        } catch (e: any) {
            toast('error', e.message);
        }
        return store;
    }

    async function deleteMessageStore(id: number) {
        try {
            await useIndexedDB().deleteFromStore(IDB_MESSAGE_STORE, id);
            messageStores.value.delete(id);
        } catch (e: any) {
            toast('error', e.message);
        }
    }

    init();

    return {
        messageStores,
        addMessageStore,
        getMessageStore,
        getMessageStores,
        updateMessageStore,
        deleteMessageStore,
    }
});
