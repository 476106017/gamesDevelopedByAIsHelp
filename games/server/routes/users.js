const express = require('express')
const router = express.Router()

const userController = require('../controllers/usersController')

// 認証系 API
router.post('/register', userController.register)
router.post('/login', userController.login)

module.exports = {
    basePath: '/users',
    router
}
