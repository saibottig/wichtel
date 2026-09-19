/**
 * 4 - Taschenlampe
 *
 * Der Entwurf, der nichts zerstoert. Der Raum ist dunkel, die beiden Karten
 * haengen darin, und der Zeiger ist eine Lampe. Was der Kegel getroffen hat,
 * bleibt sichtbar, aber matt: gesehen ist nicht beleuchtet.
 *
 * Es wird nicht gedrueckt. Die Lampe folgt dem Finger, und am Telefon heisst
 * das: der Finger liegt auf und faehrt herum. Genau daran ist zu beurteilen,
 * ob das ohne Maus noch traegt.
 *
 * Der Reiz daran ist, dass der Buchstabe und die Farbe im selben Raum liegen
 * und nicht in zwei Kaestchen. Wer den Kegel wandern laesst, findet die Farbe,
 * ohne sie gesucht zu haben.
 */

import { RAUSCHEN } from '../enthuellung/rauschen.js';
import { spielbrettBauen } from './tuch.js';

export const meta = {
  titel: '4 · Taschenlampe',
  text: 'Ein dunkler Raum und eine Lampe am Finger. Der Kegel legt frei, was er trifft, und es bleibt matt sichtbar. Nichts geht dabei kaputt.',
  hinweis: 'Den Finger über die Fläche führen, ohne zu drücken.',
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

    /* Die Dunkelheit liegt ueber der ganzen Buehne und nicht nur ueber den
       Feldern. Das ist der Unterschied zu den anderen vier: hier ist nicht
       etwas zugedeckt, hier ist das Licht aus. */
    float frei = a < b ? uFrei.x : uFrei.y;
    float gesehen = max(texture2D(uMaske, vUv).r, rand < 0.0 ? frei : 0.0);

    /* Der Kegel. Eine harte Mitte, ein weicher Saum, und ein Zittern, das ihn
       von einem Kreis unterscheidet. */
    float kegel = 0.0;
    if (uZeiger.x >= 0.0) {
      float d = length((uv - uZeiger.xy) * vec2(0.5, 1.0));
      float flackern = 1.0 + snoise(vec3(uv * 8.0, uZeit * 1.6)) * 0.06;
      kegel = smoothstep(0.115, 0.0, d / flackern);
    }

    /* Gesehen ist matt, beleuchtet ist voll. Ohne diesen Unterschied ist die
       Lampe ein Radiergummi mit Umweg. */
    float licht = max(gesehen * 0.72, kegel);

    /* Fast ganz dicht. Bei 0.965 stand der Buchstabe als Schatten im
       Dunkeln, und damit war die Lampe nur noch Zierde. Ganz dicht heisst
       hier ganz dicht: das Licht ist aus, nicht gedimmt. */
    float dunkel = 1.0 - licht;
    vec3 nacht = vec3(0.035, 0.045, 0.062);

    /* Ein warmer Rand um den Kegel, damit das Licht von einer Lampe kommt und
       nicht von einem Loch im Bild. */
    nacht += vec3(0.16, 0.12, 0.05) * kegel * (1.0 - kegel) * 2.4;

    if (dunkel <= 0.004) discard;
    gl_FragColor = vec4(nacht * dunkel, dunkel);
  }
`;

export const bauen = ({ leinwand }) =>
  spielbrettBauen({
    leinwand,
    deckel: {
      fragment: FRAGMENT,
      // Der Kegel merkt sich schwach, wo er war. Wenig Druck, weil sonst ein
      // Streifen nach dem ersten Durchgang schon voll gelesen ist und das
      // Gedaechtnis wie Abwischen wirkt.
      pinsel: { radius: 0.1, weich: 1.0, druck: 0.3 },
      schwelle: 0.4,
      ohneDruck: true,
      lebhaft: true,
    },
  });
