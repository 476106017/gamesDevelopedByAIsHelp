<template>
  <div class="game-container">
    <canvas ref="canvas" :width="canvasWidth" :height="canvasHeight" @mousedown="handleClick" />
    <div class="card-hand">
      <Card
          v-for="(card, index) in store.hand"
          :key="index"
          :card="card"
          :onDragStart="(e) => startDrag(card, e, index)"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useGameStore } from '../store/gameStore'
import { drawHexGrid, drawUnits } from '../canvas/boardRenderer'
import { getHexAt, getVisibleCoords  } from '../canvas/hexUtils'
import Card from './Card.vue'
import { io } from 'socket.io-client'

// 连接服务器
const socket = io('http://localhost:3001')
// 接收对战状态更新
socket.on('updateGame', (newState) => {
  store.units = newState.units
  // 可选：store.hero = newState.hero（若未来同步英雄状态）
})


const canvas = ref(null)
const canvasWidth = 800
const canvasHeight = 600
const store = useGameStore()

let dragCard = null
let dragIndex = null

const startDrag = (card, event, index) => {
  dragCard = card
  dragIndex = index
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', endDrag)
}

const onDrag = (event) => {
  // 拖拽预览可后续加
}

const endDrag = (event) => {
  const rect = canvas.value.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  const hex = getHexAt(x, y, 40)
  if (hex && dragCard) {
    if (store.mana >= dragCard.cost) {
      store.playCard(dragIndex)
      store.placeUnit(hex.q, hex.r, dragCard)
      // TODO
      socket.emit('placeUnit', {
        q: hex.q,
        r: hex.r,
        ...dragCard
      })
    } else {
      console.log('费用不足')
    }
  }
  dragCard = null
  dragIndex = null
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', endDrag)
}

const handleClick = (e) => {}

const draw = () => {
  const ctx = canvas.value.getContext('2d')
  const visible = getVisibleCoords([...store.units, store.hero])
  drawHexGrid(ctx, canvasWidth, canvasHeight, 40, visible)
  drawUnits(ctx, [...store.units, store.hero], 40, visible)
}

onMounted(() => {
  draw()
})

watch(() => store.units, () => {
  draw()
}, { deep: true })
</script>

<style scoped>
.game-container {
  position: relative;
}
canvas {
  border: 1px solid #ccc;
}
.card-hand {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}
</style>
