<template>
  <div class="warehouse-canvas-game" @mousemove="handleMouseMove">
    <canvas
        ref="canvasRef"
        @click="canvasClickHandler"
        @contextmenu.prevent="canvasRightClickHandler"
    />
    <div class="sidebar">
      <h3>🎖️ 等级：{{ levelState.level }}</h3>
      <p>经验值：{{ levelState.exp }} / {{ nextExp }}</p>
      <div class="level-bar">
        <div class="level-bar-inner" :style="{ width: progressPercent + '%' }"></div>
      </div>
      <div class="money-display">💰资金: ¥{{ animatedMoney }}</div>
      <div class="tabs">
        <button
            v-for="tab in tabs"
            :key="tab"
            @click="currentTab = tab"
            :class="{ active: currentTab === tab }"
        >
          {{ tab }}
        </button>
      </div>
    <div class="sidebar-content">
      <div v-if="currentTab === '入库'" style="padding: 16px">
        <div
            v-for="(p, i) in products"
            :key="p.id"
            class="product-entry"
        >
          <div v-if="i <= levelState.level + 1"  class="product-line">
            <span class="emoji" :title="getTooltip(p.name)">{{ p.emoji }}</span>
            <span class="name">{{ p.name }}</span>
            <span class="note">{{ p.boxSize }}个/箱</span>
            <button class="price-btn" @click="placeOrder(p.id)">¥{{ p.boxSize * p.buyPrice }}</button>
          </div>
          <div v-else class="locked">
            🔒 {{ p.name }}（Lv.{{ i - 2 }} 解锁）
          </div>
        </div>
      </div>
      <!-- 出库页 -->
      <div v-if="currentTab === '出库'" style="padding: 16px">
        <div v-for="order in activeOrders" :key="order.id" class="order-card">
          <div class="order-header">
            <span>🧾 订单 {{ order.id }}</span>
          </div>
          <div class="order-items">
            <div v-for="item in order.items" :key="item.productId" class="order-item">
              <span>{{ getProduct(item.productId).emoji }}{{ getProduct(item.productId).name }}</span>
              <span>¥ {{ getProduct(item.productId).sellPrice }} </span>
              <span>× {{ item.count }}</span>
            </div>
          </div>
          <div class="order-bonus">🎁 奖金: ¥{{ getOrderBonus(order) }}</div>
          <div class="order-total">💵 总收入: ¥{{ getOrderRevenue(order) }}</div>

          <!-- 订单卡片末尾添加 -->
          <button class="complete-btn" @click="handleComplete(order)">
            &nbsp;&nbsp;&nbsp;完成&nbsp;&nbsp;&nbsp;
          </button>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: getProgress(order) + '%' }"></div>
          </div>
        </div>
      </div>


      <div v-if="currentTab === '库存'" style="padding: 16px">
        <div v-for="(info, pid) in stockSummary" :key="pid" class="stock-line">
          <div class="emoji-wrapper" :title="getTooltip(info.name)">
            <span class="emoji">{{ info.emoji }}</span>
            <span class="count-overlay">×{{ info.count }}</span>
          </div>
          <span class="name">{{ info.name }}</span>
          <span class="value">估值: ¥{{ info.value }}</span>
        </div>
        <div class="inventory-total">
          💰 总估值: ¥{{ totalValue }}
        </div>

      </div>
      <div v-if="currentTab === '技能'" class="skill-panel">
        <div
            v-for="skill in skillList"
            :key="skill.id"
            class="skill-entry"
            :class="{ unlocked: unlockedSkills.includes(skill.id) }"
        >
          <div class="skill-text">
            <span class="skill-name">{{ skill.name }}</span>
            <span class="skill-desc">{{ skill.description }}</span>
          </div>
          <button
              :disabled="unlockedSkills.includes(skill.id) || gameState.money < skill.cost"
              @click="unlockSkill(skill.id)"
          >
            {{ unlockedSkills.includes(skill.id) ? '已解锁' : `购买 ¥${skill.cost}` }}
          </button>
        </div>

      </div>



    </div>

  </div>
  </div>
</template>

<script setup>
import './Game.css'
import { computed, ref, onMounted, onBeforeUnmount, reactive, watch } from 'vue'
import { products } from './data/products'
import { gameState,levelState } from './data/gameState'
import { requestImport, updateShipments, countInZoneFree } from './utils/inventory'
import { fillInitialGoods , initTerrainGrid, SHELF, PATH, IN_ZONE, OUT_ZONE } from './utils/initGrid'
import { generateOrder, tryCompleteOrder   } from './utils/orders.js'
import { drawGrid } from './utils/drawGrid'
import { levelTable } from './data/levelTable'


const canvasRef = ref(null)

let canvasWidth = 800
let canvasHeight = 512
let visibleCols = 0
let visibleRows = 0

const tileSize = 40

const rows = 20
const cols = 40


const view = ref({ x: 0, y: 0 }) // 视角左上角格子坐标



const terrainGrid = ref(initTerrainGrid(rows, cols))

const itemGrid = ref(Array.from({ length: rows }, () => Array(cols).fill(null)))

const worker = ref({
  gx: 6,
  gy: 6,
  px: 0,
  py: 0,
  path: [],
  carrying: null, // { productId: 'apple', count: 1 }
  target: null,   // 当前搬运目标格子位置

  message: null,       // 👈 当前显示的提示文字
  messageType: 'error',
  messageTimer: 0      // 👈 提示剩余时间（帧数）
})

let ctx = null
let animationFrameId = null
let mouseX = 0
let mouseY = 0

const hoverCellInfo = ref(null)

const tabs = ['入库', '出库', '库存', '技能']
const currentTab = ref('入库')
const skillList = [
  {
    id: 'auto-banana',
    name: '🍌香蕉豁免',
    description: '完成订单时无视香蕉条件',
    cost: 500,
  },
  {
    id: 'direct-out',
    name: '📦入即出',
    description: '允许商品入库到出库区',
    cost: 800,
  },
  {
    id: 'shelf-grow',
    name: '🌱富营养货架',
    description: '让货架上的商品肆意生长！',
    cost: 2000,
  }
]

const unlockedSkills = ref([])

const animatedMoney = ref(gameState.money)

const visibleProducts = computed(() =>
    products.slice(0, levelState.level + 2) // 例如等级 0 显示 3 种，等级 1 显示 4 种...
)

const activeOrders = ref([])

const nextExp = computed(() => {
  const entry = levelTable.find(e => e.level === levelState.level)
  return entry?.expNeeded || 99999
})

const progressPercent = computed(() => {
  return Math.min(100, (levelState.exp / nextExp.value) * 100)
})

function gainExp(amount) {
  levelState.exp += amount

  while (levelState.level < levelTable.length && levelState.exp >= levelTable[levelState.level - 1].expNeeded) {
    levelState.exp -= levelTable[levelState.level - 1].expNeeded
    levelState.level++

    // 升级奖励：搬运速度 +1
    gameState.workerSpeed += 1

    // 可以在此添加其他奖励逻辑
    showWorkerMessage(`Level up！`, 'success')
  }
}
 function getOrderInterval() {
  const base = 30000  // 初始间隔（ms）
  const min = 1000    // 最小间隔限制
  const k = 0.15       // 衰减速度因子

  const interval = base * Math.exp(-k * (levelState.level - 1))
  return Math.max(min, Math.floor(interval))
}

function unlockSkill(skillId) {
  const skill = skillList.find(s => s.id === skillId)
  if (!skill) return
  if (gameState.money >= skill.cost && !unlockedSkills.value.includes(skillId)) {
    gameState.money -= skill.cost
    unlockedSkills.value.push(skillId)
  }
}

function getProduct(productId) {
  return products.find(p => p.id === productId) || {}
}

function getOrderBonus(order) {
  const base = 5
  const rarityScore = order.items.reduce((sum, item) => {
    const demand = getProduct(item.productId).demand || 1
    return sum + Math.floor((1 / demand) * 10)
  }, 0)
  const varietyBonus = order.items.length * 5
  return base + rarityScore + varietyBonus
}

function getOrderRevenue(order) {
  const goodsTotal = order.items.reduce((sum, item) => {
    const price = getProduct(item.productId).sellPrice || 0
    return sum + item.count * price
  }, 0)
  return goodsTotal + getOrderBonus(order)
}

function getProgress(order) {
  const totalTime = 180000 // 所有订单固定持续 3 分钟
  const remaining = order.expires - Date.now()
  const percent = Math.min(100, Math.max(0, ((totalTime - remaining) / totalTime) * 100))
  return 100 - percent
}

const totalValue = computed(() => {
  return Object.values(stockSummary.value).reduce((sum, item) => sum + item.value, 0)
})

function startOrderGeneration() {
  function spawnOrder() {
    const order = generateOrder()
    activeOrders.value.push(order)

    const nextDelay = Math.floor(Math.random() * 10000) + getOrderInterval()
    setTimeout(spawnOrder, nextDelay)
  }

  activeOrders.value = [generateOrder()]
  setTimeout(spawnOrder, getOrderInterval())
}

// 每秒刷新订单（也会触发进度条重新计算）
setInterval(() => {
  const now = Date.now()
  activeOrders.value = activeOrders.value.filter(order => order.expires > now)
}, 1000)
const stockSummary = computed(() => {
  const summary = {}
  for (let row of itemGrid.value) {
    for (let cell of row) {
      if (isGoodsCell(cell)) {
        const product = products.find(p => p.id === cell.productId)
        if (!product) continue

        const count = cell.count

        if (!summary[product.id]) {
          summary[product.id] = {
            count,
            emoji: product.emoji,
            name: product.name,
            value: count * product.sellPrice,
          }
        } else {
          summary[product.id].count += count
          summary[product.id].value += count * product.sellPrice
        }
      }
    }
  }
  return summary
})


function getTooltip(name) {
  const p = products.find(p => p.name === name)
  if (!p) return ''
  return `名称: ${p.name}
  每箱: ${p.boxSize}个
  重量: ${p.weight}
  进价: ¥${p.buyPrice}
  售价: ¥${p.sellPrice}
  运输: ${p.transportTime / 1000}s
  需求指数: ${p.demand}`
}


function placeOrder(productId) {
  const free = countInZoneFree(itemGrid.value, terrainGrid.value, IN_ZONE)
  const result = requestImport(productId, 1, free) // ← 固定 1箱
  if (result.error) {
    alert(result.error)
  }
}

function centerOnWorker() {
  const halfCols = visibleCols / 2
  const halfRows = visibleRows / 2

  const gx = worker.value.gx
  const gy = worker.value.gy

  // 目标视角
  let targetX = gx - halfCols
  let targetY = gy - halfRows

  // 边界处理
  if (targetX < 0) targetX = 0
  if (targetX > cols - visibleCols) targetX = cols - visibleCols
  if (targetY < 0) targetY = 0
  if (targetY > rows - visibleRows) targetY = rows - visibleRows

  // 使用线性插值（lerp）实现平滑过渡
  const lerp = (a, b, t) => a + (b - a) * t
  const t = 0.1 // 平滑程度（越小越慢）

  view.value.x = lerp(view.value.x, targetX, t)
  view.value.y = lerp(view.value.y, targetY, t)
}

function drawWorker() {
  const screenX = worker.value.px - view.value.x * tileSize
  const screenY = worker.value.py - view.value.y * tileSize

  ctx.font = `${tileSize * 0.9}px serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('👷', screenX, screenY)

  if (worker.value.message && worker.value.messageTimer > 0) {
    drawWorkerMessage(ctx, worker.value.message, screenX, screenY,worker.value.messageType)

    worker.value.messageTimer--
    if (worker.value.messageTimer === 0) {
      worker.value.message = null
    }
  }


  if (worker.value.carrying) {
    const p = products.find(p => p.id === worker.value.carrying.productId)
    if (p) {
      ctx.font = '20px serif'
      ctx.fillText(p.emoji, screenX, screenY + 14)

      ctx.fillStyle = '#fff'
      ctx.fillRect(screenX + 10, screenY + 15, 26,14)
      ctx.font = '10px sans-serif'
      ctx.fillStyle = '#000'
      ctx.fillText(`×${worker.value.carrying.count}`, screenX + 22, screenY + 24)
    }
  }

}

function drawShipmentsProgress() {
  const now = Date.now()
  const barWidth = 120
  const barHeight = 16

  gameState.incomingShipments.forEach((s, i) => {
    const product = products.find(p => p.id === s.productId)
    if (!product) return
    const total = s.eta - (s.startTime || (s.eta - product.transportTime))
    const remaining = s.eta - now
    const progress = 1 - remaining / total

    const x = canvasWidth - 150
    const y = 30 + i * (barHeight + 10)

    // 背景
    ctx.fillStyle = '#ddd'
    ctx.fillRect(x, y, barWidth, barHeight)

    // 进度条
    ctx.fillStyle = '#76c7c0'
    ctx.fillRect(x, y, barWidth * progress, barHeight)

    // 商品图标
    ctx.font = '16px serif'
    ctx.fillStyle = '#000'
    ctx.fillText(product.emoji + ' ×' + s.boxCount, x - 80, y + 14)
  })
}

let shelfGrowTimer = 0

function animate() {
  ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)
  drawGrid(ctx, terrainGrid.value, itemGrid.value, view.value, tileSize, rows, cols, canvasWidth, canvasHeight)
  moveWorker()
  centerOnWorker() // 调整视角到工人居中
  drawWorker()
  drawShipmentsProgress()
  updateShipments(itemGrid.value, terrainGrid.value, IN_ZONE, unlockedSkills.value)

  // 每 60 帧（约1秒）尝试增长货架商品
  shelfGrowTimer++
  if (shelfGrowTimer >= 60) {
    shelfGrowTimer = 0
    if (unlockedSkills.value.includes('shelf-grow')) {
      growShelfItems()
    }
  }

  animationFrameId = requestAnimationFrame(animate)
  if (worker.value.target) {
    const [gx, gy] = worker.value.target
    const cell = itemGrid.value[gy]?.[gx]
    const mode = worker.value.__targetMode
    const carrying = worker.value.carrying

    if (mode === 'pickup') {
      if (!isGoodsCell(cell)) {
        worker.value.target = null
        return
      }

      if (!worker.value.__tick) worker.value.__tick = 0
      worker.value.__tick++
      if (worker.value.__tick >= 5) {
        const productId = cell.productId
        const p = products.find(p => p.id === productId)
        if (p) {
          if (!carrying) {
            worker.value.carrying = { productId, count: 1 }
          } else {
            carrying.count++
          }

          cell.count--
          if (cell.count <= 0) {
            itemGrid.value[gy][gx] = null
            worker.value.target = null
          }
        }
        worker.value.__tick = 0
      }

    } else if (mode === 'dropoff') {
      if (!carrying) {
        worker.value.target = null
        return
      }

      const p = products.find(p => p.id === carrying.productId)
      if (!p) return

      if (!worker.value.__tick) worker.value.__tick = 0
      worker.value.__tick++
      if (worker.value.__tick >= 5) {

        // ✅ 限制数量：每格最多放一箱
        if (isGoodsCell(cell)) {
          if (cell.productId !== carrying.productId) {
            // ❌ 不同商品类型
            showWorkerMessage('商品类型不一致')
            worker.value.target = null
            return
          }

          if (cell.count >= p.boxSize) {
            // ❌ 超过一箱容量
            showWorkerMessage('此格已满')
            worker.value.target = null
            return
          }

          // ✅ 可以叠加
          cell.count++
        } else {
          // ✅ 空格子可放新货
          itemGrid.value[gy][gx] = {
            type: 'goods',
            productId: carrying.productId,
            count: 1,
          }
        }

        // 背包 -1
        carrying.count--
        if (carrying.count <= 0) {
          worker.value.carrying = null
          worker.value.target = null
        }

        worker.value.__tick = 0
      }
    }
  }

  if (hoverCellInfo.value) {
    const { x, y, productId } = hoverCellInfo.value
    const p = products.find(p => p.id === productId)
    if (p) {
      const text = `
      ${p.name}
      进价: ¥${p.buyPrice}
      售价: ¥${p.sellPrice}
      重量: ${p.weight}
      `

      const lines = text.split('\n')
      const height = lines.length * 18 + 10

      ctx.fillStyle = 'rgba(0,0,0,0.75)'
      ctx.fillRect(x + 10, y + 10, 80, height)

      ctx.fillStyle = '#fff'
      ctx.font = '13px sans-serif'
      lines.forEach((line, i) => {
        ctx.fillText(line, x + 36, y + 28 + i * 16)
      })
    }
  }
}

function growShelfItems() {
  for (let y = 0; y < itemGrid.value.length; y++) {
    for (let x = 0; x < itemGrid.value[0].length; x++) {
      const terrain = terrainGrid.value[y][x]
      const item = itemGrid.value[y][x]

      if (terrain === SHELF && item && item.type === 'goods') {
        const product = products.find(p => p.id === item.productId)
        if (!product) continue

        const max = product.boxSize

        if (Math.random() < item.count * 0.01) {
          item.count++
          item.growthAnim = { start: Date.now() }

          if (item.count > max) {
            // 尝试将多余部分转移到邻近格子
            const directions = [
              [1, 0], [-1, 0], [0, 1], [0, -1]
            ]

            for (const [dx, dy] of directions) {
              const nx = x + dx
              const ny = y + dy
              if (nx < 0 || ny < 0 || nx >= itemGrid.value[0].length || ny >= itemGrid.value.length) continue

              const neighbor = itemGrid.value[ny][nx]
              const neighborTerrain = terrainGrid.value[ny][nx]

              if (neighborTerrain === SHELF) {
                if (!neighbor) {
                  // 空位放新货
                  itemGrid.value[ny][nx] = {
                    type: 'goods',
                    productId: item.productId,
                    count: 1,
                    growthAnim: { start: Date.now() }
                  }
                  item.count--
                  break
                } else if (
                    neighbor.type === 'goods' &&
                    neighbor.productId === item.productId &&
                    neighbor.count < max
                ) {
                  // 合并到未满的同类货物
                  neighbor.count++
                  neighbor.growthAnim = { start: Date.now() }
                  item.count--
                  break
                }
              }
            }

            // 再保险：主格子不能超过上限
            if (item.count > max) item.count = max
          }
        }
      }
    }
  }
}


function afterArrivedTile() {
  const { gx, gy } = worker.value
  const targetGoods = worker.value.__targetGoods
  if (!targetGoods) return

  const [tx, ty] = targetGoods
  const dx = Math.abs(gx - tx)
  const dy = Math.abs(gy - ty)
  const cell = itemGrid.value[ty]?.[tx]

  // ✅ 到达货物旁边
  if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
    if (worker.value.__targetMode==='pickup' &&
        isGoodsCell(cell) && cell.count > 0) {
      worker.value.target = [tx, ty]
      worker.value.__tick = 0
    }
    if (worker.value.__targetMode==='dropoff' &&
        worker.value.carrying) {
      worker.value.target = [tx, ty]
      worker.value.__tick = 0
    }
  }

  console.log('afterArrivedTile', worker.value.target,worker.value.__targetGoods,worker.value.carrying);
  // 🧹 清理
  worker.value.__targetGoods = null
}


function moveWorker() {
  const speed = gameState.workerSpeed
  if (worker.value.path.length > 0) {
    const [tx, ty] = worker.value.path[0]
    const targetPx = tx * tileSize + tileSize / 2
    const targetPy = ty * tileSize + tileSize / 2
    const dx = targetPx - worker.value.px
    const dy = targetPy - worker.value.py
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < speed) {
      worker.value.px = targetPx
      worker.value.py = targetPy
      worker.value.gx = tx
      worker.value.gy = ty

      // ✅ 修正非法越界
      if (
          worker.value.gx < 0 || worker.value.gy < 0 ||
          worker.value.gx >= cols || worker.value.gy >= rows
      ) {
        console.warn('工人越界:', worker.value.gx, worker.value.gy)
        worker.value.path = []
        return
      }

      worker.value.path.shift()
      afterArrivedTile() // ← 添加这句

    } else {
      worker.value.px += (dx / dist) * speed
      worker.value.py += (dy / dist) * speed
    }
  }
}

function handleComplete(order) {
  const result = tryCompleteOrder(order, itemGrid.value, terrainGrid.value, unlockedSkills.value)
  if (result.success) {
    activeOrders.value = activeOrders.value.filter(o => o.id !== order.id)
    gainExp(result.total) // result.total 是订单收入，可作为经验值

  } else {
    showWorkerMessage(`尚未满足订单条件！`)
  }
}

function handleGoodsClick(gx, gy, mode) {

  const neighbors = [
    [gx + 1, gy],
    [gx - 1, gy],
    [gx, gy + 1],
    [gx, gy - 1]
  ]
  const reachable = neighbors.filter(([nx, ny]) => {
    return (
        nx >= 0 && ny >= 0 &&
        nx < cols && ny < rows &&
        terrainGrid.value[ny][nx] === PATH
    )
  })

  const { gx: wx, gy: wy } = worker.value
  for (const [nx, ny] of reachable) {
    if (nx === wx && ny === wy) {
      // 工人已在邻近格子，直接开始交互
      worker.value.__targetGoods = [gx, gy]
      worker.value.__targetMode = mode
      worker.value.path = []
      afterArrivedTile()      // 👈 手动触发一次
      console.log(worker.value.__targetGoods,worker.value.__targetMode,worker.value.path);
      return
    }
  }

  let bestTarget = null
  let shortestPath = []
  for (const [nx, ny] of reachable) {
    const path = aStar([worker.value.gx, worker.value.gy], [nx, ny])
    if (path.length && (!bestTarget || path.length < shortestPath.length)) {
      bestTarget = [nx, ny]
      shortestPath = path
    }
  }

  worker.value.__targetGoods = [gx, gy]
  worker.value.__targetMode = mode // "pickup" or "dropoff"
  if (bestTarget && shortestPath) {
    worker.value.path = shortestPath
  }
}

function canvasClickHandler(e) {
  const rect = canvasRef.value.getBoundingClientRect()
  const clickX = e.clientX - rect.left
  const clickY = e.clientY - rect.top
  const gx = Math.floor(clickX / tileSize + view.value.x)
  const gy = Math.floor(clickY / tileSize + view.value.y)

  // ✅ 修正非法越界
  if (gx < 0 || gy < 0 ||
      gx >= cols || gy >= rows
  ) {
    console.warn('工人越界:', gx, gy)
    return
  }
  let targetX = gx
  let targetY = gy

  if (terrainGrid.value[gy]?.[gx] !== PATH) {
    // ⛔ 目标不是 PATH，找最近的可达正交邻居格子
    const neighbors = [
      [gx + 1, gy], // →
      [gx - 1, gy], // ←
      [gx, gy + 1], // ↓
      [gx, gy - 1]  // ↑
    ]


    let shortest = null
    let bestPath = []

    for (const [nx, ny] of neighbors) {
      if (
          nx >= 0 && ny >= 0 &&
          nx < cols && ny < rows &&
          terrainGrid.value[ny][nx] === PATH
      ) {
        const path = aStar([worker.value.gx, worker.value.gy], [nx, ny])
        if (path.length && (!shortest || path.length < bestPath.length)) {
          shortest = [nx, ny]
          bestPath = path
        }
      }
    }

    if (shortest) {
      targetX = shortest[0]
      targetY = shortest[1]
    } else {
      console.warn('没有可达路径')
    }
  }


  // 🛑 中断当前搬运
  worker.value.target = null

  const cell = itemGrid.value[gy]?.[gx]
  const carry = worker.value.carrying
  if (isGoodsCell(cell)) {
    console.warn('isGoodsCell',carry)
    // 🧠 如果当前没拿东西，点击任何货物格都可以 pickup
    // 🧠 如果拿着东西，只能搬同类（视为转运）
    if (!carry || carry.productId === cell.productId) {
      handleGoodsClick(gx, gy, 'pickup')
    } else {
      showWorkerMessage('商品类型不一致')
    }
    return
  }

  const path = aStar([worker.value.gx, worker.value.gy], [targetX, targetY])
  if (path.length > 0) {
    worker.value.path = path
  }
}

function canvasRightClickHandler(e) {
  e.preventDefault()

  const rect = canvasRef.value.getBoundingClientRect()
  const clickX = e.clientX - rect.left
  const clickY = e.clientY - rect.top
  const gx = Math.floor(clickX / tileSize + view.value.x)
  const gy = Math.floor(clickY / tileSize + view.value.y)

  // ✅ 修正非法越界
  if (gx < 0 || gy < 0 ||
      gx >= cols || gy >= rows
  ) {
    console.warn('工人越界:', gx, gy)
    return
  }

  const terrain = terrainGrid.value[gy]?.[gx]
  const item = itemGrid.value[gy]?.[gx]
  const carry = worker.value.carrying

  if (terrain === PATH) return
  if (!carry) return

  // 🧠 只有同类货物才能放
  const canDrop =
      item == null ||
      (item.type === 'goods' && item.productId === carry.productId)

  if (!canDrop) {
    showWorkerMessage('商品类型不一致')
    return
  }

  handleGoodsClick(gx, gy, 'dropoff')
}




function handleMouseMove(e) {
  const rect = canvasRef.value.getBoundingClientRect()
  mouseX = e.clientX - rect.left
  mouseY = e.clientY - rect.top

  const gx = Math.floor(mouseX / tileSize + view.value.x)
  const gy = Math.floor(mouseY / tileSize + view.value.y)

  const cell = itemGrid.value[gy]?.[gx]
  if (isGoodsCell(cell)) {
    hoverCellInfo.value = { x: mouseX, y: mouseY, productId: cell.productId }
  } else {
    hoverCellInfo.value = null
  }

}

function aStar(start, goal) {
  const [sx, sy] = start
  const [gx, gy] = goal
  const open = [[sx, sy]]
  const cameFrom = {}
  const costSoFar = {}
  const key = (x, y) => `${x},${y}`
  cameFrom[key(sx, sy)] = null
  costSoFar[key(sx, sy)] = 0

  while (open.length) {
    open.sort((a, b) => (costSoFar[key(a[0], a[1])] + heuristic(a, goal)) - (costSoFar[key(b[0], b[1])] + heuristic(b, goal)))
    const [x, y] = open.shift()
    if (x === gx && y === gy) break

    for (const [dx, dy] of [[1,0], [-1,0], [0,1], [0,-1], [1,1], [-1,1], [1,-1], [-1,-1]]) {
      const nx = x + dx, ny = y + dy
      if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue
      if (terrainGrid.value[ny][nx] !== PATH) continue
      // 对角线不能穿过角落障碍
      // ✅ 对角线走法时，左右上下两个方向都要是 PATH
      if (Math.abs(dx) + Math.abs(dy) === 2) {
        const block1 = terrainGrid.value[y][ny] !== PATH
        const block2 = terrainGrid.value[ny][x] !== PATH
        if (block1 || block2) continue
      }

      const moveCost = (dx === 0 || dy === 0) ? 1 : 1.4
      const newCost = costSoFar[key(x, y)] + moveCost
      if (!(key(nx, ny) in costSoFar) || newCost < costSoFar[key(nx, ny)]) {
        costSoFar[key(nx, ny)] = newCost
        cameFrom[key(nx, ny)] = [x, y]
        open.push([nx, ny])
      }
    }
  }

  const path = []
  let current = [gx, gy]
  while (current && key(current[0], current[1]) !== key(sx, sy)) {
    path.unshift(current)
    current = cameFrom[key(current[0], current[1])]
  }
  return path
}

function heuristic(a, b) {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1])
}

function isGoodsCell(cell) {
  return cell && typeof cell === 'object' && cell.type === 'goods'
}



function showWorkerMessage(text, type = 'error', duration = 60) {
  worker.value.message = text
  worker.value.messageTimer = duration
  worker.value.messageType = type
}
function drawWorkerMessage(ctx, msg, x, y, type = 'error') {
  const padding = 8
  const fontSize = 14
  const icon = type === 'success' ? '😄' : '❌'
  const fullText = `${icon} ${msg}`

  ctx.font = `${fontSize}px sans-serif`
  const textWidth = ctx.measureText(fullText).width
  const bubbleWidth = textWidth + padding * 2
  const bubbleHeight = fontSize + padding

  const bx = x - bubbleWidth / 2
  const by = y - 60
  const radius = 6

  // 背景气泡
  ctx.beginPath()
  ctx.moveTo(bx + radius, by)
  ctx.lineTo(bx + bubbleWidth - radius, by)
  ctx.quadraticCurveTo(bx + bubbleWidth, by, bx + bubbleWidth, by + radius)
  ctx.lineTo(bx + bubbleWidth, by + bubbleHeight - radius)
  ctx.quadraticCurveTo(bx + bubbleWidth, by + bubbleHeight, bx + bubbleWidth - radius, by + bubbleHeight)
  ctx.lineTo(bx + radius, by + bubbleHeight)
  ctx.quadraticCurveTo(bx, by + bubbleHeight, bx, by + bubbleHeight - radius)
  ctx.lineTo(bx, by + radius)
  ctx.quadraticCurveTo(bx, by, bx + radius, by)
  ctx.closePath()

  ctx.fillStyle = type === 'success' ? 'rgba(240,255,240,0.95)' : 'rgba(255,255,255,0.95)'
  ctx.fill()
  ctx.strokeStyle = type === 'success' ? '#4caf50' : '#999'
  ctx.stroke()

  // 文本
  ctx.fillStyle = '#000'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(fullText, x, by + bubbleHeight / 2)
}


onMounted(() => {


  canvasWidth = window.innerWidth - 500
  canvasHeight = window.innerHeight - 100

  canvasRef.value.width = canvasWidth
  canvasRef.value.height = canvasHeight

  visibleCols = Math.floor(canvasWidth / tileSize)
  visibleRows = Math.floor(canvasHeight / tileSize)

  ctx = canvasRef.value.getContext('2d')
  worker.value.px = worker.value.gx * tileSize + tileSize / 2
  worker.value.py = worker.value.gy * tileSize + tileSize / 2
  canvasRef.value.addEventListener('click', canvasClickHandler)

  fillInitialGoods(itemGrid.value, terrainGrid.value)

  animate()

  startOrderGeneration()
})

onBeforeUnmount(() => {
  cancelAnimationFrame(animationFrameId)
  canvasRef.value.removeEventListener('click', canvasClickHandler)
})

watch(() => gameState.money, (newVal, oldVal) => {
  const duration = 500  // 动画持续时间 (ms)
  const steps = 30
  const stepTime = duration / steps
  const delta = (newVal - oldVal) / steps

  let current = oldVal
  let count = 0

  const interval = setInterval(() => {
    current += delta
    animatedMoney.value = Math.round(current)
    count++
    if (count >= steps) {
      animatedMoney.value = newVal
      clearInterval(interval)
    }
  }, stepTime)
})

</script>

