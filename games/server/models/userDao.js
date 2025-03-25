const db = require('../drizzle/db')
const { users } = require('../drizzle/schema/user')
const { eq } = require('drizzle-orm')

async function findUserByUsername(username) {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1)
    return result[0] || null
}

async function createUser(username, password) {
    const result = await db.insert(users).values({ username, password }).returning({ id: users.id })
    return result[0]?.id
}

module.exports = {
    findUserByUsername,
    createUser
}
