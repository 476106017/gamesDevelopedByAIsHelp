import { defineStore } from 'pinia'

export const useGameStore = defineStore('game', {
    state: () => ({
        mana: 20,
        hand: [
            { type: 'minion', name: '战士', cost: 2, atk: 3, hp: 2 },
            { type: 'minion', name: '巨人', cost: 12, atk: 12, hp: 12 },
            { type: 'minion', name: '小兵', cost: 1, atk: 1, hp: 1 }
        ],
        units: [] as { q: number, r: number, type: string, name: string, atk: number, hp: number }[],
        hero: { q: 3, r: 3, type: 'hero', name: '王牌', atk: 0, hp: 30 }
    }),
    actions: {
        playCard(index: number) {
            const card = this.hand[index]
            if (card.cost <= this.mana) {
                this.mana -= card.cost
                this.hand.splice(index, 1)
            }
        },
        placeUnit(q: number, r: number, card: { type: string, name: string, atk: number, hp: number }) {
            this.units.push({ q, r, type: card.type, name: card.name, atk: card.atk, hp: card.hp })
        }
    }
})
