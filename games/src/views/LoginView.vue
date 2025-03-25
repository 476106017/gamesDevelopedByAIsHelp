<template>
  <div class="login-page">
    <div class="login-box">
      <h2>{{ isLogin ? '登录' : '注册' }}</h2>
      <form @submit.prevent="isLogin ? handleLogin() : handleRegister()">
        <input v-model="username" placeholder="用户名" required />
        <input v-model="password" type="password" placeholder="密码" required />
        <button type="submit">{{ isLogin ? '登录' : '注册' }}</button>
      </form>
      <p class="toggle" @click="isLogin = !isLogin">
        {{ isLogin ? '没有账号？点此注册' : '已有账号？点此登录' }}
      </p>
      <p v-if="error" class="error">{{ error }}</p>
    </div>
  </div>
</template>

<script setup>
// 打开登录页就清除旧的登录状态
localStorage.removeItem('user')

import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/userStore'

const userStore = useUserStore()
const username = ref('')
const password = ref('')
const error = ref('')
const isLogin = ref(true)
const router = useRouter()

const handleLogin = async () => {
  try {
    const res = await fetch('http://localhost:3001/api/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.value, password: password.value })
    })

    if (res.ok) {
      const data = await res.json()
      userStore.setUser(data.user)
      router.push('/')
    } else {
      error.value = '用户名或密码错误'
    }
  } catch {
    error.value = '登录失败，请稍后重试'
  }
}
const handleRegister = async () => {
  try {
    const res = await fetch('http://localhost:3001/api/users/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.value, password: password.value })
    })

    if (res.ok) {
      // ✅ 自动切换为登录状态并预填用户名
      error.value = ''
      isLogin.value = true
      password.value = ''
      // ✅ 自动聚焦密码栏，体验更好（如果你加了 ref）
    } else {
      const data = await res.json()
      error.value = data.error || '注册失败'
    }
  } catch {
    error.value = '注册失败，请稍后重试'
  }
}

</script>

<style scoped>
.login-page {
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f5f5f5;
}

.login-box {
  background: white;
  padding: 2rem 2.5rem;
  border-radius: 12px;
  box-shadow: 0 0 10px rgba(0,0,0,0.1);
  width: 300px;
  text-align: center;
}

h2 {
  margin-bottom: 1.5rem;
}

input {
  display: block;
  width: 100%;
  padding: 0.6rem;
  margin-bottom: 1rem;
  border: 1px solid #ccc;
  border-radius: 6px;
}

button {
  width: 100%;
  padding: 0.6rem;
  background-color: #4caf50;
  color: white;
  font-size: 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.3s;
}

button:hover {
  background-color: #388e3c;
}

.toggle {
  margin-top: 1rem;
  font-size: 0.9rem;
  color: #007bff;
  cursor: pointer;
  text-decoration: underline;
}

.error {
  margin-top: 0.8rem;
  color: red;
  font-size: 0.9rem;
}
</style>
