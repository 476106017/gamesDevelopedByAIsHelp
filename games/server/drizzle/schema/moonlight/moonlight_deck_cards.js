const { sqliteTable, integer } = require('drizzle-orm/sqlite-core')

/**
 * デッキ内の各カードと枚数
 */
const moonlight_deck_cards = sqliteTable('moonlight_deck_cards', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    deckId: integer('deck_id').notNull(),
    cardId: integer('card_id').notNull(),
    count: integer('count').default(1)
})

module.exports = { moonlight_deck_cards }
