/**
 * Die Farbflut der Seite, aber als Flaeche im Raum.
 *
 * `styles.css` legt eine gezogene Farbe als Hintergrund ueber die ganze Seite:
 * Verlaeufe in voller Staerke, Muster gedaempft ueber einer ruhigen Grundfarbe.
 * Wer im Raum dasselbe zeigen will, muss dieselben drei Dinge treffen, und zwar
 * alle drei, sonst faellt der Wechsel zur Seite auf:
 *
 * - die Kachelung, damit Streifen nicht ploetzlich steiler stehen,
 * - die Daempfung, damit der Text nicht auf Streifen steht,
 * - den Farbraum, denn CSS mischt in sRGB und ein Shader in linearem Licht.
 *
 * Dazu kommt hier noch eine Staerke: die Flaeche faengt als ruhiger Grund an
 * und wird erst zur Farbe, wenn die Enthuellung so weit ist.
 */

import * as THREE from 'three';

import {
  FARBRAUM,
  texturFuer,
  hatTextur,
  kachelung,
  daempfungFuer,
  leitfarbe,
} from './farben3d.js';

const VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT = /* glsl */ `
  uniform sampler2D uFarbe;
  uniform vec3 uEinfarbig;
  uniform float uHatTextur;
  uniform vec2 uKachel;
  uniform vec3 uDaempfBasis;
  uniform float uDaempfStaerke;
  uniform vec3 uGrundfarbe;
  uniform float uStaerke;
  varying vec2 vUv;

  void main() {
    vec3 farbe = uHatTextur > 0.5
      ? texture2D(uFarbe, vUv * uKachel).rgb
      : uEinfarbig;
    farbe = mischeWieCss(uDaempfBasis, farbe, uDaempfStaerke);
    gl_FragColor = vec4(mix(uGrundfarbe, farbe, uStaerke), 1.0);
    #include <colorspace_fragment>
  }
`;

/**
 * @param {number} grundfarbe Der ruhige Grund, bevor die Farbe kommt.
 */
export const flutFlaeche = (grundfarbe = 0x0c0e12) => {
  const material = new THREE.ShaderMaterial({
    vertexShader: VERTEX,
    fragmentShader: FARBRAUM + FRAGMENT,
    uniforms: {
      uFarbe: { value: null },
      uEinfarbig: { value: new THREE.Color(0xffffff) },
      uHatTextur: { value: 0 },
      uKachel: { value: new THREE.Vector2(1, 1) },
      uDaempfBasis: { value: new THREE.Color(0, 0, 0) },
      uDaempfStaerke: { value: 1 },
      uGrundfarbe: { value: new THREE.Color().setHex(grundfarbe, THREE.SRGBColorSpace) },
      uStaerke: { value: 0 },
    },
  });

  const flaeche = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
  let name = 'Rot';
  let seite = 0.5;

  const nachziehen = () => {
    material.uniforms.uKachel.value.copy(kachelung(name, seite));
  };

  return {
    flaeche,

    farbeSetzen(gezogen) {
      name = gezogen;
      material.uniforms.uHatTextur.value = hatTextur(name) ? 1 : 0;
      material.uniforms.uFarbe.value = hatTextur(name) ? texturFuer(name) : null;
      material.uniforms.uEinfarbig.value.copy(leitfarbe(name));
      const daempfung = daempfungFuer(name);
      material.uniforms.uDaempfBasis.value.copy(daempfung.basis);
      material.uniforms.uDaempfStaerke.value = daempfung.staerke;
      material.uniforms.uStaerke.value = 0;
      nachziehen();
    },

    /** 0 ist der ruhige Grund, 1 ist die gezogene Farbe. */
    staerke(wert) {
      material.uniforms.uStaerke.value = wert;
    },

    /** Legt die Flaeche in einer bestimmten Tiefe formatfuellend hinter die Kamera-Achse. */
    einpassen(kamera, tiefe) {
      seite = kamera.aspect;
      const hoehe = 2 * Math.tan(THREE.MathUtils.degToRad(kamera.fov) / 2) * tiefe;
      flaeche.scale.set(hoehe * kamera.aspect * 1.04, hoehe * 1.04, 1);
      flaeche.position.z = kamera.position.z - tiefe;
      nachziehen();
    },

    freigeben() {
      flaeche.geometry.dispose();
      material.dispose();
    },
  };
};
