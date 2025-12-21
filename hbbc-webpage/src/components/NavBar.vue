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
                        <img class="h-20 w-auto" src="../assets/hbbc_logo.png" alt="HBBC Logo" />
                    </div>
                    <!-- Desktop navigation links (hidden on mobile, visible on tablet+) -->
                    <div class="hidden sm:ml-6 sm:block">
                        <div class="flex space-x-1 h-full items-center">
                            <a v-for="item in navigation" :key="item.name" :href="item.href"
                                :class="[item.current ? 'text-white border-b-2 border-red-500 font-semibold' : 'text-gray-300 hover:text-white border-b-2 border-transparent', 'px-4 py-2 text-sm font-medium transition-all duration-300 hover:bg-gradient-to-b hover:from-red-500/10 hover:to-transparent rounded-t-md hover:scale-[1.03] relative']"
                                :aria-current="item.current ? 'page' : undefined">{{ item.name }}</a>
                        </div>
                    </div>
                </div>
                <!-- Right-side buttons: notifications and profile menu -->
                <div class="flex items-center pr-2 sm:ml-6 sm:pr-0">
                    <!-- User profile dropdown menu -->
                    <Menu as="div" class="relative ml-3">
                        <!-- Profile avatar button to open dropdown -->
                        <MenuButton
                            class="relative flex rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 transition-transform duration-200 hover:scale-110">
                            <span class="absolute -inset-1.5"></span>
                            <span class="sr-only">Open user menu</span>
                            <img class="size-8 rounded-full bg-gray-800 outline -outline-offset-1 outline-white/10"
                                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Guest"
                                alt="User avatar" />
                        </MenuButton>

                        <!-- Dropdown menu with smooth transition animation -->
                        <transition enter-active-class="transition ease-out duration-100"
                            enter-from-class="transform opacity-0 scale-95" enter-to-class="transform scale-100"
                            leave-active-class="transition ease-in duration-75" leave-from-class="transform scale-100"
                            leave-to-class="transform opacity-0 scale-95">
                            <!-- Dropdown menu items -->
                            <MenuItems
                                class="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-lg bg-gray-800/95 backdrop-blur-md py-1 border border-gray-700/50 shadow-lg">
                                <MenuItem v-slot="{ active }">
                                <a href="#"
                                    :class="[active ? 'bg-red-500/20 text-white' : 'text-gray-300 hover:text-white', 'block px-4 py-2 text-sm transition-colors duration-150']">Your
                                    profile</a>
                                </MenuItem>
                                <MenuItem v-slot="{ active }">
                                <a href="#"
                                    :class="[active ? 'bg-red-500/20 text-white' : 'text-gray-300 hover:text-white', 'block px-4 py-2 text-sm transition-colors duration-150']">Settings</a>
                                </MenuItem>
                                <MenuItem v-slot="{ active }">
                                <a href="#"
                                    :class="[active ? 'bg-red-500/20 text-white' : 'text-gray-300 hover:text-white', 'block px-4 py-2 text-sm transition-colors duration-150']">Sign
                                    out</a>
                                </MenuItem>
                            </MenuItems>
                        </transition>
                    </Menu>
                </div>
            </div>
        </div>

        <!-- Mobile menu panel (visible only on small screens) -->
        <DisclosurePanel class="sm:hidden bg-gradient-to-r from-gray-900/95 to-red-950/95 backdrop-blur-md border-b border-red-500/20">
            <!-- Mobile navigation links (stacked vertically) -->
            <div class="space-y-1 px-2 pt-2 pb-3">
                <DisclosureButton v-for="item in navigation" :key="item.name" as="a" :href="item.href"
                    :class="[item.current ? 'bg-red-500/20 text-white font-semibold' : 'text-gray-300 hover:bg-white/10 hover:text-white', 'block rounded-md px-3 py-2 text-base font-medium transition-all duration-200']"
                    :aria-current="item.current ? 'page' : undefined">{{ item.name }}</DisclosureButton>
            </div>
        </DisclosurePanel>
    </Disclosure>
</template>

<script setup>
// Import UI components from Headless UI
import { Disclosure, DisclosureButton, DisclosurePanel, Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue'
// Import icons from Heroicons
import { Bars3Icon, BellIcon, XMarkIcon } from '@heroicons/vue/24/outline'
// Import router to detect current route
import { useRoute } from 'vue-router'
import { computed } from 'vue'

// Get current route
const route = useRoute()

// Navigation menu items - links are automatically highlighted based on current route
const navigationBase = [
    { name: 'Home', href: '/' },
    { name: 'Downloads', href: '/downloads' },
]

// Computed property to dynamically set current based on active route
const navigation = computed(() => 
    navigationBase.map(item => ({
        ...item,
        current: route.path === item.href
    }))
)
</script>