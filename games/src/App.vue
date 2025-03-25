<template>
  <div id="app">
    <router-view />

    <!-- 首页按钮 -->
    <router-link
        v-if="$route.path !== '/'"
        to="/"
        class="home-button"
    > 🏠 {{ $t('home') }} </router-link>

    <!-- 多语言切换 -->
    <div class="lang-switch">
      <select v-model="$i18n.locale">
        <option value="ja">日本語</option>
        <option value="en">English</option>
        <option value="zh">中文</option>
      </select>
    </div>

    <!-- 登录用户信息 -->
    <div v-if="userStore.user" class="user-info">
      👤 {{ userStore.user.username }}
      <button @click="userStore.clearUser(); location.reload()">退出</button>
    </div>

  </div>
</template>

<script setup>
import { useUserStore } from './store/userStore'

import { ref, onMounted } from 'vue'

const user = ref(null)
const userStore = useUserStore()


const logout = () => {
  localStorage.removeItem('user')
  location.reload() // 简洁粗暴的刷新（你也可以 router.push('/login')）
}

onMounted(() => {
  userStore.loadUserFromStorage()
})


</script>


<style>
html, body, #app {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
}

#app {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}.home-button {
   position: fixed;
   top: 20px;
   left: 20px;
   background: #ffffffcc;
   color: #333;
   padding: 0.5rem 1rem;
   border: 1px solid #aaa;
   border-radius: 6px;
   font-weight: bold;
   text-decoration: none;
   box-shadow: 0 2px 4px rgba(0,0,0,0.2);
   z-index: 999;
   transition: 0.2s ease;
 }
.home-button:hover {
  background: #fff;
  color: #000;
  transform: scale(1.05);
}

.lang-switch {
  position: fixed;
  top: 70px; /* 👈 稍微低一点，避免重叠主页按钮 */
  left: 20px;
  z-index: 998;
}

.lang-switch select {
  padding: 0.4rem 0.8rem;
  font-size: 0.9rem;
  border: 1px solid #aaa;
  border-radius: 6px;
  background: #ffffffcc;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  cursor: pointer;
  transition: 0.2s ease;
}
.lang-switch select:hover {
  background: #fff;
}
.user-info {
  position: fixed;
  top: 10px;
  right: 20px;
  background: #ffffffcc;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: bold;
  color: #333;
  box-shadow: 0 2px 4px rgba(0,0,0,0.15);
  z-index: 997;
}

.user-info button {
  margin-left: 0.5rem;
  background: #e53935;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.3rem 0.6rem;
  cursor: pointer;
  font-size: 0.8rem;
  transition: background 0.2s;
}

.user-info button:hover {
  background: #c62828;
}


</style>
