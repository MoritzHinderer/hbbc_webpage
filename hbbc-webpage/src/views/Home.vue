<template>
    <div class="min-h-screen" style="background: linear-gradient(to bottom, rgb(31, 41, 55) 0%, rgb(80, 7, 7) 150%);">>
        <!-- Hero + Logo -->
        <div class="relative h-screen overflow-hidden">

            <!-- Logo -->
            <div class="fixed left-1/2 z-40 pointer-events-none" :style="{
                transform: `translate(-50%, ${logoTranslateY}px) scale(${logoScale})`,
                opacity: logoOpacity
            }">
                <img src="../assets/hbbc_logo.png" alt="HBBC Logo" class="block w-[300px] h-auto" />
            </div>

            <!-- VFB Schal Background (scrolls with page) -->
            <div class="absolute left-1/2 top-[95vh] z-10 pointer-events-none" :style="{
                transform: `translateX(-50%) scale(${schalScale})`
            }">
                <img src="../assets/vfb_schal.png" alt="VFB Schal" class="block w-screen h-auto opacity-10" />
            </div>

            <!-- VFB Schal Background (scrolls with page) -->
            <div class="absolute left-1/2 top-[70vh] z-10 pointer-events-none" :style="{
                transform: `translateX(-50%) scale(${schalScale})`
            }">
                <img src="../assets/vfb_schal.png" alt="VFB Schal" class="block w-screen h-auto opacity-10" />
            </div>

            <!-- VFB Schal Background 2 (scrolls with page, tilted) -->
            <div class="absolute left-1/2 top-[45vh] z-10 pointer-events-none" :style="{
                transform: `translateX(-50%) scale(${schalScale}) rotate(0deg)`
            }">
                <img src="../assets/vfb_schal.png" alt="VFB Schal" class="block w-screen h-auto opacity-10" />
            </div>

            <!-- VFB Schal Background 2 (scrolls with page, tilted) -->
            <div class="absolute left-1/2 top-[20vh] z-10 pointer-events-none" :style="{
                transform: `translateX(-50%) scale(${schalScale}) rotate(0deg)`
            }">
                <img src="../assets/vfb_schal.png" alt="VFB Schal" class="block w-screen h-auto opacity-10" />
            </div>

            <!-- VFB Schal Background (scrolls with page) -->
            <div class="absolute left-1/2 top-[-5vh] z-10 pointer-events-none" :style="{
                transform: `translateX(-50%) scale(${schalScale})`
            }">
                <img src="../assets/vfb_schal.png" alt="VFB Schal" class="block w-screen h-auto opacity-10" />
            </div>

            <!-- VFB Schal Background (scrolls with page) -->
            <div class="absolute left-1/2 top-[-30vh] z-10 pointer-events-none" :style="{
                transform: `translateX(-50%) scale(${schalScale})`
            }">
                <img src="../assets/vfb_schal.png" alt="VFB Schal" class="block w-screen h-auto opacity-10" />
            </div>

            <!-- Glass fade overlay -->
            <div class="fixed top-0 left-0 right-0 z-30 pointer-events-none w-full h-[300px] backdrop-blur-[8px]"
                style="
                background-color: rgba(1,24,39,0.5);
                -webkit-mask-image: linear-gradient(to bottom, black 60%, transparent 100%);
                mask-image: linear-gradient(to bottom, black 60%, transparent 100%);
                ">
            </div>


        </div>

        <!-- Content Sections -->
        <main class="relative z-20 px-6 py-12">
            <div class="max-w-4xl mx-auto text-center space-y-16">
                <h1 class="text-2xl md:text-3xl font-bold text-red-600">Willkommen beim</h1>
                <h1 class="text-4xl md:text-5xl font-bold text-white -mt-10">Hamburger Böblinger
                    Banausenchor und VFB Fanclub OFC</h1>
                <p class="text-xl text-red-500 -mt-10">
                    Zwanzighundertvierundzwanzig
                </p>

                <section class="bg-red-900/30 rounded-lg p-8 backdrop-blur mx-auto max-w-3xl text-center border border-red-700 hover:scale-100 md:hover:scale-[1.15] transition-transform">
                    <h2 class="text-2xl font-bold text-white mb-4">Wer sind wir?</h2>
                    <p class="text-gray-200 leading-relaxed">
                        Der HHBC ist ein offizieller Fanclub (OFC) des VfB Stuttgart.
                        Die 12 Gründungsmitglieder kennen sich teilweise seit der
                        Schulzeit und sind durch eine jahrelange Freundschaft
                        miteinander verbunden. Unser Fanclub versteht sich als
                        interregionaler bzw. als internationaler Fanclub, dessen
                        Mitglieder deutschlandweit und darüber hinaus wohnhaft sind.
                    </p>
                </section>

                <section class="bg-gray-800/50 rounded-lg p-8 backdrop-blur mx-auto max-w-3xl text-center border border-gray-700 hover:scale-100 md:hover:scale-[1.15] transition-transform">
                    <h2 class="text-2xl font-bold text-white mb-4">Was ist unser Ziel?</h2>
                    <p class="text-gray-200 leading-relaxed">
                        Mit dem HHBC möchten wir unsere gemeinsame Liebe und
                        Leidenschaft zu unserem VfB Stuttgart zum Ausdruck bringen.
                        Der VfB bildet einen vitalen Teil unserer Gruppe und ist
                        damals wie heute ein zentraler Bestandteil unserer Gespräche,
                        Lieder oder Unternehmungen. Mit dem OFC möchten wir unsere
                        Gemeinschaft aktiv beim VfB einbringen, um diesen bestmöglich
                        zu unterstützen. Darüber hinaus dient der Fanclub als
                        Plattform für unsere leidenschaftliche Freundschaft..
                    </p>
                </section>

                <section class="bg-red-900/30 rounded-lg p-8 backdrop-blur mx-auto max-w-3xl text-center border border-red-700 hover:scale-100 md:hover:scale-[1.15] transition-transform">
                    <h2 class="text-2xl font-bold text-white mb-4">Warum Hamburg, warum Banausenchor?</h2>
                    <p class="text-gray-200 leading-relaxed">
                        Die beiden Städte liegen geographisch gesehen ein gutes Stück
                        auseinander und symbolisieren somit einerseits die
                        interregionale Vielfalt der Mitglieder. Andererseits wurde
                        Hamburg in den Namen mitaufgenommen, da es sich hierbei um
                        die Stadt handelt, in der für unseren Fanclub alles begann
                        und daher eng mit dem Gründungsmythos verbunden ist.
                        Aus dem Landkreis Böblingen stammen die meisten
                        Gründungsmitglieder und fühlen sich bis heute noch eng mit
                        der Heimatregion verbunden. Wir sind kein professioneller
                        Chor, dennoch verbindet eine Vielzahl der Mitglieder die Musik
                        und der Gesang, weshalb wir hierbei ein weiteres zentrales
                        Element in unserem Fanclub sehen.
                    </p>
                </section>

                <section class="bg-gray-800/50 rounded-lg p-8 backdrop-blur mx-auto max-w-3xl text-center border border-gray-700 hover:scale-100 md:hover:scale-[1.15] transition-transform">
                    <h2 class="text-2xl font-bold text-white mb-4">Was ist uns wichtig?</h2>
                    <p class="text-gray-200 leading-relaxed">
                        Den zentralen Bestandteil des HBBCs bildet unsere Satzung,
                        die von jedem Mitglied sorgfältig gelesen werden sollte.
                        Darüber hinaus ist ein respektvoller Umgang miteinander die
                        Grundvoraussetzung einer Mitgliedschaft. Der HBBC vertritt
                        ein offenes, dynamisches Weltbild, das keinen Platz für
                        Intoleranz bietet und sich entschieden gegen Diskriminierung
                        stellt. Bei uns sind grundsätzlich alle Personen willkommen,
                        die sich bei unserem gemeinsamen Freundschaftsprojekt
                        einbringen und gleichzeitig den VfB Stuttgart unterstützen
                        möchten.
                    </p>
                </section>

                <section class="bg-red-900/30 rounded-lg p-8 backdrop-blur mx-auto max-w-3xl text-center border border-red-700 hover:scale-100 md:hover:scale-[1.15] transition-transform">
                    <h2 class="text-2xl font-bold text-white mb-4">Wie siehts aus mit Tickets?</h2>
                    <p class="text-gray-200 leading-relaxed">
                        Als OFC haben wir die Möglichkeit für alle VfB Spiele Karten
                        zu erwerben. Der Fanbeauftragte des VfB hat uns darauf
                        hingewiesen, dass es für neu gegründete Fanclubs jedoch
                        erstmal schwierig wird an Karten zu gelangen. Des Weiteren
                        überlegen wir uns ein Ticketverteilsystem für unseren Fanclub,
                        welches zu einer fairen Verteilung an unsere Mitglieder
                        beiträgt, insbesondere wenn die Nachfrage höher als das
                        Angebot ist. Dafür wird vom Vorstand ein „Ticketbeauftragter"
                        ermächtigt.
                    </p>
                </section>

                <section class="bg-gray-800/50 rounded-lg p-8 backdrop-blur mx-auto max-w-3xl text-center border border-gray-700 hover:scale-100 md:hover:scale-[1.15] transition-transform">
                    <h2 class="text-2xl font-bold text-white mb-4">Wie werde ich Mitglied im HBBC?</h2>
                    <p class="text-gray-200 leading-relaxed">
                        Gegenwärtig ist unser Fanclub ein Zusammenschluss von engen
                        Freund:innen. Jedes neue Mitglied muss die Satzung des HBBC
                        anerkennen und auf Gewalt im Rahmen von Fußballspielen und
                        Aktionen des HBBC verzichten. Des Weiteren sollte der
                        Antragssteller/ die Antragsstellerin mindestens mit zwei
                        Gründungsmitgliedern vertraut/befreundet sein (4-Augen-
                        Prinzip). Sollte das nicht zutreffen, kann sich die Person im
                        Rahmen einer Fanclubveranstaltung oder eines anderen Treffens
                        (analog oder digital), in Anwesenheit des Vorstands, gerne
                        vorstellen.
                    </p>
                </section>
            </div>
        </main>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const logoBaseHeight = 300 // base logo height (matches w-[300px])
const initialScale = 2
const finalScale = 0.8
const finalTopOffset = -130

const logoScale = ref(initialScale)
const logoTranslateY = ref(window.innerHeight / 2 - logoBaseHeight / 2)
const logoOpacity = ref(1)
const schalScale = ref(1)

const handleScroll = () => {
    const scrollY = window.scrollY
    const heroHeight = window.innerHeight
    const progress = Math.min(scrollY / heroHeight, 1)

    // scale interpolation
    logoScale.value = initialScale - (initialScale - finalScale) * progress

    // translateY interpolation (center → top)
    const centerY = window.innerHeight / 2 - logoBaseHeight / 2 - 40
    logoTranslateY.value = centerY + (finalTopOffset - centerY) * progress

    // schal scale: grows from 1.7 to 2.6 as you scroll
    schalScale.value = 2.5 + (0.9 * progress)
}

onMounted(() => {
    handleScroll() // initialize logo properly
    window.addEventListener('scroll', handleScroll, { passive: true })
})

onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll)
})
</script>
