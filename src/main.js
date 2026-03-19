/**
 * Main - Application entry point
 */

import { createPinia } from 'pinia';
import { createApp } from 'vue';
import App from './App.vue';
import './index.css';

// Create Vue app instance
const app = createApp(App);

// Install Pinia for state management
const pinia = createPinia();
app.use(pinia);

// Mount app to #root element
app.mount('#root');
