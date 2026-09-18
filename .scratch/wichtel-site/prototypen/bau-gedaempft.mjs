import { writeFileSync } from 'node:fs';
import { FLUT } from './flut-tabelle.mjs';

/**
 * Die gedämpfte Behandlung, jetzt über den ganzen Topf.
 *
 * Nur die sechs gemusterten Farben bekommen überhaupt eine Dämpfung. Für die
 * anderen 22 ist sie wirkungslos, weil dort nichts zu dämpfen ist.
 */
const GEDAEMPFT = {
  Gestreift: { basis: '#c4392f', staerke: 0.3, ton: 'hell' },
  Kariert: { basis: '#c4392f', staerke: 0.3, ton: 'hell' },
  Gepunktet: { basis: '#eeede8', staerke: 0.32, ton: 'dunkel' },
  Durchsichtig: { basis: '#edf0f3', staerke: 0.55, ton: 'dunkel' },
  Bunt: { basis: '#f4f3f0', staerke: 0.58, ton: 'dunkel' },
  Regenbogen: { basis: '#f4f3f0', staerke: 0.58, ton: 'dunkel' },
};

/** Die Gegenprobe: dieselben zwei nach dunkel gedämpft statt nach hell. */
const GEGENPROBE = {
  Bunt: { basis: '#1f2430', staerke: 0.26, ton: 'hell' },
  Regenbogen: { basis: '#1f2430', staerke: 0.26, ton: 'hell' },
};

const BUCHSTABEN = [...'QWEASZRTBMNKLPÄÖÜGHJ'];
const wortGroesse = (n) => (n.length > 11 ? 26 : n.length > 9 ? 30 : n.length > 7 ? 34 : 38);

const kachel = ([name, grund, grundTon], i, ueberschreiben) => {
  const d = ueberschreiben ?? GEDAEMPFT[name];
  const ton = d ? d.ton : grundTon;
  const bu = BUCHSTABEN[i % BUCHSTABEN.length];
  return `
  <div class="spalte">
    <div class="rahmen ${ton}" style="background: ${d ? d.basis : grund}">
      <div class="muster" style="background: ${grund}; opacity: ${d ? d.staerke : 1}"></div>
      <div class="schleier"></div>
      <div class="inhalt">
        <div class="jahr"><span>Wichteln 2026</span></div>
        <div class="riese">${bu}</div>
        <div class="farbwort" style="font-size: ${wortGroesse(name)}px">${name}</div>
        <p class="satz">Das Geschenk fängt mit ${bu} an und ist ${name.toLowerCase()}.</p>
        <div class="aktionen">
          <button class="knopf knopf-haupt">Link kopieren</button>
          <button class="knopf knopf-still">Neu auslosen</button>
        </div>
      </div>
    </div>
    <p class="etikett">${name}${d ? ' <span>gedämpft</span>' : ''}</p>
  </div>`;
};

const bunt = FLUT.find((f) => f[0] === 'Bunt');
const regen = FLUT.find((f) => f[0] === 'Regenbogen');

writeFileSync(
  'flut-gedaempft.html',
  `<!doctype html><html lang="de"><head><meta charset="utf-8" />
<title>Farbflut, gedämpft</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; padding: 30px 22px 60px; background: #5f6461; color: #fff;
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
  h2 { font-size: 17px; margin: 0 0 4px; }
  .einleitung { margin: 0 0 16px; font-size: 13.5px; opacity: 0.74; max-width: 64ch; line-height: 1.5; }
  .block { max-width: 1560px; margin: 0 auto 42px; }
  .reihe { display: flex; flex-wrap: wrap; gap: 20px; }
  .spalte { width: 244px; }
  .rahmen { width: 244px; height: 488px; border-radius: 18px; overflow: hidden;
    position: relative; box-shadow: 0 12px 26px rgba(0,0,0,0.34); }
  .muster, .schleier { position: absolute; inset: 0; }
  .inhalt { position: absolute; inset: 0; display: flex; flex-direction: column; padding: 21px 18px; }
  .etikett { font-size: 12px; font-weight: 700; margin: 8px 0 0; display: flex; justify-content: space-between; }
  .etikett span { font-weight: 500; opacity: 0.66; text-transform: uppercase; letter-spacing: 0.1em; }

  .hell .schleier { background: linear-gradient(180deg, rgba(10,10,14,0.04), rgba(10,10,14,0.44)); }
  .hell .inhalt { color: #fff; }
  .hell .knopf-haupt { background: #fff; color: #1a1a1a; }
  .hell .knopf-still { background: rgba(255,255,255,0.22); color: #fff; }
  .hell .jahr span { background: rgba(0,0,0,0.26); }
  .dunkel .schleier { background: linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.36)); }
  .dunkel .inhalt { color: #16181a; }
  .dunkel .knopf-haupt { background: #16181a; color: #fff; }
  .dunkel .knopf-still { background: rgba(0,0,0,0.12); color: #16181a; }
  .dunkel .jahr span { background: rgba(255,255,255,0.4); }

  /* Die Jahreszeile lag vorher direkt auf dem Muster und war dort unlesbar. */
  .jahr span { display: inline-block; font-size: 10px; font-weight: 700; letter-spacing: 0.2em;
    text-transform: uppercase; padding: 4px 9px; border-radius: 999px; }
  .riese { font-size: 178px; line-height: 1; font-weight: 800; letter-spacing: -0.06em;
    margin: auto 0 0; padding-left: 1px; }
  .farbwort { font-weight: 800; letter-spacing: -0.035em; margin-top: 4px; white-space: nowrap; }
  .satz { font-size: 11.5px; line-height: 1.45; margin: 7px 0 0; opacity: 0.93; }
  .aktionen { margin-top: 15px; display: flex; flex-direction: column; gap: 7px; }
  .knopf { appearance: none; border: 0; font: inherit; font-size: 12.5px; font-weight: 650;
    border-radius: 999px; padding: 10px 14px; cursor: pointer; }
</style></head>
<body>
  <section class="block">
    <h2>Zuerst die Streitfrage: Bunt und Regenbogen</h2>
    <p class="einleitung">Links nach hell gedämpft, rechts nach dunkel. Dunkel war das, was vorhin matschig aussah.</p>
    <div class="reihe">
      ${kachel(bunt, 19)}${kachel(regen, 27)}
      ${kachel(bunt, 19, GEGENPROBE.Bunt)}${kachel(regen, 27, GEGENPROBE.Regenbogen)}
    </div>
  </section>
  <section class="block">
    <h2>Der ganze Topf</h2>
    <p class="einleitung">28 Farben. Nur die sechs gemusterten sind gedämpft, der Rest läuft unverändert voll durch.</p>
    <div class="reihe">${FLUT.map((f, i) => kachel(f, i)).join('')}</div>
  </section>
</body></html>`,
);
console.log('gedämpfte Fassung gebaut');
