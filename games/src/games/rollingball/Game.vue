<template>
  <div class="game-wrapper">
    <div ref="container" class="game-container"></div>
    <div v-if="gameOver" class="overlay">
      <p>Game Over</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as THREE from 'https://unpkg.com/three@0.155.0/build/three.module.js'

const container = ref(null)
const gameOver = ref(false)

let scene, camera, renderer, player, ground, sky
let obstacles = []
let left = false
let right = false
let downSpeed = 0
let sideSpeed = 0
let playerRadius = 1
let lastTime = 0

const slopeAngle = Math.PI / 6
let nextSpawnDist = 20

function createEmojiTexture(emoji, bg) {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  if (bg) {
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, size, size)
  }
  ctx.font = `${size * 0.8}px serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(emoji, size / 2, size / 2)
  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(1000, 1000)
  return texture
}

function init() {
  scene = new THREE.Scene()

  camera = new THREE.PerspectiveCamera(60, container.value.clientWidth / container.value.clientHeight, 0.1, 1000)
  camera.position.set(0, 3, 10)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  renderer.setClearColor(0x87ceeb)
  container.value.appendChild(renderer.domElement)

  const ambient = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambient)
  const dir = new THREE.DirectionalLight(0xffffff, 0.8)
  dir.position.set(0, 20, 10)
  scene.add(dir)

  const groundGeo = new THREE.PlaneGeometry(1000, 100000)
  const groundMat = new THREE.MeshStandardMaterial({ map: createEmojiTexture('🌿', '#228b22') })
  ground = new THREE.Mesh(groundGeo, groundMat)
  ground.rotation.x = -slopeAngle
  ground.position.y = -5
  scene.add(ground)

  const skyGeo = new THREE.SphereGeometry(5000, 16, 16)
  const skyMat = new THREE.MeshBasicMaterial({ map: createEmojiTexture('☁️', '#87ceeb'), side: THREE.BackSide })
  sky = new THREE.Mesh(skyGeo, skyMat)
  scene.add(sky)

  const playerGeo = new THREE.SphereGeometry(playerRadius, 32, 32)
  const playerMat = new THREE.MeshStandardMaterial({ color: 0xff0000 })
  player = new THREE.Mesh(playerGeo, playerMat)
  scene.add(player)

  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  window.addEventListener('resize', onResize)

  lastTime = performance.now()
  animate()
}

function onResize() {
  camera.aspect = container.value.clientWidth / container.value.clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
}

function onKeyDown(e) {
  if (e.key === 'ArrowLeft' || e.key === 'a') left = true
  if (e.key === 'ArrowRight' || e.key === 'd') right = true
}

function onKeyUp(e) {
  if (e.key === 'ArrowLeft' || e.key === 'a') left = false
  if (e.key === 'ArrowRight' || e.key === 'd') right = false
}

function spawnObstacle(dist, radius) {
  radius = radius || 0.5 + Math.random() * 2
  const geo = new THREE.SphereGeometry(radius, 16, 16)
  const mat = new THREE.MeshStandardMaterial({ color: 0x00ff00 })
  const mesh = new THREE.Mesh(geo, mat)
  const x = (Math.random() - 0.5) * 20
  const z = -dist * Math.cos(slopeAngle)
  const y = dist * Math.sin(slopeAngle)
  mesh.position.set(x, y + radius, z)
  scene.add(mesh)
  obstacles.push({ mesh, radius, x, dist })
}

function animate() {
  if (gameOver.value) return
  requestAnimationFrame(animate)
  const now = performance.now()
  const delta = (now - lastTime) / 1000
  lastTime = now

  const maxSpeed = 5 + playerRadius
  downSpeed = Math.min(downSpeed + 20 * delta, maxSpeed)
  if (left) sideSpeed -= 20 * delta
  if (right) sideSpeed += 20 * delta
  sideSpeed *= 0.95

  playerRadius = Math.max(0.2, playerRadius - 0.02 * delta)
  player.geometry.dispose()
  player.geometry = new THREE.SphereGeometry(playerRadius, 32, 32)

  player.userData.dist = (player.userData.dist || 0) + downSpeed * delta
  player.userData.x = (player.userData.x || 0) + sideSpeed * delta
  const z = -player.userData.dist * Math.cos(slopeAngle)
  const y = player.userData.dist * Math.sin(slopeAngle)
  player.position.set(player.userData.x, y + playerRadius, z)

  camera.position.set(player.userData.x, y + 2, z + 10)
  camera.lookAt(player.position)
  ground.position.z = z
  sky.position.set(player.position.x, player.position.y, player.position.z)

  while (nextSpawnDist < player.userData.dist + 100) {
    spawnObstacle(nextSpawnDist, playerRadius * (0.2 + Math.random() * 0.6))
    spawnObstacle(nextSpawnDist, playerRadius * (0.6 + Math.random() * 2))
    nextSpawnDist += 10 + Math.random() * 10
  }

  for (let i = obstacles.length - 1; i >= 0; i--) {
    const o = obstacles[i]
    const oz = -o.dist * Math.cos(slopeAngle)
    const oy = o.dist * Math.sin(slopeAngle)
    o.mesh.position.set(o.x, oy + o.radius, oz)

    if (o.dist < player.userData.dist - 20) {
      scene.remove(o.mesh)
      obstacles.splice(i, 1)
      continue
    }

    const dx = player.userData.x - o.x
    const dd = player.userData.dist - o.dist
    const distance = Math.sqrt(dx * dx + dd * dd)
    if (distance < playerRadius + o.radius) {
      if (o.radius > playerRadius) {
        gameOver.value = true
      } else {
        playerRadius = Math.cbrt(playerRadius ** 3 + o.radius ** 3)
        player.geometry.dispose()
        player.geometry = new THREE.SphereGeometry(playerRadius, 32, 32)
        scene.remove(o.mesh)
        obstacles.splice(i, 1)
      }
    }
  }

  renderer.render(scene, camera)
}

onMounted(() => {
  init()
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
  window.removeEventListener('resize', onResize)
})
</script>

<style scoped>
.game-wrapper {
  position: relative;
}
.game-container {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 2rem;
}
</style>
