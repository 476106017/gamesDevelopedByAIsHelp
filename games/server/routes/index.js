const express = require('express')
const router = express.Router()

const modules = [
    require('./users'),
    require('./moonlight/cards'),
    require('./moonlight/decks'),
    require('./moonlight/matches')
]

for (const mod of modules) {
    router.use(mod.basePath || '/', mod.router)
}

module.exports = router
