import { createRouter, createWebHashHistory } from 'vue-router'

import HomeView from '../views/HomeView.vue'
import GameSelectView from '../views/GameSelectView.vue'
import NotFoundView from '../views/NotFoundView.vue'
import LoginView from '../views/LoginView.vue'

// 游戏模块懒加载（按需加载）
const GameWrapperView = () => import('../views/GameWrapperView.vue')

const routes = [
    {
        path: '/',
        name: 'home',
        component: HomeView,
    },
    { path: '/login', name: 'login', component: LoginView },
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
    history: createWebHashHistory(import.meta.env.BASE_URL),
    routes,
})

export default router
