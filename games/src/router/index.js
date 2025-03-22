import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '../views/HomeView.vue'
import GameSelectView from '../views/GameSelectView.vue'
import NotFoundView from '../views/NotFoundView.vue'

// 游戏模块懒加载（按需加载）
const GameWrapperView = () => import('../views/GameWrapperView.vue')

const routes = [
    {
        path: '/',
        name: 'home',
        component: HomeView,
    },
    {
        path: '/games',
        name: 'gameSelect',
        component: GameSelectView,
    },
    {
        path: '/game/:name',
        name: 'game',
        component: GameWrapperView,
        props: true,
    },
    {
        path: '/:pathMatch(.*)*',
        name: 'notFound',
        component: NotFoundView,
    },
]

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
})

export default router
