const { sqliteTable, integer, text } = require('drizzle-orm/sqlite-core')

/**
 * Moonlight の対戦履歴（基本情報＋リプレイ保存）
 */
const moonlightMatches = sqliteTable('moonlight_matches', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    sideAPlayerId: integer('side_a_player_id').notNull(),
    sideBPlayerId: integer('side_b_player_id').notNull(),
    winnerId: integer('winner_id'),
    seed: text('seed'),
    replayContent: text('replay_content'),
    startedAt: integer('started_at', { mode: 'timestamp' }),
    endedAt: integer('ended_at', { mode: 'timestamp' }),
})

module.exports = { moonlightMatches }
