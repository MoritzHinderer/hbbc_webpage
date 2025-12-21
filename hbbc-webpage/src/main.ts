import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'

// Import Tailwind CSS
import './index.css'

createApp(App)
    .use(router)
    .mount('#app')
