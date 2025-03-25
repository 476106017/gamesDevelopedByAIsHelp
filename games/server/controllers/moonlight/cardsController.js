const { getAllCards } = require('../../models/moonlight/cardDao')

async function getAllCardsHandler(req, res) {
    try {
        const cards = await getAllCards()
        res.json(cards)
    } catch (e) {
        res.status(500).json({ error: e.message })
    }
}

module.exports = {
    getAllCards: getAllCardsHandler
}
