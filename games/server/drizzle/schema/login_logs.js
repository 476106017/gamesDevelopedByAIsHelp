const { sqliteTable, integer, text } = require('drizzle-orm/sqlite-core')

const loginLogs = sqliteTable('login_logs', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id').notNull(),
    ip: text('ip'),
})

module.exports = { loginLogs }
