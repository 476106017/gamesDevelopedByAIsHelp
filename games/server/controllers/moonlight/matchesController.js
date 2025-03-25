const { createMatchRecord, joinMatchRecord } = require('../../models/moonlight/matchDao')
const { v4: uuidv4 } = require('uuid')
const liveMatches = require('../../live/liveMatches')
const pendingMatches = new Map() // matchId -> playerAId

// マッチ作成（A）
function createPendingMatch(req, res) {
    const { userId } = req.body

    const matchId = uuidv4()
    pendingMatches.set(matchId, userId)

    res.json({ matchId, status: 'waiting' })
}

async function createMatch(req, res) {
    const { matchId, playerAId, playerBId } = req.body

    // すでに存在するならスキップ（またはエラーにしてもOK）
    if (liveMatches.getMatch(matchId)) {
        return res.status(400).json({ error: 'このマッチはすでに存在します' })
    }

    const result = await createMatchRecord(userId)
    res.status(201).json(result)
}

async function joinMatch(req, res) {
    const { userId, matchId } = req.body
    const result = await joinMatchRecord(matchId, userId)
    res.json(result)
}

module.exports = {
    createMatch,
    joinMatch
}
