/**
 * 1 - Staub
 *
 * Sechsunddreissigtausend Staubkoerner tragen den ganzen Farbtopf. Sie kreisen
 * auseinander, werden nach innen gezogen und setzen sich zum gezogenen
 * Buchstaben zusammen. Waehrend sie einlaufen, wechseln alle Koerner nach und
 * nach in die gezogene Farbe: aus achtundzwanzig Moeglichkeiten wird eine,
 * sichtbar und nicht behauptet.
 *
 * Zum Schluss schrumpft der Buchstabe auf die Stelle, an der ihn die Seite
 * hinsetzt, und blendet dort aus. Die Uebergabe faellt damit nicht auf.
 *
 * Die Bewegung rechnet der Shader, einmal je Korn und Bild. Auf der Seite des
 * Rechners waere das bei dieser Zahl nicht zu halten.
 */

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

import { RAUSCHEN } from './rauschen.js';
import { glyphWolke, glyphMasse } from './glyph.js';
import { farbwolke, ganzerTopf, leitfarbe } from './farben3d.js';
import {
  rendererBauen,
  kameraAufHoehe,
  landeplatz,
  spanne,
  easeInOut,
  sichtbar,
  zufallAus,
} from './buehne.js';

export const meta = {
  titel: '1 · Staub',
  text: 'Der ganze Farbtopf als Staub, der auseinanderkreist, nach innen gerissen wird und sich zum Buchstaben setzt. Unterwegs wechseln alle Körner in die gezogene Farbe.',
  dauer: 3200,
  landung: 0.87,
  abgang: 'flut',
};

const KOERNER = 36000;
const HOEHE_WELT = 4.3;
const SPREIZUNG = 1.32;

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

export const bauen = ({ leinwand }) => {
  const renderer = rendererBauen(leinwand, { alpha: false });
  const szene = new THREE.Scene();
  szene.background = new THREE.Color(0x0b0d10);

  const kamera = new THREE.PerspectiveCamera(45, 0.5, 0.1, 60);
  kameraAufHoehe(kamera, HOEHE_WELT, 5);

  const geometrie = new THREE.BufferGeometry();
  const ziel = new Float32Array(KOERNER * 3);
  const farbe = new Float32Array(KOERNER * 3);
  const radius = new Float32Array(KOERNER);
  const dreh = new Float32Array(KOERNER);
  const verzug = new Float32Array(KOERNER);
  const korn = new Float32Array(KOERNER);

  for (let i = 0; i < KOERNER; i += 1) {
    radius[i] = 0.5 + Math.random() ** 1.6 * 2.6;
    dreh[i] = Math.random() * Math.PI * 2;
    verzug[i] = Math.random() ** 2 * 0.34;
    korn[i] = 0.007 + Math.random() ** 2.4 * 0.016;
  }

  geometrie.setAttribute('position', new THREE.BufferAttribute(ziel, 3));
  geometrie.setAttribute('aZiel', new THREE.BufferAttribute(ziel, 3));
  geometrie.setAttribute('aFarbe', new THREE.BufferAttribute(farbe, 3));
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
      uZielfarbe: { value: new THREE.Color(0xffffff) },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const wolke = new THREE.Points(geometrie, material);
  szene.add(wolke);

  const komponist = new EffectComposer(renderer);
  komponist.addPass(new RenderPass(szene, kamera));
  komponist.addPass(new UnrealBloomPass(new THREE.Vector2(256, 512), 0.34, 0.7, 0.62));
  komponist.addPass(new OutputPass());

  /** Wohin der Buchstabe am Ende laeuft, und wie klein er dort ist. */
  let platz = { hoehe: 1, x: 0, y: 0 };
  let zielMasse = 1;

  const groesse = (breite, hoehe) => {
    renderer.setSize(breite, hoehe, false);
    komponist.setSize(breite, hoehe);
    kamera.aspect = breite / hoehe;
    kameraAufHoehe(kamera, HOEHE_WELT, 5);
    // Punktgroessen sind in Bildpunkten, die Koerner in Welteinheiten. Der
    // Umrechnungsfaktor haengt an Bildhoehe und Oeffnungswinkel.
    const hoeheImPuffer = hoehe * renderer.getPixelRatio();
    material.uniforms.uSkala.value =
      hoeheImPuffer / (2 * Math.tan(THREE.MathUtils.degToRad(kamera.fov) / 2));
  };

  const bereit = ({ buchstabe, farbe: farbname }) => {
    const punkte = glyphWolke(buchstabe, KOERNER);
    const topf = ganzerTopf().map((f) => sichtbar(f.clone()));
    const eigene = farbwolke(farbname).map((f) => sichtbar(f.clone(), 0.42));

    for (let i = 0; i < KOERNER; i += 1) {
      ziel[i * 3] = punkte[i * 2] * SPREIZUNG;
      ziel[i * 3 + 1] = punkte[i * 2 + 1] * SPREIZUNG;
      ziel[i * 3 + 2] = (Math.random() - 0.5) * 0.16;

      // Ein Zehntel traegt schon die gezogene Farbe, damit der Wechsel nicht
      // wie ein Schalter wirkt, sondern wie ein Uebergewicht.
      const gewaehlt = Math.random() < 0.1 ? zufallAus(eigene) : zufallAus(topf);
      farbe[i * 3] = gewaehlt.r;
      farbe[i * 3 + 1] = gewaehlt.g;
      farbe[i * 3 + 2] = gewaehlt.b;
    }
    geometrie.attributes.aZiel.needsUpdate = true;
    geometrie.attributes.position.needsUpdate = true;
    geometrie.attributes.aFarbe.needsUpdate = true;

    platz = landeplatz(buchstabe, HOEHE_WELT);
    zielMasse = platz.hoehe / (glyphMasse(buchstabe).hoehe * SPREIZUNG);

    material.uniforms.uZielfarbe.value.copy(sichtbar(leitfarbe(farbname).clone(), 0.42));
    material.uniforms.uT.value = 0;
    material.uniforms.uZeit.value = 0;
    material.uniforms.uFarbwechsel.value = 0;
    material.uniforms.uMasse.value = 1;
    material.uniforms.uVersatz.value.set(0, 0, 0);
    material.uniforms.uAbgang.value = 0;
    wolke.rotation.y = 0;
  };

  const schritt = (t, sekunden) => {
    const schrumpf = easeInOut(spanne(t, 0.74, 0.93));
    material.uniforms.uT.value = spanne(t, 0.03, 0.7);
    material.uniforms.uZeit.value = sekunden;
    material.uniforms.uFarbwechsel.value = easeInOut(spanne(t, 0.32, 0.72));
    material.uniforms.uMasse.value = 1 + (zielMasse - 1) * schrumpf;
    material.uniforms.uVersatz.value.set(platz.x * schrumpf, platz.y * schrumpf, 0);
    material.uniforms.uAbgang.value = spanne(t, 0.85, 1);
    wolke.rotation.y = Math.sin(sekunden * 0.5) * 0.16 * (1 - spanne(t, 0.55, 0.78));
  };

  const rendern = () => komponist.render();

  const freigeben = () => {
    geometrie.dispose();
    material.dispose();
    komponist.dispose();
    renderer.dispose();
  };

  return { groesse, bereit, schritt, rendern, freigeben };
};
