import { products } from '../data/products'

export function drawGrid(ctx, terrainGrid, itemGrid, view, tileSize, rows, cols, canvasWidth, canvasHeight) {
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const screenX = (x - view.x) * tileSize
            const screenY = (y - view.y) * tileSize
            if (screenX + tileSize < 0 || screenX > canvasWidth || screenY + tileSize < 0 || screenY > canvasHeight) continue

            const terrain = terrainGrid[y][x]
            const item = itemGrid[y][x]

            // 背景绘制（地形层）
            switch (terrain) {
                case 1: ctx.fillStyle = '#888'; break // SHELF
                case 2: ctx.fillStyle = '#aaf'; break // IN_ZONE
                case 3: ctx.fillStyle = '#afa'; break // OUT_ZONE
                default: ctx.fillStyle = '#f0f0f0'; break // PATH
            }
            ctx.fillRect(screenX, screenY, tileSize, tileSize)
            ctx.strokeStyle = '#ccc'
            ctx.strokeRect(screenX, screenY, tileSize, tileSize)

            // 物品绘制（emoji + 数量）
            if (item?.type === 'goods') {
                const p = products.find(p => p.id === item.productId)
                if (p) {
                    ctx.font = `${tileSize * 0.6}px serif`
                    ctx.textAlign = 'center'
                    ctx.textBaseline = 'middle'
                    ctx.fillText(p.emoji, screenX + tileSize * 0.5, screenY + tileSize * 0.5)

                    ctx.font = '12px sans-serif'
                    ctx.textAlign = 'right'
                    ctx.textBaseline = 'bottom'
                    ctx.fillStyle = '#fff'
                    ctx.fillRect(screenX + tileSize - 28, screenY + tileSize - 18, 26, 16)
                    ctx.fillStyle = '#000'
                    ctx.fillText(`×${item.count}`, screenX + tileSize - 4, screenY + tileSize - 4)
// ➕ 绘制增长动画
                    if (item.growthAnim) {
                        const elapsed = Date.now() - item.growthAnim.start
                        const duration = 800 // 动画时长 ms

                        if (elapsed < duration) {
                            const progress = elapsed / duration
                            const floatY = 20 * progress // 向上浮动
                            const alpha = 1 - progress   // 渐隐
                            const scale = 1 + progress   // 放大一点

                            ctx.save()
                            ctx.globalAlpha = alpha
                            ctx.font = `${12 * scale}px sans-serif`
                            ctx.fillStyle = 'darkgreen' // ← 深绿色
                            ctx.textAlign = 'right'
                            ctx.fillText('+1', screenX + tileSize - 4, screenY + 12 - floatY)
                            ctx.restore()
                        } else {
                            delete item.growthAnim // 动画结束后移除
                        }
                    }


                }
            }
        }
    }
}
