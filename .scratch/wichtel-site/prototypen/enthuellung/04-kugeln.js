/**
 * 4 - Kugeln
 *
 * Siebenhundert Christbaumkugeln in allen Farben des Topfes taumeln
 * durcheinander wie in einem geschuettelten Sack. Dann ordnen sich die, die
 * gebraucht werden, zum Buchstaben, und der Rest faellt aus dem Bild. Zuletzt
 * nehmen die uebrigen die gezogene Farbe an, mitsamt ihrem Material: Gold wird
 * metallisch, Glitzer bekommt Klarlack, Gestreift bekommt Streifen.
 *
 * Die Enthuellung mit dem meisten Wichteln darin, und die einzige, die eine
 * Farbe nicht nur zeigt, sondern anfassbar macht.
 */

import * as THREE from 'three';

import { glyphRaster, glyphMasse } from './glyph.js';
import { flutFlaeche } from './flut.js';
import { farbwolke, ganzerTopf, materialFuer, leitfarbe } from './farben3d.js';
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
  zufallAus,
} from './buehne.js';

export const meta = {
  titel: '4 · Kugeln',
  text: 'Siebenhundert Christbaumkugeln aus dem ganzen Topf taumeln durcheinander, ordnen sich zum Buchstaben und lassen den Rest fallen. Zum Schluss nehmen sie die gezogene Farbe samt Material an.',
  dauer: 3400,
  landung: 0.9,
  abgang: 'flut',
};

const KUGELN = 700;
const SPALTEN = 30;
const HOEHE_WELT = 4.2;
const ABSTAND = 5.2;
const SPREIZUNG = 1.35;

/** Ein fester Wurf je Kugel, damit das Aufspulen immer dasselbe Bild ergibt. */
const wuerfe = Array.from({ length: KUGELN }, () => ({
  winkel: Math.random() * Math.PI * 2,
  neigung: Math.acos(2 * Math.random() - 1),
  radius: 0.7 + Math.random() ** 0.7 * 2.1,
  tempo: 0.5 + Math.random() * 1.3,
  kreisel: Math.random() * Math.PI * 2,
  masse: 0.78 + Math.random() * 0.46,
  flucht: Math.random() * Math.PI * 2,
}));

export const bauen = ({ leinwand }) => {
  const renderer = rendererBauen(leinwand, { alpha: false });
  renderer.setClearColor(0x0c0e12, 1);

  const szene = new THREE.Scene();
  szene.environment = umgebungFuer(renderer);
  szene.environmentIntensity = 1;

  const kamera = new THREE.PerspectiveCamera(45, 0.5, 0.1, 80);
  kameraAufHoehe(kamera, HOEHE_WELT, ABSTAND);

  const licht = new THREE.DirectionalLight(0xffffff, 2.1);
  licht.position.set(-2.5, 4, 5);
  szene.add(licht);
  szene.add(new THREE.AmbientLight(0xffffff, 0.35));

  // Ein Grund, der zur gezogenen Farbe wird.
  //
  // Ohne ihn steht Durchsichtig auf Schwarz, und Glas, das Schwarz durchlaesst,
  // ist schwarz. Nebenbei macht er die Uebergabe an die Seite sanfter: die
  // Farbe ist schon da, bevor die Farbflut sie uebernimmt.
  const grund = flutFlaeche(0x0c0e12);
  szene.add(grund.flaeche);

  const kugel = new THREE.SphereGeometry(1, 22, 14);

  /** Vor der Ziehung: jede Kugel ihre eigene Farbe, auf schlichtem Material. */
  const topfMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.08,
    roughness: 0.34,
    clearcoat: 0.5,
    clearcoatRoughness: 0.2,
  });

  const buchstabenKugeln = new THREE.InstancedMesh(kugel, topfMaterial, KUGELN);
  const restKugeln = new THREE.InstancedMesh(kugel, topfMaterial, KUGELN);
  for (const haufen of [buchstabenKugeln, restKugeln]) {
    haufen.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    haufen.frustumCulled = false;
    szene.add(haufen);
  }

  const hilfe = new THREE.Object3D();
  const farbeJetzt = new THREE.Color();

  /** Nach der Ziehung: eine Farbe, aber mit ihrem echten Material. */
  let zielMaterial = null;
  let plaetze = [];
  let platz = { hoehe: 0.5, x: 0, y: 0 };
  let kugelmasse = 0.07;
  let zielMasse = 0.3;
  let startfarben = [];
  let zielfarbe = new THREE.Color();

  const groesse = (breite, hoehe) => {
    renderer.setSize(breite, hoehe, false);
    kamera.aspect = breite / hoehe;
    kameraAufHoehe(kamera, HOEHE_WELT, ABSTAND);
    grund.einpassen(kamera, ABSTAND + 6);
  };

  const bereit = ({ buchstabe, farbe: farbname }) => {
    plaetze = glyphRaster(buchstabe, SPALTEN).slice(0, KUGELN);
    platz = landeplatz(buchstabe, HOEHE_WELT);
    // Eine Kugel fuellt ihr Rasterfeld und ueberlappt die Nachbarn ein wenig,
    // sonst sieht der Buchstabe aus wie ein Sieb.
    kugelmasse = ((2 * SPREIZUNG) / SPALTEN) * 0.62;
    zielMasse = platz.hoehe / (glyphMasse(buchstabe).hoehe * SPREIZUNG);

    buchstabenKugeln.count = plaetze.length;
    restKugeln.count = KUGELN - plaetze.length;

    const topf = ganzerTopf();
    startfarben = Array.from({ length: KUGELN }, () => zufallAus(topf));
    zielfarbe = leitfarbe(farbname);

    zielMaterial?.dispose();
    // Eine Kugel ist klein: ein Muster muss einmal um sie herum laufen, nicht
    // dreimal, sonst verschwimmt es zu einem Grauton.
    zielMaterial = materialFuer(farbname, { kacheln: 1 });

    grund.farbeSetzen(farbname);
    for (const haufen of [buchstabenKugeln, restKugeln]) haufen.material = topfMaterial;
  };

  /** Wo Kugel `i` taumelt, solange noch nichts entschieden ist. */
  const imSack = (i, zeit, ziel) => {
    const w = wuerfe[i];
    const a = w.winkel + zeit * w.tempo * 0.55;
    const b = w.neigung + Math.sin(zeit * 0.6 + w.kreisel) * 0.5;
    const r = w.radius * (1 + Math.sin(zeit * 0.9 + w.kreisel) * 0.08);
    ziel.set(
      Math.sin(b) * Math.cos(a) * r,
      Math.cos(b) * r * 0.92 + Math.sin(zeit * 1.3 + w.kreisel) * 0.12,
      Math.sin(b) * Math.sin(a) * r,
    );
  };

  const vonHier = new THREE.Vector3();
  const nachDort = new THREE.Vector3();

  const schritt = (t, sekunden) => {
    const ordnen = easeInOut(spanne(t, 0.3, 0.68));
    const fallen = easeIn(spanne(t, 0.3, 0.72));
    const farbwechsel = easeInOut(spanne(t, 0.5, 0.74));
    const schrumpf = easeInOut(spanne(t, 0.74, 0.93));
    grund.staerke(easeInOut(spanne(t, 0.7, 0.93)));

    // Ab dem Wechsel traegt die Farbe ihr echtes Material. Davor waere es
    // verraten, wovon es noch gar nichts zu wissen gibt.
    const material = t >= 0.74 ? zielMaterial : topfMaterial;
    if (buchstabenKugeln.material !== material) {
      buchstabenKugeln.material = material;
      restKugeln.material = material;
    }
    const eigeneFarbe = material === topfMaterial;

    const masse = mische(1, zielMasse, schrumpf);
    const versatzX = platz.x * schrumpf;
    const versatzY = platz.y * schrumpf;
    // Ein kurzer Stups, wenn die Farbe einrastet.
    const stups = 1 + Math.sin(spanne(t, 0.7, 0.8) * Math.PI) * 0.18;

    for (let i = 0; i < plaetze.length; i += 1) {
      imSack(i, sekunden, vonHier);
      const p = plaetze[i];
      nachDort.set(p.x * SPREIZUNG, p.y * SPREIZUNG, 0);
      hilfe.position.lerpVectors(vonHier, nachDort, ordnen);
      hilfe.position.multiplyScalar(masse);
      hilfe.position.x += versatzX;
      hilfe.position.y += versatzY;
      hilfe.rotation.set(sekunden * 0.7 + i, sekunden * 0.5 + i * 0.3, 0);
      hilfe.scale.setScalar(kugelmasse * wuerfe[i].masse * masse * stups);
      hilfe.updateMatrix();
      buchstabenKugeln.setMatrixAt(i, hilfe.matrix);

      farbeJetzt.copy(startfarben[i]).lerp(zielfarbe, farbwechsel);
      buchstabenKugeln.setColorAt(i, eigeneFarbe ? farbeJetzt : farbeJetzt.setRGB(1, 1, 1));
    }

    for (let i = 0; i < restKugeln.count; i += 1) {
      const j = plaetze.length + i;
      const w = wuerfe[j];
      imSack(j, sekunden, vonHier);
      // Wer nicht gebraucht wird, wird zur Seite gedraengt und faellt.
      hilfe.position.set(
        vonHier.x + Math.cos(w.flucht) * fallen * 2.6,
        vonHier.y - fallen * fallen * 9,
        vonHier.z + Math.sin(w.flucht) * fallen * 1.4,
      );
      hilfe.rotation.set(sekunden * 1.1 + j, sekunden * 0.8 + j * 0.2, 0);
      hilfe.scale.setScalar(kugelmasse * w.masse * (1 - fallen * 0.35));
      hilfe.updateMatrix();
      restKugeln.setMatrixAt(i, hilfe.matrix);
      restKugeln.setColorAt(i, startfarben[j]);
    }

    buchstabenKugeln.instanceMatrix.needsUpdate = true;
    restKugeln.instanceMatrix.needsUpdate = true;
    if (buchstabenKugeln.instanceColor) buchstabenKugeln.instanceColor.needsUpdate = true;
    if (restKugeln.instanceColor) restKugeln.instanceColor.needsUpdate = true;

    // Eine ruhige Kamerabewegung gibt dem Haufen Tiefe.
    szene.rotation.y = Math.sin(sekunden * 0.45) * 0.14 * (1 - easeOut(spanne(t, 0.55, 0.8)));
  };

  const rendern = () => renderer.render(szene, kamera);

  const freigeben = () => {
    kugel.dispose();
    grund.freigeben();
    topfMaterial.dispose();
    zielMaterial?.dispose();
    buchstabenKugeln.dispose();
    restKugeln.dispose();
    renderer.dispose();
  };

  return { groesse, bereit, schritt, rendern, freigeben };
};
