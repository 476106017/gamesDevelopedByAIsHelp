const express = require('express');
const router = express.Router();
const { getDecksByUser, saveDeck } = require('../../controllers/moonlight/decksController');

router.get('/:userId', getDecksByUser);   // 例: /moonlight/decks/1
router.post('/', saveDeck);               // デッキの新規保存 or 更新

module.exports = {
    basePath: '/moonlight/decks',
    router
};
