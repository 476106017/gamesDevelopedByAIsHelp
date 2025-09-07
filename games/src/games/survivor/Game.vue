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
        🕒 {{ Math.floor(elapsed / 1000) }}s | 👾 {{ score }} | ⭐ {{ level }} | ❤️ {{ hp }}/{{ maxHp }}
      </div>
      <div class="exp-bar">
        <div class="exp-fill" :style="{ width: (exp / expToNext * 100) + '%' }"></div>
      </div>
      <div class="btn-row">
        <button @click="showSkillTree = true">技能树({{ skillPoints }})</button>
        <button @click="restart">重新开始</button>
      </div>
    </div>

    <div class="weapon-levels">
      🔫{{ bulletLevel }}
      🔪{{ knifeLevel }}
      🔥{{ flameLevel }}
      💣{{ bombLevel }}
    </div>

    <div v-if="showSkillTree" class="skill-overlay">
      <div class="tabs">
        <button @click="currentTree = 'bullet'">🔫</button>
        <button @click="currentTree = 'knife'">🔪</button>
        <button @click="currentTree = 'flame'">🔥</button>
        <button @click="currentTree = 'bomb'">💣</button>
      </div>
      <div v-if="currentTree === 'bullet'" class="tree">
        <svg class="tree-lines" viewBox="0 0 300 200">
          <line x1="150" y1="30" x2="50" y2="70" stroke="#000" />
          <line x1="150" y1="30" x2="150" y2="70" stroke="#000" />
          <line x1="150" y1="30" x2="250" y2="70" stroke="#000" />
          <line x1="50" y1="70" x2="50" y2="110" stroke="#000" />
          <line x1="150" y1="70" x2="150" y2="110" stroke="#000" />
          <line x1="250" y1="70" x2="250" y2="110" stroke="#000" />
          <line x1="150" y1="110" x2="100" y2="150" stroke="#000" />
          <line x1="150" y1="110" x2="200" y2="150" stroke="#000" />
        </svg>
        <div class="row">
          <div class="node">
            <button v-if="!bulletSkills.power" @click="unlockPower" :disabled="skillPoints <= 0">强力子弹</button>
            <span v-else>强力子弹✓</span>
          </div>
        </div>
        <div class="row">
          <div class="node">
            <button v-if="bulletSkills.power && !bulletSkills.fireRate" @click="selectFireRate" :disabled="skillPoints <= 0">射击频率</button>
            <span v-else-if="bulletSkills.fireRate">射击频率✓</span>
          </div>
          <div class="node">
            <button v-if="bulletSkills.power && !bulletSkills.speed" @click="selectSpeed" :disabled="skillPoints <= 0">子弹速度</button>
            <span v-else-if="bulletSkills.speed">子弹速度✓</span>
          </div>
          <div class="node">
            <button v-if="bulletSkills.power && !bulletSkills.vamp" @click="unlockVamp" :disabled="skillPoints <= 0">吸血弹</button>
            <span v-else-if="bulletSkills.vamp">吸血弹✓</span>
          </div>
        </div>
        <div class="row">
          <div class="node">
            <button v-if="bulletSkills.fireRate && !bulletSkills.shotgun" @click="unlockShotgun" :disabled="skillPoints <= 0">散弹枪</button>
            <span v-else-if="bulletSkills.shotgun">散弹枪✓</span>
          </div>
          <div class="node">
            <button v-if="bulletSkills.speed && !bulletSkills.fission" @click="unlockFission" :disabled="skillPoints <= 0">裂变子弹</button>
            <span v-else-if="bulletSkills.fission">裂变子弹✓</span>
          </div>
          <div class="node">
            <button v-if="bulletSkills.vamp && !bulletSkills.bend" @click="unlockBend" :disabled="skillPoints <= 0">拐弯子弹</button>
            <span v-else-if="bulletSkills.bend">拐弯子弹✓</span>
          </div>
        </div>
        <div class="row">
          <div class="node"></div>
          <div class="node">
            <button v-if="bulletSkills.fission && !bulletSkills.doubleFission && !bulletSkills.deathBullet" @click="unlockDoubleFission" :disabled="skillPoints <= 0">二次裂变</button>
            <span v-else-if="bulletSkills.doubleFission">二次裂变✓</span>
          </div>
          <div class="node">
            <button v-if="bulletSkills.fission && !bulletSkills.doubleFission && !bulletSkills.deathBullet" @click="unlockDeathBullet" :disabled="skillPoints <= 0">死亡子弹</button>
            <span v-else-if="bulletSkills.deathBullet">死亡子弹✓</span>
          </div>
          <div class="node"></div>
        </div>
      </div>
      <div v-else class="skill-page">敬请期待</div>
      <button @click="showSkillTree = false">关闭</button>
    </div>

    <div v-if="gameOver" class="game-over-overlay">
      <div>游戏结束！存活 {{ Math.floor(elapsed / 1000) }}s</div>
      <button @click="restart">重新开始</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, reactive, watch } from 'vue'

const canvasRef = ref(null)
const ctx = ref(null)

const width = ref(window.innerWidth)
const height = ref(window.innerHeight)

const player = { x: 0, y: 0, size: 10 }
const hp = ref(3)
const maxHp = ref(3)
let bulletDamage = 1
// 刀的伤害较高，补偿其极短的攻击范围
let knifeDamage = 10
let knifeRange = 80
const knife = { x: 0, y: 0 }
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
let bulletSpeed = 4
let bulletInterval = 500
let flamePierce = 1
let bombRange = 40
let expToNext = 5
const hasKnife = ref(false)
const hasFlame = ref(false)
const hasBomb = ref(false)
const showSkillTree = ref(false)
const skillPoints = ref(0)
const currentTree = ref('bullet')
const bulletSkills = reactive({
  fireRate: false,
  speed: false,
  shotgun: false,
  fission: false,
  doubleFission: false,
  deathBullet: false,
  power: false,
  vamp: false,
  bend: false,
})
let paused = false

const bulletLevel = ref(1)
const knifeLevel = ref(0)
const flameLevel = ref(0)
const bombLevel = ref(0)

// 随机背景元素
const backgrounds = []
const bgEmojis = ['🌳','🌲','🌼','🌵','🌸','🌻','🍄','🌴','🌱','🪨','🌷','🌹']

// 随机掉落道具
const powerups = []
const powerupTypes = [
  { type: 'freeze', emoji: '🧊' },
  { type: 'shield', emoji: '🛡️' },
  { type: 'gravity', emoji: '🪂' },
]
let lastPowerup = 0
let playerShield = false
let invulnUntil = 0
let knifeInterval = 200

const levelEmojis = ['🙂','😊','😄','😁','😆','😎']
const playerEmoji = ref(levelEmojis[0])
const gameOver = ref(false)

watch(showSkillTree, v => {
  paused = v || gameOver.value
})

// 敌人类型：普通、快速、血厚、走位
const enemyTypes = [
  { emoji: '👾', speed: 0.6, hp: 1, size: 10 },
  { emoji: '👻', speed: 1.2, hp: 1, size: 10 },
  { emoji: '👹', speed: 0.5, hp: 4, size: 16 },
  { emoji: '🤖', speed: 0.8, hp: 2, size: 12, dodge: true },
]

function generateBackground() {
  backgrounds.length = 0
  for (let i = 0; i < 300; i++) {
    backgrounds.push({
      x: (Math.random() - 0.5) * 8000,
      y: (Math.random() - 0.5) * 8000,
      emoji: bgEmojis[Math.floor(Math.random() * bgEmojis.length)],
    })
  }
}

function spawnPowerup() {
  const radius = 300
  const angle = Math.random() * Math.PI * 2
  const dist = Math.random() * radius
  powerups.push({
    x: player.x + Math.cos(angle) * dist,
    y: player.y + Math.sin(angle) * dist,
    size: 8,
    ...powerupTypes[Math.floor(Math.random() * powerupTypes.length)],
  })
}

function spawnEnemy() {
  const camX = player.x - width.value / 2
  const camY = player.y - height.value / 2
  const side = Math.floor(Math.random() * 4)
  let x, y
  if (side === 0) { x = camX - 20; y = camY + Math.random() * height.value }
  else if (side === 1) { x = camX + width.value + 20; y = camY + Math.random() * height.value }
  else if (side === 2) { x = camX + Math.random() * width.value; y = camY - 20 }
  else { x = camX + Math.random() * width.value; y = camY + height.value + 20 }

  const wave = Math.floor(elapsed.value / 15000) + 1
  let typeCount
  if (wave < 3) typeCount = 1
  else if (wave < 6) typeCount = 2
  else if (wave < 9) typeCount = 3
  else typeCount = 4
  typeCount = Math.min(typeCount, enemyTypes.length)
  const type = enemyTypes[Math.floor(Math.random() * typeCount)]
  const stage = wave - 1
  const hp = type.hp + stage
  enemies.push({
    x,
    y,
    size: type.size,
    hp,
    maxHp: hp,
    speed: type.speed,
    emoji: type.emoji,
    dodge: !!type.dodge,
    dodgeDir: 0,
    dodgeTime: 0,
    freeze: 0,
    vy: 0,
    isFalling: false,
    fallTime: 0,
  })
}

function getNearestEnemy(fromX = player.x, fromY = player.y) {
  let nearest = null
  let minDist = Infinity
  let index = -1
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i]
    const d = Math.hypot(e.x - fromX, e.y - fromY)
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
  const baseAngle = Math.atan2(dy, dx)
  if (bulletSkills.shotgun) {
    for (let i = 0; i < 6; i++) {
      const ang = baseAngle + (Math.random() - 0.5) * 0.6
      bullets.push({
        x: player.x,
        y: player.y,
        vx: Math.cos(ang) * bulletSpeed * 0.6,
        vy: Math.sin(ang) * bulletSpeed * 0.6,
        size: 3,
        damage: Math.max(1, bulletDamage - 1),
        life: 30,
      })
    }
  } else {
    bullets.push({
      x: player.x,
      y: player.y,
      vx: dx / len * bulletSpeed,
      vy: dy / len * bulletSpeed,
      size: 4,
      damage: bulletDamage,
      depth: 0,
      death: bulletSkills.deathBullet,
      fission: bulletSkills.fission,
    })
  }
}

function update() {
  const now = Date.now()
  if (paused) { draw(); return }
  elapsed.value = now - startTime.value

  // 玩家移动，支持方向键与 WASD
  if (keys.has('arrowup') || keys.has('w')) player.y -= 3
  if (keys.has('arrowdown') || keys.has('s')) player.y += 3
  if (keys.has('arrowleft') || keys.has('a')) player.x -= 3
  if (keys.has('arrowright') || keys.has('d')) player.x += 3

  // 根据存活时间调整刷怪速度，减缓提升节奏
  const spawnInterval = Math.max(400, 1000 - Math.floor(elapsed.value / 80))
  if (now - lastSpawn > spawnInterval) { spawnEnemy(); lastSpawn = now }

  if (now - lastShoot > bulletInterval) { shoot(); lastShoot = now }
  if (now - lastPowerup > 10000) { spawnPowerup(); lastPowerup = now }

  if (hasKnife.value) {
    const { enemy: nearest, dist: minDist, index: nearestIndex } = getNearestEnemy()
    if (nearest) {
      const nx = (nearest.x - player.x) / minDist
      const ny = (nearest.y - player.y) / minDist
      knife.x = player.x + nx * knifeRange
      knife.y = player.y + ny * knifeRange
      if (now - lastKnife > knifeInterval && minDist < knifeRange) {
        nearest.hp -= knifeDamage
        if (nearest.hp <= 0) {
          const ex = nearest.x, ey = nearest.y
          enemies.splice(nearestIndex, 1)
          score.value++
          xpOrbs.push({ x: ex, y: ey, size: 4, vx: 0, vy: 0 })
          if (knifeLevel.value >= 3) {
            enemies.forEach(e => {
              if (Math.hypot(e.x - ex, e.y - ey) < 100) e.freeze = 120
            })
            effects.push({ type: 'freeze', x: ex, y: ey, ttl: 30, r: 50 })
          }
        }
        lastKnife = now
      }
    } else {
      knife.x = player.x + knifeRange
      knife.y = player.y
    }
  }

  if (hasFlame.value && now - lastFlame > 1000 && enemies.length) {
    const { enemy: target } = getNearestEnemy()
    if (target) {
      const dx = target.x - player.x
      const dy = target.y - player.y
      const len = Math.hypot(dx, dy)
      flames.push({ x: player.x, y: player.y, vx: dx / len * 3, vy: dy / len * 3, life: 60, size: 6, pierce: flameLevel.value >= 3 ? Infinity : flamePierce })
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

  const camY = player.y - height.value / 2
  enemies.forEach(e => {
    if (e.freeze > 0) { e.freeze--; return }
    if (e.isFalling) {
      e.vy += 0.5
      e.y += e.vy
      const bottom = camY + height.value - e.size
      if (e.y > bottom) { e.y = bottom; e.vy *= -0.6 }
      e.fallTime--
      if (e.fallTime <= 0) e.isFalling = false
      return
    }
    if (e.dodgeTime > 0) {
      e.x += Math.cos(e.dodgeDir) * e.speed
      e.y += Math.sin(e.dodgeDir) * e.speed
      e.dodgeTime--
    } else {
      const dx = player.x - e.x
      const dy = player.y - e.y
      const len = Math.hypot(dx, dy)
      if (len > 0) {
        e.x += (dx / len) * e.speed
        e.y += (dy / len) * e.speed
      }
      if (e.dodge && Math.random() < 0.02) {
        e.dodgeTime = 30
        e.dodgeDir = Math.random() * Math.PI * 2
      }
    }
  })

  // 敌人之间的碰撞
  for (let i = 0; i < enemies.length; i++) {
    for (let j = i + 1; j < enemies.length; j++) {
      const e1 = enemies[i]
      const e2 = enemies[j]
      const dx = e2.x - e1.x
      const dy = e2.y - e1.y
      const dist = Math.hypot(dx, dy)
      const min = e1.size + e2.size
      if (dist < min && dist > 0) {
        const overlap = (min - dist) / 2
        const ox = dx / dist * overlap
        const oy = dy / dist * overlap
        e1.x -= ox
        e1.y -= oy
        e2.x += ox
        e2.y += oy
      }
    }
  }

  // 敌人碰撞玩家
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i]
    if (e.isFalling) continue
    if (Math.hypot(e.x - player.x, e.y - player.y) < e.size + player.size) {
      if (playerShield) {
        playerShield = false
        const ex = e.x, ey = e.y
        enemies.splice(i, 1)
        score.value++
        xpOrbs.push({ x: ex, y: ey, size: 4, vx: 0, vy: 0 })
        for (let j = enemies.length - 1; j >= 0; j--) {
          if (Math.hypot(enemies[j].x - player.x, enemies[j].y - player.y) < 80) {
            const ex2 = enemies[j].x, ey2 = enemies[j].y
            enemies.splice(j, 1)
            score.value++
            xpOrbs.push({ x: ex2, y: ey2, size: 4, vx: 0, vy: 0 })
          }
        }
        effects.push({ type: 'shield', x: player.x, y: player.y, ttl: 20, r: 40 })
      } else if (now > invulnUntil) {
        hp.value--
        effects.push({ type: 'damage', x: player.x, y: player.y, ttl: 30, r: 10, text: '-1❤' })
        invulnUntil = now + 1000
        if (hp.value <= 0) {
          playerEmoji.value = '😭'
          paused = true
          gameOver.value = true
          showSkillTree.value = false
          return
        }
      }
    }
  }

  // 子弹移动
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i]
    b.x += b.vx
    b.y += b.vy
    if (bulletSkills.bend && !b.homed) {
      for (const bg of backgrounds) {
        if (Math.hypot(bg.x - b.x, bg.y - b.y) < 8) {
          const { enemy: t } = getNearestEnemy(b.x, b.y)
          if (t) {
            const dx2 = t.x - b.x
            const dy2 = t.y - b.y
            const len2 = Math.hypot(dx2, dy2)
            b.vx = dx2 / len2 * bulletSpeed
            b.vy = dy2 / len2 * bulletSpeed
            b.homed = true
          }
          break
        }
      }
    }
    if (b.life !== undefined) {
      b.life--
      if (b.life <= 0) {
        bullets.splice(i, 1)
        continue
      }
    }
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
        if (flameLevel.value < 3) {
          f.pierce--
          if (f.pierce <= 0) { flames.splice(i, 1); removed = true; break }
        } else {
          f.size += 2
        }
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
    if (bombLevel.value >= 3) {
      for (const e of enemies) {
        const dx = m.x - e.x
        const dy = m.y - e.y
        const dist = Math.hypot(dx, dy)
        if (dist < bombRange * 2 && dist > 1) {
          e.x += dx / dist * 0.5
          e.y += dy / dist * 0.5
        }
      }
    }
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
        const dmg = b.damage ?? bulletDamage
        e.hp -= dmg
        const killed = e.hp <= 0
        if (killed) {
          const ex = e.x, ey = e.y
          enemies.splice(i, 1)
          score.value++
          xpOrbs.push({ x: ex, y: ey, size: 4, vx: 0, vy: 0 })
        }
        if (bulletSkills.vamp && killed) {
          hp.value = Math.min(maxHp.value, hp.value + 1)
        }
        if ((b.fission || bulletSkills.fission) && (!b.death || killed)) {
          const maxDepth = bulletSkills.doubleFission ? 2 : 1
          const depth = b.depth || 0
          if (depth < maxDepth) {
            const originX = e.x
            const originY = e.y
            const { enemy: next } = getNearestEnemy(originX, originY)
            if (next) {
              const dx2 = next.x - originX
              const dy2 = next.y - originY
              const len2 = Math.hypot(dx2, dy2)
              bullets.push({
                x: originX,
                y: originY,
                vx: dx2 / len2 * bulletSpeed,
                vy: dy2 / len2 * bulletSpeed,
                size: 4,
                damage: bulletDamage,
                depth: depth + 1,
                death: b.death,
                fission: true,
              })
            }
          }
        }
        bullets.splice(j, 1)
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

  // 道具拾取
  for (let i = powerups.length - 1; i >= 0; i--) {
    const p = powerups[i]
    if (Math.hypot(p.x - player.x, p.y - player.y) < p.size + player.size) {
      powerups.splice(i, 1)
      if (p.type === 'freeze') {
        enemies.forEach(e => { e.freeze = 180 })
      } else if (p.type === 'shield') {
        playerShield = true
      } else if (p.type === 'gravity') {
        enemies.forEach(e => {
          e.isFalling = true
          e.vy = 0
          e.fallTime = 180
          effects.push({ type: 'fall', x: e.x, y: e.y, ttl: 30, r: 20 })
        })
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
  ctx.value.clearRect(0, 0, width.value, height.value)

  const camX = player.x - width.value / 2
  const camY = player.y - height.value / 2

  ctx.value.font = '20px sans-serif'
  ctx.value.textAlign = 'center'
  ctx.value.textBaseline = 'middle'

  // 背景
  backgrounds.forEach(bg => {
    const sx = bg.x - camX
    const sy = bg.y - camY
    if (sx > -50 && sx < width.value + 50 && sy > -50 && sy < height.value + 50) {
      ctx.value.fillText(bg.emoji, sx, sy)
    }
  })

  // 玩家
  ctx.value.fillText(playerEmoji.value, player.x - camX, player.y - camY)
  if (playerShield) {
    ctx.value.fillText('🛡️', player.x - camX, player.y - camY - 20)
  }

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

  // 道具
  powerups.forEach(p => {
    ctx.value.fillText(p.emoji, p.x - camX, p.y - camY)
  })

  // 子弹
  bullets.forEach(b => {
    ctx.value.fillText('🔹', b.x - camX, b.y - camY)
  })

  // 火焰
  flames.forEach(f => {
    ctx.value.save()
    ctx.value.font = f.size * 2 + 'px sans-serif'
    ctx.value.fillText('🔥', f.x - camX, f.y - camY)
    ctx.value.restore()
  })

  // 炸弹
  bombs.forEach(m => {
    ctx.value.fillText('💣', m.x - camX, m.y - camY)
  })

  // 小刀
  if (hasKnife.value) {
    ctx.value.fillText('🔪', knife.x - camX, knife.y - camY)
  }

  // 效果
  for (let i = effects.length - 1; i >= 0; i--) {
    const ef = effects[i]
    const sx = ef.x - camX
    const sy = ef.y - camY - (ef.type === 'damage' ? (30 - ef.ttl) * 0.5 : 0)
    ctx.value.save()
    ctx.value.font = ef.r * 2 + 'px sans-serif'
    ctx.value.textAlign = 'center'
    ctx.value.textBaseline = 'middle'
    if (ef.type === 'freeze') {
      ctx.value.fillText('❄️', sx, sy)
    } else if (ef.type === 'shield') {
      ctx.value.fillText('🛡️', sx, sy)
    } else if (ef.type === 'fall') {
      ctx.value.fillText('⬇️', sx, sy)
    } else if (ef.type === 'damage') {
      ctx.value.fillText(ef.text, sx, sy)
    } else {
      ctx.value.fillText('💥', sx, sy)
    }
    ctx.value.restore()
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
  powerups.length = 0
  generateBackground()
  score.value = 0
  exp.value = 0
  level.value = 1
  expToNext = 5
  bulletInterval = 500
  knifeDamage = 10
  knifeRange = 80
  flamePierce = 1
  bombRange = 40
  bulletSpeed = 4
  bulletDamage = 1
  playerShield = false
  invulnUntil = 0
  knifeInterval = 200
  lastPowerup = Date.now()
  hasKnife.value = false
  hasFlame.value = false
  hasBomb.value = false
  hp.value = maxHp.value
  skillPoints.value = 0
  Object.keys(bulletSkills).forEach(k => bulletSkills[k] = false)
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
  knife.x = player.x + knifeRange
  knife.y = player.y
  startTime.value = Date.now()
  keys.clear()
  playerEmoji.value = levelEmojis[0]
  gameOver.value = false
  paused = false
}

function levelUp() {
  exp.value -= expToNext
  level.value++
  expToNext = Math.floor(expToNext * 1.5)
  playerEmoji.value = levelEmojis[Math.min(level.value - 1, levelEmojis.length - 1)]
  skillPoints.value++
}

function unlockKnife() {
  hasKnife.value = true
  knifeLevel.value = 1
}

function unlockFlame() {
  hasFlame.value = true
  flameLevel.value = 1
}

function unlockBomb() {
  hasBomb.value = true
  bombLevel.value = 1
}

function spendPoint(fn) {
  if (skillPoints.value <= 0) return
  skillPoints.value--
  fn()
}

function selectFireRate() {
  spendPoint(() => {
    bulletSkills.fireRate = true
    bulletInterval = Math.max(100, bulletInterval - 100)
  })
}

function selectSpeed() {
  spendPoint(() => {
    bulletSkills.speed = true
    bulletSpeed += 2
  })
}

function unlockShotgun() {
  spendPoint(() => {
    bulletSkills.shotgun = true
  })
}

function unlockFission() {
  spendPoint(() => {
    bulletSkills.fission = true
  })
}

function unlockDoubleFission() {
  spendPoint(() => {
    bulletSkills.doubleFission = true
  })
}

function unlockDeathBullet() {
  spendPoint(() => {
    bulletSkills.deathBullet = true
  })
}

function unlockPower() {
  spendPoint(() => {
    bulletSkills.power = true
    bulletDamage += 1
  })
}

function unlockVamp() {
  spendPoint(() => {
    bulletSkills.vamp = true
  })
}

function unlockBend() {
  spendPoint(() => {
    bulletSkills.bend = true
  })
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
  z-index: 10;
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

.btn-row {
  display: flex;
  gap: 0.5rem;
}

.skill-overlay {
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
  z-index: 20;
}

.tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.skill-page {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.tree {
  position: relative;
  width: 300px;
  height: 200px;
}

.tree-lines {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.tree .row {
  display: flex;
  justify-content: space-around;
  margin-top: 10px;
}

.tree .row:first-child {
  justify-content: center;
}

.node {
  background: #fff;
  border: 1px solid #333;
  border-radius: 4px;
  padding: 2px 4px;
  min-width: 60px;
  text-align: center;
}

.node:empty {
  border: none;
  background: transparent;
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
  z-index: 10;
}

.game-over-overlay {
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
  z-index: 30;
}
</style>

