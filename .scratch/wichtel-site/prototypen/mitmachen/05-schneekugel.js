/**
 * 5 - Schneekugel
 *
 * Der Gegenentwurf zu den anderen vier, und er stellt die Frage, um die es
 * eigentlich geht: muessen Buchstabe und Farbe getrennt aufgedeckt werden?
 *
 * Hier nicht. In der Kugel liegt der Staub des ganzen Farbtopfes als Haufen am
 * Boden. Wer sie schuettelt, wirbelt ihn auf, und wenn die Hand aufhoert,
 * setzt er sich zum Buchstaben und nimmt dabei die gezogene Farbe an. Eine
 * Geste, eine Antwort.
 *
 * Es ist derselbe Staub, der in `src/enthuellung.js` von selbst laeuft. Der
 * Unterschied ist nur, wer ihn ausloest.
 */

import * as THREE from 'three';

import { RAUSCHEN } from '../enthuellung/rauschen.js';
import { glyphWolke, glyphMasse } from '../enthuellung/glyph.js';
import { farbwolke, ganzerTopf, leitfarbe } from '../enthuellung/farben3d.js';
import { landeplatz, spanne, easeInOut, zufallAus } from '../enthuellung/buehne.js';
import { HOEHE_WELT, BREITE_WELT } from './tuch.js';

export const meta = {
  titel: '5 · Schneekugel',
  text: 'Der ganze Farbtopf als Staub am Boden einer Kugel. Schütteln wirbelt ihn auf, Loslassen setzt ihn zum Buchstaben und in die gezogene Farbe. Eine Geste für beides.',
  hinweis: 'Die Kugel greifen und schütteln.',
};

const KOERNER = 9000;
const KUGEL = 0.33; // Radius in Welteinheiten
const KUGEL_Y = 0.33; // Mitte der Kugel, ueber dem Sockel

const VERTEX =
  RAUSCHEN +
  /* glsl */ `
  uniform float uWirbel;
  uniform float uGesetzt;
  uniform float uZeit;
  uniform float uSkala;
  uniform float uFarbwechsel;
  uniform float uMasse;
  uniform vec3 uVersatz;
  uniform float uAbgang;
  uniform vec3 uZielfarbe;

  attribute vec3 aZiel;
  attribute vec3 aHaufen;
  attribute vec3 aAchse;
  attribute float aRadius;
  attribute float aDreh;
  attribute float aKorn;
  attribute vec3 aFarbe;

  varying vec3 vFarbe;
  varying float vStaerke;

  void main() {
    /* Drei Zustaende, zwei Mischungen: der Haufen am Boden, der Buchstabe, und
       darueber der Wirbel. Wer schuettelt, hebt den Wirbel; wer aufhoert,
       laesst ihn fallen, und darunter ist inzwischen der Buchstabe. */
    vec3 ruhe = mix(aHaufen, aZiel, uGesetzt);

    /* Jedes Korn kreist auf seiner eigenen Kugelschale um die Senkrechte.
       Eine gemeinsame Kreisbahn ueber alle Koerner ergibt einen Ring, und der
       sieht schon nach einer Form aus, bevor eine da sein darf. */
    float winkel = aDreh + uZeit * (1.5 + aRadius * 1.2);
    float s = sin(winkel);
    float c = cos(winkel);
    vec3 wirbel = vec3(
      aAchse.x * c - aAchse.z * s,
      aAchse.y + sin(uZeit * 1.7 + aDreh) * 0.12,
      aAchse.x * s + aAchse.z * c
    ) * aRadius;
    wirbel += vec3(
      snoise(aAchse * 2.2 + uZeit * 0.9),
      snoise(aAchse * 2.2 + 11.3 + uZeit * 0.8),
      snoise(aAchse * 2.2 + 27.9 + uZeit * 1.1)
    ) * 0.12;

    vec3 p = mix(ruhe, wirbel, uWirbel);

    /* Im Glas bleiben. Ohne das haengt bei starkem Schuetteln ein Drittel des
       Staubes ausserhalb der Kugel in der Luft. */
    float r = length(p);
    if (r > 0.94) p *= 0.94 / r;

    p = p * ${KUGEL.toFixed(3)} + vec3(0.0, ${KUGEL_Y.toFixed(3)}, 0.0);
    p = p * uMasse + uVersatz;

    vFarbe = mix(aFarbe, uZielfarbe, uFarbwechsel);
    vStaerke = mix(0.9, 0.62, uWirbel) * (1.0 - uAbgang);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = max(aKorn * uSkala * uMasse, 1.0);
  }
`;

const FRAGMENT = /* glsl */ `
  varying vec3 vFarbe;
  varying float vStaerke;
  void main() {
    vec2 d = gl_PointCoord - 0.5;
    float r2 = dot(d, d);
    if (r2 > 0.25) discard;
    float weich = smoothstep(0.25, 0.02, r2);
    float a = weich * vStaerke;
    /* Vorgewichtet, weil der Browser die Leinwand vorgewichtet
       zusammensetzt. Nicht vorgewichtet geschrieben, wird jeder weiche
       Kornrand zu hell, und das sieht nach schlechter Textur aus. */
    gl_FragColor = vec4(vFarbe * a, a);
  }
`;

/** Glas, Sockel und Lichter, hinter und vor dem Staub. */
const GLAS_FRAGMENT = /* glsl */ `
  uniform float uVorne;
  uniform float uDeckung;
  varying vec2 vUv;

  void main() {
    vec2 p = vec2((vUv.x - 0.5) * ${BREITE_WELT.toFixed(2)},
                  (vUv.y - 0.5) * ${HOEHE_WELT.toFixed(2)});
    float d = length(p - vec2(0.0, ${KUGEL_Y.toFixed(3)})) / ${KUGEL.toFixed(3)};

    vec3 ton = vec3(0.0);
    float a = 0.0;

    if (uVorne < 0.5) {
      /* Hinten: der Sockel und das Wasser im Glas.

         Das Wasser ist fast klar. Dichter gelegt ist die Kugel eine graue
         Murmel, und der Staub darin verliert seine Farben. */
      float oben = ${(KUGEL_Y - KUGEL).toFixed(3)} + 0.035;
      float unten = oben - 0.20;
      float halb = 0.25 + (oben - p.y) * 0.30;
      if (p.y < oben && p.y > unten && abs(p.x) < halb) {
        float rund = 1.0 - abs(p.x) / halb;
        ton = mix(vec3(0.17, 0.10, 0.055), vec3(0.42, 0.27, 0.15), pow(rund, 0.7));
        /* Der Schatten der Kugel auf ihrem Sockel. */
        ton *= 1.0 - smoothstep(0.08, 0.0, oben - p.y) * 0.45;
        a = 1.0;
      }

      /* Das Glas liegt ueber dem Sockel, also wird es darueber gelegt und
         nicht mit ihm gemischt: gemischt bekaeme der Sockel dort, wo die
         Kugel ihn ueberdeckt, die Deckung des Wassers. */
      float innen = smoothstep(1.0, 0.985, d) * 0.55;
      vec3 wasser = mix(vec3(0.99, 0.995, 1.0), vec3(0.84, 0.89, 0.93), smoothstep(0.4, 1.0, d));
      float zusammen = innen + a * (1.0 - innen);
      ton = zusammen > 0.0 ? (wasser * innen + ton * a * (1.0 - innen)) / zusammen : ton;
      a = zusammen;
    } else {
      /* Vorne: die Kante des Glases und zwei Lichter darauf. */
      float kante = smoothstep(1.02, 0.995, d) * smoothstep(0.93, 0.99, d);
      float licht = smoothstep(0.34, 0.0,
        length((p - vec2(-0.13, ${KUGEL_Y.toFixed(3)} + 0.14)) * vec2(1.6, 1.0)));
      float streif = smoothstep(0.12, 0.0,
        length((p - vec2(0.17, ${KUGEL_Y.toFixed(3)} - 0.12)) * vec2(2.6, 0.7)));
      ton = vec3(1.0);
      a = kante * 0.55 + (licht * 0.16 + streif * 0.22) * smoothstep(1.0, 0.96, d);
    }

    a *= uDeckung;
    if (a <= 0.004) discard;
    gl_FragColor = vec4(ton * a, a);
  }
`;

const GLAS_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const bauen = ({ leinwand }) => {
  const renderer = new THREE.WebGLRenderer({
    canvas: leinwand,
    alpha: true,
    antialias: true,
    premultipliedAlpha: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.NoToneMapping;

  const szene = new THREE.Scene();
  const kamera = new THREE.OrthographicCamera(
    -BREITE_WELT / 2,
    BREITE_WELT / 2,
    HOEHE_WELT / 2,
    -HOEHE_WELT / 2,
    0.1,
    10,
  );
  kamera.position.z = 5;

  const glasMaterial = (vorne) =>
    new THREE.ShaderMaterial({
      vertexShader: GLAS_VERTEX,
      fragmentShader: GLAS_FRAGMENT,
      uniforms: { uVorne: { value: vorne ? 1 : 0 }, uDeckung: { value: 1 } },
      transparent: true,
      depthWrite: false,
    });

  const hinten = new THREE.Mesh(
    new THREE.PlaneGeometry(BREITE_WELT, HOEHE_WELT),
    glasMaterial(false),
  );
  hinten.position.z = -0.1;
  szene.add(hinten);

  const geometrie = new THREE.BufferGeometry();
  const ziel = new Float32Array(KOERNER * 3);
  const haufen = new Float32Array(KOERNER * 3);
  const achse = new Float32Array(KOERNER * 3);
  const farbe = new Float32Array(KOERNER * 3);
  const radius = new Float32Array(KOERNER);
  const dreh = new Float32Array(KOERNER);
  const korn = new Float32Array(KOERNER);

  for (let i = 0; i < KOERNER; i += 1) {
    radius[i] = 0.25 + Math.random() ** 0.8 * 0.68;
    dreh[i] = Math.random() * Math.PI * 2;
    korn[i] = 0.0055 + Math.random() ** 2.2 * 0.009;

    // Eine gleichmaessig gestreute Richtung auf der Einheitskugel. Mit drei
    // unabhaengigen Zufallszahlen lagen die Koerner in den Ecken eines
    // Wuerfels statt auf einer Kugel.
    const z = Math.random() * 2 - 1;
    const phi = Math.random() * Math.PI * 2;
    const ring = Math.sqrt(1 - z * z);
    achse[i * 3] = Math.cos(phi) * ring;
    achse[i * 3 + 1] = z;
    achse[i * 3 + 2] = Math.sin(phi) * ring;

    // Der Haufen am Boden: eine flache Schicht, die der Rundung des Glases
    // folgt. Gerade gelegt haengt sie an den Seiten aus der Kugel heraus.
    const b = (Math.random() * 2 - 1) * 0.86;
    haufen[i * 3] = b;
    haufen[i * 3 + 1] = -Math.sqrt(Math.max(0, 1 - b * b)) * 0.93 + Math.random() ** 1.2 * 0.34;
    haufen[i * 3 + 2] = (Math.random() - 0.5) * 0.4;
  }

  geometrie.setAttribute('position', new THREE.BufferAttribute(ziel, 3));
  geometrie.setAttribute('aZiel', new THREE.BufferAttribute(ziel, 3));
  geometrie.setAttribute('aHaufen', new THREE.BufferAttribute(haufen, 3));
  geometrie.setAttribute('aAchse', new THREE.BufferAttribute(achse, 3));
  geometrie.setAttribute('aFarbe', new THREE.BufferAttribute(farbe, 3));
  geometrie.setAttribute('aRadius', new THREE.BufferAttribute(radius, 1));
  geometrie.setAttribute('aDreh', new THREE.BufferAttribute(dreh, 1));
  geometrie.setAttribute('aKorn', new THREE.BufferAttribute(korn, 1));
  geometrie.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 6);

  const material = new THREE.ShaderMaterial({
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    uniforms: {
      uWirbel: { value: 0 },
      uGesetzt: { value: 0 },
      uZeit: { value: 0 },
      uSkala: { value: 600 },
      uFarbwechsel: { value: 0 },
      uMasse: { value: 1 },
      uVersatz: { value: new THREE.Vector3() },
      uAbgang: { value: 0 },
      uZielfarbe: { value: new THREE.Color(0xffffff) },
    },
    transparent: true,
    depthWrite: false,
  });

  const wolke = new THREE.Points(geometrie, material);
  szene.add(wolke);

  const vorne = new THREE.Mesh(
    new THREE.PlaneGeometry(BREITE_WELT, HOEHE_WELT),
    glasMaterial(true),
  );
  vorne.position.z = 0.2;
  szene.add(vorne);

  let platz = { hoehe: 0.3, x: 0, y: -0.7 };
  let zielMasse = 1;

  // Der Zustand des Schuettelns. Kein Fortschritt von aussen, sondern was die
  // Hand hinterlassen hat.
  let energie = 0;
  let genug = false;
  let gesetzt = 0;
  let letzter = null;

  const groesse = (breite, hoehe) => {
    renderer.setSize(breite, hoehe, false);
    // Punktgroessen sind Bildpunkte, Koerner sind Welteinheiten. Bei einer
    // geraden Kamera ist der Faktor fest und haengt nur an der Bildhoehe.
    material.uniforms.uSkala.value = (hoehe * renderer.getPixelRatio()) / HOEHE_WELT;
  };

  const bereit = ({ buchstabe, farbe: farbname }) => {
    const punkte = glyphWolke(buchstabe, KOERNER);
    const topf = ganzerTopf();
    const eigene = farbwolke(farbname);

    for (let i = 0; i < KOERNER; i += 1) {
      ziel[i * 3] = punkte[i * 2] * 0.9;
      ziel[i * 3 + 1] = punkte[i * 2 + 1] * 0.9;
      ziel[i * 3 + 2] = (Math.random() - 0.5) * 0.14;

      const gewaehlt = Math.random() < 0.08 ? zufallAus(eigene) : zufallAus(topf);
      farbe[i * 3] = gewaehlt.r;
      farbe[i * 3 + 1] = gewaehlt.g;
      farbe[i * 3 + 2] = gewaehlt.b;
    }
    geometrie.attributes.aZiel.needsUpdate = true;
    geometrie.attributes.position.needsUpdate = true;
    geometrie.attributes.aFarbe.needsUpdate = true;

    platz = landeplatz(buchstabe, HOEHE_WELT);
    // Der Buchstabe steht in der Kugel auf 0.9 von KUGEL, und `glyphMasse`
    // misst im Quadrat von -1 bis 1. Danach richtet sich die Endgroesse.
    zielMasse = platz.hoehe / (glyphMasse(buchstabe).hoehe * 0.9 * KUGEL);

    material.uniforms.uZielfarbe.value.copy(leitfarbe(farbname));
    material.uniforms.uWirbel.value = 0;
    material.uniforms.uGesetzt.value = 0;
    material.uniforms.uFarbwechsel.value = 0;
    material.uniforms.uMasse.value = 1;
    material.uniforms.uVersatz.value.set(0, 0, 0);
    material.uniforms.uAbgang.value = 0;
    hinten.material.uniforms.uDeckung.value = 1;
    vorne.material.uniforms.uDeckung.value = 1;

    energie = 0;
    genug = false;
    gesetzt = 0;
    letzter = null;
  };

  const zeiger = (punkt) => {
    if (!punkt || !punkt.gedrueckt) {
      letzter = null;
      return;
    }
    if (letzter) {
      // Nur die Bewegung zaehlt, nicht das Halten. Eine Kugel, die vom
      // Anfassen allein schneit, wirkt wie ein Knopf.
      const weite = Math.hypot((punkt.u - letzter.u) * 0.5, punkt.v - letzter.v);
      energie = Math.min(1, energie + weite * 2.6);
    }
    letzter = { u: punkt.u, v: punkt.v };
  };

  const schritt = (sekunden, dauer) => {
    energie = Math.max(0, energie - dauer * 0.5);
    if (energie >= 0.99) genug = true;
    if (genug && energie < 0.35) gesetzt = Math.min(1, gesetzt + dauer * 0.7);

    material.uniforms.uZeit.value = sekunden;
    material.uniforms.uWirbel.value = energie;
    material.uniforms.uGesetzt.value = easeInOut(gesetzt);
    material.uniforms.uFarbwechsel.value = easeInOut(gesetzt);
  };

  const fortschritt = () => {
    const anteil = genug ? 0.5 + 0.5 * gesetzt : 0.5 * energie;
    return { buchstabe: anteil, farbe: anteil, fertig: gesetzt >= 1 };
  };

  const landen = (t) => {
    const flug = easeInOut(spanne(t, 0, 0.72));
    material.uniforms.uMasse.value = 1 + (zielMasse - 1) * flug;
    material.uniforms.uVersatz.value.set(
      (platz.x - 0) * flug,
      (platz.y - KUGEL_Y * (1 + (zielMasse - 1) * flug)) * flug,
      0,
    );
    material.uniforms.uAbgang.value = spanne(t, 0.72, 1);
    const glas = 1 - spanne(t, 0.0, 0.45);
    hinten.material.uniforms.uDeckung.value = glas;
    vorne.material.uniforms.uDeckung.value = glas;
  };

  const rendern = () => renderer.render(szene, kamera);

  const freigeben = () => {
    geometrie.dispose();
    material.dispose();
    hinten.geometry.dispose();
    hinten.material.dispose();
    vorne.geometry.dispose();
    vorne.material.dispose();
    renderer.dispose();
  };

  return {
    groesse,
    bereit,
    zeiger,
    schritt,
    fortschritt,
    landen,
    rendern,
    freigeben,
    lebhaft: true,
  };
};
