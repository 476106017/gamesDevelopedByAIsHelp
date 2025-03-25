<template>
  <div class="home">
    <h1>{{ $t('homeTitle') }}</h1>
    <div class="button-group">
      <router-link to="/login" class="btn secondary">登录</router-link>
      <button class="btn primary" @click="goToGames">{{ $t('chooseGame') }}</button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()

const goToGames = () => {
  router.push('/games')
}
</script>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 80vh;
  text-align: center;
}

h1 {
  font-size: 2rem;
  margin-bottom: 2rem;
}

.button-group {
  display: flex;
  gap: 1rem;
}

.btn {
  padding: 0.8rem 2rem;
  font-size: 1.1rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  text-decoration: none;
  transition: 0.3s;
  display: inline-block;
}

.primary {
  background-color: #4caf50;
  color: white;
}

.primary:hover {
  background-color: #388e3c;
}

.secondary {
  background-color: white;
  color: #4caf50;
  border: 2px solid #4caf50;
}

.secondary:hover {
  background-color: #e8f5e9;
}
</style>
