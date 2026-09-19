/**
 * 3 - Beschlagene Scheibe
 *
 * Kein Material, das kaputtgeht, sondern eines, das zurueckkommt. Hinter einer
 * beschlagenen Fensterscheibe liegen die beiden Felder, und die flache Hand
 * wischt sie frei. Wo gewischt wurde, laufen Tropfen ab, und am Rand der
 * gewischten Stelle zieht der Beschlag langsam wieder zu.
 *
 * Damit steht hier eine Frage zur Wahl, die die anderen vier nicht stellen:
 * darf eine Enthuellung umkehrbar sein? Sie ist weicher und schoener, und sie
 * nimmt in Kauf, dass jemand zu langsam wischt und nichts erreicht.
 */

import { RAUSCHEN } from '../enthuellung/rauschen.js';
import { spielbrettBauen } from './tuch.js';

export const meta = {
  titel: '3 · Beschlagene Scheibe',
  text: 'Die Felder liegen hinter angelaufenem Glas. Die flache Hand wischt frei, Tropfen laufen ab, und der Beschlag zieht langsam wieder zu.',
  hinweis: 'Mit der Hand über das Glas wischen.',
};

const FRAGMENT =
  RAUSCHEN +
  /* glsl */ `
  uniform sampler2D uMaske;
  uniform vec2 uFrei;
  uniform vec3 uZeiger;
  uniform float uZeit;
  varying vec2 vUv;

  void main() {
    vec2 uv = vec2(vUv.x, 1.0 - vUv.y);
    float a = feldRand(uv, FELD_A);
    float b = feldRand(uv, FELD_B);
    float rand = min(a, b);
    if (rand > 0.0) discard;

    float frei = a < b ? uFrei.x : uFrei.y;
    float m = max(texture2D(uMaske, vUv).r, frei);

    /* Tropfen: was oberhalb frei gewischt wurde, laeuft nach unten ab und
       nimmt dort den Beschlag mit. Gerechnet ueber ein paar Abgriffe nach
       oben, gewichtet mit einer schmalen Bahn, damit Spuren entstehen und
       keine Schleier. */
    float bahn = snoise(vec3(uv.x * 90.0, 0.0, 3.0));
    float spur = smoothstep(0.55, 0.95, bahn);
    float lauf = 0.0;
    for (int i = 1; i <= 5; i += 1) {
      float d = float(i) * 0.012;
      lauf = max(lauf, texture2D(uMaske, vUv + vec2(0.0, d)).r * (1.0 - float(i) * 0.16));
    }
    m = max(m, lauf * spur * 0.85);

    /* Der Beschlag selbst: kalte, fast weisse Milch mit grobem Atem darin. */
    float atem = fbm(vec3(uv * vec2(7.0, 13.0), uZeit * 0.05)) * 0.5 + 0.5;
    vec3 milch = mix(vec3(0.86, 0.90, 0.93), vec3(0.97, 0.98, 1.0), atem);

    /* Weich, und zwar auf beiden Achsen: die Deckung laeuft langsam aus, und
       der Rand der gewischten Stelle bleibt trueb statt zu brechen.

       Fast ganz dicht, nicht nur beinahe: bei 0.94 stand der Buchstabe als
       grauer Schatten im Beschlag, und eine Decke, durch die man die Antwort
       liest, ist keine. */
    float weg = smoothstep(0.12, 0.72, m);
    float deckung = (1.0 - weg) * 0.997;

    /* Wo der Finger gerade steht, ist die Scheibe nass und spiegelt. */
    float nass = 0.0;
    if (uZeiger.z > 0.5) {
      float d = length((uv - uZeiger.xy) * vec2(0.5, 1.0));
      nass = smoothstep(0.075, 0.0, d);
    }
    milch += nass * 0.06;

    /* Am Glasrand steht der Beschlag am dichtesten, dort kommt er auch als
       erstes zurueck. Schmal gehalten: breiter gelegt wird daraus ein
       weisser Rahmen um die Karte, und der sieht aus wie ein Bauteil. */
    deckung = mix(deckung, 0.997, smoothstep(-0.012, -0.001, rand) * 0.45);
    deckung *= smoothstep(0.0, -0.0025, rand);
    if (deckung <= 0.004) discard;
    gl_FragColor = vec4(milch * deckung, deckung);
  }
`;

export const bauen = ({ leinwand }) =>
  spielbrettBauen({
    leinwand,
    deckel: {
      fragment: FRAGMENT,
      // Die flache Hand, nicht die Fingerspitze: weit, weich, und ohne viel
      // Druck, weil erst mehrere Zuege ueber dieselbe Stelle klar werden.
      pinsel: { radius: 0.06, weich: 1.0, druck: 0.42 },
      schwelle: 0.46,
      // Zieht wieder zu. Der Wert ist so gesetzt, dass ein ruhiger Wisch
      // gewinnt und eine vergessene Karte nach einer halben Minute wieder
      // blind ist.
      abklingen: 0.055,
      lebhaft: true,
    },
  });
