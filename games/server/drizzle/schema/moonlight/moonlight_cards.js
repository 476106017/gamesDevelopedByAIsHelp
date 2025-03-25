const { sqliteTable, text, integer } = require('drizzle-orm/sqlite-core')

/**
 * moonlight_cards テーブル（Moonlight専用カード定義）
 *
 * type（カードタイプ）:
 * - minion: 随従カード 💠
 * - spell: スペルカード ✨
 * - weapon: 装備カード 🗡
 * - hero: ヒーローカード（王牌）👑 ※スキルカードと関連あり
 */
const moonlightCards = sqliteTable('moonlight_cards', {
  id: integer('id').primaryKey({ autoIncrement: true }),

  name: text('name').notNull(),              // カード名
  type: text('type').notNull(),              // カードタイプ
  cost: integer('cost').notNull(),           // マナコスト

  atk: integer('atk'),                       // 攻撃力（minion/weapon用）
  range: integer('range'),                // 射程距離（移動・攻撃距離）
  hp: integer('hp'),                         // 体力（minion/weapon/hero用）

  effectType: text('effect_type'),           // 効果タイプ（例：damage, heal, buff）
  effectValue: integer('effect_value'),      // 効果値
  effectTarget: text('effect_target'),       // 効果対象（self, enemy, all, etc）
  effectRange: integer('effect_range'),   // 効果範囲（スペルや装備の影響範囲）


  relatedCardId: integer('related_card_id'), // ヒーローカードの場合、対応するスキルカードID

  isLegendary: integer('is_legendary', { mode: 'boolean' }).default(false), // レジェンドカードか

  description: text('description')           // 説明・フレーバーテキスト
})

module.exports = { moonlightCards }
