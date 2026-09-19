/**
 * 3 - Prisma
 *
 * Hinter einem geschliffenen Glasstein kreist der ganze Farbtopf. Der Stein
 * bricht das Licht, faechert es in seine Bestandteile und macht dabei alles
 * unleserlich, was dahinter steht. Waehrend er langsamer wird, laeuft der
 * Farbkreis dahinter in die gezogene Farbe zusammen. Dann faellt der Stein aus
 * dem Bild und laesst einen klaren Buchstaben stehen.
 *
 * Das ist die Enthuellung, die ohne three.js gar nicht zu haben waere. Brechung
 * mit Farbzerstreuung ist keine Nachahmung, sondern das, was das Material
 * tatsaechlich tut.
 */

import * as THREE from 'three';

import { glyphTextur, glyphMasse } from './glyph.js';
import {
  texturFuer,
  hatTextur,
  kachelung,
  leitfarbe,
  topfKreisTextur,
  darstellungFuer,
} from './farben3d.js';
import {
  rendererBauen,
  umgebungFuer,
  kameraAufHoehe,
  landeplatz,
  spanne,
  easeOut,
  easeIn,
  easeInOut,
  mische,
} from './buehne.js';

export const meta = {
  titel: '3 · Prisma',
  text: 'Ein geschliffener Glasstein bricht den kreisenden Farbtopf dahinter in Spektralfarben. Er wird langsamer, die Farben laufen in eine zusammen, dann fällt der Stein aus dem Bild.',
  dauer: 3400,
  landung: 0.9,
  abgang: 'flut',
};

const HOEHE_WELT = 4;
const ABSTAND = 5;

const GRUND_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const GRUND_FRAGMENT = /* glsl */ `
  uniform sampler2D uTopf;
  uniform sampler2D uFarbe;
  uniform vec3 uEinfarbig;
  uniform float uHatTextur;
  uniform vec2 uKachel;
  uniform float uMisch;
  uniform float uDrehung;
  varying vec2 vUv;

  void main() {
    vec2 m = vUv - 0.5;
    float c = cos(uDrehung);
    float s = sin(uDrehung);
    vec2 gedreht = vec2(m.x * c - m.y * s, m.x * s + m.y * c) + 0.5;

    vec3 topf = texture2D(uTopf, gedreht).rgb;
    vec3 eine = uHatTextur > 0.5 ? texture2D(uFarbe, vUv * uKachel).rgb : uEinfarbig;

    gl_FragColor = vec4(mix(topf, eine, uMisch), 1.0);
    #include <colorspace_fragment>
  }
`;

export const bauen = ({ leinwand }) => {
  const renderer = rendererBauen(leinwand, { alpha: false });
  renderer.setClearColor(0x0b0d10, 1);

  const szene = new THREE.Scene();
  szene.environment = umgebungFuer(renderer);
  szene.environmentIntensity = 0.9;

  const kamera = new THREE.PerspectiveCamera(45, 0.5, 0.1, 60);
  kameraAufHoehe(kamera, HOEHE_WELT, ABSTAND);

  const licht = new THREE.DirectionalLight(0xffffff, 1.6);
  licht.position.set(-2, 3, 4);
  szene.add(licht);

  // Der Grund: erst alle Farben im Kreis, dann eine.
  const grundMaterial = new THREE.ShaderMaterial({
    vertexShader: GRUND_VERTEX,
    fragmentShader: GRUND_FRAGMENT,
    uniforms: {
      uTopf: { value: topfKreisTextur() },
      uFarbe: { value: null },
      uEinfarbig: { value: new THREE.Color(0xffffff) },
      uHatTextur: { value: 0 },
      uKachel: { value: new THREE.Vector2(1, 1) },
      uMisch: { value: 0 },
      uDrehung: { value: 0 },
    },
  });
  const grund = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), grundMaterial);
  grund.position.z = -2.4;
  szene.add(grund);

  // Der Buchstabe steht zwischen Grund und Stein.
  //
  // Nicht `transparent`, sondern `alphaTest`: was durchsichtig gezeichnet wird,
  // landet in three.js in einem spaeteren Durchgang und steht damit weder im
  // Hintergrundbild, aus dem der Stein seine Brechung holt, noch hinter ihm.
  // Ein durchsichtiger Buchstabe laege also vor dem Glas statt dahinter, und
  // die ganze Enthuellung waere hin.
  const glyphMaterial = new THREE.MeshBasicMaterial({
    alphaTest: 0.5,
    alphaToCoverage: true,
    color: 0xffffff,
  });
  const buchstabenFeld = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), glyphMaterial);
  buchstabenFeld.position.z = -1.1;
  szene.add(buchstabenFeld);

  // Der Stein. Zwanzig ebene Flaechen, damit die Brechung Kanten hat, an denen
  // sich etwas tut.
  const steinMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transmission: 1,
    thickness: 1.4,
    ior: 1.7,
    dispersion: 6,
    roughness: 0.02,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.02,
    flatShading: true,
  });
  const stein = new THREE.Mesh(new THREE.IcosahedronGeometry(0.95, 0), steinMaterial);
  szene.add(stein);

  let farbname = 'Rot';
  let platz = { hoehe: 0.5, x: 0, y: 0 };
  let grossSeite = 2;
  let zielSeite = 0.5;
  let glyph = null;

  const groesse = (breite, hoehe) => {
    renderer.setSize(breite, hoehe, false);
    kamera.aspect = breite / hoehe;
    kameraAufHoehe(kamera, HOEHE_WELT, ABSTAND);
    // Der Grund liegt hinter dem Stein und muss das Bild in seiner Tiefe fuellen.
    const tiefe = ABSTAND - grund.position.z;
    const hoeheDort = 2 * Math.tan(THREE.MathUtils.degToRad(kamera.fov) / 2) * tiefe;
    grund.scale.set(hoeheDort * kamera.aspect * 1.05, hoeheDort * 1.05, 1);
    kachelSetzen();
  };

  const kachelSetzen = () => {
    grundMaterial.uniforms.uKachel.value.copy(kachelung(farbname, kamera.aspect));
  };

  const bereit = ({ buchstabe, farbe: gezogen }) => {
    farbname = gezogen;
    glyph?.dispose();
    glyph = glyphTextur(buchstabe);
    glyphMaterial.map = glyph;
    glyphMaterial.needsUpdate = true;

    const masse = glyphMasse(buchstabe);
    platz = landeplatz(buchstabe, HOEHE_WELT);
    const seiteFuer = (tuscheHoehe) => tuscheHoehe / (masse.hoehe / 2);
    // Gross, aber nie breiter als das Bild.
    const breiteWelt = HOEHE_WELT * kamera.aspect;
    grossSeite = seiteFuer(Math.min(1.9, (0.82 * breiteWelt * masse.hoehe) / masse.breite));
    zielSeite = seiteFuer(platz.hoehe);

    const { ton } = darstellungFuer(farbname);
    glyphMaterial.color.setHex(ton === 'hell' ? 0xffffff : 0x16181a, THREE.SRGBColorSpace);

    grundMaterial.uniforms.uHatTextur.value = hatTextur(farbname) ? 1 : 0;
    grundMaterial.uniforms.uFarbe.value = hatTextur(farbname) ? texturFuer(farbname) : null;
    kachelSetzen();
    grundMaterial.uniforms.uEinfarbig.value.copy(leitfarbe(farbname));
    grundMaterial.uniforms.uMisch.value = 0;
    grundMaterial.uniforms.uDrehung.value = 0;

    buchstabenFeld.scale.set(grossSeite, grossSeite, 1);
    buchstabenFeld.position.set(0, 0.1, -1.1);
    stein.position.set(0, 0.1, 0);
    stein.scale.setScalar(1);
    stein.rotation.set(0, 0, 0);
  };

  const schritt = (t) => {
    // Der Kreis dreht sich schnell und wird langsamer, wie eine auslaufende
    // Scheibe. Der Stein tut dasselbe, nur um zwei Achsen.
    const auslauf = easeOut(spanne(t, 0, 0.72));
    grundMaterial.uniforms.uDrehung.value = auslauf * 7.4;
    grundMaterial.uniforms.uMisch.value = easeInOut(spanne(t, 0.42, 0.74));

    stein.rotation.y = auslauf * 12.6;
    stein.rotation.x = auslauf * 5.1;
    stein.scale.setScalar(mische(0.8, 1.18, easeOut(spanne(t, 0, 0.45))));

    // Der Stein faellt aus dem Bild, sobald er seine Arbeit getan hat.
    const fall = easeIn(spanne(t, 0.7, 0.9));
    stein.position.y = 0.1 - fall * 4.6;
    stein.rotation.z = fall * 2.4;

    // Der Buchstabe wandert auf seinen Platz.
    const wandern = easeInOut(spanne(t, 0.76, 0.94));
    const seite = mische(grossSeite, zielSeite, wandern);
    buchstabenFeld.scale.set(seite, seite, 1);
    buchstabenFeld.position.x = mische(0, platz.x, wandern);
    buchstabenFeld.position.y = mische(0.1, platz.y, wandern);
  };

  const rendern = () => renderer.render(szene, kamera);

  const freigeben = () => {
    grund.geometry.dispose();
    grundMaterial.dispose();
    buchstabenFeld.geometry.dispose();
    glyphMaterial.dispose();
    stein.geometry.dispose();
    steinMaterial.dispose();
    glyph?.dispose();
    renderer.dispose();
  };

  return { groesse, bereit, schritt, rendern, freigeben };
};
