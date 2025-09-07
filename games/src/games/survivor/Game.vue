<template>
  <div class="game-container">
    <h2>吸血鬼幸存者风</h2>
    <canvas ref="canvasRef" width="400" height="400" class="game-canvas"></canvas>
    <p>存活时间：{{ Math.floor(elapsed / 1000) }}秒 | 击败：{{ score }}</p>
    <button @click="restart">重新开始</button>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const canvasRef = ref(null)
const ctx = ref(null)

const player = { x: 200, y: 200, size: 10 }
const bullets = []
const enemies = []
const keys = new Set()

let lastSpawn = 0
let lastShoot = 0
let animationFrameId = 0

const score = ref(0)
const startTime = ref(Date.now())
const elapsed = ref(0)

function spawnEnemy() {
  const side = Math.floor(Math.random() * 4)
  let x, y
  if (side === 0) { x = 0; y = Math.random() * 400 }
  else if (side === 1) { x = 400; y = Math.random() * 400 }
  else if (side === 2) { x = Math.random() * 400; y = 0 }
  else { x = Math.random() * 400; y = 400 }
  enemies.push({ x, y, size: 10 })
}

function shoot() {
  if (enemies.length === 0) return
  const target = enemies[0]
  const dx = target.x - player.x
  const dy = target.y - player.y
  const len = Math.hypot(dx, dy)
  bullets.push({ x: player.x, y: player.y, vx: dx / len * 4, vy: dy / len * 4, size: 4 })
}

function update() {
  const now = Date.now()
  elapsed.value = now - startTime.value

  // 玩家移动
  if (keys.has('ArrowUp')) player.y = Math.max(player.size, player.y - 3)
  if (keys.has('ArrowDown')) player.y = Math.min(400 - player.size, player.y + 3)
  if (keys.has('ArrowLeft')) player.x = Math.max(player.size, player.x - 3)
  if (keys.has('ArrowRight')) player.x = Math.min(400 - player.size, player.x + 3)

  // 根据存活时间调整刷怪速度
  const spawnInterval = Math.max(200, 1000 - Math.floor(elapsed.value / 20))
  if (now - lastSpawn > spawnInterval) { spawnEnemy(); lastSpawn = now }

  if (now - lastShoot > 500) { shoot(); lastShoot = now }

  enemies.forEach(e => {
    const dx = player.x - e.x
    const dy = player.y - e.y
    const len = Math.hypot(dx, dy)
    e.x += dx / len
    e.y += dy / len
  })

  // 敌人碰撞玩家
  for (const e of enemies) {
    if (Math.hypot(e.x - player.x, e.y - player.y) < e.size + player.size) {
      alert('游戏结束！')
      restart()
      return
    }
  }

  // 子弹移动
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i]
    b.x += b.vx
    b.y += b.vy
    if (b.x < 0 || b.x > 400 || b.y < 0 || b.y > 400) bullets.splice(i, 1)
  }

  // 碰撞检测
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i]
    for (let j = bullets.length - 1; j >= 0; j--) {
      const b = bullets[j]
      if (Math.hypot(e.x - b.x, e.y - b.y) < e.size + b.size) {
        enemies.splice(i, 1)
        bullets.splice(j, 1)
        score.value++
        break
      }
    }
  }

  draw()
}

function loop() {
  update()
  animationFrameId = requestAnimationFrame(loop)
}

function draw() {
  ctx.value.clearRect(0, 0, 400, 400)

  ctx.value.fillStyle = 'blue'
  ctx.value.beginPath()
  ctx.value.arc(player.x, player.y, player.size, 0, Math.PI * 2)
  ctx.value.fill()

  ctx.value.fillStyle = 'red'
  enemies.forEach(e => {
    ctx.value.beginPath()
    ctx.value.arc(e.x, e.y, e.size, 0, Math.PI * 2)
    ctx.value.fill()
  })

  ctx.value.fillStyle = 'black'
  bullets.forEach(b => {
    ctx.value.beginPath()
    ctx.value.arc(b.x, b.y, b.size, 0, Math.PI * 2)
    ctx.value.fill()
  })
}

function handleKeyDown(e) {
  keys.add(e.key)
}

function handleKeyUp(e) {
  keys.delete(e.key)
}

function restart() {
  enemies.length = 0
  bullets.length = 0
  score.value = 0
  player.x = 200
  player.y = 200
  startTime.value = Date.now()
  keys.clear()
}

onMounted(() => {
  ctx.value = canvasRef.value.getContext('2d')
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
  restart()
  loop()
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
  cancelAnimationFrame(animationFrameId)
})
</script>

<style scoped>
.game-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  width: 100%;
  background-color: #f5f5f5;
  padding: 2rem;
  box-sizing: border-box;
}

.game-canvas {
  border: 2px solid #333;
  background-color: #ffffff;
  margin-top: 1rem;
}

h2 {
  margin-bottom: 1rem;
}

p {
  margin-top: 1rem;
  font-size: 1.2rem;
}

button {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  font-size: 1rem;
}
</style>

