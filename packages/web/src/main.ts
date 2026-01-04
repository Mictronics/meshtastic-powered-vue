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
//import Select from 'primevue/select';
//import IconField from 'primevue/iconfield';
//import InputIcon from 'primevue/inputicon';
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
} from "lucide-vue-next";
import { useGlobalToast } from '@/composables/useGlobalToast';

const app = createApp(App)

app.use(PrimeVue, {
    theme: {
        preset: Lara,
        options: {
            darkModeSelector: '.p-dark',
            cssLayer: {
                name: 'primevue',
                order: 'theme, base, primevue, utilities'
            }
        }
    }
});
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
//app.component('Select', Select);
//app.component('IconField', IconField);
//app.component('InputIcon', InputIcon);
app.component('InputText', InputText);
app.component('InputGroup', InputGroup);
app.component('InputGroupAddon', InputGroupAddon);
app.component('FloatLabel', FloatLabel);
app.component('Dialog', Dialog);
app.component('Divider', Divider);
app.component('ProgressSpinner', ProgressSpinner);
app.component('ConfirmDialog', ConfirmDialog);
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
app.mount('#app')
