import { writeFileSync } from 'node:fs';

/** Nur die sechs, die auf der ganzen Fläche nicht lesbar waren. */
const PROBLEM = [
  { name: 'Gestreift', muster: 'repeating-linear-gradient(45deg, #f4f4f0 0 26px, #d33b33 26px 52px)', basis: '#c13931', ton: 'hell', bu: 'E' },
  { name: 'Kariert', muster: 'repeating-conic-gradient(#d33b33 0% 25%, #f4f4f0 0% 50%) 0 / 84px 84px', basis: '#c13931', ton: 'hell', bu: 'A' },
  { name: 'Gepunktet', muster: 'radial-gradient(#1b1b1b 30%, #f4f4f0 32%) 0 / 46px 46px', basis: '#efeee9', ton: 'dunkel', bu: 'S' },
  { name: 'Durchsichtig', muster: 'repeating-conic-gradient(#e2e6ea 0% 25%, #fbfcfd 0% 50%) 0 / 52px 52px', basis: '#eceff2', ton: 'dunkel', bu: 'Z' },
  { name: 'Bunt', muster: 'conic-gradient(#d33b33, #e8cf3f, #3a9e52, #2f6fd0, #8a4fc4, #d33b33)', basis: '#1f2430', ton: 'hell', bu: 'J' },
  { name: 'Regenbogen', muster: 'linear-gradient(150deg, #d33b33, #e8892f, #e8cf3f, #3a9e52, #2f6fd0, #8a4fc4)', basis: '#1f2430', ton: 'hell', bu: 'T' },
];

const BEHANDLUNG = [
  { id: 'a', titel: 'A · Frostzone', text: 'Das Muster läuft über die ganze Fläche, wird aber unter dem Text weich gerechnet. Keine Kante, keine Karte.' },
  { id: 'b', titel: 'B · Zweiteilung', text: 'Muster oben als Band, darunter eine ruhige Fläche aus einer Farbe des Musters. Klar, aber weniger flutig.' },
  { id: 'c', titel: 'C · Gedämpft', text: 'Muster überall, aber nur schwach über einer ruhigen Grundfarbe. Bleibt erkennbar, drängt sich nicht auf.' },
];

const wortGroesse = (name) => (name.length > 10 ? 27 : name.length > 8 ? 31 : 38);

const kachel = (f, b) => `
  <div class="spalte">
    <div class="rahmen ${f.ton} b-${b.id}" style="--basis: ${f.basis}">
      <div class="muster" style="background: ${f.muster}"></div>
      <div class="schleier"></div>
      <div class="frost"></div>
      <div class="inhalt">
        <div class="jahr">Wichteln 2026</div>
        <div class="riese">${f.bu}</div>
        <div class="farbwort" style="font-size: ${wortGroesse(f.name)}px">${f.name}</div>
        <p class="satz">Das Geschenk fängt mit ${f.bu} an und ist ${f.name.toLowerCase()}.</p>
        <div class="aktionen">
          <button class="knopf knopf-haupt">Link kopieren</button>
          <button class="knopf knopf-still">Neu auslosen</button>
        </div>
      </div>
    </div>
    <p class="etikett">${f.name}</p>
  </div>`;

const block = (b) => `
  <section class="block">
    <h2>${b.titel}</h2><p class="einleitung">${b.text}</p>
    <div class="reihe">${PROBLEM.map((f) => kachel(f, b)).join('')}</div>
  </section>`;

writeFileSync(
  'flut-problemfaelle.html',
  `<!doctype html><html lang="de"><head><meta charset="utf-8" />
<title>Farbflut, die sechs schwierigen Farben</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; padding: 30px 22px 60px; background: #5f6461;
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; color: #fff; }
  .block { max-width: 1560px; margin: 0 auto 40px; }
  h2 { font-size: 17px; letter-spacing: 0.04em; margin: 0 0 4px; }
  .einleitung { margin: 0 0 16px; font-size: 13.5px; opacity: 0.74; max-width: 62ch; line-height: 1.5; }
  .reihe { display: flex; flex-wrap: wrap; gap: 18px; }
  .spalte { width: 244px; }
  .rahmen { width: 244px; height: 488px; border-radius: 18px; overflow: hidden;
    position: relative; box-shadow: 0 12px 26px rgba(0,0,0,0.34); background: var(--basis); }
  .muster, .schleier, .frost { position: absolute; inset: 0; }
  .inhalt { position: absolute; inset: 0; display: flex; flex-direction: column; padding: 21px 18px; }
  .etikett { font-size: 12px; font-weight: 700; margin: 8px 0 0; }

  .hell .inhalt { color: #fff; }
  .hell .knopf-haupt { background: #fff; color: #1a1a1a; }
  .hell .knopf-still { background: rgba(255,255,255,0.22); color: #fff; }
  .dunkel .inhalt { color: #16181a; }
  .dunkel .knopf-haupt { background: #16181a; color: #fff; }
  .dunkel .knopf-still { background: rgba(0,0,0,0.12); color: #16181a; }

  /* A: Muster ganzflaechig, unter dem Text weichgezeichnet. */
  .b-a .frost { top: 44%; backdrop-filter: blur(15px) saturate(0.8); }
  .b-a.hell .frost { background: linear-gradient(180deg, rgba(14,12,10,0) 0%, rgba(14,12,10,0.52) 34%, rgba(14,12,10,0.74) 100%);
    mask-image: linear-gradient(180deg, transparent 0, #000 22%); }
  .b-a.dunkel .frost { background: linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.68) 34%, rgba(255,255,255,0.86) 100%);
    mask-image: linear-gradient(180deg, transparent 0, #000 22%); }

  /* B: Musterband oben, ruhige Flaeche unten. */
  .b-b .muster { bottom: 56%; }
  .b-b .schleier { top: 44%; background: var(--basis); }

  /* C: Muster schwach ueber ruhiger Grundfarbe. */
  .b-c .muster { opacity: 0.26; }
  .b-c.hell .schleier { background: linear-gradient(180deg, rgba(10,10,14,0.05), rgba(10,10,14,0.42)); }
  .b-c.dunkel .schleier { background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.34)); }

  .jahr { font-size: 10px; font-weight: 700; letter-spacing: 0.22em; text-transform: uppercase; opacity: 0.9; }
  .riese { font-size: 178px; line-height: 0.82; font-weight: 800; letter-spacing: -0.06em; margin: auto 0 0 -7px; }
  .farbwort { font-weight: 800; letter-spacing: -0.035em; margin-top: -1px; }
  .satz { font-size: 11.5px; line-height: 1.45; margin: 7px 0 0; opacity: 0.93; }
  .aktionen { margin-top: 15px; display: flex; flex-direction: column; gap: 7px; }
  .knopf { appearance: none; border: 0; font: inherit; font-size: 12.5px; font-weight: 650;
    border-radius: 999px; padding: 10px 14px; cursor: pointer; }
</style></head>
<body>${BEHANDLUNG.map(block).join('')}</body></html>`,
);
console.log('drei Behandlungen x sechs Farben gebaut');
