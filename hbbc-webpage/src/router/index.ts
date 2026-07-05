import { createRouter, createWebHistory, type Router, type RouteRecordRaw } from "vue-router"
import { checkAuth, currentUser } from "../auth"

const routes: RouteRecordRaw[] = [
    {
        path: "/",
        name: "home",
        component: () => import("../views/Home.vue"),
    },
    {
        path: "/downloads",
        name: "downloads",
        component: () => import("../views/Downloads.vue"),
    },
    {
        path: "/members",
        name: "members",
        component: () => import("../views/Members.vue"),
    },
    {
        path: "/events",
        name: "events",
        component: () => import("../views/Events.vue"),
        meta: { requiresAuth: true },
    },
    {
        path: "/gallery",
        name: "gallery",
        component: () => import("../views/Gallery.vue"),
        meta: { requiresAuth: true },
    },
    {
        path: "/contact",
        name: "contact",
        component: () => import("../views/Contact.vue"),
    },
    {
        path: "/login",
        name: "login",
        component: () => import("../views/Login.vue"),
    },
    {
        path: "/register",
        name: "register",
        component: () => import("../views/Register.vue"),
    },
    {
        path: "/profile",
        name: "profile",
        component: () => import("../views/Profile.vue"),
        meta: { requiresAuth: true },
    },
    {
        path: "/admin",
        name: "admin",
        component: () => import("../views/Admin.vue"),
        meta: { requiresAdmin: true },
    },
    {
        path: "/:pathMatch(.*)*",
        name: "not-found",
        component: () => import("../views/NotFound.vue"),
    },
]

const router: Router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior() {
        return { top: 0 }
    },
})

// Awaits the (cached) auth check before deciding, so a page refresh on a
// protected route doesn't flash-redirect before we know whether the
// session cookie is actually valid.
router.beforeEach(async (to) => {
    await checkAuth()

    if (to.meta.requiresAdmin) {
        if (!currentUser.value) return { path: "/login", query: { redirect: to.fullPath } }
        if (currentUser.value.role !== "admin") return { path: "/" }
        return true
    }

    if (to.meta.requiresAuth && !currentUser.value) {
        return { path: "/login", query: { redirect: to.fullPath } }
    }

    return true
})

export default router
