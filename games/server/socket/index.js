const liveMatches = require('../live/liveMatches')

module.exports = function(io) {
    io.on('connection', (socket) => {
        console.log('🟢 Connected:', socket.id)

        socket.on('joinMatch', ({ matchId, userId }) => {
            socket.join(`match-${matchId}`)
            console.log(`👤 User ${userId} joined match-${matchId}`)
        })

        socket.on('endTurn', ({ matchId }) => {
            const nextPlayer = liveMatches.endTurn(matchId)
            if (nextPlayer) {
                io.to(`match-${matchId}`).emit('turnChanged', {
                    matchId,
                    currentPlayer: nextPlayer
                })
                console.log(`🔁 Match ${matchId} turn changed to ${nextPlayer}`)
            }
        })

        socket.on('disconnect', () => {
            console.log('🔌 Disconnected:', socket.id)
        })
    })
}
