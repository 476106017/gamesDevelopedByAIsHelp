<template>
  <div class="game-container">
    <canvas
      ref="canvasRef"
      :width="width"
      :height="height"
      class="game-canvas"
    ></canvas>

    <div class="hud">
      <div class="info">
        存活时间：{{ Math.floor(elapsed / 1000) }}秒 | 击败：{{ score }} | 等级：{{ level }}
      </div>
      <div class="exp-bar">
        <div class="exp-fill" :style="{ width: (exp / expToNext * 100) + '%' }"></div>
      </div>
      <button @click="restart">重新开始</button>
    </div>

    <div v-if="showUpgrade" class="upgrade-overlay">
      <button @click="upgradeBullet">提升子弹速度</button>
      <button v-if="!hasPulse" @click="upgradePulse">解锁范围攻击</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const canvasRef = ref(null)
const ctx = ref(null)

const width = ref(window.innerWidth)
const height = ref(window.innerHeight)

const player = { x: width.value / 2, y: height.value / 2, size: 10 }
const bullets = []
const enemies = []
const xpOrbs = []
const keys = new Set()

let lastSpawn = 0
let lastShoot = 0
let lastPulse = 0
let animationFrameId = 0

const score = ref(0)
const startTime = ref(Date.now())
const elapsed = ref(0)

const exp = ref(0)
const level = ref(1)
const bulletSpeed = ref(4)
let expToNext = 5
const hasPulse = ref(false)
const showUpgrade = ref(false)
let paused = false

function spawnEnemy() {
  const side = Math.floor(Math.random() * 4)
  let x, y
  if (side === 0) { x = 0; y = Math.random() * height.value }
  else if (side === 1) { x = width.value; y = Math.random() * height.value }
  else if (side === 2) { x = Math.random() * width.value; y = 0 }
  else { x = Math.random() * width.value; y = height.value }
  enemies.push({ x, y, size: 10 })
}

function shoot() {
  if (enemies.length === 0) return
  const target = enemies[0]
  const dx = target.x - player.x
  const dy = target.y - player.y
  const len = Math.hypot(dx, dy)
  bullets.push({ x: player.x, y: player.y, vx: dx / len * bulletSpeed.value, vy: dy / len * bulletSpeed.value, size: 4 })
}

function pulse() {
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i]
    if (Math.hypot(e.x - player.x, e.y - player.y) < 60) {
      enemies.splice(i, 1)
      score.value++
      xpOrbs.push({ x: e.x, y: e.y, size: 4 })
    }
  }
}

function update() {
  const now = Date.now()
  elapsed.value = now - startTime.value

  if (paused) { draw(); return }

  // 玩家移动
  if (keys.has('ArrowUp')) player.y = Math.max(player.size, player.y - 3)
  if (keys.has('ArrowDown')) player.y = Math.min(height.value - player.size, player.y + 3)
  if (keys.has('ArrowLeft')) player.x = Math.max(player.size, player.x - 3)
  if (keys.has('ArrowRight')) player.x = Math.min(width.value - player.size, player.x + 3)

  // 根据存活时间调整刷怪速度
  const spawnInterval = Math.max(200, 1000 - Math.floor(elapsed.value / 20))
  if (now - lastSpawn > spawnInterval) { spawnEnemy(); lastSpawn = now }

  if (now - lastShoot > 500) { shoot(); lastShoot = now }
  if (hasPulse.value && now - lastPulse > 3000) { pulse(); lastPulse = now }

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
    if (b.x < 0 || b.x > width.value || b.y < 0 || b.y > height.value) bullets.splice(i, 1)
  }

  // 碰撞检测
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i]
    for (let j = bullets.length - 1; j >= 0; j--) {
      const b = bullets[j]
      if (Math.hypot(e.x - b.x, e.y - b.y) < e.size + b.size) {
        const ex = e.x
        const ey = e.y
        enemies.splice(i, 1)
        bullets.splice(j, 1)
        score.value++
        xpOrbs.push({ x: ex, y: ey, size: 4 })
        break
      }
    }
  }

  // 经验球拾取
  for (let i = xpOrbs.length - 1; i >= 0; i--) {
    const xp = xpOrbs[i]
    if (Math.hypot(xp.x - player.x, xp.y - player.y) < xp.size + player.size) {
      xpOrbs.splice(i, 1)
      exp.value++
      if (exp.value >= expToNext) levelUp()
    }
  }

  draw()
}

function loop() {
  update()
  animationFrameId = requestAnimationFrame(loop)
}

function draw() {
  ctx.value.clearRect(0, 0, width.value, height.value)

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

  ctx.value.fillStyle = 'green'
  xpOrbs.forEach(xp => {
    ctx.value.beginPath()
    ctx.value.arc(xp.x, xp.y, xp.size, 0, Math.PI * 2)
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
  xpOrbs.length = 0
  score.value = 0
  exp.value = 0
  level.value = 1
  expToNext = 5
  bulletSpeed.value = 4
  hasPulse.value = false
  player.x = width.value / 2
  player.y = height.value / 2
  startTime.value = Date.now()
  keys.clear()
  showUpgrade.value = false
  paused = false
}

function levelUp() {
  exp.value -= expToNext
  level.value++
  expToNext = Math.floor(expToNext * 1.5)
  paused = true
  showUpgrade.value = true
}

function upgradeBullet() {
  bulletSpeed.value += 1
  showUpgrade.value = false
  paused = false
}

function upgradePulse() {
  hasPulse.value = true
  showUpgrade.value = false
  paused = false
}

onMounted(() => {
  ctx.value = canvasRef.value.getContext('2d')

  function handleResize() {
    width.value = window.innerWidth
    height.value = window.innerHeight
    canvasRef.value.width = width.value
    canvasRef.value.height = height.value
  }
  handleResize()
  window.addEventListener('resize', handleResize)
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
  restart()
  loop()
  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
  })
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
  cancelAnimationFrame(animationFrameId)
})
</script>

<style scoped>
.game-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background-color: #f5f5f5;
}

.game-canvas {
  position: absolute;
  top: 0;
  left: 0;
  border: 2px solid #333;
  background-color: #ffffff;
}

.hud {
  position: absolute;
  top: 10px;
  left: 10px;
  color: #000;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.exp-bar {
  width: 200px;
  height: 10px;
  background: #ccc;
}

.exp-fill {
  height: 100%;
  background: #4caf50;
}

.upgrade-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(255, 255, 255, 0.9);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: center;
}
</style>

