/**
 * 2 - Geschenkpapier
 *
 * Dieselbe Aufgabe, eine andere Geste: nicht reiben, sondern reissen. Ein Zug
 * quer ueber das Feld genuegt, das Papier reisst mit einer ausgefransten Kante
 * auf, und die Raender rollen sich ein.
 *
 * Der Unterschied zum Rubbellos ist nicht die Oberflaeche, sondern die Zahl
 * der Bewegungen: hier eine entschiedene statt dreissig kleine. Am Telefon,
 * wo die Felder klein sind, ist das der ganze Unterschied zwischen einer
 * Enthuellung und einer Arbeit.
 */

import { RAUSCHEN } from '../enthuellung/rauschen.js';
import { spielbrettBauen } from './tuch.js';

export const meta = {
  titel: '2 · Geschenkpapier',
  text: 'Zwei eingepackte Felder, aufgerissen statt abgerubbelt. Ein Zug quer durch genügt, die Kante franst, die Ränder rollen sich ein.',
  hinweis: 'Quer über das Päckchen ziehen.',
};

const FRAGMENT =
  RAUSCHEN +
  /* glsl */ `
  uniform sampler2D uMaske;
  uniform vec2 uFrei;
  uniform vec3 uZeiger;
  uniform float uZeit;
  varying vec2 vUv;

  /* Papier: tiefrot mit cremefarbenen Schraegstreifen und Fasern darin. Die
     Streifen laufen ueber (x + y), damit sie ueber beide Felder durchlaufen
     und das Paeckchen wie ein Stueck Papier wirkt und nicht wie zwei. */
  vec3 papier(vec2 uv) {
    float schraeg = fract((uv.x * 0.5 + uv.y) * 13.0);
    float streifen = smoothstep(0.44, 0.5, schraeg) * smoothstep(0.96, 0.9, schraeg);
    vec3 rot = vec3(0.50, 0.075, 0.09);
    vec3 creme = vec3(0.93, 0.90, 0.83);
    vec3 ton = mix(rot, creme, streifen);

    float faser = snoise(vec3(uv * vec2(180.0, 360.0), 2.0)) * 0.035;
    ton += faser;

    /* Sterne auf den cremefarbenen Bahnen, sonst ist es Schlafanzugstoff. */
    vec2 raster = fract(vec2(uv.x * 0.5, uv.y) * 22.0) - 0.5;
    float stern = smoothstep(0.24, 0.05, length(raster * vec2(1.0, 1.0)));
    ton = mix(ton, rot * 1.5, stern * streifen * 0.5);
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

    /* Der Riss folgt grobem Rauschen, nicht dem Pinsel. Deshalb liegt die
       Amplitude hoch und die Frequenz tief: eine feinkoernige Kante ist
       abgerubbelt, eine grob gezackte ist gerissen. */
    float zacke = snoise(vec3(uv * vec2(14.0, 26.0), 0.0)) * 0.5
                + snoise(vec3(uv * vec2(46.0, 92.0), 7.0)) * 0.18;
    float weg = smoothstep(0.26, 0.40, m + zacke * 0.46);

    vec3 ton = papier(uv);

    /* Die Rolle: direkt vor dem Riss steht das Papier hoch, faengt Licht und
       wirft einen Schatten auf sich selbst. */
    float rolle = weg * (1.0 - weg) * 4.0;
    ton += rolle * 0.30;
    ton *= 1.0 - smoothstep(0.55, 0.95, weg) * 0.45;

    /* Ein Schatten auf das, was darunter liegt, waere Sache einer zweiten
       Flaeche. Hier genuegt der Rand: das Papier sitzt straff um das Feld. */
    ton *= 1.0 - smoothstep(-0.02, 0.0, rand) * 0.30;

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
      // Weit und weich: ein Zug soll reichen, und was er trifft, reisst auf
      // einer ganzen Bahn und nicht nur unter der Fingerspitze.
      pinsel: { radius: 0.052, weich: 0.9, druck: 0.5 },
      schwelle: 0.4,
    },
  });
