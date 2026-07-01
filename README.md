# Visitekaartje — digitale PWA

Een installeerbaar digitaal visitekaartje. Statische HTML/CSS/JS, geen
build step, geen backend.

## Gegevens invullen

Tik onderaan de kaart op **"Gegevens bewerken"** om alles aan te passen:

- **Foto**: kies een foto, tik op het gewenste focuspunt en bevestig —
  de foto wordt automatisch vierkant bijgesneden rond dat punt.
- **Naam en uitspraak**: voornaam, achternaam en een optionele
  fonetische uitspraak (getoond cursief onder je naam).
- **Kleur**: de accentkleur van de kaart (knoppen, naam-uitspraak, QR-
  icoon) is vrij instelbaar.
- **Velden**: een vrije lijst van label/waarde-paren (bv. Profession,
  Email, Telefoon, Adres, Website, LinkedIn, ...). Je kiest per veld het
  type (tekst, telefoon, e-mail, link of adres) — dat bepaalt of het als
  tel:/mailto:/link wordt weergegeven én of het wordt meegenomen in de
  vCard. Velden zijn vrij toe te voegen, te hernoemen of te verwijderen.

Alles wordt lokaal opgeslagen op je telefoon (`localStorage`) — geen
account, geen login nodig. Bij een lege kaart opent het bewerkscherm
automatisch.

Wil je in plaats daarvan vaste standaardwaarden in de code zetten? Pas
dan `data/contact.js` aan; dat dient als fallback zolang er nog niets
lokaal is opgeslagen.

Onderaan het bewerkscherm staat ook een link naar **"NFC-tag
programmeren"** — dat is een eenmalige setup-actie, dus die staat expres
niet op de kaart zelf.

## Lokaal bekijken

```
npx serve .
```

## Deployen op GitHub Pages

1. Maak een nieuwe repo op GitHub (public of private) en upload deze map
   naar de `main`-branch.
2. Repo → **Settings → Pages** → Source: **Deploy from a branch** →
   branch `main`, folder `/ (root)`.
3. Na een minuut is de kaart bereikbaar op
   `https://<gebruikersnaam>.github.io/<repo-naam>/`.
4. Open de URL op je telefoon → browsermenu → **Toevoegen aan
   beginscherm**.

## Gebruik

- **Aan de balie**: open de kaart op je eigen telefoon en toon het
  scherm.
- **Delen**: laat iemand de QR-code scannen (icoon rechtsboven op de
  foto) — dat opent direct de "voeg contact toe"-prompt in hun
  camera-app. Dit is de enige manier die ook echt werkt voor iemand die
  jouw gegevens nog niet heeft.
- **NFC** (eenmalige setup, via "Gegevens bewerken" → "NFC-tag
  programmeren"): schrijf je gegevens op een fysieke NFC-sticker
  (alleen werkend vanaf Chrome op Android). Wie daarna met een telefoon
  tegen de tag tikt, krijgt direct de contact-prompt — geen app nodig.

## Belangrijk: geen sync tussen toestellen

De gegevens staan alleen lokaal op het toestel waarop je ze hebt
ingevuld. Vul je de kaart in op je telefoon, dan zie je die gegevens niet
terug als je de kaart op een ander toestel of in een andere browser
opent — daar moet je ze opnieuw invullen.
