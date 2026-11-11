# Robins Webseite Infrastruktur

Schlanke Arbeitsversion von robinstolberg.de. Hier wird die Seite künftig mit Claude Code gepflegt. Der Ordner enthält nur, was online gehört. Arbeitsdateien aus Claude Design (Bildschirmfotos, Bundle Dateien, Standalone Exporte) gehören nicht hierher.

Der alte Originalordner "Website robinstolberg.de" auf dem Schreibtisch bleibt unverändert als Sicherung.

## Aufbau

```
index.html                  Startseite (robinstolberg.de)
linktree.html               Link Seite für Instagram
private-session.html        Private Session
inner-office.html           Inner Office
impressum.html              Impressum
datenschutz.html            Datenschutz
sound-alchemy/index.html    Verkaufsseite Sound Alchemy Masterclass
sound-alchemy/assets/       Bilder nur für Sound Alchemy
assets/                     Alle Bilder der übrigen Seiten
live-breathwork-guide.pdf   Guide für Live Sessions
online-breathwork-guide.pdf Guide für Online Sessions
favicon.png
netlify.toml                Weiterleitungen
```

Webadressen nach dem Veröffentlichen:

* robinstolberg.de
* robinstolberg.de/linktree
* robinstolberg.de/private-session
* robinstolberg.de/inner-office
* robinstolberg.de/sound-alchemy
* robinstolberg.de/impressum und robinstolberg.de/datenschutz
* robinstolberg.de/danke-breathworking-space (Ziel nach dem Kauf beim BreathWorking Space). Die Seite selbst liegt nicht hier, sondern im separaten Netlify Projekt superb-marshmallow-ad336f, damit die Gruppen Links nicht öffentlich auf GitHub stehen. Ändern: neuen Ordner mit index.html dort per Drag and Drop hochladen.
* robinstolberg.de/live-breathwork-guide und robinstolberg.de/online-breathwork-guide (leiten auf die PDFs weiter)

## Bilder

Die meisten Bilder der Startseite kommen weiterhin von Cloudinary (Account dtj877v2v). Das bleibt so. Alles andere liegt in `assets/`.

Regeln für neue Dateien:

1. Dateinamen komplett klein schreiben, ohne Leerzeichen, ohne Sonderzeichen. Netlify unterscheidet Groß und Kleinschreibung. Genau daran ist der alte Link zum Online Guide gescheitert.
2. Bilder vor dem Einbauen verkleinern (Webp, möglichst unter 300 KB).

## Weiterleitungen

Stehen in `netlify.toml`. Neue Kurzlinks dort als weiteren Block `[[redirects]]` ergänzen.

## Events pflegen

Die Events auf der Startseite stehen als Liste `const events = [` in `index.html` (etwa Zeile 1838). Nur dort Datum, Titel und Link ändern. Der Rest baut sich automatisch.

## Veröffentlichen

Die Seite liegt im privaten GitHub Repository beyondhustle/robinstolberg-website. Netlify (Projekt stately-sunflower-4d2666) ist damit verbunden.

1. Änderungen landen über Claude im Repository.
2. Größere Änderungen kommen zuerst als Pull Request. Netlify baut dafür automatisch eine Vorschau Adresse. Die Live Seite bleibt unverändert.
3. Passt die Vorschau, wird der Pull Request übernommen. Netlify stellt die Seite dann automatisch auf robinstolberg.de online.

Jede Übernahme in den Zweig main ist eine Veröffentlichung. Deshalb Änderungen bündeln.

Der Ordner "Robins Webseite Infrastruktur" auf dem Schreibtisch ist nur noch eine Kopie. Nicht mehr per Drag and Drop hochladen, sonst überschreibt er die Version aus GitHub.

## BOLT Test (robinstolberg.de/test)

Lead Magnet mit Video, Stoppuhr, Formular und Ergebnis. Die Anmeldung läuft über die Netlify Function `netlify/functions/bolt-signup.mjs` (Adresse `/api/bolt`) an die SendFox API.

In Netlify unter Project configuration, Environment variables (nie ins Repository schreiben):

* `SENDFOX_TOKEN` persönlicher API Token aus SendFox (Pflicht)
* `SENDFOX_LIST_ID` ID der Liste (optional; ohne sie nimmt die Funktion die Liste, deren Name "Beyond Hustle" enthält)

Tags: `bolt-unter-20`, `bolt-20-30`, `bolt-ueber-30`, und `Freiheitspaket 2026` bei Aufruf mit `?quelle=freiheitspaket`. Fehlt ein Tag in SendFox, legt die Funktion ihn an.

Video: `assets/bolt-test.mp4` mit Vorschaubild `assets/bolt-test-poster.jpg`. Es lädt erst, wenn jemand auf Abspielen tippt.

## Sound Alchemy Zahlung

Der Kaufbutton verweist auf den Stripe Payment Link https://buy.stripe.com/cNi9AUgjOcjr39IcT167S01 (199 Euro, Gutscheincodes aktiv). Preise und Gutscheine werden in Stripe gepflegt, nicht auf der Seite. Der Preis 199 Euro steht zusätzlich im Text der Seite und muss bei einer Preisänderung in `sound-alchemy/index.html` angepasst werden.

## Offene Punkte

* Die drei größten Bilder in `assets/` sind sehr schwer (sku03029-web.jpg knapp 6 MB, guide-portrait-web.jpg und img7491-web.jpg je knapp 3 MB). Verkleinern verbessert die Ladezeit auf dem Handy deutlich.
* Gutschein SACREDBREATH: 50 Prozent ergibt 99,50 Euro. Ein fester Rabatt von 100 Euro ergäbe glatte 99 Euro. Stripe erlaubt nicht, einen bestehenden Gutschein zu ändern. Es bräuchte einen neuen Gutschein mit neuem Code.
