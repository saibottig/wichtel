/**
 * 2 - Gommage
 *
 * Die Farbe ist nicht da und wird es. Eine Rauschschwelle laeuft von unten nach
 * oben durch die Flaeche, und ueberall, wo sie vorbeigekommen ist, steht die
 * gezogene Farbe. Vor der Front fliegt Staub in den Farben des ganzen Topfes
 * heran und verschwindet in ihr: die Farbe sammelt sich buchstaeblich aus allen
 * anderen ein.
 *
 * Danach wird der Buchstabe aus derselben Flaeche herausgeholt, gross und
 * mittig, und wandert dann auf seinen Platz unten links.
 *
 * Umgekehrte Richtung des Gommage-Effekts, der sonst Schrift zu Staub zerfallen
 * laesst. Hier faellt nichts auseinander, hier setzt sich etwas zusammen.
 */

import * as THREE from 'three';

import { RAUSCHEN } from './rauschen.js';
import { glyphTextur, glyphMasse } from './glyph.js';
import {
  farbwolke,
  ganzerTopf,
  texturFuer,
  hatTextur,
  kachelung,
  daempfungFuer,
  FARBRAUM,
  leitfarbe,
  darstellungFuer,
} from './farben3d.js';
import { rendererBauen, landeplatz, spanne, easeInOut, easeOut, mische, zufallAus } from './buehne.js';

export const meta = {
  titel: '2 · Gommage',
  text: 'Die Farbe sammelt sich aus Staub zusammen, von unten nach oben, mit glühender Kante. Danach wird der Buchstabe aus derselben Fläche geholt und wandert auf seinen Platz.',
  dauer: 3400,
  landung: 0.9,
  abgang: 'bleibt',
};

/** Die Buehne ist zwei Einheiten hoch und halb so breit. */
const HOEHE_WELT = 2;
const UNTERTEILUNG = [170, 340];

/**
 * Das Feld, an dem sich alles entscheidet.
 *
 * Eine Hoehenlinie plus Rauschen. Wand und Staub rechnen dieselbe Funktion,
 * sonst laege der Staub nicht auf der Front, sondern irgendwo.
 */
const FELD = /* glsl */ `
  float feld(vec2 welt) {
    return (welt.y * 0.5 + 0.5) * 0.95 + fbm(welt * 2.6) * 0.42;
  }
`;

const WAND_VERTEX = /* glsl */ `
  uniform float uSeite;
  varying vec2 vWelt;
  void main() {
    vWelt = vec2(position.x * uSeite, position.y);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const WAND_FRAGMENT = /* glsl */ `
  uniform float uSeite;
  uniform sampler2D uFarbe;
  uniform sampler2D uGlyph;
  uniform vec3 uEinfarbig;
  uniform float uHatTextur;
  uniform float uFortschritt;
  uniform float uBand;
  uniform vec3 uKantenfarbe;
  uniform vec3 uSchriftfarbe;
  uniform vec2 uGlyphMitte;
  uniform float uGlyphSeite;
  uniform float uBuchstabe;
  uniform vec2 uKachel;
  uniform vec3 uDaempfBasis;
  uniform float uDaempfStaerke;
  uniform float uTuscheSichtbar;

  varying vec2 vWelt;

  void main() {
    float f = feld(vWelt);
    if (f > uFortschritt) discard;

    vec3 grund = uHatTextur > 0.5
      ? texture2D(uFarbe, (vWelt / vec2(uSeite * 2.0, 2.0) + 0.5) * uKachel).rgb
      : uEinfarbig;
    // Dieselbe Daempfung wie auf der Seite: ein Muster liegt nur schwach ueber
    // seiner Grundfarbe. Ohne das stuende der Text am Ende auf Streifen und der
    // Uebergang zur Seite waere ein Sprung.
    grund = mischeWieCss(uDaempfBasis, grund, uDaempfStaerke);

    // Der Buchstabe wird aus derselben Flaeche geholt, mit eigener Schwelle,
    // damit er nach der Farbe kommt und nicht mit ihr.
    vec2 gUv = (vWelt - uGlyphMitte) / uGlyphSeite + 0.5;
    float tusche = texture2D(uGlyph, gUv).a;
    float schwelle = fbm(vWelt * 5.0 + 31.7) * 0.5 + 0.5;
    float geholt = smoothstep(schwelle - 0.25, schwelle + 0.05, uBuchstabe);
    vec3 farbe = mix(grund, uSchriftfarbe, tusche * geholt * uTuscheSichtbar);

    // Die Kante gluehte, als die Farbe dort ankam.
    float kante = smoothstep(uFortschritt - uBand, uFortschritt, f);
    farbe = mix(farbe, uKantenfarbe, kante * 0.85);

    gl_FragColor = vec4(farbe, 1.0);
    #include <colorspace_fragment>
  }
`;

const STAUB_VERTEX = /* glsl */ `
  uniform float uSeite;
  uniform float uFortschritt;
  uniform float uBand;
  uniform float uSkala;
  uniform float uZeit;
  uniform vec3 uZielfarbe;

  attribute vec3 aFlug;
  attribute float aKorn;
  attribute vec3 aFarbe;

  varying vec3 vFarbe;
  varying float vStaerke;

  void main() {
    vec2 welt = vec2(position.x * uSeite, position.y);
    float vor = (feld(welt) - uFortschritt) / uBand;

    if (vor < 0.0 || vor > 1.0) {
      gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
      gl_PointSize = 0.0;
      vStaerke = 0.0;
      return;
    }

    vec3 p = position;
    p.xy += aFlug.xy * vor * 0.5;
    p.y += vor * 0.28;
    p.x += sin(uZeit * 2.0 + aFlug.z * 9.0) * vor * 0.05;

    // Weit vor der Front traegt das Korn noch seine eigene Farbe, dicht davor
    // schon die gezogene.
    vFarbe = mix(uZielfarbe, aFarbe, vor);
    vStaerke = sin(vor * 3.14159) * 0.85;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = max(aKorn * uSkala * (0.4 + vor), 1.0);
  }
`;

const STAUB_FRAGMENT = /* glsl */ `
  varying vec3 vFarbe;
  varying float vStaerke;
  void main() {
    vec2 d = gl_PointCoord - 0.5;
    float r2 = dot(d, d);
    if (r2 > 0.25) discard;
    gl_FragColor = vec4(vFarbe, smoothstep(0.25, 0.02, r2) * vStaerke);
    #include <colorspace_fragment>
  }
`;

export const bauen = ({ leinwand }) => {
  const renderer = rendererBauen(leinwand, { alpha: false });
  renderer.setClearColor(0x0b0d10, 1);
  const szene = new THREE.Scene();
  const kamera = new THREE.OrthographicCamera(-0.5, 0.5, 1, -1, 0, 10);
  kamera.position.z = 4;

  const flaeche = new THREE.PlaneGeometry(2, 2, ...UNTERTEILUNG);
  const anzahl = flaeche.attributes.position.count;
  const flug = new Float32Array(anzahl * 3);
  const korn = new Float32Array(anzahl);
  const staubfarbe = new Float32Array(anzahl * 3);

  for (let i = 0; i < anzahl; i += 1) {
    flug[i * 3] = (Math.random() - 0.5) * 0.7;
    flug[i * 3 + 1] = 0.2 + Math.random() * 0.8;
    flug[i * 3 + 2] = Math.random();
    korn[i] = 0.004 + Math.random() ** 2 * 0.012;
  }

  const staubGeometrie = new THREE.BufferGeometry();
  staubGeometrie.setAttribute('position', flaeche.attributes.position);
  staubGeometrie.setAttribute('aFlug', new THREE.BufferAttribute(flug, 3));
  staubGeometrie.setAttribute('aKorn', new THREE.BufferAttribute(korn, 1));
  staubGeometrie.setAttribute('aFarbe', new THREE.BufferAttribute(staubfarbe, 3));
  staubGeometrie.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 6);

  const wandMaterial = new THREE.ShaderMaterial({
    vertexShader: RAUSCHEN + FELD + WAND_VERTEX,
    fragmentShader: RAUSCHEN + FARBRAUM + FELD + WAND_FRAGMENT,
    uniforms: {
      uSeite: { value: 0.5 },
      uFarbe: { value: null },
      uGlyph: { value: null },
      uEinfarbig: { value: new THREE.Color(0xffffff) },
      uHatTextur: { value: 0 },
      uFortschritt: { value: -1 },
      uBand: { value: 0.1 },
      uKantenfarbe: { value: new THREE.Color(0xffffff) },
      uSchriftfarbe: { value: new THREE.Color(0xffffff) },
      uGlyphMitte: { value: new THREE.Vector2() },
      uGlyphSeite: { value: 1 },
      uBuchstabe: { value: 0 },
      uKachel: { value: new THREE.Vector2(1, 1) },
      uDaempfBasis: { value: new THREE.Color(0, 0, 0) },
      uDaempfStaerke: { value: 1 },
      uTuscheSichtbar: { value: 1 },
    },
  });

  const staubMaterial = new THREE.ShaderMaterial({
    vertexShader: RAUSCHEN + FELD + STAUB_VERTEX,
    fragmentShader: STAUB_FRAGMENT,
    uniforms: {
      uSeite: { value: 0.5 },
      uFortschritt: { value: -1 },
      uBand: { value: 0.34 },
      uSkala: { value: 300 },
      uZeit: { value: 0 },
      uZielfarbe: { value: new THREE.Color(0xffffff) },
    },
    transparent: true,
    depthWrite: false,
  });

  const wand = new THREE.Mesh(flaeche, wandMaterial);
  const staub = new THREE.Points(staubGeometrie, staubMaterial);
  staub.position.z = 0.4;
  szene.add(wand, staub);

  let farbname = 'Rot';
  let platz = { hoehe: 0.3, x: 0, y: 0 };
  let grossSeite = 1;
  let grossHoehe = 1;
  let glyph = null;

  const groesse = (breite, hoehe) => {
    renderer.setSize(breite, hoehe, false);
    const seite = breite / hoehe;
    kamera.left = -seite;
    kamera.right = seite;
    kamera.updateProjectionMatrix();
    wand.scale.x = seite;
    staub.scale.x = seite;
    wandMaterial.uniforms.uSeite.value = seite;
    staubMaterial.uniforms.uSeite.value = seite;
    kachelSetzen();
    staubMaterial.uniforms.uSkala.value = (hoehe * renderer.getPixelRatio()) / HOEHE_WELT;
  };

  /** Die Kachelung haengt an Farbe und Seitenverhaeltnis, also an beidem. */
  const kachelSetzen = () => {
    wandMaterial.uniforms.uKachel.value.copy(
      kachelung(farbname, wandMaterial.uniforms.uSeite.value),
    );
  };

  const bereit = ({ buchstabe, farbe: gezogen }) => {
    farbname = gezogen;
    glyph?.dispose();
    glyph = glyphTextur(buchstabe);

    const masse = glyphMasse(buchstabe);
    platz = landeplatz(buchstabe, HOEHE_WELT);
    // Die Glyph-Textur ist quadratisch und der Buchstabe steht mittig darin.
    // Aus seiner Hoehe folgt, wie gross das Quadrat sein muss.
    const seiteFuer = (tuscheHoehe) => tuscheHoehe / (masse.hoehe / 2);
    // Gross, aber nie breiter als die Buehne. Ein W ist fast doppelt so breit
    // wie ein I, und nur die Hoehe zu begrenzen laesst es links und rechts
    // hinauslaufen.
    const breiteWelt = HOEHE_WELT * wandMaterial.uniforms.uSeite.value;
    grossHoehe = Math.min(1.05, (0.84 * breiteWelt * masse.hoehe) / masse.breite);
    grossSeite = seiteFuer(grossHoehe);

    const { ton } = darstellungFuer(farbname);
    const eigene = farbwolke(farbname);
    const topf = ganzerTopf();
    for (let i = 0; i < anzahl; i += 1) {
      const gewaehlt = zufallAus(topf);
      staubfarbe[i * 3] = gewaehlt.r;
      staubfarbe[i * 3 + 1] = gewaehlt.g;
      staubfarbe[i * 3 + 2] = gewaehlt.b;
    }
    staubGeometrie.attributes.aFarbe.needsUpdate = true;

    const wandU = wandMaterial.uniforms;
    wandU.uHatTextur.value = hatTextur(farbname) ? 1 : 0;
    wandU.uFarbe.value = hatTextur(farbname) ? texturFuer(farbname) : null;
    kachelSetzen();
    const daempfung = daempfungFuer(farbname);
    wandU.uDaempfBasis.value.copy(daempfung.basis);
    wandU.uDaempfStaerke.value = daempfung.staerke;
    wandU.uTuscheSichtbar.value = 1;
    wandU.uEinfarbig.value.copy(leitfarbe(farbname));
    wandU.uSchriftfarbe.value.setHex(ton === 'hell' ? 0xffffff : 0x16181a, THREE.SRGBColorSpace);
    // Die Kante gluehte in der hellsten Farbe, die diese Farbe hergibt.
    wandU.uKantenfarbe.value.copy(
      eigene.reduce((a, b) => (a.r + a.g + a.b >= b.r + b.g + b.b ? a : b)).clone().lerp(new THREE.Color(1, 1, 1), 0.45),
    );
    wandU.uFortschritt.value = -0.5;
    wandU.uGlyphSeite.value = grossSeite;
    wandU.uGlyphMitte.value.set(0, 0.12);
    wandU.uGlyph.value = glyph;
    wandU.uBuchstabe.value = 0;

    staubMaterial.uniforms.uZielfarbe.value.copy(leitfarbe(farbname));
    staubMaterial.uniforms.uFortschritt.value = -0.5;
  };

  const schritt = (t, sekunden) => {
    const front = mische(-0.45, 1.45, easeInOut(spanne(t, 0.03, 0.6)));
    wandMaterial.uniforms.uFortschritt.value = front;
    staubMaterial.uniforms.uFortschritt.value = front;
    staubMaterial.uniforms.uZeit.value = sekunden;
    wandMaterial.uniforms.uBuchstabe.value = easeOut(spanne(t, 0.5, 0.76));

    // Der Buchstabe wandert auf den Platz, den die Seite ihm gibt. Die Seite des
    // Glyph-Quadrats verhaelt sich dabei wie die Hoehe des Buchstabens darin.
    const wandern = easeInOut(spanne(t, 0.78, 0.95));
    wandMaterial.uniforms.uGlyphSeite.value = mische(
      grossSeite,
      (grossSeite * platz.hoehe) / grossHoehe,
      wandern,
    );
    wandMaterial.uniforms.uGlyphMitte.value.set(
      mische(0, platz.x, wandern),
      mische(0.12, platz.y, wandern),
    );

    // Am Ziel uebergibt der Shader den Buchstaben an die Seite. Beide stehen an
    // derselben Stelle, also ist das eine Ueberblendung und kein Wechsel.
    wandMaterial.uniforms.uTuscheSichtbar.value = 1 - spanne(t, 0.93, 1);
  };

  const rendern = () => renderer.render(szene, kamera);

  const freigeben = () => {
    flaeche.dispose();
    staubGeometrie.dispose();
    wandMaterial.dispose();
    staubMaterial.dispose();
    glyph?.dispose();
    renderer.dispose();
  };

  return { groesse, bereit, schritt, rendern, freigeben };
};
