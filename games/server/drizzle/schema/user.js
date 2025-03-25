const { sqliteTable, text, integer } = require('drizzle-orm/sqlite-core')

const users = sqliteTable('users', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    username: text('username').notNull().unique(),
    password: text('password').notNull(), // 已加密
    nickname: text('nickname'),
    avatar: text('avatar'), // 可选：头像 URL
    lastLogin: integer('last_login', { mode: 'timestamp' }),
})

module.exports = { users }
