import { products } from '../data/products'
import { gameState,levelState } from '../data/gameState'
import { OUT_ZONE } from './initGrid'

function shuffle(array) {
    return array
        .map(v => ({ v, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ v }) => v)
}

// 替换原来的 orderId 生成逻辑：
let orderCounter = 1

function generateOrderId() {
    const today = new Date().toISOString().slice(0,10).replace(/-/g, '')
    const id = `ORD-${today}-${String(orderCounter).padStart(3, '0')}`
    orderCounter++
    return id
}

export function generateOrder() {
    const itemCount = Math.floor(Math.random() * 3) + 1 // 每个订单 1~5 种商品

    const unlocked = products.slice(0, levelState.level + 2)
    const weighted = unlocked.flatMap(p => Array(Math.floor(p.demand * 10)).fill(p))

    const unique = [...new Set(shuffle(weighted))].slice(0, itemCount)

    const orderItems = unique.map(product => {
        const totalUnits = Math.ceil(Math.random() * product.boxSize) // 不超过1箱
        return {
            productId: product.id,
            count: totalUnits,
        }
    })

    return {
        id: generateOrderId(),
        items: orderItems,
        expires: Date.now() + 180000, // 3分钟
    }
}

export function tryCompleteOrder(order, itemGrid, terrainGrid) {
    // 累计每种商品在出库区的数量
    const zoneItems = {}

    for (let y = 0; y < itemGrid.length; y++) {
        for (let x = 0; x < itemGrid[0].length; x++) {
            if (terrainGrid[y][x] === OUT_ZONE) {
                const cell = itemGrid[y][x]
                if (cell && cell.type === 'goods') {
                    const id = cell.productId
                    zoneItems[id] = (zoneItems[id] || 0) + cell.count
                }
            }
        }
    }

    // 检查是否满足订单需求
    for (const item of order.items) {
        if (!zoneItems[item.productId] || zoneItems[item.productId] < item.count) {
            return { success: false, reason: '库存不足' }
        }
    }

    // ✅ 扣减出库区中的货物
    for (const item of order.items) {
        let remain = item.count
        for (let y = 0; y < itemGrid.length; y++) {
            for (let x = 0; x < itemGrid[0].length; x++) {
                if (terrainGrid[y][x] === OUT_ZONE) {
                    const cell = itemGrid[y][x]
                    if (cell && cell.type === 'goods' && cell.productId === item.productId) {
                        const take = Math.min(remain, cell.count)
                        cell.count -= take
                        remain -= take

                        if (cell.count <= 0) itemGrid[y][x] = null
                        if (remain <= 0) break
                    }
                }
            }
            if (remain <= 0) break
        }
    }

    // ✅ 增加收入
    const base = order.items.reduce((sum, item) => {
        const p = products.find(p => p.id === item.productId)
        return sum + (p?.sellPrice || 0) * item.count
    }, 0)

    const bonus = Math.floor(
        order.items.reduce((sum, item) => {
            const d = products.find(p => p.id === item.productId)?.demand || 1
            return sum + (1 / d) * 10
        }, 0) + Math.random() * 10
    )

    gameState.money += base + bonus

    return {
        success: true,
        earned: base,
        bonus,
        total: base + bonus
    }
}