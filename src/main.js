import { createApp } from 'vue'
import { createPinia } from 'pinia'

// Vuetify
import vuetify from './plugins/vuetify'

//全域字體
import './assets/styles/global.css'

import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'

const app = createApp(App)

app.use(vuetify)

app.use(createPinia())
app.use(router)

// 應用程式啟動時檢查token有效性
const authStore = useAuthStore()
if (authStore.token && authStore.isTokenValid) {
  // 如果token有效，啟動檢查機制
  authStore.startTokenCheck()
}

app.mount('#app')
