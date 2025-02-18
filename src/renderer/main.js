import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import { createI18n } from 'vue-i18n'
import zhTW from './locales/zh-TW'
import en from './locales/en'
import App from './App.vue'
import router from './router'
import './styles/main.css'
import { useNotification } from './components/GlobalNotification.vue'

// 創建 Pinia 實例
const pinia = createPinia()

// 創建 i18n 實例
const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem('language') || 'zh-TW',
  fallbackLocale: 'zh-TW',
  messages: {
    'zh-TW': zhTW,
    'en': en
  }
})

// 創建應用實例
const app = createApp(App)

// Use plugins
app.use(pinia)
app.use(router)
app.use(i18n)
app.use(ElementPlus)

// Register global notification method
app.config.globalProperties.$notify = useNotification()

// Mount application
app.mount('#app') 