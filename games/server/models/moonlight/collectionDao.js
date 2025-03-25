const db = require('../../drizzle/db')
const { moonlight_card_collections } = require('../../drizzle/schema/moonlight/moonlight_card_collections')

async function getCollectionByUser(userId) {
    return await db.select().from(moonlight_card_collections).where(moonlight_card_collections.userId.eq(userId))
}

async function addCardToCollection(userId, cardId, quantity = 1) {
    return await db.insert(moonlight_card_collections).values({ userId, cardId, quantity })
}

module.exports = {
    getCollectionByUser,
    addCardToCollection
}
