import type { FunctionalComponent } from 'vue';
import type { LucideProps } from 'lucide-vue-next';

export type SortDir = 'asc' | 'desc';

export type SortState = {
    dir: SortDir;
    order: number;
};

export type ButtonConfig = {
    icon: FunctionalComponent<LucideProps>;
    toolTip: string;
};

export type ButtonsMap = {
    shortName: ButtonConfig;
    longName: ButtonConfig;
    isFavorite: ButtonConfig;
    lastHeard: ButtonConfig;
    numHops: ButtonConfig;
    numSnr: ButtonConfig;
    batteryLevel: ButtonConfig;
    isOnline: ButtonConfig;
};

export type ButtonKey = keyof ButtonsMap;