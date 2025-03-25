const { createUser, findUserByUsername } = require('../models/userDao')
const { hashPassword, comparePassword } = require('../utils/hash')

async function register(req, res) {
    const { username, password } = req.body
    if (!username || !password) return res.sendStatus(400)

    try {
        const existing = await findUserByUsername(username)
        if (existing) return res.status(409).json({ error: '用户已存在' })

        const hashed = await hashPassword(password)
        const id = await createUser(username, hashed)
        res.status(201).json({ id })
    } catch (e) {
        res.status(500).json({ error: e.message })
    }
}

async function login(req, res) {
    const { username, password } = req.body
    if (!username || !password) return res.sendStatus(400)

    const user = await findUserByUsername(username)
    if (!user) return res.sendStatus(404)

    const match = await comparePassword(password, user.password)
    if (!match) return res.sendStatus(401)

    // 不返回 password
    const { password: _, ...userSafe } = user
    res.status(200).json({ user: userSafe })
}

module.exports = { register, login }
