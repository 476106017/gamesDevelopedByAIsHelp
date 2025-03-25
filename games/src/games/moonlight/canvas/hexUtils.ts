export const drawHex = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) => {
    ctx.beginPath()
    for (let i = 0; i < 6; i++) {
        const angle = Math.PI / 3 * i - Math.PI / 6 // 旋转角度修正（使平边朝上）
        const px = x + radius * Math.cos(angle)
        const py = y + radius * Math.sin(angle)
        ctx.lineTo(px, py)
    }
    ctx.closePath()
    ctx.stroke()
}


export function getHexAt(x: number, y: number, radius: number): { q: number; r: number } | null {
    const originX = 50
    const originY = 50
    const w = radius * 2 * Math.cos(Math.PI / 6)
    const h = radius * 1.5

    let closest = null
    let minDist = Infinity

    // 枚举 r: [-10, +10]，q: [-10, +10]
    for (let r = -10; r <= 10; r++) {
        for (let q = -10; q <= 10; q++) {
            const cx = q * w + (r % 2 === 1 ? w / 2 : 0) + originX
            const cy = r * h + originY
            const dx = x - cx
            const dy = y - cy
            const dist = dx * dx + dy * dy
            if (dist < minDist) {
                minDist = dist
                closest = { q, r }
            }
        }
    }

    // 可选：如果 minDist 太大，说明点击落在空白区域
    if (minDist > radius * radius) return null

    return closest
}

export function getVisibleCoords(units: { q: number, r: number }[], radius = 2): Set<string> {
    const result = new Set<string>()

    for (const { q, r } of units) {
        for (let dq = -radius; dq <= radius; dq++) {
            for (let dr = Math.max(-radius, -dq - radius); dr <= Math.min(radius, -dq + radius); dr++) {
                const q2 = q + dq
                const r2 = r + dr
                result.add(`${q2},${r2}`)
            }
        }
    }
    return result
}
