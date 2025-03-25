<template>
  <div class="game-select">
    <h1>{{ $t('gameList') }}</h1>

    <!-- 本地小游戏 -->
    <section>
      <h2>本地游戏</h2>
      <div class="game-list">
        <div
            v-for="game in localGames"
            :key="game.name"
            class="game-item"
            @click="goToGame(game.name)"
        >
          <img :src="game.thumbnail" :alt="game.name" />
          <p>{{ $t('games.' + game.name) }}</p>
        </div>
      </div>
    </section>

    <!-- 在线游戏 -->
    <section>
      <h2>在线游戏</h2>
      <div class="game-list">
        <div
            v-for="game in onlineGames"
            :key="game.name"
            class="game-item"
            :class="{ disabled: !loggedIn }"
            @click="loggedIn && goToGame(game.name)"
        >
          <img :src="game.thumbnail" :alt="game.name" />
          <p>{{ $t('games.' + game.name) }}</p>
          <small v-if="!loggedIn" class="login-tip">需登录</small>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import allGames from '../data/games.js'
import { computed } from 'vue'

// 假设你的游戏数据中有 online 字段
const localGames = allGames.filter(g => !g.online)
const onlineGames = allGames.filter(g => g.online)

const router = useRouter()

// 登录状态（从 localStorage 获取）
const loggedIn = computed(() => {
  return !!localStorage.getItem('user')
})

const goToGame = (name) => {
  router.push({ name: 'game', params: { name } })
}
</script>

<style scoped>
.game-select {
  text-align: center;
  padding: 2rem;
}

h2 {
  margin-top: 2rem;
  color: #333;
}

.game-list {
  display: flex;
  justify-content: center;
  gap: 2rem;
  flex-wrap: wrap;
  margin-top: 1rem;
}

.game-item {
  cursor: pointer;
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 1rem;
  width: 160px;
  transition: transform 0.2s;
  position: relative;
}

.game-item:hover {
  transform: scale(1.05);
}

.game-item img {
  width: 100%;
  height: auto;
  border-radius: 4px;
}

.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.login-tip {
  color: red;
  font-size: 12px;
  position: absolute;
  bottom: 8px;
  left: 0;
  right: 0;
}
</style>
