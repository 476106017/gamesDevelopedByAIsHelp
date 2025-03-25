const { sqliteTable, integer } = require('drizzle-orm/sqlite-core')

/**
 * 各ユーザーが所持する Moonlight カード（コレクション）
 */
const moonlight_card_collections = sqliteTable('moonlight_card_collections', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id').notNull(),
    cardId: integer('card_id').notNull(),
    count: integer('count').default(1)
})

module.exports = { moonlight_card_collections }
