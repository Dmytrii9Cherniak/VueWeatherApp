import CarbonVue3 from '@carbon/vue';
import App from './App.vue';
import { createApp } from 'vue'
import './assets/main.scss';

import 'carbon-components/css/carbon-components.css';
import router from '@/routes/routes.ts'
import { i18n } from '@/i18n/i18n.ts'

const app = createApp(App);

app.use(router);
app.use(CarbonVue3);
app.use(i18n);
app.mount('#app');
