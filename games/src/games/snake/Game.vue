<template>
  <div class="game-container">
    <h2>スネークゲーム</h2>
    <canvas ref="canvasRef" width="400" height="400" class="game-canvas"></canvas>
    <p :class="{ score: true, bonus: isBonusMode }">
      スコア：{{ score }}
    </p>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const canvasRef = ref(null)
const score = ref(0)

let ctx
let gameLoop = null
let slowTimer = null

const gridSize = 20
const snake = ref([{ x: 5, y: 5 }])
const direction = ref({ x: 1, y: 0 })

let food = { x: 10, y: 10 }
let specialItem = null // 道具（一个）
let applesEaten = 0
let isGhostMode = ref(false)
let activeEffect = null   // 当前生效中的道具类型
let effectEndTime = 0     // 结束时间戳

const isBonusMode = ref(false)
let currentSpeed = 150 // 默认速度

function draw() {
  ctx.clearRect(0, 0, 400, 400)

  // 🌀 ghost 模式边框提示
  if (activeEffect === 'ghost') {
    drawGhostBorder()
  }

  // 蛇
  ctx.fillStyle = getSnakeColor()
  snake.value.forEach(part => {
    ctx.fillRect(part.x * gridSize, part.y * gridSize, gridSize - 2, gridSize - 2)
  })

  // 普通食物
  ctx.fillStyle = '#f44336'
  ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 2, gridSize - 2)

  // 特殊道具（如减速）
  if (specialItem) {
    const now = Date.now()
    const flicker = Math.floor(now / 300) % 2 === 0 // 闪烁动画
    ctx.fillStyle = flicker ? getItemColor(specialItem.type) : '#ddd'
    ctx.fillRect(specialItem.x * gridSize, specialItem.y * gridSize, gridSize - 2, gridSize - 2)
  }

}

function drawGhostBorder() {
  const flicker = Math.floor(Date.now() / 200) % 2 === 0

  ctx.strokeStyle = flicker ? '#ab47bc' : '#ce93d8' // 深紫 ↔ 淡紫
  ctx.lineWidth = 4
  ctx.setLineDash([6, 6]) // 虚线
  ctx.strokeRect(0, 0, 400, 400)
  ctx.setLineDash([]) // 清除虚线
}

function getSnakeColor() {
  if (!activeEffect) return '#4caf50' // 默认绿

  const timeLeft = effectEndTime - Date.now()
  const flicker = (timeLeft < 1000) && (Math.floor(Date.now() / 150) % 2 === 0)

  if (flicker) return '#ffffff' // 闪烁时变白

  switch (activeEffect) {
    case 'slow': return '#a1887f'  // 棕灰
    case 'fast': return '#00acc1'  // 青色
    case 'ghost': return '#ab47bc' // 紫色
    case 'bonus': return '#ffa000' // 橙色
    default: return '#4caf50'
  }
}

function update() {
  const newHead = {
    x: snake.value[0].x + direction.value.x,
    y: snake.value[0].y + direction.value.y,
  }

  // 撞墙或自撞
  if (!isGhostMode.value) {
    if (
        newHead.x < 0 || newHead.y < 0 ||
        newHead.x >= 20 || newHead.y >= 20 ||
        snake.value.some(seg => seg.x === newHead.x && seg.y === newHead.y)
    ) {
      alert('ゲームオーバー！')
      snake.value = [{ x: 5, y: 5 }]
      direction.value = { x: 1, y: 0 }
      score.value = 0
      applesEaten = 0
      specialItem = null
      resetSpeed()
      return
    }
  } else {
    // 穿墙：从另一边出来
    newHead.x = (newHead.x + 20) % 20
    newHead.y = (newHead.y + 20) % 20
  }

  snake.value.unshift(newHead)

  // 吃普通食物
  if (newHead.x === food.x && newHead.y === food.y) {
    score.value += isBonusMode.value ? 3 : 1
    applesEaten++
    placeFood()

    if (applesEaten >= 1 && Math.random() < 0.5 && !specialItem) {
      placeSpecialItem()
      applesEaten = 0
    }
  } else {
    snake.value.pop()
  }

  // 吃道具
  if (specialItem && newHead.x === specialItem.x && newHead.y === specialItem.y) {
    applySpecialEffect(specialItem.type)
    specialItem = null
  }

  draw()
}

function placeFood() {
  let x, y
  do {
    x = Math.floor(Math.random() * 20)
    y = Math.floor(Math.random() * 20)
  } while (snake.value.some(p => p.x === x && p.y === y) || (specialItem && specialItem.x === x && specialItem.y === y))

  food = { x, y }
}

function getItemColor(type) {
  switch (type) {
    case 'slow': return '#c2b280'  // 土黄
    case 'fast': return '#00bcd4'  // 青蓝
    case 'ghost': return '#9c27b0' // 紫色
    case 'bonus': return 'gold' // 橙色
    default: return '#aaa'
  }
}

function placeSpecialItem() {
  let x, y
  do {
    x = Math.floor(Math.random() * 20)
    y = Math.floor(Math.random() * 20)
  } while (
      snake.value.some(p => p.x === x && p.y === y) ||
      (food.x === x && food.y === y)
      )

  const types = ['slow', 'fast', 'ghost', 'bonus']
  const type = types[Math.floor(Math.random() * types.length)]
  specialItem = { x, y, type }

}

function applySpecialEffect(type) {
  const duration = {
    slow: 5000,
    fast: 3000,
    ghost: 5000,
    bonus: 5000
  }[type]

  const now = Date.now()
  const newEndTime = now + duration

// 只延长效果，不会缩短
  if (activeEffect === type && effectEndTime > now) {
    effectEndTime = Math.max(effectEndTime, newEndTime)
  } else {
    activeEffect = type
    effectEndTime = newEndTime

    // 重新启动道具状态（例如 ghost / bonus）
    if (type === 'ghost') {
      isGhostMode.value = true
    } else if (type === 'bonus') {
      isBonusMode.value = true
    }

    // 设置结束回收
    setTimeout(() => {
      if (effectEndTime <= Date.now()) {
        activeEffect = null
        if (type === 'ghost') isGhostMode.value = false
        if (type === 'bonus') isBonusMode.value = false
      }
    }, duration)
  }


  if (type === 'slow') {
    setSpeed(300, duration)
  } else if (type === 'fast') {
    setSpeed(80, duration)
  } else if (type === 'ghost') {
    isGhostMode.value = true
    setTimeout(() => { isGhostMode.value = false }, duration)
  } else if (type === 'bonus') {
    isBonusMode.value = true
    setTimeout(() => { isBonusMode.value = false }, duration)
  }

  // 自动清除 activeEffect
  setTimeout(() => { activeEffect = null }, duration)
}


function setSpeed(speed, duration) {
  clearInterval(gameLoop)
  currentSpeed = speed
  gameLoop = setInterval(update, currentSpeed)
  if (slowTimer) clearTimeout(slowTimer)
  slowTimer = setTimeout(() => {
    resetSpeed()
  }, duration)
}

function resetSpeed() {
  clearInterval(gameLoop)
  currentSpeed = 150
  gameLoop = setInterval(update, currentSpeed)
}

function handleKey(e) {
  switch (e.key) {
    case 'ArrowUp': if (direction.value.y === 0) direction.value = { x: 0, y: -1 }; break
    case 'ArrowDown': if (direction.value.y === 0) direction.value = { x: 0, y: 1 }; break
    case 'ArrowLeft': if (direction.value.x === 0) direction.value = { x: -1, y: 0 }; break
    case 'ArrowRight': if (direction.value.x === 0) direction.value = { x: 1, y: 0 }; break
  }
}

onMounted(() => {
  ctx = canvasRef.value.getContext('2d')
  window.addEventListener('keydown', handleKey)
  gameLoop = setInterval(update, currentSpeed)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKey)
  clearInterval(gameLoop)
  clearTimeout(slowTimer)
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
.score {
  margin-top: 1rem;
  font-size: 1.2rem;
  transition: all 0.3s ease;
}

.score.bonus {
  color: gold;
  text-shadow: 0 0 8px gold, 0 0 4px orange;
  animation: pulse 0.6s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

</style>
