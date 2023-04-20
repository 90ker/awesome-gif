import { createApp } from 'vue'
import draggable from 'vuedraggable'
import App from './App.vue'

import './assets/main.css'

const app = createApp(App);
app.component('DraggableWrapper', draggable);
app.mount('#app')
