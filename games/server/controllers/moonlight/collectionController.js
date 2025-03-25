const {
    getCollectionByUser,
    addCardToCollection
} = require('../../models/moonlight/collectionDao')

/**
 * ユーザーのカードコレクションを取得
 */
async function getUserCollection(req, res) {
    const userId = parseInt(req.params.userId)
    try {
        const result = await getCollectionByUser(userId)
        res.json(result)
    } catch (e) {
        res.status(500).json({ error: e.message })
    }
}

/**
 * カードをコレクションに追加（デバッグ用）
 */
async function addToCollection(req, res) {
    const { userId, cardId, quantity } = req.body
    try {
        const result = await addCardToCollection(userId, cardId, quantity)
        res.status(201).json(result)
    } catch (e) {
        res.status(500).json({ error: e.message })
    }
}

module.exports = {
    getUserCollection,
    addToCollection
}
