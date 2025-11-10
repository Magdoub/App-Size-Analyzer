/**
 * Main - Application entry point
 */

import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import './index.css';

// Create Vue app instance
const app = createApp(App);

// Install Pinia for state management
const pinia = createPinia();
app.use(pinia);

// Mount app to #root element
app.mount('#root');
