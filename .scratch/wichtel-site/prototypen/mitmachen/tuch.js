/**
 * Das Gemeinsame der mitmachenden Enthuellungen.
 *
 * Die Runde davor lief von selbst ab. Diese hier laeuft nicht, bis jemand sie
 * anfasst: unter einer Decke liegen zwei Felder, eines mit dem Buchstaben und
 * eines mit der Farbe, und beide werden einzeln freigelegt.
 *
 * Damit der Buchstabe das Feld der Farbe nicht verraet, steht er in neutraler
 * Tinte auf Papier. Die gezogene Farbe kommt erst, wenn ihr eigenes Feld frei
 * ist, und die ganze Seite bekommt sie erst, wenn beide frei sind. Sonst waere
 * das zweite Feld schon beantwortet, bevor es angefasst wird.
 *
 * Vier der fuenf Entwuerfe unterscheiden sich nur in der Decke und im Strich.
 * Deshalb liegt hier alles, was sie teilen: die Felder, die Karten darunter,
 * die Maske, in die der Finger malt, und die Landung. Ein Entwurf gibt dann
 * einen Fragment-Shader und einen Pinsel an und sonst nichts.
 *
 * Der Vertrag steht in `index.html`.
 */

import * as THREE from 'three';

import { glyphTextur, glyphMasse } from '../enthuellung/glyph.js';
import { texturFuer, kachelung } from '../enthuellung/farben3d.js';
import { landeplatz, spanne, easeInOut } from '../enthuellung/buehne.js';
import { darstellungFuer } from '../../../../src/pool.js';

/** Die Buehne ist hochkant und immer halb so breit wie hoch. */
export const HOEHE_WELT = 2;
export const BREITE_WELT = 1;

/**
 * Die beiden Felder, in Buehnen-Koordinaten: u von links nach rechts, v von
 * oben nach unten, beide von 0 bis 1.
 *
 * Der Buchstabe bekommt ein Quadrat, die Farbe einen Streifen. Unten bleibt
 * ein Viertel der Buehne frei, denn dorthin faellt spaeter der Buchstabe der
 * Seite, und der Flug dahin soll zu sehen sein.
 */
export const FELDER = Object.freeze({
  buchstabe: Object.freeze({ u0: 0.08, u1: 0.92, v0: 0.145, v1: 0.565 }),
  farbe: Object.freeze({ u0: 0.08, u1: 0.92, v0: 0.605, v1: 0.755 }),
});

export const FELDNAMEN = Object.freeze(['buchstabe', 'farbe']);

/** Dieselben Felder fuer den Shader, damit keine zweite Liste entsteht. */
export const FELDER_GLSL = /* glsl */ `
  const vec4 FELD_A = vec4(${FELDER.buchstabe.u0}, ${FELDER.buchstabe.v0}, ${FELDER.buchstabe.u1}, ${FELDER.buchstabe.v1});
  const vec4 FELD_B = vec4(${FELDER.farbe.u0}, ${FELDER.farbe.v0}, ${FELDER.farbe.u1}, ${FELDER.farbe.v1});

  const float RUND = 0.019;

  /* Die Decke liegt einen Hauch ueber den Rand der Karte hinaus. Genau
     buendig bleibt sonst ein Faden der Karte stehen, und bei der roten
     Farbkarte ist das eine rote Linie, die die Antwort verraet. */
  const float UEBERSTAND = 0.005;

  /* Die Lage im Feld, von 0 bis 1, damit sich eine Decke am Feldrand
     ausrichten kann und nicht an der Buehne. */
  vec2 imFeldUv(vec2 uv, vec4 feld) {
    return (uv - feld.xy) / (feld.zw - feld.xy);
  }

  /* Abstand zum abgerundeten Feldrand, in Buehnenhoehen, negativ innerhalb.

     Gerechnet wird in Buehnenhoehen und nicht in uv, sonst waeren die Ecken
     eines liegenden Feldes Ellipsen: die Buehne ist doppelt so hoch wie
     breit, und in uv ist eine Laenge waagerecht etwas anderes als senkrecht. */
  float feldRand(vec2 uv, vec4 feld) {
    vec2 p = vec2(uv.x * 0.5, uv.y);
    vec2 a = vec2(feld.x * 0.5, feld.y);
    vec2 b = vec2(feld.z * 0.5, feld.w);
    vec2 mitte = (a + b) * 0.5;
    vec2 halb = (b - a) * 0.5 - RUND + UEBERSTAND;
    vec2 d = abs(p - mitte) - halb;
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - RUND;
  }
`;

/** Buehnen-Koordinate zu Weltkoordinate. */
export const uvZuWelt = (u, v) => ({
  x: (u - 0.5) * BREITE_WELT,
  y: (0.5 - v) * HOEHE_WELT,
});

const rechteck = (g, x, y, b, h, r) => {
  g.beginPath();
  g.roundRect(x, y, b, h, r);
};

const SCHRIFT = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

/**
 * Was unter der Decke liegt: zwei Karten, eine leer fuer den Buchstaben und
 * eine mit der gezogenen Farbe.
 *
 * Der Buchstabe selbst wird nicht hier gezeichnet, sondern liegt als eigene
 * Flaeche darueber. Nur so kann er am Ende an seinen Platz auf der Seite
 * fliegen, waehrend die Karte stehen bleibt.
 */
export const untenTextur = (ziehung, { breite = 512 } = {}) => {
  const hoehe = breite * 2;
  const leinwand = document.createElement('canvas');
  leinwand.width = breite;
  leinwand.height = hoehe;
  const g = leinwand.getContext('2d');

  const kasten = (feld) => ({
    x: feld.u0 * breite,
    y: feld.v0 * hoehe,
    b: (feld.u1 - feld.u0) * breite,
    h: (feld.v1 - feld.v0) * hoehe,
  });

  const beschriften = (feld, text) => {
    const k = kasten(feld);
    g.fillStyle = 'rgba(28, 30, 34, 0.42)';
    g.font = `700 ${breite * 0.026}px ${SCHRIFT}`;
    g.textAlign = 'left';
    g.textBaseline = 'alphabetic';
    g.letterSpacing = `${breite * 0.006}px`;
    g.fillText(text.toUpperCase(), k.x + breite * 0.008, k.y - breite * 0.022);
    g.letterSpacing = '0px';
  };

  // Die Karte des Buchstabens: Papier, sonst nichts. Die Farbe darf hier nicht
  // vorkommen, sonst beantwortet das eine Feld das andere gleich mit.
  const kb = kasten(FELDER.buchstabe);
  g.save();
  g.shadowColor = 'rgba(0, 0, 0, 0.3)';
  g.shadowBlur = breite * 0.045;
  g.shadowOffsetY = breite * 0.012;
  g.fillStyle = '#faf7f1';
  rechteck(g, kb.x, kb.y, kb.b, kb.h, breite * 0.045);
  g.fill();
  g.restore();
  g.strokeStyle = 'rgba(27, 30, 34, 0.12)';
  g.lineWidth = Math.max(1, breite * 0.003);
  rechteck(g, kb.x, kb.y, kb.b, kb.h, breite * 0.045);
  g.stroke();
  beschriften(FELDER.buchstabe, 'Buchstabe');

  // Die Karte der Farbe: die Farbe selbst, so wie die Seite sie zeigt.
  const kf = kasten(FELDER.farbe);
  const { ton } = darstellungFuer(ziehung.farbe);
  const bild = texturFuer(ziehung.farbe).image;
  const kacheln = kachelung(ziehung.farbe, 0.5);

  g.save();
  g.shadowColor = 'rgba(0, 0, 0, 0.3)';
  g.shadowBlur = breite * 0.045;
  g.shadowOffsetY = breite * 0.012;
  g.fillStyle = '#000000';
  rechteck(g, kf.x, kf.y, kf.b, kf.h, breite * 0.045);
  g.fill();
  g.restore();

  g.save();
  rechteck(g, kf.x, kf.y, kf.b, kf.h, breite * 0.045);
  g.clip();
  if (kacheln.x > 1) {
    // Ein Muster wiederholt sich und wird nicht gedehnt, sonst stehen
    // Streifen, die auf der Seite unter 45 Grad laufen, hier schraeger.
    const kachel = kf.h / 1.4;
    const muster = g.createPattern(bild, 'repeat');
    muster.setTransform(new DOMMatrix().translate(kf.x, kf.y).scale(kachel / bild.width));
    g.fillStyle = muster;
    g.fillRect(kf.x, kf.y, kf.b, kf.h);
  } else {
    // Ein Verlauf laeuft genau einmal ueber die Karte, so wie ueber die Seite.
    g.drawImage(bild, kf.x, kf.y, kf.b, kf.h);
  }
  g.fillStyle = ton === 'hell' ? 'rgba(255, 255, 255, 0.94)' : 'rgba(22, 24, 26, 0.92)';
  g.font = `800 ${kf.h * 0.42}px ${SCHRIFT}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(ziehung.farbe, kf.x + kf.b / 2, kf.y + kf.h * 0.54);
  g.restore();

  g.strokeStyle = 'rgba(27, 30, 34, 0.14)';
  rechteck(g, kf.x, kf.y, kf.b, kf.h, breite * 0.045);
  g.stroke();
  beschriften(FELDER.farbe, 'Farbe');

  const textur = new THREE.CanvasTexture(leinwand);
  textur.colorSpace = THREE.SRGBColorSpace;
  textur.minFilter = THREE.LinearFilter;
  textur.generateMipmaps = false;
  return textur;
};

/**
 * Die Maske, in die der Finger malt.
 *
 * Weiss heisst frei, Schwarz heisst zugedeckt. Was eine Decke daraus macht,
 * ist ihre Sache: das Rubbellos nimmt die harte Kante, der Beschlag die
 * weiche, die Taschenlampe nimmt dieselbe Maske als Gedaechtnis fuer das
 * Licht und zerstoert dabei gar nichts.
 */
export const maskeBauen = ({ breite = 192 } = {}) => {
  const hoehe = breite * 2;
  const leinwand = document.createElement('canvas');
  leinwand.width = breite;
  leinwand.height = hoehe;
  const g = leinwand.getContext('2d', { willReadFrequently: true });

  const textur = new THREE.CanvasTexture(leinwand);
  textur.minFilter = THREE.LinearFilter;
  textur.magFilter = THREE.LinearFilter;
  textur.generateMipmaps = false;

  const leeren = () => {
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = '#000000';
    g.fillRect(0, 0, breite, hoehe);
    textur.needsUpdate = true;
  };
  leeren();

  /** Ein Tupfer an einer Stelle, weich auslaufend. */
  const tupfen = (u, v, { radius, weich, druck }) => {
    const x = u * breite;
    const y = v * hoehe;
    const r = radius * hoehe;
    const verlauf = g.createRadialGradient(x, y, 0, x, y, r);
    verlauf.addColorStop(0, `rgba(255,255,255,${druck})`);
    verlauf.addColorStop(Math.max(0.001, 1 - weich), `rgba(255,255,255,${druck})`);
    verlauf.addColorStop(1, 'rgba(255,255,255,0)');
    g.globalCompositeOperation = 'lighter';
    g.fillStyle = verlauf;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  };

  /**
   * Ein Strich von einem Punkt zum naechsten.
   *
   * Mit einzelnen Tupfern je Bild hat ein schneller Zeiger Luecken, und die
   * sehen aus wie eine kaputte Maske statt nach einer schnellen Hand.
   */
  const streichen = (von, nach, pinsel) => {
    const weite = Math.hypot((nach.u - von.u) * 0.5, nach.v - von.v);
    const schritte = Math.max(1, Math.ceil(weite / (pinsel.radius * 0.34)));
    for (let i = 1; i <= schritte; i += 1) {
      const a = i / schritte;
      tupfen(von.u + (nach.u - von.u) * a, von.v + (nach.v - von.v) * a, pinsel);
    }
    textur.needsUpdate = true;
  };

  /** Laesst die Maske wieder zulaufen, fuer alles, was von selbst zurueckkommt. */
  const abklingen = (menge) => {
    if (menge <= 0) return;
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = `rgba(0,0,0,${Math.min(menge, 1)})`;
    g.fillRect(0, 0, breite, hoehe);
    textur.needsUpdate = true;
  };

  /**
   * Wie frei ein Feld ist, von 0 bis 1.
   *
   * Gemessen wird der Mittelwert und nicht die Zahl der freien Punkte: eine
   * halb weggewischte Flaeche ist halb frei, und beim Beschlag ist genau das
   * der Zustand, in dem man steht.
   */
  const anteil = (feld) => {
    const x = Math.floor(feld.u0 * breite);
    const y = Math.floor(feld.v0 * hoehe);
    const b = Math.max(1, Math.ceil((feld.u1 - feld.u0) * breite));
    const h = Math.max(1, Math.ceil((feld.v1 - feld.v0) * hoehe));
    const bild = g.getImageData(x, y, b, h).data;
    let summe = 0;
    for (let i = 0; i < bild.length; i += 4) summe += bild[i];
    return summe / (255 * (bild.length / 4));
  };

  return { textur, leeren, streichen, abklingen, anteil, freigeben: () => textur.dispose() };
};

const DECKEL_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FLAECHE_VERTEX = DECKEL_VERTEX;

const FLAECHE_FRAGMENT = /* glsl */ `
  uniform sampler2D uBild;
  uniform float uDeckung;
  varying vec2 vUv;
  void main() {
    vec4 f = texture2D(uBild, vUv);
    gl_FragColor = vec4(f.rgb * f.a * uDeckung, f.a * uDeckung);
  }
`;

/**
 * Das Spielbrett: alles, was vier der fuenf Entwuerfe teilen.
 *
 * Ein Entwurf gibt `deckel` an und bekommt dafuer Felder, Karten, Maske,
 * Fortschritt und Landung geschenkt:
 *
 *   deckel = {
 *     fragment,               // der Shader der Decke
 *     pinsel,                 // { radius, weich, druck }
 *     schwelle,               // ab wann ein Feld als frei gilt
 *     zusatz?,                // eigene Uniforms
 *     bereit?(ziehung, u),    // je Ziehung setzen
 *     schritt?(sekunden, u),  // je Bild setzen
 *     abklingen?,             // wie schnell die Maske zulaeuft, je Sekunde
 *     lebhaft?,               // ob ohne Zeiger weitergerechnet werden muss
 *   }
 */
export const spielbrettBauen = ({ leinwand, deckel }) => {
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

  const maske = maskeBauen();

  // Die Karten darunter.
  const untenMaterial = new THREE.ShaderMaterial({
    vertexShader: FLAECHE_VERTEX,
    fragmentShader: FLAECHE_FRAGMENT,
    uniforms: { uBild: { value: null }, uDeckung: { value: 1 } },
    transparent: true,
    depthWrite: false,
  });
  const unten = new THREE.Mesh(
    new THREE.PlaneGeometry(BREITE_WELT, HOEHE_WELT),
    untenMaterial,
  );
  unten.position.z = 0;
  szene.add(unten);

  // Der Buchstabe, als eigene Flaeche, damit er am Ende wegfliegen kann.
  const buchstabeMaterial = new THREE.ShaderMaterial({
    vertexShader: FLAECHE_VERTEX,
    fragmentShader: /* glsl */ `
      uniform sampler2D uBild;
      uniform vec3 uTinte;
      uniform float uDeckung;
      varying vec2 vUv;
      void main() {
        float a = texture2D(uBild, vUv).a * uDeckung;
        gl_FragColor = vec4(uTinte * a, a);
      }
    `,
    uniforms: {
      uBild: { value: null },
      uTinte: { value: new THREE.Color(0x1b1e22) },
      uDeckung: { value: 1 },
    },
    transparent: true,
    depthWrite: false,
  });
  const buchstabe = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), buchstabeMaterial);
  buchstabe.position.z = 0.1;
  szene.add(buchstabe);

  // Die Decke darueber.
  const deckelUniforms = {
    uMaske: { value: maske.textur },
    uFrei: { value: new THREE.Vector2(0, 0) },
    uZeiger: { value: new THREE.Vector3(-1, -1, 0) },
    uZeit: { value: 0 },
    ...(deckel.zusatz ?? {}),
  };
  const deckelMaterial = new THREE.ShaderMaterial({
    vertexShader: DECKEL_VERTEX,
    fragmentShader: FELDER_GLSL + deckel.fragment,
    uniforms: deckelUniforms,
    transparent: true,
    depthWrite: false,
  });
  const decke = new THREE.Mesh(
    new THREE.PlaneGeometry(BREITE_WELT, HOEHE_WELT),
    deckelMaterial,
  );
  decke.position.z = 0.2;
  szene.add(decke);

  let untenTex = null;
  let buchstabeTex = null;
  let platz = { hoehe: 0.3, x: 0, y: -0.7 };
  let anfang = { hoehe: 1, x: 0, y: 0 };
  // Die Tinte auf dem Papier und die Schriftfarbe der Seite. Ohne den Wechsel
  // dazwischen springt der Buchstabe bei der Uebergabe von Dunkel auf Hell,
  // und das ist derselbe Sprung, den die Landung eigentlich vermeidet.
  const TINTE = new THREE.Color(0x1b1e22);
  const zielTinte = new THREE.Color(0xffffff);
  let frei = { buchstabe: 0, farbe: 0 };
  let gemessen = { buchstabe: 0, farbe: 0 };
  let letzterZeiger = null;
  // Nach der letzten Beruehrung wird noch eine Weile weitergerechnet: die
  // Maske wird nur zehnmal je Sekunde ausgemessen, und ein Feld, das mit dem
  // letzten Strich ueber die Schwelle kommt, springt sonst nie auf.
  let nachlauf = 0;

  const groesse = (breite, hoehe) => renderer.setSize(breite, hoehe, false);

  const bereit = (ziehung) => {
    untenTex?.dispose();
    buchstabeTex?.dispose();
    untenTex = untenTextur(ziehung);
    buchstabeTex = glyphTextur(ziehung.buchstabe);
    untenMaterial.uniforms.uBild.value = untenTex;
    buchstabeMaterial.uniforms.uBild.value = buchstabeTex;
    untenMaterial.uniforms.uDeckung.value = 1;
    buchstabeMaterial.uniforms.uDeckung.value = 1;

    const feld = FELDER.buchstabe;
    const kante = (feld.v1 - feld.v0) * HOEHE_WELT;
    const mitte = uvZuWelt((feld.u0 + feld.u1) / 2, (feld.v0 + feld.v1) / 2);
    anfang = { hoehe: kante * 0.92, x: mitte.x, y: mitte.y };
    buchstabe.scale.set(anfang.hoehe, anfang.hoehe, 1);
    buchstabe.position.set(anfang.x, anfang.y, 0.1);

    // Die Zielgroesse haengt an der Tinte des Buchstabens, nicht an der
    // Flaeche: ein I fuellt sein Quadrat anders aus als ein W.
    platz = landeplatz(ziehung.buchstabe, HOEHE_WELT);

    zielTinte.setHex(darstellungFuer(ziehung.farbe).ton === 'hell' ? 0xffffff : 0x16181a);
    buchstabeMaterial.uniforms.uTinte.value.copy(TINTE);

    maske.leeren();
    frei = { buchstabe: 0, farbe: 0 };
    gemessen = { buchstabe: 0, farbe: 0 };
    letzterZeiger = null;
    deckelUniforms.uFrei.value.set(0, 0);
    deckelUniforms.uZeiger.value.set(-1, -1, 0);
    deckelUniforms.uZeit.value = 0;
    deckel.bereit?.(ziehung, deckelUniforms);
  };

  const zeiger = (punkt) => {
    if (!punkt) {
      letzterZeiger = null;
      deckelUniforms.uZeiger.value.set(-1, -1, 0);
      return;
    }
    const malt = punkt.gedrueckt || deckel.ohneDruck;
    deckelUniforms.uZeiger.value.set(punkt.u, punkt.v, malt ? 1 : 0);
    if (!malt) {
      letzterZeiger = null;
      return;
    }
    const von = letzterZeiger ?? punkt;
    maske.streichen(von, punkt, deckel.pinsel);
    letzterZeiger = { u: punkt.u, v: punkt.v };
    nachlauf = 0.3;
  };

  let seitMessung = 0;

  const schritt = (sekunden, dauer) => {
    nachlauf = Math.max(0, nachlauf - dauer);
    deckelUniforms.uZeit.value = sekunden;
    if (deckel.abklingen) maske.abklingen(deckel.abklingen * dauer);
    deckel.schritt?.(sekunden, deckelUniforms);

    // Das Auslesen der Maske kostet eine Runde durch den Bildpunktspeicher,
    // und zehnmal je Sekunde reicht vollkommen, um eine Schwelle zu treffen.
    seitMessung += dauer;
    if (seitMessung >= 0.1) {
      seitMessung = 0;
      for (const name of FELDNAMEN) gemessen[name] = maske.anteil(FELDER[name]);
    }

    for (const [i, name] of FELDNAMEN.entries()) {
      // Ueber der Schwelle springt das Feld von selbst ganz auf. Niemand
      // rubbelt eine Flaeche vollstaendig frei, und wer es muesste, hoert
      // vorher auf und haelt die Enthuellung fuer kaputt.
      const ziel = gemessen[name] >= deckel.schwelle ? 1 : 0;
      frei[name] = ziel === 1 ? Math.min(1, frei[name] + dauer * 2.4) : 0;
      deckelUniforms.uFrei.value.setComponent(i, easeInOut(frei[name]));
    }
  };

  /**
   * Der Anteil, den jemand sieht: was gemessen wurde, bis das Feld aufspringt,
   * danach das Aufspringen selbst.
   */
  const fortschritt = () => ({
    buchstabe: Math.max(gemessen.buchstabe / deckel.schwelle, frei.buchstabe),
    farbe: Math.max(gemessen.farbe / deckel.schwelle, frei.farbe),
    fertig: frei.buchstabe >= 1 && frei.farbe >= 1,
  });

  /** Wie gross der Buchstabe am Ende ist, gemessen an seiner Tinte. */
  let zielGroesse = 1;
  const zielSetzen = (gezogen) => {
    zielGroesse = platz.hoehe / (glyphMasse(gezogen).hoehe / 2);
  };

  /**
   * Der Flug des Buchstabens auf seinen Platz in der Seite.
   *
   * Das ist die Stelle, an der sich die erste Runde verhoben hat: endet die
   * Enthuellung mit einem grossen Buchstaben in der Mitte und setzt die Seite
   * gleich darauf einen kleinen unten links hin, sieht man zwei Buchstaben und
   * einen Sprung.
   */
  const landen = (t) => {
    const flug = easeInOut(spanne(t, 0, 0.72));
    const hoehe = anfang.hoehe + (zielGroesse - anfang.hoehe) * flug;
    buchstabe.scale.set(hoehe, hoehe, 1);
    buchstabe.position.set(
      anfang.x + (platz.x - anfang.x) * flug,
      anfang.y + (platz.y - anfang.y) * flug,
      0.1,
    );
    // Erst ganz am Ende, wenn die Farbflut schon kommt. Frueher stuende ein
    // weisser Buchstabe auf dem hellen Papier und waere kurz verschwunden.
    buchstabeMaterial.uniforms.uTinte.value.copy(TINTE).lerp(zielTinte, spanne(t, 0.72, 0.95));
    const verblassen = 1 - spanne(t, 0.72, 1);
    buchstabeMaterial.uniforms.uDeckung.value = verblassen;
    untenMaterial.uniforms.uDeckung.value = 1 - spanne(t, 0.3, 0.86);
    deckelUniforms.uFrei.value.set(1, 1);
  };

  const rendern = () => renderer.render(szene, kamera);

  const freigeben = () => {
    untenTex?.dispose();
    buchstabeTex?.dispose();
    maske.freigeben();
    unten.geometry.dispose();
    decke.geometry.dispose();
    buchstabe.geometry.dispose();
    untenMaterial.dispose();
    deckelMaterial.dispose();
    buchstabeMaterial.dispose();
    renderer.dispose();
  };

  /**
   * Ob ohne Hand nichts mehr geschieht.
   *
   * Ein Feld, das gerade aufspringt, ist nicht ruhig, und die Seite muss
   * weiterrechnen, auch wenn niemand mehr etwas anfasst.
   */
  const ruhig = () =>
    nachlauf <= 0 && FELDNAMEN.every((name) => frei[name] <= 0 || frei[name] >= 1);

  return {
    groesse,
    ruhig,
    bereit: (ziehung) => {
      bereit(ziehung);
      zielSetzen(ziehung.buchstabe);
    },
    zeiger,
    schritt,
    fortschritt,
    landen,
    rendern,
    freigeben,
    lebhaft: Boolean(deckel.lebhaft || deckel.abklingen),
  };
};
