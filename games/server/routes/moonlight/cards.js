const express = require('express');
const router = express.Router();
const { getAllCards } = require('../../controllers/moonlight/cardsController');

router.get('/', getAllCards);

module.exports = {
    basePath: '/moonlight/cards',
    router
};
