<template>
  <div ref="container" class="three-game"></div>
  <div class="hud">
    <button class="skill-btn" @click="toggleTree">技能树({{ skillPoints }})</button>
  </div>
  <div v-if="showTree" class="skill-tree">
    <div v-for="n in nodes" :key="n.id" class="node">
      <button :disabled="!canUnlock(n)" @click="unlock(n)">
        {{ n.label }} ({{ n.cost }})
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'https://unpkg.com/three@0.155.0/build/three.module.js'

const container = ref(null)
const showTree = ref(false)
const skillPoints = ref(99)
const skills = ref({
  bounce: false,
  doubleBounce: false,
  doubleShot: false
})

const nodes = ref([
  { id: 'bounce', label: '弹射子弹', cost: 1 },
  { id: 'doubleBounce', label: '二次弹射', cost: 1, require: 'bounce' },
  { id: 'doubleShot', label: '双重弹射', cost: 1, require: 'bounce' }
])

function canUnlock(n) {
  return !skills.value[n.id] && skillPoints.value >= n.cost && (!n.require || skills.value[n.require])
}

function unlock(n) {
  if (canUnlock(n)) {
    skills.value[n.id] = true
    skillPoints.value -= n.cost
  }
}

let scene, camera, renderer, player
let animId, shootTimer, spawnTimer
const keys = new Set()
const SPEED = 0.1
const BULLET_SPEED = 0.3
const enemies = []
const bullets = []

function createEmojiTexture(char) {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext('2d')
  ctx.font = '48px serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(char, 32, 32)
  const texture = new THREE.CanvasTexture(canvas)
  return texture
}

onMounted(() => {
  const width = window.innerWidth
  const height = window.innerHeight

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0xa0d0ff)

  camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(width, height)
  container.value.appendChild(renderer.domElement)

  const groundGeo = new THREE.PlaneGeometry(200, 200)
  const groundMat = new THREE.MeshBasicMaterial({ color: 0x55aa55 })
  const ground = new THREE.Mesh(groundGeo, groundMat)
  ground.rotation.x = -Math.PI / 2
  scene.add(ground)

  const playerMat = new THREE.SpriteMaterial({ map: createEmojiTexture('😀'), transparent: true })
  player = new THREE.Sprite(playerMat)
  player.scale.set(0.5, 0.5, 1)
  player.position.y = 1
  scene.add(player)

  camera.position.set(0, 10, 0.1)
  camera.lookAt(player.position)

  window.addEventListener('resize', onResize)
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)

  spawnTimer = setInterval(spawnEnemy, 2000)
  shootTimer = setInterval(shoot, 600)

  animate()
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
  clearInterval(shootTimer)
  clearInterval(spawnTimer)
  cancelAnimationFrame(animId)
})

function onResize() {
  const width = window.innerWidth
  const height = window.innerHeight
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
}

function onKeyDown(e) {
  keys.add(e.key.toLowerCase())
}

function onKeyUp(e) {
  keys.delete(e.key.toLowerCase())
}

function spawnEnemy() {
  const mat = new THREE.SpriteMaterial({ map: createEmojiTexture('👾'), transparent: true })
  const enemy = new THREE.Sprite(mat)
  enemy.scale.set(0.4, 0.4, 1)
  enemy.position.set((Math.random() - 0.5) * 40, 1, (Math.random() - 0.5) * 40)
  enemy.hp = 1
  scene.add(enemy)
  enemies.push(enemy)
}

function getNearestEnemies(pos, exclude = new Set(), count = 1) {
  const candidates = enemies.filter(e => !exclude.has(e))
  candidates.sort((a, b) => a.position.distanceTo(pos) - b.position.distanceTo(pos))
  return candidates.slice(0, count)
}

function createBullet(pos, target, bouncesLeft, exclude) {
  const mat = new THREE.SpriteMaterial({ map: createEmojiTexture('•'), transparent: true })
  const b = new THREE.Sprite(mat)
  b.scale.set(0.2, 0.2, 1)
  b.position.copy(pos)
  b.position.y = 1
  b.target = target
  b.bouncesLeft = bouncesLeft
  b.exclude = exclude
  scene.add(b)
  return b
}

function shoot() {
  if (enemies.length === 0) return
  const target = getNearestEnemies(player.position, new Set(), 1)[0]
  if (!target) return
  const bounces = skills.value.doubleBounce ? 2 : skills.value.bounce ? 1 : 0
  const bullet = createBullet(player.position.clone(), target, bounces, new Set([target]))
  bullets.push(bullet)
}

function animate() {
  animId = requestAnimationFrame(animate)
  update()
  renderer.render(scene, camera)
}

function update() {
  const dir = new THREE.Vector3()
  if (keys.has('w')) dir.z -= 1
  if (keys.has('s')) dir.z += 1
  if (keys.has('a')) dir.x -= 1
  if (keys.has('d')) dir.x += 1
  dir.normalize().multiplyScalar(SPEED)
  player.position.add(dir)

  camera.position.set(player.position.x, player.position.y + 10, player.position.z + 0.1)
  camera.lookAt(player.position)

  // enemies move toward player
  enemies.forEach(e => {
    const v = player.position.clone().sub(e.position)
    v.y = 0
    v.normalize().multiplyScalar(0.02)
    e.position.add(v)
  })

  // bullet movement and collision
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i]
    const v = b.target.position.clone().sub(b.position)
    v.y = 0
    if (v.length() < 0.5) {
      // hit
      b.target.hp -= 1
      if (b.target.hp <= 0) {
        scene.remove(b.target)
        const idx = enemies.indexOf(b.target)
        if (idx > -1) enemies.splice(idx, 1)
      }

      if (b.bouncesLeft > 0) {
        const targets = getNearestEnemies(b.target.position, b.exclude, skills.value.doubleShot ? 2 : 1)
        if (targets.length > 0) {
          if (skills.value.doubleShot) {
            targets.forEach(t => {
              const nb = createBullet(b.target.position.clone(), t, b.bouncesLeft - 1, new Set([...b.exclude, t]))
              bullets.push(nb)
            })
            scene.remove(b)
            bullets.splice(i, 1)
            continue
          } else {
            b.target = targets[0]
            b.exclude.add(targets[0])
            b.bouncesLeft -= 1
            b.position.copy(b.target.position.clone())
            b.position.x += 0.5
            b.position.z += 0.5
            continue
          }
        }
      }
      scene.remove(b)
      bullets.splice(i, 1)
    } else {
      v.normalize().multiplyScalar(BULLET_SPEED)
      b.position.add(v)
    }
  }
}

function toggleTree() {
  showTree.value = !showTree.value
}
</script>

<style>
.three-game {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.hud {
  position: fixed;
  top: 10px;
  left: 10px;
  z-index: 10;
}

.skill-btn {
  padding: 4px 8px;
}

.skill-tree {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(255, 255, 255, 0.9);
  padding: 16px;
  border: 1px solid #ccc;
  z-index: 20;
}

.node {
  margin: 4px 0;
}
</style>
