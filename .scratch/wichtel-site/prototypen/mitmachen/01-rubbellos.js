/**
 * 1 - Rubbellos
 *
 * Das Naheliegende, und deshalb der Massstab fuer die anderen vier: zwei
 * Felder unter Silberfolie, jedes einzeln freizurubbeln. Die Geste ist das
 * Hin und Her, die Kante ist hart, und was abgeht, bleibt als Kruemel am Rand
 * liegen.
 *
 * Ueber der Haelfte springt ein Feld von selbst ganz auf. Niemand rubbelt eine
 * Flaeche vollstaendig frei, und wer es muesste, hoert vorher auf und haelt
 * die Enthuellung fuer kaputt.
 */

import { RAUSCHEN } from '../enthuellung/rauschen.js';
import { spielbrettBauen } from './tuch.js';

export const meta = {
  titel: '1 · Rubbellos',
  text: 'Silberfolie über beiden Feldern, hart abgerubbelt. Die Geste ist das Hin und Her, die Kante bricht körnig, die Krümel bleiben am Rand liegen.',
  hinweis: 'Über die Folie streichen.',
};

const FRAGMENT =
  RAUSCHEN +
  /* glsl */ `
  uniform sampler2D uMaske;
  uniform vec2 uFrei;
  uniform vec3 uZeiger;
  uniform float uZeit;
  varying vec2 vUv;

  /* Gebuerstetes Silber: ein Grundton, feine Striche in Laufrichtung, ein
     schraeger Glanz darueber. Ohne die Striche sieht Folie aus wie graues
     Papier. */
  vec3 folie(vec2 uv) {
    float strich = snoise(vec3(uv * vec2(38.0, 620.0), 0.0)) * 0.055;
    float grob = snoise(vec3(uv * vec2(9.0, 17.0), 4.0)) * 0.05;
    float glanz = 0.5 + 0.5 * sin((uv.x * 1.9 + uv.y * 0.9) * 11.0);
    vec3 ton = vec3(0.70, 0.72, 0.745) + strich + grob;
    ton += vec3(0.085, 0.082, 0.075) * pow(glanz, 3.0);

    /* Ein blasses Gitter, damit die Flaeche als bedruckte Folie gelesen wird
       und nicht als Fehler im Bild. */
    float gitter = step(0.93, fract((uv.x * 0.5 + uv.y) * 26.0))
                 + step(0.93, fract((uv.x * 0.5 - uv.y) * 26.0));
    ton -= gitter * 0.028;
    return ton;
  }

  void main() {
    vec2 uv = vec2(vUv.x, 1.0 - vUv.y);
    float a = feldRand(uv, FELD_A);
    float b = feldRand(uv, FELD_B);
    float rand = min(a, b);
    if (rand > 0.0) discard;

    float frei = a < b ? uFrei.x : uFrei.y;
    float m = max(texture2D(uMaske, vUv).r, frei);

    /* Das Korn entscheidet, wo die Folie zuerst bricht. Ohne es laeuft eine
       saubere Rundung mit, und die sieht nach Radiergummi aus statt nach
       Folie. */
    float korn = snoise(vec3(uv * vec2(150.0, 300.0), 0.0)) * 0.5
               + snoise(vec3(uv * vec2(44.0, 88.0), 9.0)) * 0.25;
    float weg = smoothstep(0.30, 0.46, m + korn * 0.30);

    vec3 ton = folie(uv);

    /* Kruemel: kurz vor dem Durchbruch wird die Folie dunkler und rauher. */
    float kante = weg * (1.0 - weg) * 4.0;
    ton -= kante * 0.18;
    ton += kante * 0.12 * step(0.55, korn + 0.5);

    /* Ein Schatten nach innen, damit die Folie aufgeklebt wirkt. */
    ton *= 1.0 - smoothstep(-0.012, 0.0, rand) * 0.35;

    float deckung = (1.0 - weg) * smoothstep(0.0, -0.0025, rand);
    if (deckung <= 0.003) discard;
    gl_FragColor = vec4(ton * deckung, deckung);
  }
`;

export const bauen = ({ leinwand }) =>
  spielbrettBauen({
    leinwand,
    deckel: {
      fragment: FRAGMENT,
      pinsel: { radius: 0.026, weich: 0.5, druck: 0.9 },
      schwelle: 0.5,
    },
  });
