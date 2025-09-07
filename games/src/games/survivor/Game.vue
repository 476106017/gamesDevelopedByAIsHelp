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
      <div class="exp-bar">
        <div class="exp-fill" :style="{ width: (exp / expToNext * 100) + '%' }"></div>
      </div>
      <button @click="restart">重新开始</button>
    </div>

    <div class="weapon-levels">
      🔫{{ bulletLevel }}
      🔪{{ knifeLevel }}
      🔥{{ flameLevel }}
      💣{{ bombLevel }}
    </div>

    <div v-if="showUpgrade" class="upgrade-overlay">
      <button @click="upgradeBullet">提升🔫射速</button>
      <button v-if="!hasKnife" @click="unlockKnife">解锁🔪小刀</button>
      <button v-else @click="upgradeKnife">提升🔪伤害</button>
      <button v-if="!hasFlame" @click="unlockFlame">解锁🔥火焰</button>
      <button v-else @click="upgradeFlame">提升🔥穿透</button>
      <button v-if="!hasBomb" @click="unlockBomb">解锁💣炸弹</button>
      <button v-else @click="upgradeBomb">提升💣范围</button>
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
// 刀的伤害较高，补偿其极短的攻击范围
let knifeDamage = 10
let knifeRange = 50
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
let bulletInterval = 500
let flamePierce = 1
let bombRange = 40
let expToNext = 5
const hasKnife = ref(false)
const hasFlame = ref(false)
const hasBomb = ref(false)
const showUpgrade = ref(false)
let paused = false

const bulletLevel = ref(1)
const knifeLevel = ref(0)
const flameLevel = ref(0)
const bombLevel = ref(0)

const levelEmojis = ['🙂','😊','😄','😁','😆','😎']
const playerEmoji = ref(levelEmojis[0])
const gameOver = ref(false)

const enemyEmojis = ['👾', '👹', '👻', '🤖', '👺']

function spawnEnemy() {
  const camX = player.x - width.value / 2
  const camY = player.y - height.value / 2
  const side = Math.floor(Math.random() * 4)
  let x, y
  if (side === 0) { x = camX - 20; y = camY + Math.random() * height.value }
  else if (side === 1) { x = camX + width.value + 20; y = camY + Math.random() * height.value }
  else if (side === 2) { x = camX + Math.random() * width.value; y = camY - 20 }
  else { x = camX + Math.random() * width.value; y = camY + height.value + 20 }
  // 每 15 秒提升敌人类型，血量与速度随阶段增加
  const stage = Math.floor(elapsed.value / 15000)
  const hp = 1 + stage
  const speed = 0.5 + stage * 0.2
  const emoji = enemyEmojis[Math.min(stage, enemyEmojis.length - 1)]
  enemies.push({ x, y, size: 10, hp, maxHp: hp, speed, emoji })
}

function getNearestEnemy() {
  let nearest = null
  let minDist = Infinity
  let index = -1
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i]
    const d = Math.hypot(e.x - player.x, e.y - player.y)
    if (d < minDist) {
      minDist = d
      nearest = e
      index = i
    }
  }
  return { enemy: nearest, dist: minDist, index }
}

function shoot() {
  if (enemies.length === 0) return
  const { enemy: target } = getNearestEnemy()
  if (!target) return
  const dx = target.x - player.x
  const dy = target.y - player.y
  const len = Math.hypot(dx, dy)
  bullets.push({ x: player.x, y: player.y, vx: dx / len * bulletSpeed, vy: dy / len * bulletSpeed, size: 4 })
}

function update() {
  const now = Date.now()
  elapsed.value = now - startTime.value

  if (paused) { draw(); return }

  // 玩家移动，支持方向键与 WASD
  if (keys.has('arrowup') || keys.has('w')) player.y -= 3
  if (keys.has('arrowdown') || keys.has('s')) player.y += 3
  if (keys.has('arrowleft') || keys.has('a')) player.x -= 3
  if (keys.has('arrowright') || keys.has('d')) player.x += 3

  // 根据存活时间调整刷怪速度，减缓提升节奏
  const spawnInterval = Math.max(400, 1000 - Math.floor(elapsed.value / 80))
  if (now - lastSpawn > spawnInterval) { spawnEnemy(); lastSpawn = now }

  if (now - lastShoot > bulletInterval) { shoot(); lastShoot = now }

  if (hasKnife.value && now - lastKnife > 800) {
    const { enemy: nearest, dist: minDist, index: nearestIndex } = getNearestEnemy()
    if (nearest) {
      const nx = (nearest.x - player.x) / minDist
      const ny = (nearest.y - player.y) / minDist
      const sx = player.x + nx * (knifeRange * 0.7)
      const sy = player.y + ny * (knifeRange * 0.7)
      if (minDist < knifeRange) {
        nearest.hp -= knifeDamage
        if (nearest.hp <= 0) {
          const ex = nearest.x, ey = nearest.y
          enemies.splice(nearestIndex, 1)
          score.value++
          xpOrbs.push({ x: ex, y: ey, size: 4, vx: 0, vy: 0 })
        }
      }
      effects.push({ type: 'slash', x: sx, y: sy, ttl: 10 })
    }
    lastKnife = now
  }

  if (hasFlame.value && now - lastFlame > 1000 && enemies.length) {
    const { enemy: target } = getNearestEnemy()
    if (target) {
      const dx = target.x - player.x
      const dy = target.y - player.y
      const len = Math.hypot(dx, dy)
      flames.push({ x: player.x, y: player.y, vx: dx / len * 3, vy: dy / len * 3, life: 60, size: 6, pierce: flamePierce })
    }
    lastFlame = now
  }

  if (hasBomb.value && now - lastBomb > 2000 && enemies.length) {
    const { enemy: target } = getNearestEnemy()
    if (target) {
      const dx = target.x - player.x
      const dy = target.y - player.y
      const len = Math.hypot(dx, dy)
      bombs.push({ x: player.x, y: player.y, vx: dx / len * 3, vy: dy / len * 3, size: 6 })
    }
    lastBomb = now
  }

  enemies.forEach(e => {
    const dx = player.x - e.x
    const dy = player.y - e.y
    const len = Math.hypot(dx, dy)
    e.x += (dx / len) * e.speed
    e.y += (dy / len) * e.speed
  })

  // 敌人碰撞玩家
  for (const e of enemies) {
    if (Math.hypot(e.x - player.x, e.y - player.y) < e.size + player.size) {
      playerEmoji.value = '😭'
      paused = true
      gameOver.value = true
      showUpgrade.value = false
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
    let removed = false
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
        f.pierce--
        if (f.pierce <= 0) { flames.splice(i, 1); removed = true; break }
      }
    }
    if (!removed && f.life <= 0) flames.splice(i, 1)
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
        if (Math.hypot(e.x - m.x, e.y - m.y) < bombRange) {
          const ex = e.x, ey = e.y
          enemies.splice(j, 1)
          score.value++
          xpOrbs.push({ x: ex, y: ey, size: 4, vx: 0, vy: 0 })
        }
      }
      effects.push({ type: 'boom', x: m.x, y: m.y, ttl: 20, r: bombRange })
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
  ctx.value.fillText(playerEmoji.value, player.x - camX, player.y - camY)

  // 敌人及血条
  enemies.forEach(e => {
    const sx = e.x - camX
    const sy = e.y - camY
    ctx.value.fillText(e.emoji, sx, sy)
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
    if (ef.type === 'slash') {
      ctx.value.fillText('🔪', sx, sy)
    } else {
      ctx.value.save()
      ctx.value.font = ef.r * 2 + 'px sans-serif'
      ctx.value.textAlign = 'center'
      ctx.value.textBaseline = 'middle'
      ctx.value.fillText('💥', sx, sy)
      ctx.value.restore()
    }
    ef.ttl--
    if (ef.ttl <= 0) effects.splice(i, 1)
  }
}

function handleKeyDown(e) {
  keys.add(e.key.toLowerCase())
}

function handleKeyUp(e) {
  keys.delete(e.key.toLowerCase())
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
  bulletInterval = 500
  knifeDamage = 10
  knifeRange = 50
  flamePierce = 1
  bombRange = 40
  hasKnife.value = false
  hasFlame.value = false
  hasBomb.value = false
  bulletLevel.value = 1
  knifeLevel.value = 0
  flameLevel.value = 0
  bombLevel.value = 0
  lastShoot = 0
  lastKnife = 0
  lastFlame = 0
  lastBomb = 0
  player.x = 0
  player.y = 0
  startTime.value = Date.now()
  keys.clear()
  showUpgrade.value = false
  playerEmoji.value = levelEmojis[0]
  gameOver.value = false
  paused = false
}

function levelUp() {
  exp.value -= expToNext
  level.value++
  expToNext = Math.floor(expToNext * 1.5)
  playerEmoji.value = levelEmojis[Math.min(level.value - 1, levelEmojis.length - 1)]
  paused = true
  showUpgrade.value = true
}

function unlockKnife() {
  hasKnife.value = true
  knifeLevel.value = 1
  showUpgrade.value = false
  paused = false
}

function unlockFlame() {
  hasFlame.value = true
  flameLevel.value = 1
  showUpgrade.value = false
  paused = false
}

function unlockBomb() {
  hasBomb.value = true
  bombLevel.value = 1
  showUpgrade.value = false
  paused = false
}

function upgradeBullet() {
  bulletInterval = Math.max(100, bulletInterval - 50)
  bulletLevel.value++
  showUpgrade.value = false
  paused = false
}

function upgradeKnife() {
  knifeDamage += 5
  knifeLevel.value++
  showUpgrade.value = false
  paused = false
}

function upgradeFlame() {
  flamePierce++
  flameLevel.value++
  showUpgrade.value = false
  paused = false
}

function upgradeBomb() {
  bombRange += 10
  bombLevel.value++
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

.weapon-levels {
  position: absolute;
  bottom: 10px;
  right: 10px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.2rem;
  color: #000;
}
</style>

