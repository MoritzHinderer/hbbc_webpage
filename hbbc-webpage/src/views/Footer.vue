<template>
    <footer class="bg-gray-950 border-t border-gray-800">
        <div class="max-w-7xl mx-auto px-6 py-12">
            <!-- Footer content grid -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                <!-- Company info -->
                <div class="md:col-span-2">
                    <h3 class="text-white font-bold text-lg mb-4">HBBC</h3>
                    <p class="text-gray-400 text-sm leading-relaxed">
                        Hamburger Böblinger Banausenchor und VFB Fanclub OFC
                    </p>
                    <div class="mb-6"></div>
                    <p class="text-gray-400 text-sm leading-relaxed">
                        Der Hamburger Böblinger Banausenchor (HBBC) ist ein
                        offizieller Fanclub des VFB Stuttgart. Wir sind eine
                        Gemeinschaft von begeisterten VfB-Fans, die ihre
                        Leidenschaft für den Fußball teilen und gemeinsam die
                        Spiele unseres Vereins verfolgen.
                    </p>
                </div>

                <!-- Quick links -->
                <div>
                    <h4 class="text-white font-semibold mb-4">Quick Links</h4>
                    <ul class="space-y-2">
                        <li><router-link to="/" class="text-gray-400 hover:text-red-500 transition-colors text-sm">Home</router-link></li>
                        <li><router-link to="/members" class="text-gray-400 hover:text-red-500 transition-colors text-sm">Mitglieder</router-link></li>
                        <li><router-link to="/events" class="text-gray-400 hover:text-red-500 transition-colors text-sm">VfB-Spiele</router-link></li>
                        <li><router-link to="/fanclub-termine" class="text-gray-400 hover:text-red-500 transition-colors text-sm">Fanclub-Termine</router-link></li>
                        <li><router-link to="/gallery" class="text-gray-400 hover:text-red-500 transition-colors text-sm">Galerie</router-link></li>
                        <li><router-link to="/downloads" class="text-gray-400 hover:text-red-500 transition-colors text-sm">Downloads</router-link></li>
                        <li><router-link to="/contact" class="text-gray-400 hover:text-red-500 transition-colors text-sm">Kontakt</router-link></li>
                    </ul>
                </div>
            </div>

            <!-- Divider -->
            <div class="border-t border-gray-800 pt-8 mt-8">
                <!-- Bottom footer -->
                <div class="flex flex-col md:flex-row justify-between items-center">
                    <p class="text-gray-500 text-sm mb-4 md:mb-0">
                        &copy; {{ currentYear }} HBBC. All rights reserved.
                        <span class="text-gray-600">&middot; v{{ appVersion }}</span>
                    </p>
                    
                    <!-- Footer legal links -->
                    <div class="flex gap-6">
                        <router-link to="/impressum" class="text-gray-500 hover:text-red-500 transition-colors text-sm">Impressum</router-link>
                        <router-link to="/datenschutz" class="text-gray-500 hover:text-red-500 transition-colors text-sm">Datenschutz</router-link>
                    </div>
                </div>
            </div>
        </div>
    </footer>
</template>

<script setup lang="ts">
const currentYear = new Date().getFullYear()
const appVersion = __APP_VERSION__
</script>

<style scoped>
</style>
