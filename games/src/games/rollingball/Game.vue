<template>
  <div class="game-wrapper">
    <div ref="container" class="game-container"></div>
    <div v-if="gameOver" class="overlay">
      <div class="game-over">
        <p>Game Over</p>
        <button @click="restart">Restart</button>
      </div>
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
  renderer.shadowMap.enabled = true
  container.value.appendChild(renderer.domElement)

  const ambient = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambient)
  const dir = new THREE.DirectionalLight(0xffffff, 0.8)
  dir.position.set(0, 20, 10)
  dir.castShadow = true
  scene.add(dir)

  const groundGeo = new THREE.PlaneGeometry(1000, 100000)
  const groundMat = new THREE.MeshStandardMaterial({ map: createEmojiTexture('🌿', '#228b22') })
  ground = new THREE.Mesh(groundGeo, groundMat)
  ground.rotation.x = -slopeAngle
  ground.position.y = -5
  ground.receiveShadow = true
  scene.add(ground)

  const skyGeo = new THREE.SphereGeometry(5000, 16, 16)
  const skyMat = new THREE.MeshBasicMaterial({ map: createEmojiTexture('☁️', '#87ceeb'), side: THREE.BackSide })
  sky = new THREE.Mesh(skyGeo, skyMat)
  scene.add(sky)

  const playerGeo = new THREE.SphereGeometry(playerRadius, 32, 32)
  const playerMat = new THREE.MeshStandardMaterial({ color: 0xff0000 })
  player = new THREE.Mesh(playerGeo, playerMat)
  player.castShadow = true
  player.receiveShadow = true
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
  const color = new THREE.Color().setHSL(Math.random(), 0.7, 0.5)
  const mat = new THREE.MeshStandardMaterial({ color })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.castShadow = true
  mesh.receiveShadow = true
  const x = (Math.random() - 0.5) * 20
  const z = -dist * Math.cos(slopeAngle)
  const y = dist * Math.sin(slopeAngle)
  mesh.position.set(x, y + radius, z)
  const speed = 2 + Math.random() * 3
  const theta = Math.random() * Math.PI * 2
  const phi = Math.random() * Math.PI - Math.PI / 2
  const velocity = new THREE.Vector3(
    speed * Math.cos(phi) * Math.cos(theta),
    speed * Math.sin(phi),
    speed * Math.cos(phi) * Math.sin(theta)
  )
  scene.add(mesh)
  obstacles.push({ mesh, radius, velocity })
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

  camera.position.set(player.userData.x, y + 3, z + 12)
  const lookAt = player.position.clone().add(new THREE.Vector3(0, 5, -20))
  camera.lookAt(lookAt)
  ground.position.z = z
  sky.position.set(player.position.x, player.position.y, player.position.z)

  while (nextSpawnDist < player.userData.dist + 100) {
    spawnObstacle(nextSpawnDist, playerRadius * (0.2 + Math.random() * 0.6))
    spawnObstacle(nextSpawnDist, playerRadius * (0.6 + Math.random() * 2))
    nextSpawnDist += 10 + Math.random() * 10
  }

  for (const o of obstacles) {
    o.mesh.position.addScaledVector(o.velocity, delta)
  }

  for (let i = 0; i < obstacles.length; i++) {
    const o1 = obstacles[i]
    for (let j = i + 1; j < obstacles.length; j++) {
      const o2 = obstacles[j]
      const p1 = o1.mesh.position
      const p2 = o2.mesh.position
      const dx = p2.x - p1.x
      const dy = p2.y - p1.y
      const dz = p2.z - p1.z
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
      const minDist = o1.radius + o2.radius
      if (dist < minDist) {
        const nx = dx / dist
        const ny = dy / dist
        const nz = dz / dist
        const overlap = minDist - dist
        p1.x -= nx * overlap / 2
        p1.y -= ny * overlap / 2
        p1.z -= nz * overlap / 2
        p2.x += nx * overlap / 2
        p2.y += ny * overlap / 2
        p2.z += nz * overlap / 2
        const v1n = o1.velocity.x * nx + o1.velocity.y * ny + o1.velocity.z * nz
        const v2n = o2.velocity.x * nx + o2.velocity.y * ny + o2.velocity.z * nz
        const diff = v1n - v2n
        o1.velocity.x -= diff * nx
        o1.velocity.y -= diff * ny
        o1.velocity.z -= diff * nz
        o2.velocity.x += diff * nx
        o2.velocity.y += diff * ny
        o2.velocity.z += diff * nz
      }
    }
  }

  for (let i = obstacles.length - 1; i >= 0; i--) {
    const o = obstacles[i]
    const p = o.mesh.position
    if (p.z > player.position.z + 20) {
      scene.remove(o.mesh)
      obstacles.splice(i, 1)
      continue
    }

    const dx = player.position.x - p.x
    const dy = player.position.y - p.y
    const dz = player.position.z - p.z
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)
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

function restart() {
  obstacles.forEach(o => scene.remove(o.mesh))
  obstacles = []
  playerRadius = 1
  player.geometry.dispose()
  player.geometry = new THREE.SphereGeometry(playerRadius, 32, 32)
  player.userData.dist = 0
  player.userData.x = 0
  downSpeed = 0
  sideSpeed = 0
  nextSpawnDist = 20
  gameOver.value = false
  lastTime = performance.now()
  animate()
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
.game-over {
  text-align: center;
}
.game-over button {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  font-size: 1rem;
}
</style>
