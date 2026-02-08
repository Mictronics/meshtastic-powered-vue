import './assets/main.css';

import { createApp } from 'vue';
import App from './App.vue';
import router from './router';

import PrimeVue from 'primevue/config';
import Lara from '@primeuix/themes/lara';

import Button from 'primevue/button';
import Card from 'primevue/card';
import Chip from 'primevue/chip';
import Popover from 'primevue/popover';
import Message from 'primevue/message';
import SelectButton from 'primevue/selectbutton';
import Checkbox from 'primevue/checkbox';
import InputText from 'primevue/inputtext';
import InputGroup from 'primevue/inputgroup';
import InputGroupAddon from 'primevue/inputgroupaddon';
import FloatLabel from 'primevue/floatlabel';
import Dialog from 'primevue/dialog';
import Divider from 'primevue/divider';
import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import TabPanels from 'primevue/tabpanels';
import TabPanel from 'primevue/tabpanel';
import ProgressSpinner from 'primevue/progressspinner';
import ConfirmDialog from 'primevue/confirmdialog';
import Badge from 'primevue/badge';
import PanelMenu from 'primevue/panelmenu';
import Avatar from 'primevue/avatar';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import Drawer from 'primevue/drawer';
import VirtualScroller from 'primevue/virtualscroller';
import Accordion from 'primevue/accordion';
import AccordionPanel from 'primevue/accordionpanel';
import AccordionHeader from 'primevue/accordionheader';
import AccordionContent from 'primevue/accordioncontent';
import ToggleSwitch from 'primevue/toggleswitch';
import Select from 'primevue/select';
import Fieldset from 'primevue/fieldset';
import Password from 'primevue/password';
import MeterGroup from 'primevue/metergroup';
import InputMask from 'primevue/inputmask';
import ListBox from 'primevue/listbox';

import Toast from 'primevue/toast';
import ToastService from 'primevue/toastservice';
import ConfirmationService from 'primevue/confirmationservice';
import Tooltip from 'primevue/tooltip';

import { useGlobalToast } from '@/composables/useGlobalToast';
import { bootstrapApp } from './bootstrap';

const app = createApp(App);

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

app.use(router);
app.use(ToastService);
app.use(ConfirmationService);
app.directive('tooltip', Tooltip);
app.component('Toast', Toast);

bootstrapApp();

try {
    const globalToast = useGlobalToast();
    const svc = app.config.globalProperties.$toast;
    if (svc) globalToast.setToastService(svc);
} catch (err) {
    console.warn('Toast service not available yet:', err);
}

[
    Button,
    Card,
    Chip,
    Popover,
    Message,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    Checkbox,
    SelectButton,
    InputText,
    InputGroup,
    InputGroupAddon,
    FloatLabel,
    Dialog,
    Divider,
    ProgressSpinner,
    ConfirmDialog,
    Badge,
    PanelMenu,
    Avatar,
    IconField,
    InputIcon,
    Drawer,
    VirtualScroller,
    Accordion,
    AccordionPanel,
    AccordionHeader,
    AccordionContent,
    ToggleSwitch,
    Select,
    Fieldset,
    Password,
    MeterGroup,
    InputMask,
    ListBox
].forEach(component => {
    app.component(component.name, component);
});

app.mount('#app');
