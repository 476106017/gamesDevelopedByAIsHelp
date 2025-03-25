const db = require('../../drizzle/db')
const { moonlightMatches } = require('../../drizzle/schema/moonlight/moonlight_matches')
const { eq } = require('drizzle-orm')

function createMatchRecord(userId) {
    return db.insert(moonlightMatches).values({
        sideAPlayerId: userId,
        startedAt: Math.floor(Date.now() / 1000),
        createdAt: Math.floor(Date.now() / 1000)
    }).returning()
}

function joinMatchRecord(matchId, userId) {
    return db.update(moonlightMatches)
        .set({ sideBPlayerId: userId, startedAt: Math.floor(Date.now() / 1000) })
        .where(eq(moonlightMatches.id, matchId))
        .returning()
}

module.exports = {
    createMatchRecord,
    joinMatchRecord
}
