# Die Enthüllung in drei Dimensionen

Type: prototype
Status: resolved

## Question

Die fünf Enthüllungen aus `prototypen/reveal-animationen.html` wurden verworfen.
Sie waren mit CSS und 2D-Canvas gebaut, und der Ausrichter hat die Arbeit ausdrücklich auf seinen eigenen Rechner geholt, damit echte Abhängigkeiten wie three.js geladen werden können und daraus etwas werden kann, das sich sehen lässt.

Also fünf neue Vorschläge, diesmal im Raum.
Welcher davon wird in die Seite eingebaut?

## Answer

Fünf Enthüllungen liegen spielbereit in `prototypen/enthuellung/`.
Sie sind nicht fünf Anstriche derselben Idee, sondern fünf verschiedene Antworten auf dieselbe Frage.

**1 Staub.**
Sechsunddreißigtausend Körner tragen den ganzen Farbtopf, kreisen auseinander, werden nach innen gerissen und setzen sich zum Buchstaben.
Unterwegs wechseln alle Körner in die gezogene Farbe.

**2 Gommage.**
Die Farbe ist nicht da und wird es: eine Rauschschwelle läuft von unten nach oben, davor fliegt Staub in den Farben des Topfes heran und verschwindet in ihr.
Danach wird der Buchstabe aus derselben Fläche geholt.

**3 Prisma.**
Hinter einem geschliffenen Glasstein kreist der Farbtopf.
Der Stein bricht ihn mit echter Farbzerstreuung, wird langsamer, die Farben laufen in eine zusammen, dann fällt der Stein aus dem Bild.

**4 Kugeln.**
Siebenhundert Christbaumkugeln taumeln durcheinander, ordnen sich zum Buchstaben und lassen den Rest fallen.
Zum Schluss nehmen sie die gezogene Farbe samt Material an: Gold wird Metall, Glitzer bekommt Klarlack, Gestreift bekommt Streifen.

**5 Marmor.**
Alle achtundzwanzig Farben ziehen als Schlieren durcheinander wie marmoriertes Papier, beruhigen sich und laufen in eine Farbe zusammen.
Der Buchstabe steigt als nasse Prägung auf.

### Was für alle fünf gilt

Alle fünf spielen dieselbe Ziehung, damit verglichen wird und nicht geraten.
Farbe und Buchstabe lassen sich festhalten, denn die Frage ist nicht, ob eine Enthüllung bei Rot schön aussieht, sondern ob sie Schwarz, Weiß, Durchsichtig und Glitzer genauso trägt.

Die Farben kommen aus `src/pool.js`, nicht aus einer zweiten Liste.
Kommt eine Farbe in den Topf und fehlt ihr das Aussehen im Raum, bricht das Modul beim Laden ab, statt still mit Grau weiterzumachen.

Alle fünf enden an derselben Stelle: der Buchstabe wandert dorthin, wo die Seite ihn hinsetzt, und blendet dort aus.
Damit ist die Übergabe eine Überblendung und kein Sprung.
Genau daran ist die erste Runde gescheitert.

## Gewählt: Staub

Der Ausrichter hat Staub genommen.
Die anderen vier bleiben liegen, weil sie zeigen, wogegen Staub angetreten ist, nicht weil daraus noch etwas gewählt würde.

Eingebaut in `src/enthuellung.js`, nachgeladen von `src/app.js`.
Die Enthüllung läuft gleich, ob gerade gezogen wurde oder ein geteilter Link aufgeht.

### Die beiden Fragen, die daran hingen

**three.js wird mitgeliefert, nicht vom CDN geholt.**
Es liegt unter `vendor/three/` im Repository und wird von derselben Adresse ausgeliefert wie der Rest der Seite.
Kein Dritter bekommt die Anfragen der Gruppe zu sehen, und nichts kann ausfallen, ohne dass auch die Seite selbst ausgefallen wäre.
Geholt wird mit `npm run three-holen`, die Version steht im Skript.

Die Bibliothek selbst in der gepressten Fassung, die Beigaben nicht.
Zusammen sind das 204 Kilobyte über die Leitung und 872 Kilobyte im Repository.
Die Zahl 130, die beim Fragen genannt wurde, war falsch: sie galt nur für `three.module.js` und ließ `three.core.js` aus, das den größeren Teil ausmacht.

**Die Enthüllung läuft immer voll durch.**
Kein Überspringen bei Berührung, kein Merken je Link.
Die Ziehung ist der Moment, und der geteilte Link soll ihn jedes Mal bringen.

Bei `prefers-reduced-motion` steht das Ergebnis weiterhin sofort.
Das ist keine Abkürzung, sondern die Zusage an jemanden, der Bewegung nicht verträgt.

### Was passiert, wenn three.js nicht ankommt

Nichts Schlimmes.
`src/app.js` lädt die Enthüllung nach und fängt den Fehler ab: dann läuft der alte Lauf, Buchstaben und Farben wechseln zwei Sekunden lang, und danach steht das Ergebnis.
Geprüft, indem `vendor/` im Browser blockiert wurde.

### Geprüft in

Chromium, Firefox, WebKit und Edge, jeweils frisch gezogen und über einen geteilten Link, dazu ohne three.js und mit reduzierter Bewegung.
Dass der Buchstabe genau dort landet, wo die Seite ihn hinsetzt, wurde nachgemessen: der vorhergesagte Kasten liegt auf dem gezeichneten Buchstaben, auf Handybreite wie auf Fensterbreite.

## Was davon offen bleibt

- **Der Jahreswechsel im Januar.** Unverändert offen, siehe `map.md`.
- **Wie oft eine neue three.js-Fassung geholt wird.** Es gibt keinen Anlass, solange nichts klemmt. Die Version ist festgeschrieben und ändert sich nur, wenn jemand das Skript laufen lässt.
