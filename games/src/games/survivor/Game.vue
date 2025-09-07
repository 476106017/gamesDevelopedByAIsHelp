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
        🕒 {{ Math.floor(elapsed / 1000) }}s | 👾 {{ score }} | ⭐ {{ level }}
      </div>
      <div class="weapons">
        🔫
        <span v-if="hasKnife">🔪</span>
        <span v-if="hasFlame">🔥</span>
        <span v-if="hasBomb">💣</span>
      </div>
      <div class="exp-bar">
        <div class="exp-fill" :style="{ width: (exp / expToNext * 100) + '%' }"></div>
      </div>
      <button @click="restart">重新开始</button>
    </div>

    <div v-if="showUpgrade" class="upgrade-overlay">
      <button v-if="!hasKnife" @click="unlockKnife">解锁🔪小刀</button>
      <button v-if="!hasFlame" @click="unlockFlame">解锁🔥火焰</button>
      <button v-if="!hasBomb" @click="unlockBomb">解锁💣炸弹</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const canvasRef = ref(null)
const ctx = ref(null)

const width = ref(window.innerWidth)
const height = ref(window.innerHeight)

const player = { x: 0, y: 0, size: 10 }
const bulletDamage = 1
const knifeDamage = 3
const bullets = []
const flames = []
const bombs = []
const effects = []
const enemies = []
const xpOrbs = []
const keys = new Set()

let lastSpawn = 0
let lastShoot = 0
let lastKnife = 0
let lastFlame = 0
let lastBomb = 0
let animationFrameId = 0

const score = ref(0)
const startTime = ref(Date.now())
const elapsed = ref(0)

const exp = ref(0)
const level = ref(1)
const bulletSpeed = 4
let expToNext = 5
const hasKnife = ref(false)
const hasFlame = ref(false)
const hasBomb = ref(false)
const showUpgrade = ref(false)
let paused = false

function spawnEnemy() {
  const camX = player.x - width.value / 2
  const camY = player.y - height.value / 2
  const side = Math.floor(Math.random() * 4)
  let x, y
  if (side === 0) { x = camX - 20; y = camY + Math.random() * height.value }
  else if (side === 1) { x = camX + width.value + 20; y = camY + Math.random() * height.value }
  else if (side === 2) { x = camX + Math.random() * width.value; y = camY - 20 }
  else { x = camX + Math.random() * width.value; y = camY + height.value + 20 }
  const hp = 3 + Math.floor(elapsed.value / 5000)
  enemies.push({ x, y, size: 10, hp, maxHp: hp })
}

function shoot() {
  if (enemies.length === 0) return
  const target = enemies[0]
  const dx = target.x - player.x
  const dy = target.y - player.y
  const len = Math.hypot(dx, dy)
  bullets.push({ x: player.x, y: player.y, vx: dx / len * bulletSpeed, vy: dy / len * bulletSpeed, size: 4 })
}

function update() {
  const now = Date.now()
  elapsed.value = now - startTime.value

  if (paused) { draw(); return }

  // 玩家移动
  if (keys.has('ArrowUp')) player.y -= 3
  if (keys.has('ArrowDown')) player.y += 3
  if (keys.has('ArrowLeft')) player.x -= 3
  if (keys.has('ArrowRight')) player.x += 3

  // 根据存活时间调整刷怪速度
  const spawnInterval = Math.max(200, 1000 - Math.floor(elapsed.value / 20))
  if (now - lastSpawn > spawnInterval) { spawnEnemy(); lastSpawn = now }

  if (now - lastShoot > 500) { shoot(); lastShoot = now }

  if (hasKnife.value && now - lastKnife > 800) {
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i]
      if (Math.hypot(e.x - player.x, e.y - player.y) < 25) {
        e.hp -= knifeDamage
        if (e.hp <= 0) {
          const ex = e.x, ey = e.y
          enemies.splice(i, 1)
          score.value++
          xpOrbs.push({ x: ex, y: ey, size: 4, vx: 0, vy: 0 })
        }
      }
    }
    effects.push({ type: 'slash', x: player.x, y: player.y, ttl: 10 })
    lastKnife = now
  }

  if (hasFlame.value && now - lastFlame > 1000 && enemies.length) {
    const target = enemies[0]
    const dx = target.x - player.x
    const dy = target.y - player.y
    const len = Math.hypot(dx, dy)
    flames.push({ x: player.x, y: player.y, vx: dx / len * 2, vy: dy / len * 2, life: 40, size: 6 })
    lastFlame = now
  }

  if (hasBomb.value && now - lastBomb > 2000 && enemies.length) {
    const target = enemies[0]
    const dx = target.x - player.x
    const dy = target.y - player.y
    const len = Math.hypot(dx, dy)
    bombs.push({ x: player.x, y: player.y, vx: dx / len * 3, vy: dy / len * 3, size: 6 })
    lastBomb = now
  }

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
    if (
      b.x < player.x - width.value / 2 - 100 ||
      b.x > player.x + width.value / 2 + 100 ||
      b.y < player.y - height.value / 2 - 100 ||
      b.y > player.y + height.value / 2 + 100
    ) bullets.splice(i, 1)
  }

  // 火焰移动
  for (let i = flames.length - 1; i >= 0; i--) {
    const f = flames[i]
    f.x += f.vx
    f.y += f.vy
    f.life--
    if (f.life <= 0) { flames.splice(i, 1); continue }
    for (let j = enemies.length - 1; j >= 0; j--) {
      const e = enemies[j]
      if (Math.hypot(e.x - f.x, e.y - f.y) < e.size + f.size) {
        e.hp -= 2
        if (e.hp <= 0) {
          const ex = e.x, ey = e.y
          enemies.splice(j, 1)
          score.value++
          xpOrbs.push({ x: ex, y: ey, size: 4, vx: 0, vy: 0 })
        }
        f.life = 0
        break
      }
    }
  }

  // 炸弹移动
  for (let i = bombs.length - 1; i >= 0; i--) {
    const m = bombs[i]
    m.x += m.vx
    m.y += m.vy
    m.vx *= 0.98
    m.vy *= 0.98
    if (Math.hypot(m.vx, m.vy) < 0.3) {
      for (let j = enemies.length - 1; j >= 0; j--) {
        const e = enemies[j]
        if (Math.hypot(e.x - m.x, e.y - m.y) < 40) {
          const ex = e.x, ey = e.y
          enemies.splice(j, 1)
          score.value++
          xpOrbs.push({ x: ex, y: ey, size: 4, vx: 0, vy: 0 })
        }
      }
      effects.push({ type: 'boom', x: m.x, y: m.y, ttl: 20 })
      bombs.splice(i, 1)
    }
  }

  // 子弹碰撞敌人
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i]
    for (let j = bullets.length - 1; j >= 0; j--) {
      const b = bullets[j]
      if (Math.hypot(e.x - b.x, e.y - b.y) < e.size + b.size) {
        e.hp -= bulletDamage
        bullets.splice(j, 1)
        if (e.hp <= 0) {
          const ex = e.x, ey = e.y
          enemies.splice(i, 1)
          score.value++
          xpOrbs.push({ x: ex, y: ey, size: 4, vx: 0, vy: 0 })
        }
        break
      }
    }
  }

  // 经验球吸收
  for (let i = xpOrbs.length - 1; i >= 0; i--) {
    const xp = xpOrbs[i]
    const dx = player.x - xp.x
    const dy = player.y - xp.y
    const dist = Math.hypot(dx, dy)
    if (dist < 80 && dist > 0) {
      xp.x += dx / dist * 4
      xp.y += dy / dist * 4
    }
    if (dist < xp.size + player.size) {
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

  const camX = player.x - width.value / 2
  const camY = player.y - height.value / 2

  ctx.value.font = '20px sans-serif'
  ctx.value.textAlign = 'center'
  ctx.value.textBaseline = 'middle'

  // 玩家
  ctx.value.fillText('🙂', player.x - camX, player.y - camY)

  // 敌人及血条
  enemies.forEach(e => {
    const sx = e.x - camX
    const sy = e.y - camY
    ctx.value.fillText('👾', sx, sy)
    ctx.value.fillStyle = 'red'
    ctx.value.fillRect(sx - e.size, sy - e.size - 6, e.size * 2, 4)
    ctx.value.fillStyle = 'green'
    ctx.value.fillRect(sx - e.size, sy - e.size - 6, e.size * 2 * (e.hp / e.maxHp), 4)
    ctx.value.fillStyle = 'black'
  })

  // 经验球
  xpOrbs.forEach(xp => {
    ctx.value.fillText('✨', xp.x - camX, xp.y - camY)
  })

  // 子弹
  bullets.forEach(b => {
    ctx.value.fillText('🔹', b.x - camX, b.y - camY)
  })

  // 火焰
  flames.forEach(f => {
    ctx.value.fillText('🔥', f.x - camX, f.y - camY)
  })

  // 炸弹
  bombs.forEach(m => {
    ctx.value.fillText('💣', m.x - camX, m.y - camY)
  })

  // 效果
  for (let i = effects.length - 1; i >= 0; i--) {
    const ef = effects[i]
    const sx = ef.x - camX
    const sy = ef.y - camY
    ctx.value.fillText(ef.type === 'slash' ? '🔪' : '💥', sx, sy)
    ef.ttl--
    if (ef.ttl <= 0) effects.splice(i, 1)
  }
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
  flames.length = 0
  bombs.length = 0
  effects.length = 0
  xpOrbs.length = 0
  score.value = 0
  exp.value = 0
  level.value = 1
  expToNext = 5
  hasKnife.value = false
  hasFlame.value = false
  hasBomb.value = false
  lastShoot = 0
  lastKnife = 0
  lastFlame = 0
  lastBomb = 0
  player.x = 0
  player.y = 0
  startTime.value = Date.now()
  keys.clear()
  showUpgrade.value = false
  paused = false
}

function levelUp() {
  exp.value -= expToNext
  level.value++
  expToNext = Math.floor(expToNext * 1.5)
  if (!hasKnife.value || !hasFlame.value || !hasBomb.value) {
    paused = true
    showUpgrade.value = true
  }
}

function unlockKnife() {
  hasKnife.value = true
  showUpgrade.value = false
  paused = false
}

function unlockFlame() {
  hasFlame.value = true
  showUpgrade.value = false
  paused = false
}

function unlockBomb() {
  hasBomb.value = true
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
  bottom: 10px;
  left: 10px;
  color: #000;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.weapons {
  font-size: 1.2rem;
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

