<template>
    <!-- Main navbar container with disclosure for mobile menu state -->
    <Disclosure as="nav"
        class="relative z-50 bg-gradient-to-r from-gray-900 to-red-950 backdrop-blur-md border-b border-red-500/20"
        v-slot="{ open }">
        <!-- Navbar content wrapper with max width and padding -->
        <div class="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
            <!-- Navbar main row: logo, nav links, and right-side buttons -->
            <div class="relative flex h-20 items-center justify-between">
                <!-- Mobile hamburger menu button (hidden on desktop) -->
                <div class="absolute inset-y-0 left-0 flex items-center sm:hidden">
                    <!-- Toggle button for mobile menu -->
                    <DisclosureButton
                        class="relative inline-flex items-center justify-center rounded-md p-2 text-gray-300 hover:text-white hover:bg-white/10 focus:outline-2 focus:-outline-offset-1 focus:outline-red-500 transition-colors duration-200">
                        <span class="absolute -inset-0.5"></span>
                        <span class="sr-only">Open main menu</span>
                        <Bars3Icon v-if="!open" class="block size-6" aria-hidden="true" />
                        <XMarkIcon v-else class="block size-6" aria-hidden="true" />
                    </DisclosureButton>
                </div>
                <!-- Logo and desktop navigation section -->
                <div class="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
                    <!-- Logo image -->
                    <div class="flex shrink-0 items-center">
                        <img class="h-20 w-auto" src="../assets/hbbc_logo.webp" alt="HBBC Logo" />
                    </div>
                    <!-- Desktop navigation links (hidden on mobile, visible on tablet+) -->
                    <div class="hidden sm:ml-6 sm:flex sm:items-center">
                        <div class="flex space-x-1 h-full items-center">
                            <router-link v-for="item in publicNavigation" :key="item.name" :to="item.href"
                                :class="[item.current ? 'text-white border-b-2 border-red-500 font-semibold' : 'text-gray-300 hover:text-white border-b-2 border-transparent', 'px-4 py-2 text-sm font-medium transition-all duration-300 hover:bg-gradient-to-b hover:from-red-500/10 hover:to-transparent rounded-t-md hover:scale-[1.03] relative']"
                                :aria-current="item.current ? 'page' : undefined">{{ item.name }}</router-link>
                        </div>

                        <!-- Divider between public pages and the members-only area -->
                        <div class="h-6 w-px bg-red-500/20 mx-3" aria-hidden="true"></div>

                        <div class="flex space-x-1 h-full items-center">
                            <router-link v-for="item in memberNavigation" :key="item.name" :to="item.href"
                                :class="[item.current ? 'text-white border-b-2 border-red-500 font-semibold' : 'text-gray-300 hover:text-white border-b-2 border-transparent', 'px-4 py-2 text-sm font-medium transition-all duration-300 hover:bg-gradient-to-b hover:from-red-500/10 hover:to-transparent rounded-t-md hover:scale-[1.03] relative inline-flex items-center gap-1.5']"
                                :aria-current="item.current ? 'page' : undefined">
                                <LockOpenIcon v-if="currentUser" class="size-3.5 opacity-70" aria-hidden="true" />
                                <LockClosedIcon v-else class="size-3.5 opacity-70" aria-hidden="true" />{{ item.name }}</router-link>
                        </div>
                    </div>
                </div>
                <!-- Auth controls (desktop only) -->
                <div class="hidden sm:flex items-center gap-3">
                    <template v-if="currentUser">
                        <router-link to="/profile" class="text-sm text-gray-400 hover:text-white transition-colors" title="Mein Profil">
                            Hallo, {{ currentUser.name }}
                        </router-link>
                        <span :class="['text-xs font-semibold px-2 py-0.5 rounded-full', currentUser.role === 'admin' ? 'bg-red-700/40 text-red-300' : 'bg-gray-700/60 text-gray-300']">
                            {{ currentUser.role === 'admin' ? 'Admin' : 'Mitglied' }}
                        </span>
                        <router-link v-if="currentUser.role === 'admin'" to="/admin"
                            class="inline-flex items-center gap-1.5 text-sm bg-red-700 hover:bg-red-600 text-white font-medium rounded-md px-3 py-1.5 shadow-sm transition-colors">
                            <Cog6ToothIcon class="size-4" aria-hidden="true" />
                            Admin-Bereich
                        </router-link>
                        <button type="button" @click="handleLogout"
                            class="text-sm text-gray-300 hover:text-white border border-gray-600 hover:border-red-500 rounded-md px-3 py-1.5 transition-colors">Logout</button>
                    </template>
                    <template v-else>
                        <router-link to="/login" class="text-sm text-gray-300 hover:text-white transition-colors">Anmelden</router-link>
                        <router-link to="/register"
                            class="text-sm bg-red-700 hover:bg-red-600 text-white rounded-md px-3 py-1.5 transition-colors">Konto beantragen</router-link>
                    </template>
                </div>
            </div>
        </div>

        <!-- Mobile menu panel (visible only on small screens) -->
        <DisclosurePanel class="sm:hidden bg-gradient-to-r from-gray-900/95 to-red-950/95 backdrop-blur-md border-b border-red-500/20">
            <!-- Mobile navigation links (stacked vertically) -->
            <div class="space-y-1 px-2 pt-2 pb-3">
                <DisclosureButton v-for="item in publicNavigation" :key="item.name" as="router-link" :to="item.href"
                    :class="[item.current ? 'bg-red-500/20 text-white font-semibold' : 'text-gray-300 hover:bg-white/10 hover:text-white', 'block rounded-md px-3 py-2 text-base font-medium transition-all duration-200']"
                    :aria-current="item.current ? 'page' : undefined">{{ item.name }}</DisclosureButton>

                <div class="border-t border-red-500/20 mt-1 pt-1">
                    <p class="px-3 pt-1 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Mitgliederbereich</p>
                    <DisclosureButton v-for="item in memberNavigation" :key="item.name" as="router-link" :to="item.href"
                        :class="[item.current ? 'bg-red-500/20 text-white font-semibold' : 'text-gray-300 hover:bg-white/10 hover:text-white', 'flex items-center gap-1.5 rounded-md px-3 py-2 text-base font-medium transition-all duration-200']"
                        :aria-current="item.current ? 'page' : undefined">
                        <LockOpenIcon v-if="currentUser" class="size-3.5 opacity-70" aria-hidden="true" />
                        <LockClosedIcon v-else class="size-3.5 opacity-70" aria-hidden="true" />{{ item.name }}</DisclosureButton>
                </div>

                <div class="border-t border-red-500/20 mt-1 pt-1">
                    <template v-if="currentUser">
                        <div class="flex items-center gap-2 px-3 py-2">
                            <span class="text-gray-300 text-sm">{{ currentUser.name }}</span>
                            <span :class="['text-xs font-semibold px-2 py-0.5 rounded-full', currentUser.role === 'admin' ? 'bg-red-700/40 text-red-300' : 'bg-gray-700/60 text-gray-300']">
                                {{ currentUser.role === 'admin' ? 'Admin' : 'Mitglied' }}
                            </span>
                        </div>
                        <DisclosureButton as="router-link" to="/profile"
                            class="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-white/10 hover:text-white transition-all duration-200">Mein Profil</DisclosureButton>
                        <DisclosureButton v-if="currentUser.role === 'admin'" as="router-link" to="/admin"
                            class="flex items-center gap-1.5 w-full rounded-md px-3 py-2 mb-1 text-base font-medium bg-red-700 hover:bg-red-600 text-white transition-all duration-200">
                            <Cog6ToothIcon class="size-4" aria-hidden="true" />
                            Admin-Bereich
                        </DisclosureButton>
                        <DisclosureButton as="button"
                            class="block w-full text-left rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-white/10 hover:text-white transition-all duration-200"
                            @click="handleLogout">Logout</DisclosureButton>
                    </template>
                    <template v-else>
                        <DisclosureButton as="router-link" to="/login"
                            class="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-white/10 hover:text-white transition-all duration-200">Anmelden</DisclosureButton>
                        <DisclosureButton as="router-link" to="/register"
                            class="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-white/10 hover:text-white transition-all duration-200">Konto beantragen</DisclosureButton>
                    </template>
                </div>
            </div>
        </DisclosurePanel>
    </Disclosure>
</template>

<script setup lang="ts">
// Import UI components from Headless UI
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue'
// Import icons from Heroicons
import { Bars3Icon, XMarkIcon, LockClosedIcon, LockOpenIcon, Cog6ToothIcon } from '@heroicons/vue/24/outline'
// Import router to detect current route
import { useRoute, useRouter } from 'vue-router'
import { computed } from 'vue'
import { currentUser, logout } from '../auth'

// Get current route
const route = useRoute()
const router = useRouter()

const handleLogout = async () => {
    await logout()
    router.push('/')
}

// Navigation menu items - links are automatically highlighted based on current route.
// Split into public pages and the members-only area (Termine/Galerie require
// login), so the navbar can visually separate the two groups.
const publicNavigationBase = [
    { name: 'Home', href: '/' },
    { name: 'Mitglieder', href: '/members' },
    { name: 'Downloads', href: '/downloads' },
    { name: 'Kontakt', href: '/contact' },
]

const memberNavigationBase = [
    { name: 'Termine', href: '/events' },
    { name: 'Galerie', href: '/gallery' },
]

const withCurrent = (items: typeof publicNavigationBase) =>
    items.map(item => ({
        ...item,
        current: route.path === item.href
    }))

const publicNavigation = computed(() => withCurrent(publicNavigationBase))
const memberNavigation = computed(() => withCurrent(memberNavigationBase))
</script>