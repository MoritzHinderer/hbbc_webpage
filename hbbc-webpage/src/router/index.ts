import { createRouter, createWebHistory, type Router, type RouteRecordRaw } from "vue-router"

import Home from "../views/Home.vue"
import Downloads from "../views/Downloads.vue"
import Members from "../views/Members.vue"

const routes:RouteRecordRaw[] = [
    {
        path: "/",
        name: "home",
        component: Home
    },
    {
        path: "/downloads",
        name: "downloads",
        component: Downloads
    },
    {
        path: "/members",
        name: "members",
        component: Members
    },
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

export default router