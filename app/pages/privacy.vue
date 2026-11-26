<script setup lang="ts">
useHead({ title: 'Privacy' })
</script>

<template>
  <div class="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
    <h1 class="text-4xl sm:text-5xl">
      Jouw gegevens
      <span class="label-tag mt-1 -rotate-2 bg-blue-dark">en privacy</span>
    </h1>
    <p class="mt-6 text-lg leading-relaxed">
      Zo gaan we om met wat je invult voor het smoelenboek van Repair Café Jeltje.
    </p>

    <div class="mt-10 space-y-8 leading-relaxed [&_a]:underline [&_a]:underline-offset-2">
      <section>
        <h2 class="mb-2 text-2xl">Wie is verantwoordelijk?</h2>
        <p>
          {{ CONTACT_NAME }}, vrijwilliger bij Repair Café Jeltje, beheert het smoelenboek. Vragen
          of verzoeken over je gegevens kun je mailen naar
          <a :href="`mailto:${CONTACT_EMAIL}`">{{ CONTACT_EMAIL }}</a
          >.
        </p>
      </section>

      <section>
        <h2 class="mb-2 text-2xl">Wat bewaren we?</h2>
        <p>
          Je foto, je naam, je rol(len), wat je graag repareert en je zin over jezelf. Van de foto
          bewaren we ook een verkleinde versie van het origineel, zodat je de uitsnede later nog
          kunt aanpassen. We vragen geen contactgegevens. Alleen je voornaam mag ook, en wat je
          graag repareert en de zin over jezelf zijn niet verplicht. We bewaren ook wanneer je
          toestemming gaf.
        </p>
      </section>

      <section>
        <h2 class="mb-2 text-2xl">Waarvoor en voor wie?</h2>
        <p>
          Alleen voor het smoelenboek, zodat vrijwilligers elkaar beter leren kennen. We gebruiken
          je gegevens omdat je daar toestemming voor geeft. Beheerders zien alle aanmeldingen en
          kunnen het smoelenboek als PDF downloaden. Naast Peter zijn dat soms een paar andere
          vrijwilligers van het Repair Café, bijvoorbeeld wie het smoelenboek wil printen. De PDF
          delen we alleen met de vrijwilligers van Repair Café Jeltje, digitaal of geprint. Het
          smoelenboek staat niet op een openbare website en zoekmachines vinden deze site niet.
        </p>
      </section>

      <section>
        <h2 class="mb-2 text-2xl">Waar staat het?</h2>
        <p>
          Bij hostingbedrijf Alwaysdata in Frankrijk, binnen de EU. De site gebruikt geen trackers
          of andere externe diensten.
        </p>
      </section>

      <section>
        <h2 class="mb-2 text-2xl">Hoe lang?</h2>
        <p>
          Zolang je in het smoelenboek staat. Stop je als vrijwilliger, verwijder jezelf dan via je
          persoonlijke link of laat het Peter weten. Ook een beheerder kan je verwijderen als die
          weet dat je gestopt bent.
        </p>
      </section>

      <section>
        <h2 class="mb-2 text-2xl">Als je jezelf verwijdert</h2>
        <p>
          Dan verdwijnen je gegevens en foto direct van de site. In de dagelijkse back-ups van de
          hosting staan ze nog maximaal een maand. Een smoelenboek dat al gedeeld of geprint is,
          kunnen we niet terughalen. In nieuwe versies sta je er niet meer in.
        </p>
      </section>

      <section>
        <h2 class="mb-2 text-2xl">Je rechten</h2>
        <p>
          Je kunt je gegevens altijd inzien, aanpassen of verwijderen via je persoonlijke link. Ben
          je die kwijt? Mail dan naar
          <a :href="`mailto:${CONTACT_EMAIL}`">{{ CONTACT_EMAIL }}</a> voor een nieuwe link. Ben je
          het niet eens met hoe we met je gegevens omgaan, dan kun je een klacht indienen bij de
          <a href="https://autoriteitpersoonsgegevens.nl/" target="_blank" rel="noopener"
            >Autoriteit Persoonsgegevens</a
          >.
        </p>
      </section>
    </div>
  </div>
</template>
