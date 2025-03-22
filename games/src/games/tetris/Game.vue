
<template>
  <div class="tetris-container">
    <h2>テトリス</h2>
    <canvas ref="canvasRef" width="200" height="400" class="tetris-canvas"></canvas>
    <p>スコア：{{ score }}</p>
    <button @click="startGame">開始</button>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const canvasRef = ref(null)
const score = ref(0)
let ctx

const COLS = 10
const ROWS = 20
const BLOCK_SIZE = 20
let board = []
let currentPiece
let dropInterval = 500
let gameLoop

const SHAPES = {
  I: [[1, 1, 1, 1]],
  O: [[1, 1], [1, 1]],
  T: [[0, 1, 0], [1, 1, 1]],
  L: [[1, 0, 0], [1, 1, 1]],
  J: [[0, 0, 1], [1, 1, 1]],
  S: [[0, 1, 1], [1, 1, 0]],
  Z: [[1, 1, 0], [0, 1, 1]]
}

const COLORS = {
  I: '#00bcd4',
  O: '#ffc107',
  T: '#9c27b0',
  L: '#ff9800',
  J: '#3f51b5',
  S: '#4caf50',
  Z: '#f44336'
}

function createBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(''))
}

function drawBlock(x, y, color) {
  ctx.fillStyle = color
  ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE - 1, BLOCK_SIZE - 1)
}

function drawBoard() {
  ctx.clearRect(0, 0, COLS * BLOCK_SIZE, ROWS * BLOCK_SIZE)
  board.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (cell) drawBlock(x, y, COLORS[cell])
    })
  })
  drawPiece()
}

function drawPiece() {
  currentPiece.shape.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value) drawBlock(currentPiece.x + x, currentPiece.y + y, COLORS[currentPiece.type])
    })
  })
}

function spawnPiece() {
  const types = Object.keys(SHAPES)
  const type = types[Math.floor(Math.random() * types.length)]
  const shape = SHAPES[type]
  currentPiece = {
    x: Math.floor((COLS - shape[0].length) / 2),
    y: 0,
    shape,
    type
  }
  if (collides(currentPiece, 0, 0)) {
    alert('ゲームオーバー！')
    board = createBoard()
    score.value = 0
  }
}

function collides(piece, offsetX, offsetY) {
  return piece.shape.some((row, y) => {
    return row.some((value, x) => {
      if (value) {
        const nx = piece.x + x + offsetX
        const ny = piece.y + y + offsetY
        return (
            nx < 0 || nx >= COLS || ny >= ROWS ||
            (ny >= 0 && board[ny] && board[ny][nx])
        )
      }
      return false
    })
  })
}

function mergePiece() {
  currentPiece.shape.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value) {
        board[currentPiece.y + y][currentPiece.x + x] = currentPiece.type
      }
    })
  })
}

function clearLines() {
  let lines = 0
  board = board.filter(row => {
    if (row.every(cell => cell)) {
      lines++
      return false
    }
    return true
  })
  while (board.length < ROWS) board.unshift(Array(COLS).fill(''))
  score.value += lines * 100
}

function move(dx, dy) {
  if (!collides(currentPiece, dx, dy)) {
    currentPiece.x += dx
    currentPiece.y += dy
    drawBoard()
    return true
  }
  return false
}

function drop() {
  if (!move(0, 1)) {
    mergePiece()
    clearLines()
    spawnPiece()
  }
}

function rotate() {
  const shape = currentPiece.shape
  const rotated = shape[0].map((_, i) => shape.map(row => row[i]).reverse())
  const temp = { ...currentPiece, shape: rotated }
  if (!collides(temp, 0, 0)) {
    currentPiece.shape = rotated
    drawBoard()
  }
}

function startGame() {
  board = createBoard()
  spawnPiece()
  drawBoard()
  if (gameLoop) clearInterval(gameLoop)
  gameLoop = setInterval(() => {
    drop()
    drawBoard()
  }, dropInterval)
}

function handleKey(e) {
  switch (e.key) {
    case 'ArrowLeft': move(-1, 0); break
    case 'ArrowRight': move(1, 0); break
    case 'ArrowDown': drop(); break
    case 'ArrowUp': rotate(); break
  }
}

onMounted(() => {
  ctx = canvasRef.value.getContext('2d')
  window.addEventListener('keydown', handleKey)
})

onUnmounted(() => {
  clearInterval(gameLoop)
  window.removeEventListener('keydown', handleKey)
})
</script>

<style scoped>
.tetris-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #f0f0f0;
  padding: 2rem;
}

.tetris-canvas {
  border: 2px solid #333;
  background-color: #fff;
}

button {
  margin-top: 1rem;
  padding: 0.5rem 1.2rem;
  font-size: 1rem;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}
</style>
