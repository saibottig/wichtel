import { writeFileSync } from 'node:fs';
import { FLUT } from './flut-tabelle.mjs';

const BUCHSTABEN = [...'QWEASZRTBMNKLPÄÖÜGHJ'];

const kachel = ([name, grund, ton], i) => `
  <div class="spalte">
    <div class="rahmen ${ton}">
      <div class="grund" style="background: ${grund}"></div>
      <div class="schleier"></div>
      <div class="inhalt">
        <div class="jahr">Wichteln 2026</div>
        <div class="riese">${BUCHSTABEN[i % BUCHSTABEN.length]}</div>
        <div class="farbwort">${name}</div>
        <p class="satz">Das Geschenk fängt mit ${BUCHSTABEN[i % BUCHSTABEN.length]} an und ist ${name.toLowerCase()}.</p>
        <div class="aktionen">
          <button class="knopf knopf-haupt">Link kopieren</button>
          <button class="knopf knopf-still">Neu auslosen</button>
        </div>
      </div>
    </div>
    <p class="etikett">${name} <span>${ton}</span></p>
  </div>`;

writeFileSync(
  'flut-alle-farben.html',
  `<!doctype html>
<html lang="de"><head><meta charset="utf-8" />
<title>Farbflut über den ganzen Topf</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; padding: 32px 20px 60px; background: #5f6461;
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
  .galerie { display: flex; flex-wrap: wrap; gap: 26px 20px; justify-content: center; }
  .spalte { width: 248px; }
  .rahmen { width: 248px; height: 496px; border-radius: 18px; overflow: hidden;
    position: relative; box-shadow: 0 12px 26px rgba(0,0,0,0.34); }
  .grund, .schleier { position: absolute; inset: 0; }
  .inhalt { position: absolute; inset: 0; display: flex; flex-direction: column; padding: 22px 19px; }
  .etikett { color: #fff; font-size: 12px; font-weight: 700; margin: 9px 0 0;
    letter-spacing: 0.06em; display: flex; justify-content: space-between; }
  .etikett span { font-weight: 500; opacity: 0.66; text-transform: uppercase; letter-spacing: 0.12em; }

  /* Heller Grund traegt dunkle Schrift, dunkler Grund helle. */
  .hell .schleier { background: linear-gradient(180deg, rgba(10,8,4,0.10), rgba(10,8,4,0.58)); }
  .hell .inhalt { color: #fff; text-shadow: 0 1px 14px rgba(0,0,0,0.34); }
  .hell .knopf-haupt { background: #fff; color: #1a1a1a; }
  .hell .knopf-still { background: rgba(255,255,255,0.22); color: #fff; }

  .dunkel .schleier { background: linear-gradient(180deg, rgba(255,255,255,0.14), rgba(255,255,255,0.52)); }
  .dunkel .inhalt { color: #16181a; text-shadow: 0 1px 14px rgba(255,255,255,0.42); }
  .dunkel .knopf-haupt { background: #16181a; color: #fff; }
  .dunkel .knopf-still { background: rgba(0,0,0,0.13); color: #16181a; }

  .jahr { font-size: 10px; font-weight: 700; letter-spacing: 0.22em; text-transform: uppercase; opacity: 0.9; }
  .riese { font-size: 190px; line-height: 0.82; font-weight: 800; letter-spacing: -0.06em; margin: auto 0 0 -8px; }
  .farbwort { font-size: 38px; font-weight: 800; letter-spacing: -0.035em; margin-top: -2px; }
  .satz { font-size: 11.5px; line-height: 1.45; margin: 7px 0 0; opacity: 0.92; }
  .aktionen { margin-top: 16px; display: flex; flex-direction: column; gap: 7px; }
  .knopf { appearance: none; border: 0; font: inherit; font-size: 12.5px; font-weight: 650;
    border-radius: 999px; padding: 10px 14px; cursor: pointer; }
</style></head>
<body><div class="galerie">${FLUT.map(kachel).join('')}</div></body></html>`,
);
console.log(`${FLUT.length} Farben gebaut`);
