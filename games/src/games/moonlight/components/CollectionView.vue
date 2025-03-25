<template>
  <div class="collection">
    <h2>📚 カードコレクション</h2>

    <div v-if="cards.length === 0">カードがありません。</div>

    <div class="card-grid">
      <div v-for="card in cards" :key="card.id" class="card">
        <div class="header">
          <span class="type">{{ typeIcons[card.type] || '❓' }}</span>
          <span class="name">{{ card.name }}</span>
        </div>
        <div class="stats">
          <span>💧{{ card.cost }}</span>
          <span v-if="card.atk !== null">⚔{{ card.atk }}</span>
          <span v-if="card.hp !== null">❤{{ card.hp }}</span>
        </div>
        <div class="desc">{{ card.description }}</div>
        <div class="count">×{{ card.count }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/store/userStore'  // ← 必要ならパス調整
const userStore = useUserStore()

const cards = ref([])
const user = JSON.parse(localStorage.getItem('user'))
const typeIcons = {
  minion: '💠',
  spell: '✨',
  weapon: '🗡',
  hero: '👑'
}

onMounted(async () => {
  userStore.loadUserFromStorage()
  const user = userStore.user
  if (!user?.id) return
  const res = await fetch(`http://localhost:3001/api/moonlight/collection/${user.id}`)
  cards.value = await res.json()
})
</script>

<style scoped>
.collection {
  padding: 2rem;
  text-align: center;
}
.card-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
}
.card {
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 1rem;
  width: 160px;
  background: #f8f8f8;
  position: relative;
}
.header {
  font-weight: bold;
  margin-bottom: 0.5rem;
}
.type {
  margin-right: 0.5rem;
}
.stats {
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}
.desc {
  font-size: 0.8rem;
  color: #444;
}
.count {
  position: absolute;
  bottom: 8px;
  right: 8px;
  font-weight: bold;
}
</style>
