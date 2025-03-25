const db = require('../../drizzle/db')
const { moonlightCards } = require('../../drizzle/schema/moonlight/moonlight_cards')
const { eq } = require('drizzle-orm')

async function getAllCards() {
    return await db.select().from(moonlightCards)
}

async function getCardById(cardId) {
    const results = await db
        .select()
        .from(moonlightCards)
        .where(eq(moonlightCards.id, cardId))
    return results[0]
}

module.exports = {
    getAllCards,
    getCardById
}
