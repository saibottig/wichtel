/**
 * Die Vergleichsseite: fuenf Enthuellungen zum Mitmachen, eine Ziehung.
 *
 * Wie in der Runde davor spielen alle dasselbe Ergebnis, sonst vergleicht man
 * Farben statt Bedienung. Neu ist, dass hier nichts von selbst laeuft: jede
 * Karte wartet auf eine Hand.
 *
 * Vertrag eines Moduls:
 *
 *   export const meta = { titel, text, hinweis }
 *   export const bauen = ({ leinwand }) => ({
 *     groesse(breite, hoehe),        // bei jeder Groessenaenderung
 *     bereit(ziehung),               // zurueck auf zugedeckt
 *     zeiger(punkt | null),          // { u, v, gedrueckt } in Buehnen-Koordinaten
 *     schritt(sekunden, dauer),      // je Bild
 *     rendern(),
 *     fortschritt(),                 // { buchstabe, farbe, fertig }, je 0 bis 1
 *     landen(t),                     // der Uebergang zur Seite, t von 0 bis 1
 *     freigeben(),
 *     lebhaft,                       // ob ohne Hand weitergerechnet werden muss
 *   })
 *
 * Die Landung gehoert dem Modul, die Farbflut der Seite. Beides zusammen ist
 * die Stelle, an der sich die erste Runde verhoben hat.
 */

import { BUCHSTABEN, FARBEN, darstellungFuer } from '../../../../src/pool.js';
import { zufallAus } from '../enthuellung/buehne.js';
import { FELDER } from './tuch.js';

const MODULE = [
  './01-rubbellos.js',
  './02-geschenkpapier.js',
  './03-beschlagene-scheibe.js',
  './04-taschenlampe.js',
  './05-schneekugel.js',
];

const JAHR = new Date().getFullYear();
const LANDUNG_MS = 1100;
/** Ab wann die Seite uebernimmt: genau dann, wenn der Buchstabe angekommen
 *  ist. Frueher deckt die Farbflut ihn auf halbem Weg zu, und die Uebergabe
 *  ist wieder der Sprung, den sie vermeiden soll. */
const UEBERGABE = 0.72;
const $ = (id) => document.getElementById(id);

let ziehung = { jahr: JAHR, buchstabe: 'W', farbe: 'Rot' };

const wahlFarbe = $('wahl-farbe');
const wahlBuchstabe = $('wahl-buchstabe');

const auswahlFuellen = (feld, werte) => {
  feld.replaceChildren(new Option('Zufällig', ''), ...werte.map((w) => new Option(w, w)));
};

auswahlFuellen(wahlFarbe, [...FARBEN]);
auswahlFuellen(wahlBuchstabe, [...BUCHSTABEN]);

const neuZiehen = () => {
  ziehung = {
    jahr: JAHR,
    buchstabe: wahlBuchstabe.value || zufallAus([...BUCHSTABEN]),
    farbe: wahlFarbe.value || zufallAus([...FARBEN]),
  };
  $('ziehung').innerHTML = `Gezogen: <b>${ziehung.buchstabe}</b> und <b>${ziehung.farbe}</b>`;
};

/**
 * Eine gespeicherte Geste, damit sich diese Runde genauso pruefen laesst wie
 * die vorige.
 *
 * Eine Animation wurde aufgespult, indem man ihren Fortschritt setzt. Eine
 * Bedienung hat keinen Fortschritt, die hat eine Hand. Also wird die Hand
 * aufgeschrieben: ein Schlangenzug ueber das Buchstabenfeld, dann einer ueber
 * das Farbfeld. `mitmachenStandbild(t)` spielt davon die ersten t ab und haelt
 * an. Damit ist ein Bildschirmfoto wiederholbar, und nur so ist es zu
 * gebrauchen.
 */
const GESTE = (() => {
  const punkte = [];
  const feldZug = (feld, bahnen, schritte) => {
    for (let b = 0; b < bahnen; b += 1) {
      const v = feld.v0 + ((b + 0.5) / bahnen) * (feld.v1 - feld.v0);
      for (let s = 0; s <= schritte; s += 1) {
        const a = s / schritte;
        const u = b % 2 === 0 ? a : 1 - a;
        punkte.push({ u: feld.u0 + u * (feld.u1 - feld.u0), v });
      }
    }
  };
  feldZug(FELDER.buchstabe, 7, 12);
  feldZug(FELDER.farbe, 3, 12);
  return punkte;
})();

const karteBauen = (modul) => {
  const { meta, bauen } = modul;
  const karte = document.createElement('article');
  karte.className = 'karte';
  karte.innerHTML = `
    <h2>${meta.titel}</h2>
    <p class="beschreibung">${meta.text}</p>
    <div class="buehne">
      <canvas></canvas>
      <div class="grund-farbe"></div>
      <div class="grund-muster"></div>
      <div class="grund-schleier"></div>
      <div class="inhalt">
        <span class="pille">Wichteln ${JAHR}</span>
        <div class="unten"><div class="riese"></div><div class="wort"></div></div>
      </div>
    </div>
    <div class="balken">
      <div class="teil"><span>Buchstabe</span><i></i></div>
      <div class="teil"><span>Farbe</span><i></i></div>
    </div>
    <p class="hinweis">${meta.hinweis}</p>
    <div class="reihe">
      <button type="button" class="knopf zurueck">Zurücksetzen</button>
      <button type="button" class="knopf gross">Groß</button>
    </div>`;

  const buehne = karte.querySelector('.buehne');
  const leinwand = karte.querySelector('canvas');
  const balken = [...karte.querySelectorAll('.teil i')];
  const laufwerk = bauen({ leinwand });

  let landetSeit = null;
  let schmutzig = true;
  // Aufgespult heisst angehalten. Sonst rechnet die Schleife im naechsten Bild
  // weiter, und das Bildschirmfoto zeigt nicht mehr, was aufgespult wurde.
  let angehalten = false;

  const beobachter = new ResizeObserver(([eintrag]) => {
    const { width, height } = eintrag.contentRect;
    if (width > 0 && height > 0) {
      laufwerk.groesse(width, height);
      schmutzig = true;
    }
  });
  beobachter.observe(buehne);

  const zuruecksetzen = () => {
    // Ohne Ueberblendung zurueck auf Anfang, sonst liegt die Farbflut des
    // letzten Durchgangs noch ueber dem Beginn des naechsten.
    buehne.classList.add('sofort');
    buehne.classList.remove('gelandet', 'geflutet', 'abgetreten', 'ton-hell', 'ton-dunkel');
    buehne.querySelector('.riese').textContent = '';
    buehne.querySelector('.wort').textContent = '';
    buehne.offsetHeight;
    buehne.classList.remove('sofort');
    laufwerk.bereit(ziehung);
    landetSeit = null;
    schmutzig = true;
    angehalten = false;
  };

  /** Die Seite uebernimmt: Farbflut, Buchstabe, Farbname. */
  const landen = () => {
    const { flut, ton, daempfung } = darstellungFuer(ziehung.farbe);
    buehne.querySelector('.riese').textContent = ziehung.buchstabe;
    buehne.querySelector('.wort').textContent = ziehung.farbe;
    buehne.classList.add(ton === 'hell' ? 'ton-hell' : 'ton-dunkel');
    buehne.querySelector('.grund-farbe').style.background = daempfung ? daempfung.basis : flut;
    buehne.querySelector('.grund-muster').style.background = daempfung ? flut : 'none';
    buehne.style.setProperty('--muster-staerke', daempfung ? String(daempfung.staerke) : '0');
    buehne.classList.add('geflutet', 'gelandet', 'abgetreten');
  };

  // --- Die Hand ----------------------------------------------------------

  const stelle = (ereignis) => {
    const k = buehne.getBoundingClientRect();
    return {
      u: (ereignis.clientX - k.left) / k.width,
      v: (ereignis.clientY - k.top) / k.height,
      gedrueckt: ereignis.buttons > 0 || ereignis.pointerType !== 'mouse',
    };
  };

  const melden = (ereignis) => {
    if (landetSeit !== null) return;
    laufwerk.zeiger(stelle(ereignis));
    schmutzig = true;
  };

  buehne.addEventListener('pointerdown', (e) => {
    buehne.setPointerCapture(e.pointerId);
    melden(e);
  });
  buehne.addEventListener('pointermove', melden);
  buehne.addEventListener('pointerup', (e) => {
    laufwerk.zeiger({ ...stelle(e), gedrueckt: false });
    schmutzig = true;
  });
  buehne.addEventListener('pointerleave', () => {
    laufwerk.zeiger(null);
    schmutzig = true;
  });

  karte.querySelector('.zurueck').addEventListener('click', zuruecksetzen);
  karte.querySelector('.gross').addEventListener('click', () => vergroessern(karte, buehne));

  const bild = (sekunden, dauer) => {
    // Weitergerechnet wird, solange etwas geschieht: eine Hand am Werk, ein
    // Entwurf, der von selbst weiterlaeuft, ein Feld mitten im Aufspringen,
    // oder die Uebergabe an die Seite.
    if (angehalten) return;
    const ruhig = laufwerk.ruhig?.() ?? true;
    if (!schmutzig && ruhig && !laufwerk.lebhaft && landetSeit === null) return;
    schmutzig = false;

    laufwerk.schritt(sekunden, dauer);
    const stand = laufwerk.fortschritt();
    balken[0].style.width = `${Math.min(1, stand.buchstabe) * 100}%`;
    balken[1].style.width = `${Math.min(1, stand.farbe) * 100}%`;

    if (landetSeit === null && stand.fertig) landetSeit = sekunden;
    if (landetSeit !== null) {
      const t = Math.min((sekunden - landetSeit) / (LANDUNG_MS / 1000), 1);
      laufwerk.landen(t);
      if (t >= UEBERGABE && !buehne.classList.contains('gelandet')) landen();
      if (t < 1) schmutzig = true;
    }
    laufwerk.rendern();
  };

  laufwerk.bereit(ziehung);

  /**
   * Spielt die gespeicherte Geste bis zum Anteil `t` und haelt dort an.
   *
   * `flug` haelt zusaetzlich die Uebergabe an die Seite an. Dort ist zu
   * pruefen, ob der Buchstabe des Entwurfs genau auf dem der Seite landet:
   * vier Bildpunkte daneben, und man sieht zwei Buchstaben statt einem.
   */
  const standbild = (t, flug = 1) => {
    zuruecksetzen();
    const bis = Math.floor(Math.min(Math.max(t, 0), 1) * GESTE.length);
    for (let i = 0; i < bis; i += 1) {
      laufwerk.zeiger({ ...GESTE[i], gedrueckt: true });
      laufwerk.schritt(i / 60, 1 / 60);
    }
    laufwerk.zeiger(null);

    // Die Hand ist fertig, der Entwurf noch nicht: ein aufgesprungenes Feld
    // loest sich ueber ein paar Zehntel auf, und der Staub der Kugel braucht
    // laenger. Ohne dieses Nachlaufen endet jedes Bild mitten im Aufspringen.
    for (let i = 0; i < 420 && !laufwerk.fortschritt().fertig; i += 1) {
      laufwerk.schritt((bis + i) / 60, 1 / 60);
    }

    const stand = laufwerk.fortschritt();
    balken[0].style.width = `${Math.min(1, stand.buchstabe) * 100}%`;
    balken[1].style.width = `${Math.min(1, stand.farbe) * 100}%`;
    if (stand.fertig) {
      laufwerk.landen(flug);
      if (flug >= UEBERGABE) {
        buehne.classList.add('sofort');
        landen();
        buehne.offsetHeight;
        buehne.classList.remove('sofort');
      }
    }
    laufwerk.rendern();
    schmutzig = false;
    angehalten = true;
  };

  return { karte, zuruecksetzen, bild, standbild };
};

// --- Die Lupe -------------------------------------------------------------

const lupe = $('lupe');
const lupePlatz = $('lupe-platz');
let zurueckIn = null;

const vergroessern = (karte, buehne) => {
  zurueckIn = karte;
  lupePlatz.append(buehne);
  lupe.hidden = false;
};

const verkleinern = () => {
  if (!zurueckIn) return;
  zurueckIn.insertBefore(lupePlatz.firstElementChild, zurueckIn.querySelector('.balken'));
  zurueckIn = null;
  lupe.hidden = true;
};

$('lupe-zu').addEventListener('click', verkleinern);
lupe.addEventListener('click', (e) => {
  if (e.target === lupe || e.target === lupePlatz) verkleinern();
});
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') verkleinern();
});

// --- Aufbau ---------------------------------------------------------------

const galerie = $('galerie');
const karten = [];

const fehlerKarte = (pfad, fehler) => {
  const karte = document.createElement('article');
  karte.className = 'karte';
  karte.innerHTML = `<h2>${pfad}</h2>
    <p class="beschreibung warnung">Lädt nicht: ${fehler.message}</p>`;
  return karte;
};

neuZiehen();

for (const pfad of MODULE) {
  try {
    const modul = await import(pfad);
    const eintrag = karteBauen(modul);
    galerie.append(eintrag.karte);
    karten.push(eintrag);
  } catch (fehler) {
    console.error(pfad, fehler);
    galerie.append(fehlerKarte(pfad, fehler));
  }
}

$('alle-zurueck').addEventListener('click', () => karten.forEach((k) => k.zuruecksetzen()));
$('wuerfeln').addEventListener('click', () => {
  neuZiehen();
  karten.forEach((k) => k.zuruecksetzen());
});
for (const feld of [wahlFarbe, wahlBuchstabe]) {
  feld.addEventListener('change', () => {
    neuZiehen();
    karten.forEach((k) => k.zuruecksetzen());
  });
}

window.mitmachenStandbild = (t, flug) => karten.forEach((k) => k.standbild(t, flug));

let vorher = performance.now();
const schleife = (jetzt) => {
  const dauer = Math.min((jetzt - vorher) / 1000, 0.05);
  vorher = jetzt;
  for (const k of karten) k.bild(jetzt / 1000, dauer);
  requestAnimationFrame(schleife);
};
requestAnimationFrame(schleife);
