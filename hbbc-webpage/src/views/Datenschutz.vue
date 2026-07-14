<template>
  <div class="min-h-screen" style="background: linear-gradient(to bottom, rgb(31, 41, 55) 0%, rgb(80, 7, 7) 100%);">
    <div class="max-w-3xl mx-auto px-6 py-16 space-y-8">
      <h1 class="text-4xl md:text-5xl font-bold text-white text-center">Datenschutzerklärung</h1>

      <div class="bg-gray-800/50 backdrop-blur rounded-lg p-8 border border-gray-500 text-gray-200 leading-relaxed space-y-8">
        <section>
          <h2 class="text-lg font-semibold text-white mb-2">1. Verantwortlicher</h2>
          <p>
            Verantwortlicher im Sinne der Datenschutz-Grundverordnung (DSGVO) ist:
          </p>
          <p class="mt-2">
            Hamburger Böblinger Banausenchor und VFB Fanclub OFC<br />
            vertreten durch {{ representativeName }}<br />
            E-Mail:
            <a href="mailto:info@hbbc-fanclub.de" class="text-red-400 hover:text-red-300">info@hbbc-fanclub.de</a>
          </p>
          <p class="mt-2 text-sm text-gray-400">
            Vollständige Anschrift: siehe
            <router-link to="/impressum" class="text-red-400 hover:text-red-300">Impressum</router-link>.
          </p>
        </section>

        <section>
          <h2 class="text-lg font-semibold text-white mb-2">2. Übersicht der Verarbeitungen</h2>
          <p>Wir verarbeiten personenbezogene Daten nur, soweit dies für den Betrieb dieser Website und die Vereinsarbeit erforderlich ist:</p>
          <ul class="list-disc list-inside mt-3 space-y-2">
            <li><strong>Kontoregistrierung:</strong> Name, E-Mail-Adresse und ein Passwort-Hash (das Passwort selbst wird nicht gespeichert), zur Bereitstellung eines Zugangs für Mitglieder.</li>
            <li><strong>Fanclub-Mitgliedschaft &amp; Mitgliederkarte:</strong> Name, Beitrittsdatum, optional ein Foto und ein kurzer Vorstellungstext, zur Darstellung auf der Mitgliederseite.</li>
            <li><strong>Kontaktformular:</strong> Name, E-Mail-Adresse und Nachrichtentext, zur Bearbeitung deiner Anfrage.</li>
            <li><strong>Newsletter:</strong> E-Mail-Adresse, nur nach ausdrücklicher Anmeldung über dein Profil; jederzeit im Profil widerrufbar.</li>
            <li><strong>Galerie-Uploads:</strong> von Mitgliedern hochgeladene Fotos, vor Veröffentlichung durch die Vereinsleitung geprüft.</li>
            <li><strong>Anmeldung (Session-Cookie):</strong> ein technisches Cookie, das dich nach dem Login angemeldet hält (siehe Abschnitt 5).</li>
            <li><strong>Anonyme Seitenaufruf-Statistik:</strong> beim Besuch der Website wird serverseitig nur der aufgerufene Pfad und ein Zeitstempel gespeichert — ohne Cookie, ohne IP-Adresse und ohne sonstigen Personenbezug —, um zu sehen, welche Seiten genutzt werden.</li>
          </ul>
        </section>

        <section>
          <h2 class="text-lg font-semibold text-white mb-2">3. Rechtsgrundlagen</h2>
          <p>
            Die Verarbeitung erfolgt je nach Zweck auf Grundlage von Art. 6 Abs. 1
            lit. b DSGVO (Erfüllung der Mitgliedschaft bzw. Bearbeitung deiner
            Anfrage), Art. 6 Abs. 1 lit. a DSGVO (Einwilligung, z. B. beim
            Newsletter oder Foto-Upload) oder Art. 6 Abs. 1 lit. f DSGVO
            (berechtigtes Interesse an einem funktionierenden, sicheren
            Vereinsangebot). Eine erteilte Einwilligung kannst du jederzeit mit
            Wirkung für die Zukunft widerrufen.
          </p>
        </section>

        <section>
          <h2 class="text-lg font-semibold text-white mb-2">4. Empfänger &amp; Auftragsverarbeiter</h2>
          <p>Deine Daten werden nicht an Dritte verkauft. Zur Bereitstellung der Website nutzen wir folgende Dienstleister:</p>
          <ul class="list-disc list-inside mt-3 space-y-2">
            <li><strong>Hosting:</strong> IONOS SE (Elgendorfer Str. 57, 56410 Montabaur) — betreibt den Server, auf dem diese Website und alle gespeicherten Daten liegen.</li>
            <li><strong>E-Mail-Versand:</strong> Google LLC / Google Ireland Limited (Gmail) — verarbeitet Empfängeradresse und Inhalt bei jeder von uns versendeten E-Mail (Kontobestätigung, Kontaktantworten, Newsletter).</li>
          </ul>
        </section>

        <section>
          <h2 class="text-lg font-semibold text-white mb-2">5. Cookies</h2>
          <p>
            Diese Website verwendet genau ein Cookie: ein technisch notwendiges
            Session-Cookie, das ausschließlich nach dem Login gesetzt wird, um
            dich als angemeldet zu erkennen. Es endet automatisch nach 30 Tagen
            oder beim Logout. Dieses Cookie ist gemäß § 25 Abs. 2 TTDSG technisch
            erforderlich — dafür ist keine Einwilligung nötig. Es werden keine
            Tracking-, Marketing- oder Drittanbieter-Cookies eingesetzt.
          </p>
        </section>

        <section>
          <h2 class="text-lg font-semibold text-white mb-2">6. Speicherdauer</h2>
          <p>
            Wir speichern personenbezogene Daten, solange dein Konto bzw. deine
            Fanclub-Mitgliedschaft besteht oder eine gesetzliche
            Aufbewahrungspflicht dem entgegensteht. Auf Anfrage löschen wir dein
            Konto und die damit verknüpften Daten (siehe Abschnitt 7).
          </p>
        </section>

        <section>
          <h2 class="text-lg font-semibold text-white mb-2">7. Deine Rechte</h2>
          <p>Du hast jederzeit das Recht auf:</p>
          <ul class="list-disc list-inside mt-3 space-y-1">
            <li>Auskunft über die von uns verarbeiteten Daten (Art. 15 DSGVO)</li>
            <li>Berichtigung unrichtiger Daten (Art. 16 DSGVO)</li>
            <li>Löschung deiner Daten (Art. 17 DSGVO)</li>
            <li>Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
            <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
            <li>Widerspruch gegen die Verarbeitung (Art. 21 DSGVO)</li>
            <li>Widerruf einer erteilten Einwilligung mit Wirkung für die Zukunft</li>
            <li>Beschwerde bei einer Datenschutz-Aufsichtsbehörde</li>
          </ul>
          <p class="mt-3">
            Wende dich dafür an:
            <a href="mailto:info@hbbc-fanclub.de" class="text-red-400 hover:text-red-300">info@hbbc-fanclub.de</a>
          </p>
        </section>
      </div>

      <p class="text-sm text-gray-400 text-center">
        Siehe auch: <router-link to="/impressum" class="text-red-400 hover:text-red-300">Impressum</router-link>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'

// Same source as Impressum.vue — real identity data lives only in .env,
// never in git (see server/routes/impressum.ts).
const representativeName = ref('(siehe Impressum)')

onMounted(async () => {
  try {
    const response = await fetch('/api/impressum')
    const data = await response.json()
    if (data.configured && data.name) representativeName.value = data.name
  } catch (error) {
    console.error('Failed to load Impressum data:', error)
  }
})
</script>
