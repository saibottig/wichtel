/**
 * 5 - Marmor
 *
 * Der ganze Farbtopf als marmoriertes Papier: ein Rauschfeld, das sich selbst
 * verzerrt, und alle achtundzwanzig Farben ziehen als Schlieren durcheinander.
 * Dann beruhigt sich die Verzerrung und die Schlieren laufen in die gezogene
 * Farbe zusammen. Der Buchstabe steigt als nasse Praegung aus der Flaeche auf
 * und wandert auf seinen Platz.
 *
 * Die einzige der fuenf, die ohne einen einzigen Koerper auskommt: alles
 * passiert in einem Fragment-Shader. Der Grund fuer three.js ist hier nicht die
 * Geometrie, sondern dass eine Shaderflaeche ueberhaupt erst moeglich wird.
 *
 * Nahe an der Farbflut, die die Seite ohnehin schon traegt, nur in Bewegung.
 */

import * as THREE from 'three';

import { RAUSCHEN } from './rauschen.js';
import { glyphTextur, glyphMasse } from './glyph.js';
import {
  LEITFARBEN,
  farbbandTextur,
  texturFuer,
  hatTextur,
  kachelung,
  daempfungFuer,
  FARBRAUM,
  leitfarbe,
  darstellungFuer,
} from './farben3d.js';
import { rendererBauen, landeplatz, spanne, easeInOut, easeOut, mische } from './buehne.js';

export const meta = {
  titel: '5 · Marmor',
  text: 'Alle achtundzwanzig Farben ziehen als Schlieren durcheinander wie marmoriertes Papier. Die Verzerrung beruhigt sich, die Schlieren laufen in eine Farbe zusammen, der Buchstabe steigt als nasse Prägung auf.',
  dauer: 3400,
  landung: 0.9,
  abgang: 'bleibt',
};

const HOEHE_WELT = 2;

const VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT = /* glsl */ `
  uniform float uZeit;
  uniform float uSeite;
  uniform float uWarp;
  uniform float uMisch;
  uniform sampler2D uPalette;
  uniform sampler2D uFarbe;
  uniform vec3 uEinfarbig;
  uniform float uHatTextur;
  uniform vec2 uKachel;
  uniform vec3 uDaempfBasis;
  uniform float uDaempfStaerke;

  uniform sampler2D uGlyphScharf;
  uniform sampler2D uGlyphWeich;
  uniform vec2 uGlyphMitte;
  uniform float uGlyphSeite;
  uniform float uHoehe;
  uniform float uTusche;
  uniform vec3 uSchriftfarbe;

  varying vec2 vUv;

  void main() {
    vec2 welt = (vUv - 0.5) * vec2(uSeite * 2.0, 2.0);
    vec2 p = welt * 0.88;

    // Feldverzerrung: das Rauschen schaut nicht dort nach, wo es steht,
    // sondern dort, wohin ein zweites Rauschen es schiebt. Daher die Schlieren.
    //
    // Die Staerke ist hier das Ganze. Jede Verzerrung vervielfacht auch die
    // Frequenz dessen, was sie verschiebt, und zwei Stufen davon multiplizieren
    // sich. Zu hoch angesetzt kommt kein Marmor heraus, sondern Farbgriess:
    // achtundzwanzig Farben, die sich von Bildpunkt zu Bildpunkt abwechseln.
    vec2 q = vec2(
      snoise(p + vec2(0.0, uZeit * 0.13)),
      snoise(p + vec2(4.3, 1.7) - uZeit * 0.11)
    );
    vec2 r = vec2(
      snoise(p + 0.7 * q + vec2(1.7, 9.2)),
      snoise(p + 0.7 * q + vec2(8.3, 2.8))
    );
    float f = fbm3(p + uWarp * r);

    float k = clamp(f * 0.62 + 0.5, 0.0, 1.0);
    vec3 topf = texture2D(uPalette, vec2(k, 0.5)).rgb;

    vec3 eine = uHatTextur > 0.5
      ? texture2D(uFarbe, (welt / vec2(uSeite * 2.0, 2.0) + 0.5) * uKachel).rgb
      : uEinfarbig;
    // Auch die eine Farbe bleibt fluessig. Ohne das waere das Ende eine
    // Pappfarbe, und der ganze Sinn der Bewegung ginge in der letzten Sekunde
    // verloren.
    eine = mischeWieCss(uDaempfBasis, eine, uDaempfStaerke);
    eine *= 0.88 + 0.26 * (f * 0.5 + 0.5);

    vec3 farbe = mix(topf, eine, uMisch);

    // Der Buchstabe: scharf fuer die Farbe, weich fuer das Licht.
    vec2 g = (welt - uGlyphMitte) / uGlyphSeite + 0.5;
    float scharf = texture2D(uGlyphScharf, g).a;

    float e = 0.007;
    float hx = texture2D(uGlyphWeich, g + vec2(e, 0.0)).a
             - texture2D(uGlyphWeich, g - vec2(e, 0.0)).a;
    float hy = texture2D(uGlyphWeich, g + vec2(0.0, e)).a
             - texture2D(uGlyphWeich, g - vec2(0.0, e)).a;
    vec3 n = normalize(vec3(-hx * 5.5, -hy * 5.5, 0.16));
    vec3 licht = normalize(vec3(-0.45, 0.78, 0.44));

    // Nur die Schraege bekommt Licht, nicht die Flaeche.
    //
    // Das Licht einer ebenen Flaeche wird abgezogen, sonst haette jeder
    // Bildpunkt einen festen Zuschlag. Auf einer hellen Farbe faellt das nicht
    // auf, aber Schwarz wird davon mittelgrau, und dann steht auf der Seite
    // eine andere Farbe als die, die gezogen wurde.
    float eben = max(dot(vec3(0.0, 0.0, 1.0), licht), 0.0);
    float schraeg = max(dot(n, licht), 0.0) - eben;
    float spek = pow(max(dot(n, normalize(licht + vec3(0.0, 0.0, 1.0))), 0.0), 24.0);

    farbe = mix(farbe, uSchriftfarbe, scharf * uTusche);
    farbe += (schraeg * 0.3 + spek * 0.5) * uHoehe;

    gl_FragColor = vec4(farbe, 1.0);
    #include <colorspace_fragment>
  }
`;

export const bauen = ({ leinwand }) => {
  const renderer = rendererBauen(leinwand, { alpha: false });
  // Das Feld kostet ein paar Dutzend Rauschwerte je Bildpunkt. Bei doppelter
  // Bildpunktdichte waere das auf einem Telefon zu viel, und zu sehen waere es
  // nicht: die Flaeche hat ohnehin keine harten Kanten.
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

  const szene = new THREE.Scene();
  const kamera = new THREE.OrthographicCamera(-0.5, 0.5, 1, -1, 0, 10);
  kamera.position.z = 2;

  const palette = farbbandTextur([...LEITFARBEN, LEITFARBEN[0]]);

  const material = new THREE.ShaderMaterial({
    vertexShader: VERTEX,
    fragmentShader: RAUSCHEN + FARBRAUM + FRAGMENT,
    uniforms: {
      uZeit: { value: 0 },
      uSeite: { value: 0.5 },
      uWarp: { value: 0.85 },
      uMisch: { value: 0 },
      uPalette: { value: palette },
      uFarbe: { value: null },
      uEinfarbig: { value: new THREE.Color(0xffffff) },
      uHatTextur: { value: 0 },
      uKachel: { value: new THREE.Vector2(1, 1) },
      uDaempfBasis: { value: new THREE.Color(0, 0, 0) },
      uDaempfStaerke: { value: 1 },
      uGlyphScharf: { value: null },
      uGlyphWeich: { value: null },
      uGlyphMitte: { value: new THREE.Vector2() },
      uGlyphSeite: { value: 1 },
      uHoehe: { value: 0 },
      uTusche: { value: 0 },
      uSchriftfarbe: { value: new THREE.Color(0xffffff) },
    },
  });

  const flaeche = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  szene.add(flaeche);

  let farbname = 'Rot';
  let platz = { hoehe: 0.3, x: 0, y: 0 };
  let grossSeite = 1;
  let zielSeite = 0.3;
  let scharf = null;
  let weich = null;

  const groesse = (breite, hoehe) => {
    renderer.setSize(breite, hoehe, false);
    const seite = breite / hoehe;
    kamera.left = -seite;
    kamera.right = seite;
    kamera.updateProjectionMatrix();
    flaeche.scale.x = seite;
    material.uniforms.uSeite.value = seite;
    kachelSetzen();
  };

  const kachelSetzen = () => {
    material.uniforms.uKachel.value.copy(kachelung(farbname, material.uniforms.uSeite.value));
  };

  const bereit = ({ buchstabe, farbe: gezogen }) => {
    farbname = gezogen;
    scharf?.dispose();
    weich?.dispose();
    scharf = glyphTextur(buchstabe);
    weich = glyphTextur(buchstabe, { weich: 16 });
    material.uniforms.uGlyphScharf.value = scharf;
    material.uniforms.uGlyphWeich.value = weich;

    const masse = glyphMasse(buchstabe);
    platz = landeplatz(buchstabe, HOEHE_WELT);
    const seiteFuer = (tuscheHoehe) => tuscheHoehe / (masse.hoehe / 2);
    const breiteWelt = HOEHE_WELT * material.uniforms.uSeite.value;
    grossSeite = seiteFuer(Math.min(1.0, (0.8 * breiteWelt * masse.hoehe) / masse.breite));
    zielSeite = seiteFuer(platz.hoehe);

    const { ton } = darstellungFuer(farbname);
    material.uniforms.uSchriftfarbe.value.setHex(
      ton === 'hell' ? 0xffffff : 0x16181a,
      THREE.SRGBColorSpace,
    );
    material.uniforms.uHatTextur.value = hatTextur(farbname) ? 1 : 0;
    material.uniforms.uFarbe.value = hatTextur(farbname) ? texturFuer(farbname) : null;
    kachelSetzen();
    const daempfung = daempfungFuer(farbname);
    material.uniforms.uDaempfBasis.value.copy(daempfung.basis);
    material.uniforms.uDaempfStaerke.value = daempfung.staerke;
    material.uniforms.uEinfarbig.value.copy(leitfarbe(farbname));
    material.uniforms.uMisch.value = 0;
    material.uniforms.uWarp.value = 0.85;
    material.uniforms.uHoehe.value = 0;
    material.uniforms.uTusche.value = 0;
    material.uniforms.uGlyphSeite.value = grossSeite;
    material.uniforms.uGlyphMitte.value.set(0, 0.08);
  };

  const schritt = (t, sekunden) => {
    const u = material.uniforms;
    u.uZeit.value = sekunden;
    u.uMisch.value = easeInOut(spanne(t, 0.36, 0.74));
    // Die Verzerrung faellt nie ganz auf null: eine Spur Bewegung bleibt, damit
    // die Farbe am Ende lebt statt zu stehen.
    u.uWarp.value = mische(0.85, 0.22, easeInOut(spanne(t, 0.36, 0.78)));
    u.uHoehe.value = easeOut(spanne(t, 0.44, 0.74)) * (1 - spanne(t, 0.93, 1));
    // Am Ziel uebergibt der Shader den Buchstaben an die Seite, die ihn an
    // derselben Stelle scharf hinsetzt.
    u.uTusche.value = easeOut(spanne(t, 0.5, 0.78)) * (1 - spanne(t, 0.93, 1));

    const wandern = easeInOut(spanne(t, 0.78, 0.95));
    u.uGlyphSeite.value = mische(grossSeite, zielSeite, wandern);
    u.uGlyphMitte.value.set(mische(0, platz.x, wandern), mische(0.08, platz.y, wandern));
  };

  const rendern = () => renderer.render(szene, kamera);

  const freigeben = () => {
    flaeche.geometry.dispose();
    material.dispose();
    palette.dispose();
    scharf?.dispose();
    weich?.dispose();
    renderer.dispose();
  };

  return { groesse, bereit, schritt, rendern, freigeben };
};
