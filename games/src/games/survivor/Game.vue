<template>
  <div ref="container" class="three-game"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'https://unpkg.com/three@0.155.0/build/three.module.js'

const container = ref(null)
let scene, camera, renderer, player
let animId
const keys = new Set()
const SPEED = 0.1

onMounted(() => {
  const width = window.innerWidth
  const height = window.innerHeight

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0xa0d0ff)

  camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(width, height)
  container.value.appendChild(renderer.domElement)

  // ground
  const groundGeo = new THREE.PlaneGeometry(200, 200)
  const groundMat = new THREE.MeshBasicMaterial({ color: 0x55aa55 })
  const ground = new THREE.Mesh(groundGeo, groundMat)
  ground.rotation.x = -Math.PI / 2
  scene.add(ground)

  // player
  const playerGeo = new THREE.BoxGeometry(1, 2, 1)
  const playerMat = new THREE.MeshBasicMaterial({ color: 0xffff00 })
  player = new THREE.Mesh(playerGeo, playerMat)
  player.position.y = 1
  scene.add(player)

  camera.position.set(0, 5, 10)
  camera.lookAt(player.position)

  window.addEventListener('resize', onResize)
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)

  animate()
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
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

  camera.position.set(player.position.x, player.position.y + 4, player.position.z + 8)
  camera.lookAt(player.position)
}
</script>

<style>
.three-game {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
</style>

