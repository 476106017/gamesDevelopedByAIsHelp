
import { products } from '../data/products'
import { gameState,levelState } from '../data/gameState'

export const SHELF = 1
export const PATH = 0
export const IN_ZONE = 2
export const OUT_ZONE = 3

export function fillInitialGoods(itemGrid, terrainGrid) {
    const unlockedProducts = products.slice(0, levelState.level + 2)

    for (let y = 0; y < terrainGrid.length; y++) {
        for (let x = 0; x < terrainGrid[0].length; x++) {
            if (terrainGrid[y][x] === 1 && Math.random() < 0.05) { // 5%概率放货
                const product = unlockedProducts[Math.floor(Math.random() * unlockedProducts.length)]
                itemGrid[y][x] = {
                    type: 'goods',
                    productId: product.id,
                    count: Math.floor(product.boxSize * (Math.random() * 0.5 + 0.5)), // 50%~100% 一箱
                }
            }
        }
    }
}

export function initTerrainGrid(rows, cols) {
    const terrainGrid  = Array.from({ length: rows }, () => Array(cols).fill(PATH))
    // 左右两侧：多个 2×10 的货架堆叠，每组间隔1行
    const shelfGroups = 4 // 总共3组上下堆叠
    const shelfHeight = 2
    const shelfWidth = 10
    const shelfGapY = 1
    const shelfStartY = 4

    for (let g = 0; g < shelfGroups; g++) {
        const yStart = shelfStartY + g * (shelfHeight + shelfGapY)

        // 左侧
        for (let y = yStart; y < yStart + shelfHeight; y++) {
            for (let x = 1; x <= 10; x++) {
                terrainGrid [y][x] = SHELF
            }
        }

        // mid
        for (let y = yStart; y < yStart + shelfHeight; y++) {
            for (let x = 15; x <= 24; x++) {
                terrainGrid [y][x] = SHELF
            }
        }

        // 右侧
        for (let y = yStart; y < yStart + shelfHeight; y++) {
            for (let x = cols - 11; x <= cols - 2; x++) {
                terrainGrid [y][x] = SHELF
            }
        }

        // 入库区（上方中间）
        for (let x = 18; x <= 21; x++) terrainGrid[0][x] = IN_ZONE
        // 出库区（下方中间）
        for (let x = 18; x <= 21; x++) terrainGrid[rows - 1][x] = OUT_ZONE
    }


    return terrainGrid
}
