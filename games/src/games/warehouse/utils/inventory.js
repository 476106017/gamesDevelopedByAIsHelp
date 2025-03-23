import { products } from '../data/products.js'
import { gameState } from '../data/gameState.js'
import { OUT_ZONE } from './initGrid'


export function requestImport(productId, boxCount, currentInZoneSpaces) {
    const product = products.find(p => p.id === productId)
    if (!product) return { error: '商品不存在' }

    const totalCost = product.buyPrice * product.boxSize * boxCount
    if (currentInZoneSpaces < boxCount)
        return { error: '入库区空间不足' }

    if (gameState.money < totalCost)
        return { error: '资金不足' }

    gameState.money -= totalCost
    const eta = Date.now() + product.transportTime

    gameState.incomingShipments.push({
        productId,
        boxCount,
        eta,
        startTime: Date.now(), // ← 加这个用于计算进度百分比
    })

    return { success: true }
}
export function updateShipments(itemGrid, terrainGrid, inZoneType, unlockedSkills = []) {
    const now = Date.now()
    const remaining = []

    for (const shipment of gameState.incomingShipments) {
        if (shipment.eta <= now) {
            let success = false

            // ✅ 如果有 direct-out 技能，尝试投放到出库区
            if (unlockedSkills.includes('direct-out')) {
                success = placeGoodsInZone(itemGrid, terrainGrid, OUT_ZONE, shipment.productId, shipment.boxCount)
            }

            // ❌ 如果出库区满或没启用技能，再放入入库区
            if (!success) {
                success = placeGoodsInZone(itemGrid, terrainGrid, inZoneType, shipment.productId, shipment.boxCount)
            }

            if (!success) {
                alert('入库失败，空间不足')
            }
        } else {
            remaining.push(shipment)
        }
    }

    gameState.incomingShipments = remaining
}

export function placeGoodsInZone(itemGrid, terrainGrid, zoneType, productId, quantity) {
    const product = products.find(p => p.id === productId)
    if (!product) return false

    let placed = 0
    for (let y = 0; y < itemGrid.length; y++) {
        for (let x = 0; x < itemGrid[0].length; x++) {
            if (placed >= quantity) return true

            const terrain = terrainGrid[y][x]
            const item = itemGrid[y][x]

            // ✅ 只放在指定 zone 上的空格子
            if (terrain === zoneType && item === null) {
                itemGrid[y][x] = {
                    type: 'goods',
                    productId,
                    count: product.boxSize,  // 一箱
                }
                placed++
            }
        }
    }

    return placed === quantity
}

export function countInZoneFree(itemGrid, terrainGrid, zoneType) {
    let count = 0
    for (let y = 0; y < itemGrid.length; y++) {
        for (let x = 0; x < itemGrid[0].length; x++) {
            if (
                terrainGrid[y][x] === zoneType &&
                itemGrid[y][x] === null
            ) {
                count++
            }
        }
    }
    return count
}
