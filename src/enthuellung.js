/**
 * Die Enthuellung: Staub.
 *
 * Sechsunddreissigtausend Staubkoerner tragen den ganzen Farbtopf. Sie kreisen
 * auseinander, werden nach innen gezogen und setzen sich zum gezogenen
 * Buchstaben zusammen. Waehrend sie einlaufen, wechseln alle Koerner nach und
 * nach in die gezogene Farbe: aus achtundzwanzig Moeglichkeiten wird eine,
 * sichtbar und nicht behauptet.
 *
 * Zum Schluss schrumpft der Buchstabe genau auf die Stelle, an der die Seite
 * ihn hinsetzt, und blendet dort aus. Die Uebergabe ist damit eine
 * Ueberblendung und kein Sprung.
 *
 * Dieses Modul wird von `app.js` nachgeladen, nicht mitgeladen. Wer es nicht
 * bekommt, weil das Geraet kein WebGL kann oder die Dateien nicht ankommen,
 * sieht den alten Lauf und dann sein Ergebnis. Die Seite haengt nicht daran.
 *
 * Die Auswahl unter fuenf Entwuerfen steht in
 * `.scratch/wichtel-site/issues/10-enthuellung-in-drei-dimensionen.md`,
 * die Fallen beim Bauen in `docs/agents/animation.md`.
 */

import * as THREE from '../vendor/three/three.module.min.js';
import { EffectComposer } from '../vendor/three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from '../vendor/three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from '../vendor/three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from '../vendor/three/addons/postprocessing/OutputPass.js';

import { tuscheKasten, inWelt } from './landeplatz.js';
import { koernerVon, ganzerTopf, leitfarbe } from './farbkoerner.js';

const KOERNER = 36000;
const HOEHE_WELT = 4.3;
const ABSTAND = 5;
const SPREIZUNG = 1.32;

/** Wie lange die Enthuellung dauert, und wann die Seite uebernimmt. */
export const DAUER = 3200;
const LANDUNG = 0.87;

const SCHRIFT = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

// ---------------------------------------------------------------------------
// Der Buchstabe als Form
// ---------------------------------------------------------------------------

/** Zeichnet den Buchstaben mittig und moeglichst gross auf eine Leinwand. */
const glyphLeinwand = (buchstabe, groesse) => {
  const leinwand = document.createElement('canvas');
  leinwand.width = groesse;
  leinwand.height = groesse;
  const g = leinwand.getContext('2d', { willReadFrequently: true });

  // Ausrichtung vor dem Messen, nicht danach: die Masse werden vom Ankerpunkt
  // aus genommen, und der verschiebt sich mit `textAlign`.
  g.textAlign = 'center';
  g.textBaseline = 'alphabetic';

  const messen = (grad) => {
    g.font = `800 ${grad}px ${SCHRIFT}`;
    const m = g.measureText(buchstabe);
    return {
      breite: m.actualBoundingBoxLeft + m.actualBoundingBoxRight,
      hoehe: m.actualBoundingBoxAscent + m.actualBoundingBoxDescent,
      oben: m.actualBoundingBoxAscent,
      unten: m.actualBoundingBoxDescent,
      links: m.actualBoundingBoxLeft,
      rechts: m.actualBoundingBoxRight,
    };
  };

  const bezug = groesse * 0.5;
  const erst = messen(bezug);
  const passend = (bezug * groesse * 0.82) / Math.max(erst.breite, erst.hoehe);
  const fertig = messen(passend);

  g.clearRect(0, 0, groesse, groesse);
  g.fillStyle = '#ffffff';
  g.fillText(
    buchstabe,
    groesse / 2 - (fertig.rechts - fertig.links) / 2,
    groesse / 2 + (fertig.oben - fertig.unten) / 2,
  );

  return { leinwand, masse: fertig, passend };
};

/**
 * Der Buchstabe als Punktwolke, `anzahl` Punkte in einem Quadrat von -1 bis 1.
 *
 * Gezogen wird mit Zuruecklegen und einem Zittern innerhalb des Bildpunktes.
 * Ein Buchstabe hat wenige tausend gefuellte Felder, die Wolke aber zehnmal so
 * viele Punkte, und ohne das Zittern saessen sie sichtbar in Reihen.
 */
const glyphWolke = (buchstabe, anzahl) => {
  const aufloesung = 256;
  const { leinwand } = glyphLeinwand(buchstabe, aufloesung);
  const daten = leinwand
    .getContext('2d', { willReadFrequently: true })
    .getImageData(0, 0, aufloesung, aufloesung).data;

  const felder = [];
  for (let y = 0; y < aufloesung; y += 1) {
    for (let x = 0; x < aufloesung; x += 1) {
      if (daten[(y * aufloesung + x) * 4 + 3] > 140) felder.push([x, y]);
    }
  }

  const punkte = new Float32Array(anzahl * 2);
  let hoehe = 0;
  for (let i = 0; i < anzahl; i += 1) {
    const [x, y] = felder[(Math.random() * felder.length) | 0];
    punkte[i * 2] = ((x + Math.random()) / aufloesung) * 2 - 1;
    punkte[i * 2 + 1] = 1 - ((y + Math.random()) / aufloesung) * 2;
  }

  // Wie hoch der Buchstabe in diesem Quadrat tatsaechlich steht. Ein W fuellt
  // die Breite aus und bleibt in der Hoehe darunter.
  const rand = felder.reduce(
    (a, [, y]) => ({ oben: Math.min(a.oben, y), unten: Math.max(a.unten, y) }),
    { oben: aufloesung, unten: 0 },
  );
  hoehe = ((rand.unten - rand.oben + 1) / aufloesung) * 2;

  return { punkte, hoehe };
};

/** Die Masse der Schrift, als Vielfache der Schriftgroesse. */
const schriftMasse = (buchstabe, familie, gewicht) => {
  const g = document.createElement('canvas').getContext('2d');
  g.textAlign = 'left';
  g.textBaseline = 'alphabetic';
  g.font = `${gewicht} 100px ${familie}`;
  const m = g.measureText(buchstabe);
  return {
    fontAufstieg: (m.fontBoundingBoxAscent ?? 100) / 100,
    fontAbstieg: (m.fontBoundingBoxDescent ?? 21) / 100,
    aufstieg: m.actualBoundingBoxAscent / 100,
    abstieg: m.actualBoundingBoxDescent / 100,
    links: m.actualBoundingBoxLeft / 100,
    rechts: m.actualBoundingBoxRight / 100,
  };
};

/**
 * Wohin der Buchstabe laufen muss, gemessen am echten Element der Seite.
 *
 * Gemessen statt gerechnet: `.riese` steht in `clamp()`, also haengt seine
 * Groesse am Fenster, und seine Lage an allem darueber. Das Element weiss das
 * alles schon, man muss es nur fragen.
 */
const landeplatz = (element, buchstabe, fenster) => {
  const kasten = element.getBoundingClientRect();
  const stil = getComputedStyle(element);
  const grad = Number.parseFloat(stil.fontSize);
  const masse = schriftMasse(buchstabe, stil.fontFamily, stil.fontWeight);

  const tusche = tuscheKasten(
    { links: kasten.left, oben: kasten.top, hoehe: kasten.height },
    grad,
    masse,
  );
  return inWelt(tusche, fenster, HOEHE_WELT);
};

// ---------------------------------------------------------------------------
// Die Shader
// ---------------------------------------------------------------------------

const RAUSCHEN = /* glsl */ `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
`;

const VERTEX = /* glsl */ `
  uniform float uT;
  uniform float uZeit;
  uniform float uSkala;
  uniform float uFarbwechsel;
  uniform float uMasse;
  uniform vec3 uVersatz;
  uniform float uAbgang;
  uniform vec3 uZielfarbe;

  attribute vec3 aZiel;
  attribute float aRadius;
  attribute float aDreh;
  attribute float aVerzug;
  attribute float aKorn;
  attribute vec3 aFarbe;

  varying vec3 vFarbe;
  varying float vStaerke;

  void main() {
    float t = clamp((uT - aVerzug) / max(1.0 - aVerzug, 0.001), 0.0, 1.0);
    // Sanft an beiden Enden. Mit einem auslaufenden Bogen waere der Sturm nach
    // einem Drittel vorbei und der Rest der Zeit ein Standbild.
    float e = t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
    float offen = 1.0 - e;

    float winkel = aDreh + uZeit * (0.6 + aRadius * 0.3) + offen * 4.5;
    float r = aRadius * offen;

    vec3 p = aZiel;
    p.x += cos(winkel) * r;
    p.y += sin(winkel * 0.83 + aDreh) * r * 0.72;
    p.z += sin(winkel) * r;

    // Ohne Turbulenz laufen die Koerner auf sauberen Kreisbahnen, und das sieht
    // nach Zirkel aus statt nach Staub.
    p += vec3(
      snoise(aZiel * 1.6 + uZeit * 0.35),
      snoise(aZiel * 1.6 + 11.3 + uZeit * 0.31),
      snoise(aZiel * 1.6 + 27.9 + uZeit * 0.38)
    ) * offen * 0.5;

    // Der Weg auf den Platz der Seite.
    p = p * uMasse + uVersatz;

    vFarbe = mix(aFarbe, uZielfarbe, uFarbwechsel);
    vStaerke = mix(0.34, 0.22, e) * (1.0 - uAbgang);

    vec4 sicht = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * sicht;
    // Nie unter einen Bildpunkt: am Ende ist der Buchstabe klein, und Koerner
    // unterhalb eines Bildpunktes flimmern, statt eine Flaeche zu ergeben.
    gl_PointSize = max(
      aKorn * (1.0 + offen * 0.8) * uMasse * uSkala / max(-sicht.z, 0.1),
      1.0
    );
  }
`;

const FRAGMENT = /* glsl */ `
  varying vec3 vFarbe;
  varying float vStaerke;

  void main() {
    vec2 d = gl_PointCoord - 0.5;
    float r2 = dot(d, d);
    if (r2 > 0.25) discard;
    float weich = smoothstep(0.25, 0.015, r2);
    gl_FragColor = vec4(vFarbe * weich, weich * vStaerke);
  }
`;

// ---------------------------------------------------------------------------
// Ablauf
// ---------------------------------------------------------------------------

const spanne = (t, von, bis) => Math.min(Math.max((t - von) / (bis - von), 0), 1);
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/** Zieht eine Farbe so weit ins Helle, dass sie auf dunklem Grund noch traegt. */
const sichtbar = (farbe, mindest) => {
  const hell = Math.max(farbe.r, farbe.g, farbe.b);
  if (hell >= mindest) return farbe;
  if (hell < 0.001) return farbe.setRGB(mindest, mindest, mindest);
  return farbe.multiplyScalar(mindest / hell);
};

const alsFarbe = (css) => new THREE.Color().setStyle(css, THREE.SRGBColorSpace);
const zufallAus = (liste) => liste[(Math.random() * liste.length) | 0];

let laufende = null;

/**
 * Spielt die Enthuellung ueber die ganze Seite.
 *
 * @param {{ buchstabe: string, farbe: string }} ergebnis
 * @param {HTMLElement} ziel Das Element, auf dem der Buchstabe landen soll.
 * @param {() => void} beiLandung Wird gerufen, wenn die Seite uebernehmen soll.
 * @returns {Promise<void>}
 */
export const enthuellen = async ({ buchstabe, farbe: farbname }, ziel, beiLandung) => {
  // Eine zweite Enthuellung bricht die erste ab, statt sich mit ihr zu
  // ueberlagern. Das passiert, wenn jemand waehrend des Laufs neu auslost.
  const marke = {};
  laufende = marke;

  const leinwand = document.createElement('canvas');
  leinwand.className = 'enthuellung';
  leinwand.setAttribute('aria-hidden', 'true');
  document.body.append(leinwand);

  const renderer = new THREE.WebGLRenderer({
    canvas: leinwand,
    alpha: false,
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.NoToneMapping;

  const szene = new THREE.Scene();
  szene.background = new THREE.Color(0x0b0d10);
  const kamera = new THREE.PerspectiveCamera(45, 1, 0.1, 60);

  const geometrie = new THREE.BufferGeometry();
  const zielorte = new Float32Array(KOERNER * 3);
  const farben = new Float32Array(KOERNER * 3);
  const radius = new Float32Array(KOERNER);
  const dreh = new Float32Array(KOERNER);
  const verzug = new Float32Array(KOERNER);
  const korn = new Float32Array(KOERNER);

  const wolke = glyphWolke(buchstabe, KOERNER);
  const topf = ganzerTopf().map((css) => sichtbar(alsFarbe(css), 0.34));
  const eigene = koernerVon(farbname).map((css) => sichtbar(alsFarbe(css), 0.42));

  for (let i = 0; i < KOERNER; i += 1) {
    radius[i] = 0.5 + Math.random() ** 1.6 * 2.6;
    dreh[i] = Math.random() * Math.PI * 2;
    verzug[i] = Math.random() ** 2 * 0.34;
    korn[i] = 0.007 + Math.random() ** 2.4 * 0.016;

    zielorte[i * 3] = wolke.punkte[i * 2] * SPREIZUNG;
    zielorte[i * 3 + 1] = wolke.punkte[i * 2 + 1] * SPREIZUNG;
    zielorte[i * 3 + 2] = (Math.random() - 0.5) * 0.16;

    // Ein Zehntel traegt schon die gezogene Farbe, damit der Wechsel nicht wie
    // ein Schalter wirkt, sondern wie ein Uebergewicht.
    const gewaehlt = Math.random() < 0.1 ? zufallAus(eigene) : zufallAus(topf);
    farben[i * 3] = gewaehlt.r;
    farben[i * 3 + 1] = gewaehlt.g;
    farben[i * 3 + 2] = gewaehlt.b;
  }

  geometrie.setAttribute('position', new THREE.BufferAttribute(zielorte, 3));
  geometrie.setAttribute('aZiel', new THREE.BufferAttribute(zielorte, 3));
  geometrie.setAttribute('aFarbe', new THREE.BufferAttribute(farben, 3));
  geometrie.setAttribute('aRadius', new THREE.BufferAttribute(radius, 1));
  geometrie.setAttribute('aDreh', new THREE.BufferAttribute(dreh, 1));
  geometrie.setAttribute('aVerzug', new THREE.BufferAttribute(verzug, 1));
  geometrie.setAttribute('aKorn', new THREE.BufferAttribute(korn, 1));
  geometrie.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 12);

  const material = new THREE.ShaderMaterial({
    vertexShader: RAUSCHEN + VERTEX,
    fragmentShader: FRAGMENT,
    uniforms: {
      uT: { value: 0 },
      uZeit: { value: 0 },
      uSkala: { value: 600 },
      uFarbwechsel: { value: 0 },
      uMasse: { value: 1 },
      uVersatz: { value: new THREE.Vector3() },
      uAbgang: { value: 0 },
      uZielfarbe: { value: sichtbar(alsFarbe(leitfarbe(farbname)), 0.42) },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const punkte = new THREE.Points(geometrie, material);
  szene.add(punkte);

  const komponist = new EffectComposer(renderer);
  komponist.addPass(new RenderPass(szene, kamera));
  komponist.addPass(new UnrealBloomPass(new THREE.Vector2(256, 512), 0.34, 0.7, 0.62));
  komponist.addPass(new OutputPass());

  let platz = { x: 0, y: 0, hoehe: 1 };
  let zielMasse = 1;

  const einpassen = () => {
    const breite = window.innerWidth;
    const hoehe = window.innerHeight;
    renderer.setSize(breite, hoehe, false);
    komponist.setSize(breite, hoehe);
    kamera.aspect = breite / hoehe;
    kamera.fov = 2 * THREE.MathUtils.radToDeg(Math.atan(HOEHE_WELT / 2 / ABSTAND));
    kamera.position.z = ABSTAND;
    kamera.updateProjectionMatrix();

    // Punktgroessen sind in Bildpunkten, die Koerner in Welteinheiten.
    material.uniforms.uSkala.value =
      (hoehe * renderer.getPixelRatio()) /
      (2 * Math.tan(THREE.MathUtils.degToRad(kamera.fov) / 2));

    platz = landeplatz(ziel, buchstabe, { breite, hoehe });
    zielMasse = platz.hoehe / (wolke.hoehe * SPREIZUNG);
  };

  einpassen();
  window.addEventListener('resize', einpassen);

  const aufraeumen = () => {
    window.removeEventListener('resize', einpassen);
    geometrie.dispose();
    material.dispose();
    komponist.dispose();
    renderer.dispose();
    leinwand.remove();
  };

  try {
    await new Promise((fertig) => {
      const start = performance.now();
      let gelandet = false;

      const bild = (jetzt) => {
        if (laufende !== marke) {
          fertig();
          return;
        }
        const vergangen = jetzt - start;
        const t = Math.min(vergangen / DAUER, 1);
        const schrumpf = easeInOut(spanne(t, 0.74, 0.93));

        material.uniforms.uT.value = spanne(t, 0.03, 0.7);
        material.uniforms.uZeit.value = vergangen / 1000;
        material.uniforms.uFarbwechsel.value = easeInOut(spanne(t, 0.32, 0.72));
        material.uniforms.uMasse.value = 1 + (zielMasse - 1) * schrumpf;
        material.uniforms.uVersatz.value.set(platz.x * schrumpf, platz.y * schrumpf, 0);
        material.uniforms.uAbgang.value = spanne(t, 0.85, 1);
        punkte.rotation.y = Math.sin(vergangen / 2000) * 0.16 * (1 - spanne(t, 0.55, 0.78));

        komponist.render();

        if (!gelandet && t >= LANDUNG) {
          gelandet = true;
          leinwand.classList.add('abgetreten');
          beiLandung();
        }
        if (t < 1) requestAnimationFrame(bild);
        else fertig();
      };
      requestAnimationFrame(bild);
    });
  } finally {
    if (laufende === marke) laufende = null;
    // Die Leinwand blendet noch aus, also erst danach wegraeumen.
    setTimeout(aufraeumen, 600);
  }
};

/** Bricht eine laufende Enthuellung ab, ohne auf sie zu warten. */
export const abbrechen = () => {
  laufende = null;
};
