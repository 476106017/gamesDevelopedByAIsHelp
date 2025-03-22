import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createI18n } from 'vue-i18n'
import messages from './locales/locales.js'

const app = createApp(App)

app.use(router)

const userLang = navigator.language || navigator.userLanguage

let defaultLocale = 'ja' // 默认设置为日语

if (userLang.startsWith('zh')) {
    defaultLocale = 'zh'
} else if (userLang.startsWith('en')) {
    defaultLocale = 'en'
}
const i18n = createI18n({
    legacy: false,
    locale: defaultLocale,
    fallbackLocale: 'ja',
    messages,
})

app.use(i18n).mount('#app')
