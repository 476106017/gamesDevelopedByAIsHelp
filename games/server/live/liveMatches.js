const liveMatches = new Map()

// 初期化
function createMatch(matchId, playerAId, playerBId) {
    liveMatches.set(matchId, {
        turn: 1,
        players: {
            A: playerAId,
            B: playerBId
        },
        currentTurn: playerAId,
        units: [], // ユニット配置
        mana: {
            [playerAId]: 10,
            [playerBId]: 10
        }
    })
}

// 取得
function getMatch(matchId) {
    return liveMatches.get(matchId)
}

// ターン交代
function endTurn(matchId) {
    const match = liveMatches.get(matchId)
    if (!match) return

    const { A, B } = match.players
    match.turn++
    match.currentTurn = match.currentTurn === A ? B : A

    return match.currentTurn
}

// 削除（終了時）
function deleteMatch(matchId) {
    liveMatches.delete(matchId)
}

module.exports = {
    createMatch,
    getMatch,
    endTurn,
    deleteMatch
}
