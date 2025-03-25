<template>
  <div class="menu">
    <h2>🌙 Moonlight</h2>
    <div class="user-info">👤 {{ user.username }}</div>

    <DeckList :decks="decks" @edit="editDeck" @select="selectDeck" />

    <div class="actions">
      <button @click="goToCollection">📚 コレクション</button>
      <button @click="startMatch">⚔️ 対戦開始</button>
    </div>

    <!-- モーダルや遷移でDeckEditor / Collectionを表示してもOK -->
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import DeckList from './components/DeckList.vue'

import { useRouter } from 'vue-router'
const router = useRouter()


const user = JSON.parse(localStorage.getItem('user'))
const decks = ref([])

onMounted(async () => {
  const res = await fetch(`http://localhost:3001/api/moonlight/decks/${user.id}`)
  decks.value = await res.json()
})

const editDeck = (deckId) => {
  // デッキ編集画面へ
}

const selectDeck = (deckId) => {
  // デッキを選択状態に
}

const goToCollection = () => {
  // コレクション画面へ
  router.push('/moonlight/collection')

}

const startMatch = () => {
  // マッチング開始処理
}
</script>

<style scoped>
.menu {
  text-align: center;
  padding: 2rem;
}
.user-info {
  margin-bottom: 1rem;
  font-weight: bold;
}
.actions {
  margin-top: 2rem;
  display: flex;
  justify-content: center;
  gap: 1rem;
}
</style>
