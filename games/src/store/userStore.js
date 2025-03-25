import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore('user', () => {
    const user = ref(null)

    function setUser(u) {
        user.value = u
        localStorage.setItem('user', JSON.stringify(u))
    }

    function clearUser() {
        user.value = null
        localStorage.removeItem('user')
    }

    function loadUserFromStorage() {
        const stored = localStorage.getItem('user')
        if (stored) {
            try {
                user.value = JSON.parse(stored)
            } catch { user.value = null }
        }
    }

    return { user, setUser, clearUser, loadUserFromStorage }
})
