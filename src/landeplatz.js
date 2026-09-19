/**
 * Wo der Buchstabe der Seite steht, in Zahlen.
 *
 * Die Enthuellung endet damit, dass der Buchstabe genau dorthin laeuft, wo die
 * Seite ihn gleich darauf hinsetzt, und dort ausblendet. Sonst sieht man zwei
 * Buchstaben und einen Sprung.
 *
 * Geraten geht das nicht. Bei `line-height: 1.1` ist die Zeile hoeher als die
 * Schrift, und die Schrift sitzt darin nicht mittig, sondern an ihrer
 * Grundlinie. Wo die liegt, weiss nur die Schrift selbst. Hier steht deshalb
 * nur die Rechnung; die Masse kommen gemessen von aussen herein.
 */

/**
 * Der Kasten, den die Tusche eines Buchstabens tatsaechlich einnimmt.
 *
 * @param {{ links: number, oben: number, hoehe: number }} zeile
 *   Der Zeilenkasten in Bildpunkten, so wie ihn `getBoundingClientRect` liefert.
 * @param {number} grad Die Schriftgroesse in Bildpunkten.
 * @param {{ fontAufstieg: number, fontAbstieg: number, aufstieg: number,
 *           abstieg: number, links: number, rechts: number }} masse
 *   Die Masse der Schrift, jeweils als Vielfaches der Schriftgroesse.
 * @returns {{ x: number, y: number, hoehe: number }} Mitte und Hoehe in Bildpunkten.
 */
export const tuscheKasten = (zeile, grad, masse) => {
  // Der Ueberhang der Zeile verteilt sich gleichmaessig nach oben und unten.
  // Ist die Zeile niedriger als die Schrift, ist er negativ, und die Schrift
  // ragt heraus. Beides kommt vor und beides rechnet sich gleich.
  const ueberhang = (zeile.hoehe - (masse.fontAufstieg + masse.fontAbstieg) * grad) / 2;
  const grundlinie = zeile.oben + ueberhang + masse.fontAufstieg * grad;

  return {
    x: zeile.links + ((masse.rechts - masse.links) * grad) / 2,
    y: grundlinie + ((masse.abstieg - masse.aufstieg) * grad) / 2,
    hoehe: (masse.aufstieg + masse.abstieg) * grad,
  };
};

/**
 * Rechnet einen Kasten der Seite in Welteinheiten der Kamera um.
 *
 * Die Kamera ist so gesetzt, dass `hoeheWelt` Einheiten senkrecht ins Bild
 * passen. Der Ursprung liegt in der Mitte des Fensters, und y zeigt nach oben,
 * die Seite dagegen zaehlt von oben nach unten.
 *
 * @param {{ x: number, y: number, hoehe: number }} kasten in Bildpunkten
 * @param {{ breite: number, hoehe: number }} fenster in Bildpunkten
 * @param {number} hoeheWelt
 */
export const inWelt = (kasten, fenster, hoeheWelt) => {
  const jePixel = hoeheWelt / fenster.hoehe;
  return {
    x: (kasten.x - fenster.breite / 2) * jePixel,
    y: (fenster.hoehe / 2 - kasten.y) * jePixel,
    hoehe: kasten.hoehe * jePixel,
  };
};
