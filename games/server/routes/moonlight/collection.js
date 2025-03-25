const express = require('express')
const router = express.Router()
const controller = require('../../controllers/moonlight/collectionController')

router.get('/:userId', controller.getUserCollection)
router.post('/add', controller.addToCollection)

module.exports = {
    basePath: '/moonlight/collection',
    router
}
