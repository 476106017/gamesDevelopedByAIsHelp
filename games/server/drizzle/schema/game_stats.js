const { sqliteTable, integer, text } = require('drizzle-orm/sqlite-core')

const gameStats = sqliteTable('game_stats', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id').notNull(),       // 用户 ID
    game: text('game').notNull(),               // 如 'moonlight'、'snake'
    wins: integer('wins').default(0),
    losses: integer('losses').default(0),
    score: integer('score').default(0),         // 适用于积分类游戏
    lastPlayed: integer('last_played', { mode: 'timestamp' })
})

module.exports = { gameStats }
