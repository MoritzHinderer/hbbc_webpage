<template>
  <div class="min-h-screen" style="background: linear-gradient(to bottom, rgb(31, 41, 55) 0%, rgb(80, 7, 7) 100%);">
    <div class="max-w-3xl mx-auto px-6 py-16 space-y-8">
      <h1 class="text-4xl md:text-5xl font-bold text-white text-center">Impressum</h1>

      <div class="bg-gray-800/50 backdrop-blur rounded-lg p-8 border border-gray-500 text-gray-200 leading-relaxed space-y-8">
        <section>
          <h2 class="text-lg font-semibold text-white mb-2">Angaben gemäß § 5 DDG</h2>
          <p>
            Hamburger Böblinger Banausenchor und VFB Fanclub OFC<br />
            (nicht eingetragener Verein)
          </p>
        </section>

        <section v-if="!loaded"></section>
        <section v-else-if="!impressum?.configured">
          <h2 class="text-lg font-semibold text-white mb-2">Anschrift</h2>
          <p class="border border-dashed border-amber-500/60 bg-amber-500/10 text-amber-200 rounded-md p-4">
            ⚠ Nicht konfiguriert — der Betreiber muss
            <code>IMPRESSUM_NAME</code>/<code>IMPRESSUM_ADDRESS_LINE1</code>/<code>IMPRESSUM_ADDRESS_LINE2</code>
            in der Server-<code>.env</code> setzen. Diese Seite darf erst live gehen, wenn diese Angaben vorhanden sind
            — ohne sie ist das Impressum rechtlich unvollständig.
          </p>
        </section>
        <template v-else>
          <section>
            <h2 class="text-lg font-semibold text-white mb-2">Anschrift</h2>
            <p>
              {{ impressum!.name }}<br />
              <template v-for="line in impressum!.addressLines" :key="line">{{ line }}<br /></template>
            </p>
          </section>

          <section>
            <h2 class="text-lg font-semibold text-white mb-2">Vertreten durch</h2>
            <p>{{ impressum!.name }}</p>
          </section>

          <section>
            <h2 class="text-lg font-semibold text-white mb-2">Kontakt</h2>
            <p>
              E-Mail:
              <a href="mailto:info@hbbc-fanclub.de" class="text-red-400 hover:text-red-300">info@hbbc-fanclub.de</a
              ><template v-if="impressum!.phone"
                ><br />
                Telefon:
                <a :href="impressum!.phoneHref!" class="text-red-400 hover:text-red-300">{{ impressum!.phone }}</a>
              </template>
            </p>
          </section>

          <section>
            <h2 class="text-lg font-semibold text-white mb-2">Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
            <p>
              {{ impressum!.name }}<br />
              Anschrift wie oben
            </p>
          </section>
        </template>

        <section>
          <h2 class="text-lg font-semibold text-white mb-2">Haftung für Inhalte</h2>
          <p>
            Als Diensteanbieter sind wir gemäß § 7 Abs. 1 DDG für eigene Inhalte
            auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach
            §§ 8 bis 10 DDG sind wir als Diensteanbieter jedoch nicht
            verpflichtet, übermittelte oder gespeicherte fremde Informationen zu
            überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige
            Tätigkeit hinweisen. Verpflichtungen zur Entfernung oder Sperrung der
            Nutzung von Informationen nach den allgemeinen Gesetzen bleiben
            hiervon unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem
            Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei
            Bekanntwerden von entsprechenden Rechtsverletzungen werden wir diese
            Inhalte umgehend entfernen.
          </p>
        </section>

        <section>
          <h2 class="text-lg font-semibold text-white mb-2">Haftung für Links</h2>
          <p>
            Unser Angebot enthält Links zu externen Websites Dritter (z. B. dem
            VfB Stuttgart oder OpenLigaDB), auf deren Inhalte wir keinen Einfluss
            haben. Deshalb können wir für diese fremden Inhalte auch keine
            Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets
            der jeweilige Anbieter oder Betreiber der Seiten verantwortlich. Die
            verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche
            Rechtsverstöße überprüft. Rechtswidrige Inhalte waren zum Zeitpunkt
            der Verlinkung nicht erkennbar. Eine permanente inhaltliche
            Kontrolle der verlinkten Seiten ist jedoch ohne konkrete Anhaltspunkte
            einer Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von
            Rechtsverletzungen werden wir derartige Links umgehend entfernen.
          </p>
        </section>

        <section>
          <h2 class="text-lg font-semibold text-white mb-2">Urheberrecht</h2>
          <p>
            Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen
            Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung,
            Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der
            Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des
            jeweiligen Autors bzw. Erstellers. Downloads und Kopien dieser Seite
            sind nur für den privaten, nicht kommerziellen Gebrauch gestattet.
          </p>
        </section>
      </div>

      <p class="text-sm text-gray-400 text-center">
        Siehe auch: <router-link to="/datenschutz" class="text-red-400 hover:text-red-300">Datenschutzerklärung</router-link>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'

interface ImpressumData {
  configured: boolean
  name: string | null
  addressLines: string[]
  phone: string | null
  phoneHref: string | null
}

const impressum = ref<ImpressumData | null>(null)
const loaded = ref(false)

onMounted(async () => {
  try {
    const response = await fetch('/api/impressum')
    impressum.value = await response.json()
  } catch (error) {
    console.error('Failed to load Impressum data:', error)
    impressum.value = { configured: false, name: null, addressLines: [], phone: null, phoneHref: null }
  } finally {
    loaded.value = true
  }
})
</script>
