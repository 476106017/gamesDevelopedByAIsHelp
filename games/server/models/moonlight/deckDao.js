const db = require('../../drizzle/db')
const { moonlightDecks } = require('../../drizzle/schema/moonlight/moonlight_decks')
const { eq } = require('drizzle-orm')

function getDecksByUserId(userId) {
    return db.select().from(moonlightDecks).where(eq(moonlightDecks.userId, userId))
}

function createDeckForUser(userId, name) {
    return db
        .insert(moonlightDecks)
        .values({ userId, name, createdAt: Math.floor(Date.now() / 1000) })
        .returning()
}

module.exports = {
    getDecksByUserId,
    createDeckForUser
}
