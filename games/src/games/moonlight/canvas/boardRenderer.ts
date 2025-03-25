import { drawHex } from './hexUtils'

export const drawHexGrid = (
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    radius = 40,
    visibleSet?: Set<string>
) => {
    const cols = 8
    const rows = 6
    const w = radius * 2 * Math.cos(Math.PI / 6)
    const h = radius * 1.5

    ctx.clearRect(0, 0, canvasWidth, canvasHeight)

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const q = col - Math.floor(row / 2)
            const r = row
            const key = `${q},${r}`

            const x = col * w + (row % 2 === 1 ? w / 2 : 0) + 50
            const y = row * h + 50

            if (visibleSet?.has(key)) {
                ctx.strokeStyle = '#000'
                drawHex(ctx, x, y, radius)
            } else {
                ctx.fillStyle = '#ccc'
                drawHex(ctx, x, y, radius)
                ctx.fill()
            }

        }
    }
}


export const drawUnits = (ctx: CanvasRenderingContext2D, units: any[], radius: number,
                          visibleSet?: Set<string>) => {
    ctx.font = '12px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    const typeIcons = { minion: '💠', hero: '👑', spell: '✨', weapon: '🗡' }
    for (const unit of units) {
        const { q, r, type, name, atk, hp } = unit
        const key = `${q},${r}`
        const isVisible = visibleSet?.has(key)

        const w = radius * 2 * Math.cos(Math.PI / 6)
        const h = radius * 1.5
        const x = q * w + (r % 2 === 1 ? w / 2 : 0) + 50
        const y = r * h + 50

        ctx.font = '12px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillStyle = isVisible ? '#000' : '#666'

        // 类型+名字
        ctx.fillText(`${typeIcons[type] || '❓'} ${name}`, x, y - radius + 24)

        // 属性
        if (type !== 'hero') {
            ctx.fillText(`⚔${atk}  ❤${hp}`, x, y + radius - 24)
        } else {
            ctx.fillText(`❤${hp}`, x, y + radius - 24)
        }
    }

}
