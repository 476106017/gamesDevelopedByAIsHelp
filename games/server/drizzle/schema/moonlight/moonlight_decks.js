const { sqliteTable, text, integer } = require('drizzle-orm/sqlite-core')

/**
 * ユーザーが作成したデッキ（名前＋所有者）
 */
const moonlightDecks = sqliteTable('moonlight_decks', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id').notNull(),
    name: text('name').notNull(),
})

module.exports = { moonlightDecks }
