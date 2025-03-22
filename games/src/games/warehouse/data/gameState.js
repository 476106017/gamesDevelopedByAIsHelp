import { reactive } from 'vue'

export const gameState = reactive({
    money: 2000,
    carryingCapacity: 50,
    incomingShipments: [],
    workerSpeed: 3,
})

export const levelState = reactive({
    level: 1,
    exp: 0,
})
