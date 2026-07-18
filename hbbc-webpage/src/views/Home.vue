<template>
    <div class="min-h-screen" style="background: linear-gradient(to bottom, rgb(31, 41, 55) 0%, rgb(80, 7, 7) 150%);">
        <!-- Hero + Logo -->
        <div class="relative h-screen overflow-hidden">

            <!-- Logo -->
            <div ref="logoContainerRef" class="fixed left-1/2 z-40 pointer-events-none" :style="{
                transform: `translate(-50%, ${logoTranslateY}px) scale(${logoScale})`,
                opacity: logoOpacity
            }">
                <img src="../assets/hbbc_logo.webp" alt="HBBC Logo" class="block w-[clamp(180px,30vw,300px)] h-auto" @load="onLogoLoad" />
            </div>

            <!-- VFB Schal Background (repeated, scrolls with page) -->
            <div v-for="offset in schalOffsets" :key="offset" class="absolute left-1/2 z-10 pointer-events-none" :style="{
                top: `${offset}vh`,
                transform: `translateX(-50%) scale(${schalScale})`
            }">
                <img src="../assets/vfb_schal.webp" alt="VFB Schal" class="block w-screen h-auto opacity-10" />
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
        <main class="relative z-20 px-6 py-12 -mt-96">
            <div class="max-w-4xl mx-auto text-center space-y-16">
                <h1 ref="heroTextRef" class="text-2xl md:text-3xl font-bold text-red-600">Willkommen beim</h1>
                <h1 class="text-4xl md:text-5xl font-bold text-white -mt-10">Hamburger Böblinger
                    Banausenchor und VFB Fanclub OFC</h1>
                <p class="text-xl text-red-500 -mt-10">
                    Zwanzighundertvierundzwanzig
                </p>

                <StatsSection />

                <section class="group bg-red-900/30 rounded-2xl p-8 backdrop-blur-md mx-auto max-w-3xl text-center border border-red-700/60 shadow-lg shadow-black/20 transition-all duration-300 hover:border-red-500 hover:shadow-xl hover:shadow-red-950/40 hover:-translate-y-1">
                    <div class="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-red-500/15 text-red-400 ring-1 ring-red-500/40 transition-colors group-hover:bg-red-500/25">
                        <UserGroupIcon class="size-7" aria-hidden="true" />
                    </div>
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

                <section class="group bg-gray-800/50 rounded-2xl p-8 backdrop-blur-md mx-auto max-w-3xl text-center border border-gray-700 shadow-lg shadow-black/20 transition-all duration-300 hover:border-gray-500 hover:shadow-xl hover:shadow-black/40 hover:-translate-y-1">
                    <div class="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-gray-500/15 text-gray-300 ring-1 ring-gray-500/40 transition-colors group-hover:bg-gray-500/25">
                        <FlagIcon class="size-7" aria-hidden="true" />
                    </div>
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

                <section class="group bg-red-900/30 rounded-2xl p-8 backdrop-blur-md mx-auto max-w-3xl text-center border border-red-700/60 shadow-lg shadow-black/20 transition-all duration-300 hover:border-red-500 hover:shadow-xl hover:shadow-red-950/40 hover:-translate-y-1">
                    <div class="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-red-500/15 text-red-400 ring-1 ring-red-500/40 transition-colors group-hover:bg-red-500/25">
                        <MapPinIcon class="size-7" aria-hidden="true" />
                    </div>
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

                <section class="group bg-gray-800/50 rounded-2xl p-8 backdrop-blur-md mx-auto max-w-3xl text-center border border-gray-700 shadow-lg shadow-black/20 transition-all duration-300 hover:border-gray-500 hover:shadow-xl hover:shadow-black/40 hover:-translate-y-1">
                    <div class="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-gray-500/15 text-gray-300 ring-1 ring-gray-500/40 transition-colors group-hover:bg-gray-500/25">
                        <HeartIcon class="size-7" aria-hidden="true" />
                    </div>
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

                <section class="group bg-red-900/30 rounded-2xl p-8 backdrop-blur-md mx-auto max-w-3xl text-center border border-red-700/60 shadow-lg shadow-black/20 transition-all duration-300 hover:border-red-500 hover:shadow-xl hover:shadow-red-950/40 hover:-translate-y-1">
                    <div class="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-red-500/15 text-red-400 ring-1 ring-red-500/40 transition-colors group-hover:bg-red-500/25">
                        <TicketIcon class="size-7" aria-hidden="true" />
                    </div>
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

                <section class="group bg-gray-800/50 rounded-2xl p-8 backdrop-blur-md mx-auto max-w-3xl text-center border border-gray-700 shadow-lg shadow-black/20 transition-all duration-300 hover:border-gray-500 hover:shadow-xl hover:shadow-black/40 hover:-translate-y-1">
                    <div class="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-gray-500/15 text-gray-300 ring-1 ring-gray-500/40 transition-colors group-hover:bg-gray-500/25">
                        <UserPlusIcon class="size-7" aria-hidden="true" />
                    </div>
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

                <TestimonialsCarousel />
            </div>
        </main>
    </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted, onUnmounted } from 'vue'
import StatsSection from '../components/StatsSection.vue'
import TestimonialsCarousel from '../components/TestimonialsCarousel.vue'
import { UserGroupIcon, FlagIcon, MapPinIcon, HeartIcon, TicketIcon, UserPlusIcon } from '@heroicons/vue/24/outline'

// Rough approximation for the vertical-centering math below — the logo's
// real width is responsive (clamp(180px,30vw,300px), see the template), but
// any resulting imprecision is corrected automatically by the navbar-
// clearance check further down, so an exact match isn't needed here.
const logoBaseHeight = 300
const initialScale = 2
const finalScale = 0.8
const finalTopOffset = -130
const navbarClearance = 16 // minimum gap kept below the navbar at all times

const logoScale = ref(initialScale)
const logoTranslateY = ref(window.innerHeight / 2 - logoBaseHeight / 2)
const logoOpacity = ref(1)
const schalScale = ref(1)
const logoContainerRef = ref<HTMLElement | null>(null)
const heroTextRef = ref<HTMLElement | null>(null)
const heroTextClearance = 24 // minimum gap kept above the "Willkommen beim" heading
const logoScaleCorrectionFactor = ref(1)

// Cached rather than read live inside handleScroll(): iOS/iPadOS Safari's
// collapsible toolbar animates window.innerHeight over the course of an
// ordinary scroll gesture (not just overscroll), and handleScroll() fires
// on every 'scroll' event — reading window.innerHeight fresh each time
// made the progress ratio (and therefore the logo's scale/position) a
// moving target against a denominator that was itself still changing,
// which is what made the logo's size swing unpredictably with scroll
// depth even after the overscroll bounce itself was fixed. Only updated
// on resize (see onResize below), which already accounts for the
// toolbar's height changes (see the listener comment in onMounted).
const viewportHeight = ref(window.innerHeight)

// Computed once — at rest (progress=0), the logo's largest and therefore
// riskiest size — rather than every scroll frame. Both the scale and
// translateY formulas move monotonically from this resting state toward
// the docked one, so if the resting state doesn't overlap the heading,
// nothing later in the scroll will either. An earlier version of this fix
// re-derived the correction live on every scroll frame instead: since the
// heading scrolls with the page while the logo moves via these separate
// JS-driven formulas, that comparison was a moving target and could
// transiently compute a near-zero ratio partway through the scroll,
// flickering the logo's size before "popping" to its correct one.
const computeLogoScaleCorrectionFactor = async () => {
    logoScaleCorrectionFactor.value = 1

    // Iterated rather than solved in one shot, and reusing handleScroll()
    // itself (called with scrollY still 0 here, at mount) rather than a
    // simplified stand-in for it — an earlier version only replicated the
    // scale/translateY formulas, not the navbar-clearance correction that
    // handleScroll also applies, so its measurement didn't match what
    // actually ends up on screen and undercorrected. Re-measuring against
    // the real thing and correcting again converges empirically. Capped at
    // a few rounds — each one should shrink the remaining overlap towards
    // zero, not oscillate.
    for (let attempt = 0; attempt < 4; attempt++) {
        await handleScroll()

        if (!logoContainerRef.value || !heroTextRef.value) return
        const logoRect = logoContainerRef.value.getBoundingClientRect()
        const textTop = heroTextRef.value.getBoundingClientRect().top
        const maxBottom = textTop - heroTextClearance
        // The source logo image has ~12.5% transparent margin below the
        // drawn crest (trimmed content is 468 of 640px tall) — the box's
        // raw bottom edge isn't where the artwork visually ends, so using
        // it directly overcorrects (shrinks logos that already had a
        // visible gap, like desktop's, because of margin baked into the
        // asset itself, not any real crowding).
        const effectiveBottom = logoRect.bottom - logoRect.height * (80 / 640)
        const overlap = effectiveBottom - maxBottom
        if (logoRect.height <= 0 || overlap <= 0) break

        // scale() shrinks symmetrically around the box's own center, so
        // both edges move inward — the top drops by the same amount the
        // bottom rises. Shrinking by (1 - 2*overlap/height), not
        // (1 - overlap/height), is what actually lands the bottom edge
        // exactly on maxBottom instead of leaving half the overlap.
        const ratio = 1 - (2 * overlap) / logoRect.height
        if (ratio <= 0) break
        logoScaleCorrectionFactor.value *= ratio
    }
}

// The scarf image (w-screen, fixed aspect ratio) has generous white margin
// around its diagonal artwork band, so tiles need real overlap for the
// artwork itself to look continuous — not just their bounding boxes. Its
// rendered height is coupled to viewport WIDTH, but the tiling spacing
// below is in vh (viewport HEIGHT) — on a portrait phone (tall relative to
// its width) that mismatch means each tile is short in absolute pixels
// while the vh gap between tiles stays desktop-sized, exposing the
// image's own whitespace as visible gaps. Tightening the step specifically
// for narrow/tall aspect ratios (not just "small screens" — this must not
// affect the already-correct iPad layout) closes that gap without
// touching the desktop-tuned numbers.
const computeSchalOffsets = (): number[] => {
    const aspectRatio = window.innerWidth / window.innerHeight
    const step = aspectRatio < 0.6 ? 12 : 25
    return [3.8, 2.8, 1.8, 0.8, -0.2, -1.2].map((multiplier) => multiplier * step)
}

const schalOffsets = ref(computeSchalOffsets())

const handleScroll = async () => {
    // iOS/Android overscroll ("pull past the top" rubber-banding, used to
    // trigger a reload) briefly drives window.scrollY negative — without a
    // floor here, that fed a negative progress into the scale/position
    // formulas below and overshot them, which is what made the logo's size
    // visibly jump around while overscrolling on mobile/iPad. Desktop mice/
    // trackwheels never produce a negative scrollY, so this floor is a
    // no-op there.
    const scrollY = Math.max(window.scrollY, 0)
    const heroHeight = viewportHeight.value
    const progress = Math.min(scrollY / (heroHeight * 0.5), 1)

    // scale interpolation
    logoScale.value = (initialScale - (initialScale - finalScale) * progress) * logoScaleCorrectionFactor.value

    // translateY interpolation (center → top)
    const centerY = viewportHeight.value / 2 - logoBaseHeight / 2 - 160
    logoTranslateY.value = centerY + (finalTopOffset - centerY) * progress

    // schal scale: grows from 1.7 to 2.6 as you scroll
    schalScale.value = 2.5 + (0.9 * progress)

    // Recomputed here (not just on 'resize') so an orientation change that
    // fires scroll/resize together still ends up with the right spacing.
    schalOffsets.value = computeSchalOffsets()

    // On short viewports (mobile/tablet, especially landscape) the formula
    // above can push the logo's top edge above the navbar's bottom edge —
    // it then renders behind the navbar (lower z-index) instead of below
    // it. The translate+scale transform is composed in a way that isn't
    // simple to invert by hand, so measure the actual rendered position
    // and nudge it down rather than guessing at the math.
    await nextTick()
    const navbar = document.querySelector('nav')
    if (navbar && logoContainerRef.value) {
        const navbarBottom = navbar.getBoundingClientRect().bottom
        const logoTop = logoContainerRef.value.getBoundingClientRect().top
        // The navbar isn't fixed/sticky — past ~80px of scroll it scrolls
        // away too, so navbarBottom goes negative and stops constraining
        // anything. Without a floor independent of that, the docked logo
        // at the end of the scroll (small screens especially) could keep
        // drifting up until it was partly clipped above the viewport —
        // this minimumTop keeps it fully visible regardless of scroll depth.
        const minimumTop = 8
        const minTop = Math.max(navbarBottom + navbarClearance, minimumTop)
        if (logoTop < minTop) {
            logoTranslateY.value += minTop - logoTop
        }
    }
}

let ticking = false
const onScroll = () => {
    if (ticking) return
    ticking = true
    requestAnimationFrame(() => {
        handleScroll()
        ticking = false
    })
}

// Viewport size changed (resize or orientation change) — the correction
// factor depends on it, so recompute before the next handleScroll.
let resizeTicking = false
const onResize = () => {
    if (resizeTicking) return
    resizeTicking = true
    requestAnimationFrame(() => {
        viewportHeight.value = window.innerHeight
        computeLogoScaleCorrectionFactor().then(handleScroll)
        resizeTicking = false
    })
}

onMounted(async () => {
    await computeLogoScaleCorrectionFactor()
    handleScroll() // initialize logo properly
    window.addEventListener('scroll', onScroll, { passive: true })
    // Covers iOS Safari's collapsible toolbar changing window.innerHeight
    // with no 'scroll' event, and orientation changes on tablets/phones.
    window.addEventListener('resize', onResize)
})

onUnmounted(() => {
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('resize', onResize)
})

// The very first computeLogoScaleCorrectionFactor()/handleScroll() calls
// above can run before the logo <img> has actually finished loading, since
// the wrapping div has no explicit height and shrink-wraps to the image —
// its measured rect is unreliable until the image is in. Re-run once
// loading is confirmed so the initial paint (before any scroll/resize) is
// correct too, not just after the user's first interaction.
const onLogoLoad = () => { computeLogoScaleCorrectionFactor().then(handleScroll) }
</script>
