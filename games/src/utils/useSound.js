export function playBeep(frequency = 440, duration = 200, volume = 0.1) {
    const context = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = context.createOscillator()
    const gainNode = context.createGain()

    oscillator.frequency.value = frequency
    oscillator.type = 'square'

    gainNode.gain.value = volume // 声音大小，范围 0.0 ~ 1.0（默认 1）

    oscillator.connect(gainNode)
    gainNode.connect(context.destination)

    oscillator.start()
    setTimeout(() => {
        oscillator.stop()
        context.close()
    }, duration)
}
