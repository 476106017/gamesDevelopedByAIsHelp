const { getDecksByUserId, createDeckForUser } = require('../../models/moonlight/deckDao')

async function getDecksByUser(req, res) {
    const userId = parseInt(req.params.userId)
    const decks = await getDecksByUserId(userId)
    res.json(decks)
}

async function saveDeck(req, res) {
    const { userId, name } = req.body
    const result = await createDeckForUser(userId, name)
    res.status(201).json(result)
}

module.exports = {
    getDecksByUser,
    saveDeck
}
