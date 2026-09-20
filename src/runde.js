/**
 * Die Runde: ein benannter Archiv-Strang und sonst nichts.
 *
 * Die Seite steht allen offen, und mehrere Gruppen sollen darauf wichteln,
 * ohne sich die Historie der anderen einzufangen. Eine Runde entscheidet
 * ausschließlich, welche Datei die vergangenen Jahre füllt. Topf, Auslosung,
 * Filter und Token wissen nichts von ihr.
 *
 * Sie steht im Abfrageteil der Adresse, nicht hinter der Raute:
 *
 *   https://wichtel.turbodev.eu/?runde=geschwisterwichteln
 *
 * Die Raute ist als Ansichts-Grammatik bereits vollständig verplant, siehe
 * `view.js`, und ein Name darin wäre gegen einen Token nicht zu unterscheiden.
 * Der Abfrageteil reist außerdem von selbst mit jedem geteilten Link, weil
 * "Link kopieren" die ganze Adresse kopiert.
 *
 * Geprüft wird, nicht normalisiert. Passt der Parameter nicht, wird gar nicht
 * erst geholt: so kann keine Eingabe auf eine fremde Datei zeigen, und der
 * häufigste Fall, der fremde Besucher ohne Parameter, erzeugt weder
 * Netzwerkverkehr noch eine 404 in der Konsole.
 *
 * Einen Slug vergibt allein der Ausrichter, beim Anlegen der Datei. Die Regel
 * dafür steht in `CONTEXT.md` unter "Runde"; im Code hat sie keinen Platz,
 * weil die Seite selbst nie einen Namen entgegennimmt.
 */

/** Der Name des Abfrageparameters, unter dem die Runde reist. */
const RUNDEN_PARAMETER = 'runde';

/**
 * Der Slug ist der ganze Bezeichner: kleingeschrieben, ohne Punkte und ohne
 * Schrägstriche. Damit ist er zugleich ein unverdächtiger Dateiname.
 */
const SLUG = /^[a-z0-9-]{1,64}$/;

/**
 * Ist das ein Rundenname, wie ihn eine Datei im Archivverzeichnis trägt?
 * @param {unknown} slug
 * @returns {boolean}
 */
export const istRunde = (slug) => typeof slug === 'string' && SLUG.test(slug);

/**
 * Wo das Archiv dieser Runde liegt.
 *
 * Der Slug ist der ganze Dateiname, es gibt also keine Namenskonvention, die
 * man beim Anlegen falsch tippen könnte.
 *
 * @param {unknown} slug
 * @returns {string | null} Pfad, oder null, wenn nichts zu holen ist.
 */
export const archivPfad = (slug) => (istRunde(slug) ? `archiv/${slug}.json` : null);

/**
 * Liest die Runde aus einer Adresse.
 *
 * Nimmt die volle Adresse genauso an wie `location.search` allein. Ein
 * Fragezeichen hinter der Raute gehört zur Ansicht und nicht zur Abfrage.
 *
 * @param {string} adresse
 * @returns {string | null} Der Slug, oder null, wenn keiner dasteht oder er nicht passt.
 */
export const rundeAus = (adresse) => {
  const frage = adresse.indexOf('?');
  const raute = adresse.indexOf('#');
  if (frage === -1 || (raute !== -1 && raute < frage)) {
    return null;
  }
  const ende = raute === -1 ? adresse.length : raute;
  const wert = new URLSearchParams(adresse.slice(frage + 1, ende)).get(RUNDEN_PARAMETER);
  return istRunde(wert) ? wert : null;
};
