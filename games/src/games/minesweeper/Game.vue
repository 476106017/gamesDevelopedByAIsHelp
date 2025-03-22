<template>
  <div class="minesweeper-container">
    <div v-if="!level" class="overlay">
      <div class="popup">
        <h3>難易度を選択</h3>
        <button @click="selectLevel('easy')">初級</button>
        <button @click="selectLevel('medium')">中級</button>
        <button @click="selectLevel('hard')">上級</button>
      </div>
    </div>

    <h2>マインスイーパー</h2>
    <div class="status-bar">
      <span>経過時間：{{ time }}秒</span>
      <span>残り旗：{{ flagsLeft }}</span>
    </div>
    <div class="grid">
      <div v-for="(row, y) in board" :key="y" class="row">
        <div
            v-for="(cell, x) in row"
            :key="x"
            class="cell"
            :class="{
              revealed: cell.revealed,
              mine: cell.revealed && cell.mine,
              flagged: cell.flagged
            }"
            @click="handleClick(x, y)"
            @contextmenu.prevent="handleRightClick(x, y)"
        >
          <span
              v-if="cell.revealed && !cell.mine && cell.count > 0"
              :style="{ color: dangerColor(countUnknownAround(x, y)) }"
          >{{ cell.count }}</span>
          <span v-else-if="cell.revealed && cell.mine">💣</span>
          <span v-else-if="!cell.revealed && cell.flagged">🚩</span>
          <span
              v-if="cell.itemFade"
              class="item-icon fading"
          >{{ getItemIcon(cell.item) }}
          </span>
          <span v-else>&nbsp;</span> <!-- 保底空格 -->
        </div>
      </div>
    </div>
    <div v-if="items.length" class="toolbar">
      <span v-for="(item, i) in items" :key="i" class="tool" @click="useItem(i)">
        {{ getItemIcon(item) }} {{ getItemName(item) }}
      </span>
    </div>
    <p v-if="gameOver">💥 ゲームオーバー！</p>
    <p v-else-if="gameWon">🎉 クリア！</p>
    <button v-if="gameOver || gameWon" @click="restart">再プレイ</button>
  </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue'
import { playBeep } from '@/utils/useSound'

const levelMap = {
  easy: { width: 9, height: 9, mines: 10 },
  medium: { width: 16, height: 16, mines: 40 },
  hard: { width: 30, height: 16, mines: 99 },
}

const level = ref(null)
const board = ref([])
const width = ref(0)
const height = ref(0)
const mineCount = ref(0)

const gameOver = ref(false)
const gameWon = ref(false)
const firstClick = ref(false)
const time = ref(0)
const flagsLeft = ref(0)

const items = ref([]) // ← 所有获得的道具依次存入


let timer = null

function selectLevel(lv) {
  stopTimer()
  level.value = lv
  const config = levelMap[lv]
  width.value = config.width
  height.value = config.height
  mineCount.value = config.mines
  flagsLeft.value = mineCount.value
  time.value = 0
  firstClick.value = false
  gameOver.value = false
  gameWon.value = false

  // **🔹 生成一个“没有雷”的空网格**
  board.value = Array.from({ length: height.value }, () =>
      Array.from({ length: width.value }, () => ({
        revealed: false,
        flagged: false,
        mine: false,
        count: 0,
        item: null, // 可能是 'flag' , 'reveal', 'robot' 等
      }))
  )
  console.log('生成地图完成:', board.value)
}


function generateBoard(excludeX, excludeY) {
  const b = []
  for (let y = 0; y < height.value; y++) {
    b[y] = []
    for (let x = 0; x < width.value; x++) {
      b[y][x] = {
        revealed: false,
        flagged: false,
        mine: false,
        count: 0,
        item: null, // 可能是 'flag' , 'reveal', 'robot' 等
      }
    }
  }

  let placed = 0
  while (placed < mineCount.value) {
    const x = Math.floor(Math.random() * width.value)
    const y = Math.floor(Math.random() * height.value)
    const isExcluded = Math.abs(x - excludeX) <= 1 && Math.abs(y - excludeY) <= 1
    if (!b[y][x].mine && !isExcluded) {
      b[y][x].mine = true
      placed++
    }
  }

  for (let y = 0; y < height.value; y++) {
    for (let x = 0; x < width.value; x++) {
      if (!b[y][x].mine) {
        b[y][x].count = countMinesAround(b, x, y)
      }
    }
  }
  console.log('生成地图完成:', b.length, b[0]?.length)

  return b
}

function countMinesAround(b, x, y) {
  let count = 0
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx
      const ny = y + dy
      if (nx >= 0 && ny >= 0 && nx < width.value && ny < height.value && b[ny][nx].mine) {
        count++
      }
    }
  }
  return count
}

function handleClick(x, y) {
  if (gameOver.value || board.value[y]?.[x]?.flagged) return

  if (!firstClick.value) {
    board.value = generateBoard(x, y)
    firstClick.value = true
    startTimer()
  }

  const cell = board.value[y]?.[x]

  if (!cell.revealed) {
    reveal(x, y)
    checkWin()
  } else if (cell.count > 0) {
    autoExpandAround(x, y)
    checkWin()
  }
}

function handleRightClick(x, y) {
  if (gameOver.value || board.value[y][x].revealed) return
  const cell = board.value[y][x]
  cell.flagged = !cell.flagged
  flagsLeft.value += cell.flagged ? -1 : 1
  playBeep(660, 80, 0.1)
}

function reveal(x, y) {
  const cell = board.value[y][x]
  if (cell.revealed || cell.flagged) return

  cell.revealed = true

  if (cell.mine) {
    gameOver.value = true
    playBeep(120, 400, 0.1)
    stopTimer()
    revealAll()
    return
  }

  // ✅ 掉落逻辑：只有空格子才触发
  if (cell.count === 0 && !cell.item && Math.random() < 0.1) {
    // 10% 几率获得道具
    const itemPool  = ['flag', 'reveal', 'robot']
    cell.item = itemPool[Math.floor(Math.random() * itemPool.length)]
    cell.itemFade = true // 🔸控制显示
    items.value.push(cell.item) // ← 存入道具栏

    // 🔸几秒后自动隐藏
    setTimeout(() => {
      cell.itemFade = false
    }, 2000)
  }


  if (cell.count === 0) {
    revealAdjacent(x, y)
  }
}

function revealAdjacent(x, y) {
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx
      const ny = y + dy
      if (
          nx >= 0 && ny >= 0 &&
          nx < width.value && ny < height.value
      ) {
        reveal(nx, ny)
      }
    }
  }
}

function countUnknownAround(x, y) {
  let count = 0
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx
      const ny = y + dy
      if (
          nx >= 0 && ny >= 0 &&
          nx < width.value && ny < height.value
      ) {
        const c = board.value[ny][nx]
        if (!c.revealed && !c.flagged) count++
      }
    }
  }
  return count
}

function dangerColor(count) {
  const minColor = [0, 0, 0]       // 黑色 rgb(0,0,0)
  const maxColor = [255, 0, 0]     // 红色 rgb(255,0,0)
  const max = 5

  const ratio = Math.min(count / max, 1)

  const r = Math.floor(minColor[0] + (maxColor[0] - minColor[0]) * ratio)
  const g = Math.floor(minColor[1] + (maxColor[1] - minColor[1]) * ratio)
  const b = Math.floor(minColor[2] + (maxColor[2] - minColor[2]) * ratio)

  return `rgb(${r},${g},${b})`
}

function tryClickSafeCell() {
  console.log('机器人尝试点击')
  for (let y = 0; y < height.value; y++) {
    for (let x = 0; x < width.value; x++) {
      const cell = board.value[y][x]
      if (cell.revealed && cell.count > 0) {
        let flagCount = 0
        let unrevealed = []

        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx
            const ny = y + dy
            if (
                nx >= 0 && ny >= 0 &&
                nx < width.value && ny < height.value
            ) {
              const neighbor = board.value[ny][nx]
              if (neighbor.flagged) flagCount++
              else if (!neighbor.revealed) unrevealed.push({ x: nx, y: ny })
            }
          }
        }

        if (flagCount + unrevealed.length === cell.count && unrevealed.length > 0) {
          const { x: tx, y: ty } = unrevealed[Math.floor(Math.random() * unrevealed.length)]
          handleRightClick(tx, ty)
          console.log('机器人尝试成功')
          return true
        }
      }
    }
  }
  console.log('机器人尝试失败')
  return false
}

function autoExpandAround(x, y) {
  const cell = board.value[y][x]
  let flagCount = 0

  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx
      const ny = y + dy
      if (
          nx >= 0 && ny >= 0 &&
          nx < width.value && ny < height.value &&
          board.value[ny][nx].flagged
      ) {
        flagCount++
      }
    }
  }

  if (flagCount === cell.count) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx
        const ny = y + dy
        if (
            nx >= 0 && ny >= 0 &&
            nx < width.value && ny < height.value &&
            !board.value[ny][nx].flagged &&
            !board.value[ny][nx].revealed
        ) {
          reveal(nx, ny)
        }
      }
    }
  }
}

function revealAll() {
  for (let row of board.value) {
    for (let cell of row) {
      cell.revealed = true
    }
  }
}

function getItemIcon(key) {
  switch (key) {
    case 'flag': return '🎯'
    case 'reveal': return '🌟'
    case 'robot': return '🤖'
    default: return '❓'
  }
}

function getItemName(key) {
  switch (key) {
    case 'flag': return '地雷自動マーク'
    case 'reveal': return '安全エリア展開'
    case 'robot': return 'ロボット補助'
    default: return '不明'
  }
}

function applyItem(type) {
  if (type === 'flag') {
    // 找到一个未标记的地雷，自动插旗
    const candidates = []

    for (let y = 0; y < height.value; y++) {
      for (let x = 0; x < width.value; x++) {
        const cell = board.value[y][x]
        if (cell.mine && !cell.flagged) {
          candidates.push({ x, y })
        }
      }
    }

    if (candidates.length > 0) {
      const { x, y } = candidates[Math.floor(Math.random() * candidates.length)]
      board.value[y][x].flagged = true
      flagsLeft.value--
    }
  } else if (type === 'reveal') {
    // 随机翻开一个空白安全区域
    const candidates = []

    for (let y = 0; y < height.value; y++) {
      for (let x = 0; x < width.value; x++) {
        const c = board.value[y][x]
        if (!c.mine && !c.revealed && c.count === 0) {
          candidates.push({ x, y })
        }
      }
    }

    if (candidates.length > 0) {
      const { x, y } = candidates[Math.floor(Math.random() * candidates.length)]
      reveal(x, y)
    }
  } else if (type === 'robot') {
    let runs = 0
    const maxRuns = 10

    const interval = setInterval(() => {
      const clicked = tryClickSafeCell()
      runs++
      if (!clicked || runs >= maxRuns || gameOver.value || gameWon.value) {
        clearInterval(interval)
      }
    }, 1000)
  }
}

function useItem(index) {
  const item = items.value[index]
  applyItem(item)
  items.value.splice(index, 1) // 用完移除
}

function checkWin() {
  for (let row of board.value) {
    for (let cell of row) {
      if (!cell.mine && !cell.revealed) return
    }
  }
  gameWon.value = true
  stopTimer()
}

function startTimer() {
  timer = setInterval(() => time.value++, 1000)
}

function stopTimer() {
  if (timer) clearInterval(timer)
}

function restart() {
  level.value = null
  items.value = [] // ✅ 重置道具栏
}

onUnmounted(stopTimer)
</script>


<style scoped>
.minesweeper-container {
  text-align: center;
  padding: 2rem;
  min-height: 100vh;
  background-color: #f0f0f0;
  overflow-x: auto;
}


.status-bar {
  margin-bottom: 1rem;
  font-size: 1.1rem;
  display: flex;
  justify-content: space-around;
}
.grid {
  display: inline-flex;
  flex-direction: column;
  border: 2px solid #333;
  margin-top: 1rem;
}

.row {
  display: flex;
}

.cell {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 16px;
  cursor: pointer;
  user-select: none;
  box-sizing: border-box;
  background-color: #e0e0e0;
  border: 1px solid #888;
  position: relative; /* ⬅️ 确保格子能定位 */
}


.cell.revealed {
  background-color: #eee;
}

.cell.mine {
  background-color: #ff6666;
}

.cell.flagged {
  background-color: #ccccff;
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

button:hover {
  background-color: #388e3c;
}

.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.popup {
  background: white;
  padding: 2rem;
  border-radius: 10px;
  text-align: center;
}

.popup button {
  margin: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 1rem;
}

.toolbar {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.tool {
  background: #eee;
  padding: 0.3rem 0.8rem;
  border: 1px solid #aaa;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: 0.2s;
}

.tool:hover {
  background: #ccc;
}
.item-icon {
  position: absolute;
  bottom: 2px;
  right: 4px;
  font-size: 16px;
  opacity: 1;
  transition: opacity 1s ease-out;
}

.item-icon.fading {
  animation: fadeOut 2s forwards;
}

@keyframes fadeOut {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
  100% {
    opacity: 0;
    transform: scale(1);
  }
}

</style>
