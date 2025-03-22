<template>
  <div class="game-select">
    <h1>ミニゲーム一覧</h1>
    <div class="game-list">
      <div
          v-for="game in games"
          :key="game.name"
          class="game-item"
          @click="goToGame(game.name)"
      >
        <img :src="game.thumbnail" :alt="game.title" />
        <p>{{ game.title }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import games from '../data/games.js'

const router = useRouter()


const goToGame = (name) => {
  router.push({ name: 'game', params: { name } })
}
</script>

<style scoped>
.game-select {
  text-align: center;
  padding: 2rem;
}

.game-list {
  display: flex;
  justify-content: center;
  gap: 2rem;
  flex-wrap: wrap;
  margin-top: 2rem;
}

.game-item {
  cursor: pointer;
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 1rem;
  width: 160px;
  transition: transform 0.2s;
}

.game-item:hover {
  transform: scale(1.05);
}

.game-item img {
  width: 100%;
  height: auto;
  border-radius: 4px;
}
</style>
