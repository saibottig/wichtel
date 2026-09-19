# Die Enthüllung in drei Dimensionen

Type: prototype
Status: needs decision

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

## Was noch zu entscheiden ist

- **Welche der fünf.**
  Das ist die eigentliche Frage dieses Tickets.

- **Ob three.js in die Seite darf.**
  Die Seite hat bis heute keinen Build-Schritt und lief bis zum 19. September 2026 ganz ohne Abhängigkeit.
  Playwright kam dazu, weil Animationen sonst nach Augenmaß ausgeliefert worden wären.
  Eine Bibliothek, die der Besucher lädt, ist etwas anderes als eine, die nur hier läuft: three.js kostet ihn rund 130 Kilobyte über die Leitung, gut 660 ausgepackt.
  Entweder das wird angenommen, oder die gewählte Enthüllung kommt ohne aus.
  Von den fünf ist Marmor die einzige, die sich ohne größeren Verlust nachbauen ließe, weil sie nur eine Fläche und einen Shader braucht.

- **Wer den Link zum fünften Mal öffnet.**
  Steht schon im Handoff und ist weiter offen: entweder Überspringen bei Berührung, oder einmal je Link und danach gemerkt.
  Jede der fünf dauert gut drei Sekunden.

- **Was bei `prefers-reduced-motion` passiert.**
  Die Vergleichsseite spielt dann nicht von selbst los, aber das ist eine Notlösung für den Vergleich.
  Die Seite selbst braucht einen ruhenden Endzustand, und den liefert jede der fünf schon, weil ihr letztes Bild genau das ist, was die Seite ohnehin zeigt.

## Wie geprüft wurde

Mit Playwright gegen alle fünf gleichzeitig, aufgespult statt abgespielt.
Durchgespielt mit Rot, Gestreift, Durchsichtig, Schwarz und Glitzer, jeweils über acht Zeitpunkte.

Gefunden und behoben wurden dabei unter anderem: ein Buchstabe, der halb aus dem Bild hing, weil vor dem Ausrichten gemessen wurde; Marmorierung, die als Farbgrieß ankam; Streifen, die im Raum steiler standen als auf der Seite; eine Dämpfung, die heller ausfiel als dieselbe Formel in CSS; und ein Lichtanteil, der aus Schwarz Mittelgrau machte.
Keiner dieser Fehler war am Endbild zu sehen.

Das Verfahren und die Fallen stehen in `docs/agents/animation.md`.
