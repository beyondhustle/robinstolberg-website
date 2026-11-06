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
danke-breathworking-space.html  Danke Seite nach dem Kauf des BreathWorking Space
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
* robinstolberg.de/danke-breathworking-space (Ziel nach dem Kauf, zum Beispiel bei Digistore24 eintragen)
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

Wichtig: Jeder Deploy ersetzt die komplette Seite. Dateien, die nicht im Ordner liegen, sind danach offline. Deshalb immer den ganzen Ordner veröffentlichen, nie nur eine einzelne Datei.

Projekt: stately-sunflower-4d2666 (Projekt ID 0195b0e6-4728-45b3-b545-17f7b341d599)

1. Einmalig im Ordner mit dem Projekt verbinden:
   `npx netlify-cli link --id 0195b0e6-4728-45b3-b545-17f7b341d599`
2. Testversion erzeugen (noch nicht live, es kommt eine eigene Test Adresse):
   `npx netlify-cli deploy --dir .`
3. Test Adresse öffnen und prüfen: alle Seiten, Bilder, beide Guide Links, Sound Alchemy Kaufbutton.
4. Erst wenn alles stimmt, live schalten:
   `npx netlify-cli deploy --dir . --prod`

Ordner `.netlify` (entsteht beim Verbinden) nie weitergeben. Er steht schon in `.gitignore`.

## Sound Alchemy Zahlung

Der Kaufbutton verweist auf den Stripe Payment Link https://buy.stripe.com/cNi9AUgjOcjr39IcT167S01 (199 Euro, Gutscheincodes aktiv). Preise und Gutscheine werden in Stripe gepflegt, nicht auf der Seite. Der Preis 199 Euro steht zusätzlich im Text der Seite und muss bei einer Preisänderung in `sound-alchemy/index.html` angepasst werden.

## Offene Punkte

* Die drei größten Bilder in `assets/` sind sehr schwer (sku03029-web.jpg knapp 6 MB, guide-portrait-web.jpg und img7491-web.jpg je knapp 3 MB). Verkleinern verbessert die Ladezeit auf dem Handy deutlich.
* Gutschein SACREDBREATH: 50 Prozent ergibt 99,50 Euro. Ein fester Rabatt von 100 Euro ergäbe glatte 99 Euro. Stripe erlaubt nicht, einen bestehenden Gutschein zu ändern. Es bräuchte einen neuen Gutschein mit neuem Code.
