import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import PrimeVue from 'primevue/config';
import Lara from '@primeuix/themes/lara';
import Card from 'primevue/card';
import Button from 'primevue/button';
import Chip from 'primevue/chip';
import Popover from 'primevue/popover';
import { Message } from 'primevue';
import SelectButton from 'primevue/selectbutton';
import Checkbox from 'primevue/checkbox';
import InputText from 'primevue/inputtext';
import InputGroup from 'primevue/inputgroup';
import InputGroupAddon from 'primevue/inputgroupaddon';
import FloatLabel from 'primevue/floatlabel';
import Dialog from 'primevue/dialog';
import Toast from 'primevue/toast';
import ToastService from 'primevue/toastservice';
import Divider from 'primevue/divider';
import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import TabPanels from 'primevue/tabpanels';
import TabPanel from 'primevue/tabpanel';
import ProgressSpinner from 'primevue/progressspinner';
import ConfirmDialog from 'primevue/confirmdialog';
import ConfirmationService from 'primevue/confirmationservice';
import Badge from 'primevue/badge';
import PanelMenu from 'primevue/panelmenu';
import Avatar from 'primevue/avatar';
import Tooltip from 'primevue/tooltip';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
// Import icons
import {
    Cable,
    Globe,
    Star,
    StarOff,
    Bluetooth,
    Link,
    Unlink,
    RotateCcw,
    Ellipsis,
    Trash2,
    ArrowLeft,
    Router,
    Save,
    Network,
    CircleCheck,
    CircleX,
    Info,
    SquareMousePointer,
    ShieldQuestionMark,
    Hourglass,
    Menu,
    MessageSquareText,
    Map,
    Settings,
    Users,
    BatteryCharging,
    Battery,
    BatteryLow,
    BatteryMedium,
    BatteryFull,
    Cpu,
    BatteryWarning,
    Sun,
    Moon,
    SunMoon,
    Search,
    Lock,
    LockOpen,
    MessageSquareOff
} from "lucide-vue-next";
import { useGlobalToast } from '@/composables/useGlobalToast';
import { tryOnMounted } from '@vueuse/core';
import { useIndexedDB } from '@/composables/core/stores/indexedDB';
import { useConnectionStore } from '@/composables/core/stores/connection/useConnectionStore';
import { useDeviceStore } from '@/composables/core/stores/device/useDeviceStore';
import { useMessageStore } from '@/composables/core/stores/message/useMessageStore';
import { useNodeDBStore } from '@/composables/core/stores/nodeDB/useNodeDBStore';
import { useAppStore } from './composables/core/stores/app/useAppStore';
import { useFormattedNodeDatabase } from './composables/core/utils/useFormattedNodeDatabase';

const app = createApp(App)

app.use(PrimeVue, {
    theme: {
        preset: Lara,
        options: {
            darkModeSelector: '.dark',
            cssLayer: {
                name: 'primevue',
                order: 'theme, base, primevue, utilities'
            }
        }
    }
});

/**
 * Initialize as early as possible to get IndexedDB content into
 * composables prior first use.It's all async.
 */
tryOnMounted(() => {
    useIndexedDB();
    useAppStore();
    useConnectionStore();
    useDeviceStore();
    useMessageStore();
    useNodeDBStore();
    useFormattedNodeDatabase();
});

app.directive('tooltip', Tooltip);
app.use(router)
app.use(ToastService);
app.use(ConfirmationService);
app.component('Toast', Toast);
// initialize global toast service so composables can use it
try {
    const globalToast = useGlobalToast();
    const svc = (app.config.globalProperties).$toast;
    if (svc) globalToast.setToastService(svc);
} catch (e: unknown) { }
app.component('Button', Button);
app.component('Card', Card);
app.component('Chip', Chip);
app.component('Popover', Popover);
app.component('Message', Message);
app.component('Tabs', Tabs);
app.component('TabList', TabList);
app.component('Tab', Tab);
app.component('TabPanels', TabPanels);
app.component('TabPanel', TabPanel);
app.component('Checkbox', Checkbox);
app.component('SelectButton', SelectButton);
app.component('InputText', InputText);
app.component('InputGroup', InputGroup);
app.component('InputGroupAddon', InputGroupAddon);
app.component('FloatLabel', FloatLabel);
app.component('Dialog', Dialog);
app.component('Divider', Divider);
app.component('ProgressSpinner', ProgressSpinner);
app.component('ConfirmDialog', ConfirmDialog);
app.component('Badge', Badge);
app.component('PanelMenu', PanelMenu);
app.component('Avatar', Avatar);
app.component('DataTable', DataTable);
app.component('Column', Column);
app.component('IconField', IconField);
app.component('InputIcon', InputIcon);
/* Icons */
app.component('IconCable', Cable);
app.component('IconGlobe', Globe);
app.component('IconStar', Star);
app.component('IconStarOff', StarOff);
app.component('IconBluetooth', Bluetooth);
app.component('IconLink', Link);
app.component('IconUnlink', Unlink);
app.component('IconRotateCcw', RotateCcw);
app.component('IconEllipsis', Ellipsis);
app.component('IconTrash2', Trash2);
app.component('IconArrowLeft', ArrowLeft);
app.component('IconRouter', Router);
app.component('IconSave', Save);
app.component('IconNetwork', Network);
app.component('IconCircleCheck', CircleCheck);
app.component('IconCircleX', CircleX);
app.component('IconInfo', Info);
app.component('IconSquareMousePointer', SquareMousePointer);
app.component('IconShieldQuestionMark', ShieldQuestionMark);
app.component('IconHourglass', Hourglass);
app.component('IconMenu', Menu);
app.component('IconMessageSquareText', MessageSquareText);
app.component('IconMap', Map);
app.component('IconSettings', Settings);
app.component('IconUsers', Users);
app.component('IconBatteryCharging', BatteryCharging);
app.component('IconBattery', Battery);
app.component('IconBatteryWarning', BatteryWarning);
app.component('IconBatteryLow', BatteryLow);
app.component('IconBatteryMedium', BatteryMedium);
app.component('IconBatteryFull', BatteryFull);
app.component('IconCpu', Cpu);
app.component('IconSun', Sun);
app.component('IconMoon', Moon);
app.component('IconSunMoon', SunMoon);
app.component('IconSearch', Search);
app.component('IconLock', Lock);
app.component('IconLockOpen', LockOpen);
app.component('IconMessageSquareOff', MessageSquareOff);
app.mount('#app')
