<template>
  <div class="home">
    <h1>ミニゲームセンターへようこそ！</h1>
    <button @click="goToGames">ゲームを選ぶ</button>
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
  text-align: center;
  margin-top: 100px;
}

button {
  padding: 1rem 2rem;
  font-size: 1.2rem;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s;
}

button:hover {
  background-color: #388e3c;
}
</style>
