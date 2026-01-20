declare module 'emoji-mart-vue-fast' {
    import { DefineComponent, ComponentPublicInstance } from 'vue';

    export type EmojiData = {
        id?: string;
        name?: string;
        colons?: string;
        emoticons?: string[];
        unified?: string;
        skin?: number;
        native?: string;
        custom?: boolean;
        short_names?: string[];
        keywords?: string[];
        sheet_x?: number;
        sheet_y?: number;
        text?: string | null;
        old?: string | null;
    };

    export type OnEmojiSelect = (emoji: EmojiData, event?: Event) => void;

    export interface BasePickerProps {
        emoji?: string;
        emojisToShowFilter?: (emoji: EmojiData) => boolean;
        native?: boolean;
        perLine?: number;
        emojiSize?: number;
        sheetSize?: number;
        skin?: number;
        i18n?: Record<string, string>;
        title?: string | boolean;
        enableFrequentEmojiSort?: boolean;
        showPreview?: boolean;
        showSkinTones?: boolean;
        onSelect?: OnEmojiSelect;
        onClick?: OnEmojiSelect;
        onSearch?: (query: string) => void;
        class?: string;
        style?: Record<string, any>;
        [key: string]: any;
    }

    export interface NimblePickerProps extends BasePickerProps {
        data?: any;
        emojis?: EmojiData[];
        defaultSkin?: number;
        recent?: string[];
        custom?: any[];
        include?: string[];
        exclude?: string[];
    }

    export interface EmojiProps {
        emoji: string | EmojiData;
        size?: number;
        native?: boolean;
        fallback?: string;
        set?: 'apple' | 'google' | 'twitter' | 'facebook' | 'emojione' | 'messenger';
        sheetSize?: 16 | 20 | 32;
        skin?: number;
        tooltip?: boolean;
        forceSize?: boolean;
        onClick?: (e: Event) => void;
    }

    export class EmojiIndex {
        constructor(
            data: any,
            options?: {
                emojisToShowFilter?: (emoji: any) => boolean;
                include?: string[];
                exclude?: string[];
                custom?: any[];
                recent?: string[];
                recentLength?: number;
            },
        );

        buildIndex(): void;
        findEmoji(emoji: string, skin?: number): any | null;
        categories(): any[];
        emoji(emojiId: string): any;
        firstEmoji(): any;
        hasEmoji(emojiId: string): boolean;
        nativeEmoji(unicodeEmoji: string): any | null;
        search(value: string, maxResults?: number): any[] | null;
        addCustomEmoji(customEmoji: any): any;
        addEmoji(emojiId: string): any | false;
        isCategoryNeeded(category_id: string): boolean;
        isEmojiNeeded(emoji: any): boolean;
    }

    export const EmojiIndexExport: typeof EmojiIndex | {
        search: (query: string, maxResults?: number) => any[];
        get: (shortNameOrUnified: string) => any | undefined;
        searchable: boolean;
    };

    export type EmojiIndexType = EmojiIndex;

    export const Picker: DefineComponent<Partial<BasePickerProps>, {}, any>;
    export const NimblePicker: DefineComponent<Partial<NimblePickerProps>, {}, any>;
    export const Emoji: DefineComponent<Partial<EmojiProps>, {}, any>;

    export function dataFromEmojiSheet(sheet: any): any;
    export function getEmojiDataFromNative(native: string): EmojiData | undefined;

    const _default: {
        Picker: typeof Picker;
        NimblePicker: typeof NimblePicker;
        Emoji: typeof Emoji;
        EmojiIndex: typeof EmojiIndex;
        dataFromEmojiSheet: typeof dataFromEmojiSheet;
        getEmojiDataFromNative: typeof getEmojiDataFromNative;
    };

    export default _default;
}

declare module 'emoji-mart-vue-fast/src' {
    import main from 'emoji-mart-vue-fast';
    export = main;
}
