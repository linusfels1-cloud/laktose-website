/* ==========================================================================
   Video-Player für Frage 1
   Eure Aufnahme läuft, dazu wechseln die Grafiken an den passenden Stellen.

   So passt ihr Zeitpunkte an:
   - SCENES[...].start  = ab welcher Sekunde eine Szene zu sehen ist
   - data-at="12.3"     = ab Sekunde 12,3 erscheint/bewegt sich ein Teil der Grafik
   - SUBS               = Untertitel (Sekunde, Text)
   - CHAPTERS           = Kapitel unter dem Video
   Die Zeiten stammen aus einer automatischen Auswertung der Aufnahmen.
   ========================================================================== */
(function(){
'use strict';

/* ---------- Zeichen-Helfer (alles in einem 960 × 540 großen Bild) ---------- */
const hexD = r => { const h = 0.866 * r; return `M${r},0 L${r/2},${h} L${-r/2},${h} L${-r},0 L${-r/2},${-h} L${r/2},${-h}Z`; };
const at = (t, cls='fade', extra='') => `class="${cls}" data-at="${t}" ${extra}`;
const mv = (t, tx, ty, extra='') => `class="move" data-at="${t}" style="--tx:${tx}px; --ty:${ty}px" ${extra}`;
const g = (x, y, inner, s=1) => `<g transform="translate(${x},${y})${s!==1?` scale(${s})`:''}">${inner}</g>`;

function sugar(kind, x, y, r=34, label=true){
  const cls = kind === 'gal' ? 'gal' : 'glu', txt = kind === 'gal' ? 'Gal' : 'Glc';
  return g(x, y, `<path class="${cls}" d="${hexD(r)}"/>${label ? `<text class="t-ring" y="${r*0.2}" style="font-size:${Math.round(r*0.55)}px">${txt}</text>` : ''}`);
}
// Laktose = Galaktose + Glukose, verbunden
function lac(x, y, r=34, label=true){
  const d = r * 1.45;
  return g(x, y, `<line class="bond" x1="${-d}" x2="${d}" y1="0" y2="0"/>${sugar('gal', -d, 0, r, label)}${sugar('glu', d, 0, r, label)}`);
}
// Laktase (grünes Enzym, Öffnung zeigt nach oben)
const enzyme = (x, y, s=1, rot=0) => `<g transform="translate(${x},${y}) rotate(${rot}) scale(${s})"><path class="enz" d="M0,0 L-17,-24 A30,30 0 1,0 17,-24 Z"/></g>`;
const enzymeMissing = (x, y, s=1) => `<g transform="translate(${x},${y}) scale(${s})"><path class="enz-miss" d="M0,0 L-17,-24 A30,30 0 1,0 17,-24 Z"/></g>`;
const drop = (x, y, s=1) => `<g transform="translate(${x},${y}) scale(${s})"><path class="water" d="M0,-14 C6,-5 10,0 10,5 A10,10 0 1,1 -10,5 C-10,0 -6,-5 0,-14Z"/></g>`;
const na = (x, y) => g(x, y, `<circle class="na" r="15"/><text class="na-t" y="5">Na⁺</text>`);
const bact = (x, y, rot=0) => `<g transform="translate(${x},${y}) rotate(${rot})"><rect class="bact" x="-26" y="-12" width="52" height="24" rx="12"/><circle cx="-10" cy="-2" r="3" fill="#fff" opacity=".7"/><circle cx="6" cy="3" r="2.5" fill="#fff" opacity=".7"/></g>`;
const gas = (x, y, t) => g(x, y, `<circle class="gas" r="24"/><text class="gas-t" y="5">${t}</text>`);
const check = (x, y) => g(x, y, `<circle class="mark-ok" r="22"/><path d="M-10,0 L-3,8 L11,-8" fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>`);
const cross = (x, y) => g(x, y, `<circle class="mark-bad" r="22"/><path d="M-8,-8 L8,8 M8,-8 L-8,8" fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round"/>`);
const arrowDefs = `<defs>
  <marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10z" fill="#14213d"/></marker>
  <marker id="ahw" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10z" fill="#2f86d0"/></marker>
  <marker id="ahb" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10z" fill="#d4493f"/></marker>
</defs>`;
const arrow = (x1, y1, x2, y2, cls='', m='ah') => `<line class="ln ${cls}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" marker-end="url(#${m})"/>`;

// Dünndarm-Ausschnitt: Innenraum oben, Darmwand mit Zotten unten
function gutWall(){
  let villi = '';
  for(let i = 0; i < 9; i++){
    const x = 30 + i * 104;
    villi += `<path class="tissue" d="M${x},340 L${x},250 Q${x},214 ${x+30},214 Q${x+60},214 ${x+60},250 L${x+60},340 Z"/>`;
  }
  return `<rect class="lumen" x="0" y="0" width="960" height="540"/>
    <rect class="tissue" x="-5" y="330" width="970" height="220"/>${villi}
    <text class="t-sm" x="18" y="34">Darminnenraum</text>
    <text class="t-sm" x="18" y="522">Darmwand mit Zotten</text>`;
}
const villusTop = i => [60 + i * 104, 218];

/* ======================= TEIL 1: Normale Verdauung ======================= */
const TEIL1 = {
  duration: 51.8,
  chapters: [[0,'Im Dünndarm'],[9.58,'Zweifachzucker'],[14.06,'Nur Einfachzucker'],[19.22,'Hydrolyse'],[28.94,'Glukose und Galaktose'],[34.06,'SGLT1'],[41.42,'Osmose'],[45.14,'GLUT2 und Blut']],
  subs: [
    [0,'Normalerweise wird die Laktose im Dünndarm von dem Enzym Laktase zerlegt.'],
    [4.72,'Die Laktase sitzt an der Oberfläche der Dünndarmzellen, im sogenannten Bürstensaum.'],
    [9.58,'Laktose ist ein Zweifachzucker (Disaccharid).'],
    [14.06,'Der Körper kann nur Einfachzucker aufnehmen, deshalb muss die Laktose zuerst gespalten werden.'],
    [19.22,'Die Laktase spaltet die Bindung zwischen den beiden Zuckerbausteinen durch Hydrolyse, also unter Einbau von Wasser.'],
    [25.86,'Das Wasser dafür ist im Darminhalt ohnehin vorhanden.'],
    [28.94,'Danach liegen zwei Einfachzucker vor: Glukose und Galaktose.'],
    [34.06,'Das Transportprotein SGLT1 nimmt die beiden Einfachzucker zusammen mit Natrium-Ionen in die Dünndarmzellen auf.'],
    [41.42,'Durch Osmose folgt Wasser den aufgenommenen Teilchen in die Zellen.'],
    [45.14,'Auf der anderen Seite der Zelle bringt das Transportprotein GLUT2 die Einfachzucker ins Blut.']
  ],
  scenes: [
    { start: 0, svg: () => {
      let enz = '', mol = '';
      for(let i = 0; i < 9; i++){ const [x,y] = villusTop(i); enz += `<g ${at(3.2 + i*0.06)}>${enzyme(x, y+4, 0.62)}</g>`; }
      [[150,110],[380,70],[560,150],[760,90],[880,165],[260,170]].forEach(([x,y],i)=>{ mol += `<g class="${i%2?'float2':'float'}">${lac(x, y, 15, false)}</g>`; });
      return gutWall() + mol + enz +
        `<g ${at(3.4)}><text class="t-lbl t-ok" x="100" y="195">Laktase</text>${arrow(185,200,226,212,'ln-ok')}</g>` +
        `<g ${at(4.9)}>
          <rect class="card" x="560" y="240" width="380" height="270" rx="18"/>
          <line class="ln ln-mut dash" x1="580" y1="240" x2="${villusTop(5)[0]}" y2="222"/>
          <rect class="cell" x="590" y="345" width="320" height="140" rx="10"/>
          ${Array.from({length:14},(_,k)=>`<rect class="tissue" x="${598+k*22}" y="300" width="12" height="48" rx="6"/>`).join('')}
          ${Array.from({length:7},(_,k)=>enzyme(604+k*44, 300, 0.42)).join('')}
          <text class="t-sm" x="750" y="430" text-anchor="middle">Dünndarmzelle</text>
        </g>` +
        `<g ${at(8.1)}><path class="ln ln-acc" d="M592,286 L592,276 L908,276 L908,286"/><text class="t-lbl t-acc t-c" x="750" y="268">Bürstensaum</text></g>`;
    }},
    { start: 9.58, svg: () =>
      `<g ${at(10.4)}><text class="t-big" x="480" y="110">Zweifachzucker</text></g>
       <g ${at(11.4)}><text class="t-sm t-c" x="480" y="146">(Disaccharid)</text></g>
       ${lac(480, 280, 62)}
       <g transform="translate(480,280)"><circle r="15" fill="#fff" stroke="#14213d" stroke-width="3"/><text class="t-ring" y="6" style="font-size:16px">O</text></g>
       <text class="t-lbl t-acc t-c" x="390" y="400">Galaktose</text>
       <text class="t-lbl t-warm t-c" x="570" y="400">Glukose</text>
       <g ${at(12.2)}><text class="t-sm t-c" x="480" y="470">zwei Zuckerbausteine, fest verbunden</text></g>` },
    { start: 14.06, svg: () =>
      `<rect class="lumen" x="0" y="0" width="960" height="330"/>
       <path class="tissue" d="M-5,330 L280,330 L280,345 L380,345 L380,330 L580,330 L580,345 L680,345 L680,330 L965,330 L965,545 L-5,545Z"/>
       <rect x="290" y="318" width="80" height="30" fill="#eef3fc"/><rect x="590" y="318" width="80" height="30" fill="#eef3fc"/>
       <text class="t-sm" x="18" y="300">Darminnenraum</text><text class="t-sm" x="18" y="522">Dünndarmzelle</text>
       <g ${at(15.0)}><text class="t-mid t-ok t-c" x="330" y="130">Einfachzucker</text></g>
       <g ${mv(15.2, 0, 220)}>${sugar('glu', 330, 190, 30)}</g>
       <g ${at(16.2,'pop')}>${check(400, 410)}</g>
       <g ${at(15.0)}><text class="t-mid t-bad t-c" x="630" y="130">Laktose</text></g>
       <g ${mv(15.2, 0, 75)}>${lac(630, 190, 26)}</g>
       <g ${at(16.4,'pop')}>${cross(745, 270)}</g>
       <g ${at(17.7)}><rect class="card" x="250" y="40" width="460" height="56" rx="14"/><text class="t-lbl t-c" x="480" y="76">Laktose muss erst gespalten werden</text></g>` },
    { start: 19.22, svg: () => {
      let drops = '';
      [[80,110],[150,420],[230,180],[760,120],[850,380],[900,230],[120,280],[820,470],[60,480],[900,80]].forEach(([x,y],i)=>{ drops += `<g ${at(25.9 + i*0.08)}><g class="${i%2?'float':'float2'}">${drop(x, y, 1.1)}</g></g>`; });
      return `<g ${at(22.2)}><text class="t-big" x="480" y="78">Hydrolyse</text></g>
        <g ${at(22.9)}><text class="t-sm t-c" x="480" y="112">Spaltung unter Einbau von Wasser</text></g>
        <line class="bond gone" data-at="24.75" x1="410" y1="260" x2="550" y2="260"/>
        <g ${mv(24.8, -80, 0)}>${sugar('gal', 410, 260, 52)}<g ${at(25.1)}><text class="t-lbl t-water" x="466" y="250">OH</text></g></g>
        <g ${mv(24.8, 80, 0)}>${sugar('glu', 550, 260, 52)}<g ${at(25.1)}><text class="t-lbl t-water" x="470" y="250">H</text></g></g>
        <g ${at(24.0)}><g ${mv(24.3, 0, 82)}><g ${at(24.85,'gone')}>${g(480,150,`<text class="t-mid t-water t-c">H₂O</text>`)}</g></g></g>
        <g ${mv(19.9, 0, -88)}>${enzyme(480, 432, 1.5)}<text class="t-lbl t-ok t-c" x="480" y="${432+70}">Laktase</text></g>
        ${drops}
        <g ${at(26.0)}><rect class="card" x="250" y="146" width="460" height="52" rx="14"/><text class="t-lbl t-c t-water" x="480" y="180">Wasser ist im Darminhalt schon da</text></g>`;
    }},
    { start: 28.94, svg: () =>
      `<g ${at(30.2)}><text class="t-big" x="480" y="100">2 Einfachzucker</text></g>
       ${sugar('gal', 300, 250, 62)}${sugar('glu', 660, 250, 62)}
       <g ${at(30.3)}><text class="t-big" x="480" y="266">+</text></g>
       <g ${at(32.1)}><text class="t-lbl t-acc t-c" x="300" y="370">Galaktose</text></g>
       <g ${at(31.5)}><text class="t-lbl t-warm t-c" x="660" y="370">Glukose</text></g>
       <g ${at(32.8)}><rect class="card" x="190" y="420" width="580" height="64" rx="14"/><text class="t-lbl t-c" x="480" y="461" style="font-family:var(--f-mono)">Laktose + H₂O → Glukose + Galaktose</text></g>` },
    { start: 34.06, svg: () => {
      // Zelle mit Innenraum oben, Blut unten
      const cell = `<rect class="lumen" x="0" y="0" width="960" height="150"/>
        <rect class="cell" x="150" y="150" width="660" height="250" rx="16"/>
        <rect class="blood" x="120" y="440" width="720" height="70" rx="35"/>
        <text class="t-sm" x="18" y="34">Darminnenraum</text>
        <text class="t-sm" x="830" y="280">Dünndarm-</text><text class="t-sm" x="830" y="302">zelle</text>
        <g ${at(50.9,'pulse')}><text class="t-lbl" x="140" y="483" style="fill:#fff">Blut</text></g>`;
      const sglt = `<g ${at(34.6)}><rect class="sglt" x="318" y="128" width="20" height="48" rx="8"/><rect class="sglt" x="362" y="128" width="20" height="48" rx="8"/></g>
        <g ${at(35.2)}><text class="t-lbl t-ok" x="400" y="120">SGLT1</text></g>`;
      const glut = `<g ${at(45.4)}><rect class="glut" x="588" y="376" width="20" height="48" rx="8"/><rect class="glut" x="632" y="376" width="20" height="48" rx="8"/></g>
        <g ${at(47.6)}><text class="t-lbl t-warm" x="670" y="430">GLUT2</text></g>`;
      const sug = `<g ${mv(37.1, -30, 160)}><g ${mv(50.1, 300, 245)}>${sugar('glu', 330, 70, 20)}</g></g>
        <g ${mv(37.3, 40, 170)}><g ${mv(50.3, 230, 235)}>${sugar('gal', 380, 70, 20)}</g></g>`;
      const ions = `<g ${at(38.3)}><g ${mv(38.5, -20, 240)}>${na(270, 60)}</g><g ${mv(38.6, 30, 230)}>${na(440, 70)}</g></g>
        <g ${at(38.9)}><text class="t-sm" x="492" y="306">Natrium-Ionen</text></g>`;
      let water = '';
      [[520,60],[570,100],[620,55],[680,95]].forEach(([x,y],i)=>{ water += `<g ${at(41.7)}><g ${mv(42.0 + i*0.15, -20 + i*8, 180)}>${drop(x, y, 1.1)}</g></g>`; });
      const osm = `<g ${at(42.8)}><text class="t-lbl t-water" x="720" y="210">Osmose:</text><text class="t-sm" x="720" y="236">Wasser folgt</text></g>`;
      return cell + sglt + glut + sug + ions + water + osm;
    }}
  ]
};

/* ==================== TEIL 2: Bei Laktoseintoleranz ===================== */
const TEIL2 = {
  duration: 96.7,
  chapters: [[0,'Zu wenig Laktase'],[15.44,'Wasser strömt in den Darm'],[25.78,'Bakterien im Dickdarm'],[41.28,'Noch mehr Wasser'],[48.88,'Bauchschmerzen und Durchfall'],[61.34,'Wann es losgeht'],[72.64,'H₂-Atemtest']],
  subs: [
    [0,'Im Dünndarm'],
    [1.96,'Bei einer Laktoseintoleranz fehlt die Laktase teilweise oder ganz.'],
    [6.06,'Deshalb wird nur ein Teil der Laktose oder gar keine Laktose gespalten.'],
    [9.86,'Was gespalten werden konnte, wird ganz normal aufgenommen.'],
    [12.76,'Die übrige Laktose bleibt im Dünndarm.'],
    [15.44,'Durch Osmose strömt Wasser aus dem umliegenden Gewebe in den Dünndarm.'],
    [20.0,'Der Darminhalt wird dadurch mehr und flüssiger und wird schneller in den Dickdarm weitertransportiert.'],
    [25.78,'Im Dickdarm stürzen sich Bakterien auf die Laktose und vergären (fermentieren) sie.'],
    [31.02,'Dabei entstehen Gase wie Wasserstoff, Kohlenstoffdioxid und Methan.'],
    [35.46,'Daher kommen die Blähungen.'],
    [37.28,'Außerdem stellen die Bakterien kurzkettige Fettsäuren und Milchsäure her.'],
    [41.28,'Weil aus einem Laktose-Molekül viele kleine Teilchen werden, ziehen diese zusätzlich Wasser in den Darm, so wie vorher die Laktose.'],
    [48.88,'Durch die Gase und das viele Wasser dehnt sich der Dickdarm.'],
    [51.72,'Diese Dehnung verursacht Bauchschmerzen und reizt die Darmmuskulatur.'],
    [55.6,'Sie zieht sich krampfartig zusammen, um den Inhalt schnell loszuwerden.'],
    [58.96,'Dies führt zum Durchfall.'],
    [61.34,'Die Beschwerden beginnen meist innerhalb weniger Stunden nach dem Essen oder Trinken.'],
    [65.46,'Wie stark sie sind, hängt davon ab, wie viel Laktose man zu sich genommen hat und wie viel Laktase der Körper noch bildet.'],
    [72.64,'Wie stellt man eine Laktoseintoleranz fest?'],
    [76.08,'Ein Teil des Wasserstoffs aus der Gärung gelangt über das Blut in die Lunge und wird ausgeatmet.'],
    [81.66,'Beim H₂-Atemtest trinkt man deshalb eine Laktoselösung.'],
    [85.46,'Danach wird mehrmals gemessen, wie viel Wasserstoff in der Atemluft ist.'],
    [89.38,'Steigt der Wert deutlich an, wurde die Laktose nicht im Dünndarm verdaut, sondern erst von den Bakterien im Dickdarm.']
  ],
  scenes: [
    { start: 0, svg: () => {
      let enz = '', mol = '';
      for(let i = 0; i < 9; i++){
        const [x,y] = villusTop(i);
        enz += i === 4 ? enzyme(x, y+4, 0.62) : `<g ${at(3.4 + i*0.05)}>${enzymeMissing(x, y+4, 0.62)}</g>`;
      }
      const pos = [[120,110],[300,70],[470,150],[640,80],[800,140],[900,60],[210,170],[720,180]];
      pos.forEach(([x,y],i)=>{ mol += `<g ${at(12.9,'pulse')}><g class="${i%2?'float2':'float'}">${lac(x, y, 15, false)}</g></g>`; });
      // ein Molekül direkt über der einzigen Laktase wird gespalten und aufgenommen
      const [ex] = villusTop(4);
      const split = `<g ${at(6.5,'gone')}>${lac(ex, 150, 15, false)}</g>
        <g ${at(6.5)}><g ${mv(11.9, -6, 150)}><g ${at(12.5,'gone')}>${sugar('gal', ex-26, 150, 15, false)}${sugar('glu', ex+26, 150, 15, false)}</g></g></g>`;
      return gutWall() + mol + split + enz +
        `<g ${at(3.6)}><rect class="card" x="300" y="12" width="360" height="52" rx="14"/><text class="t-lbl t-bad t-c" x="480" y="46">Laktase fehlt größtenteils</text></g>` +
        `<g ${at(10.1)}><text class="t-sm" x="${ex+40}" y="290">wird aufgenommen</text></g>` +
        `<g ${at(13.2)}><rect class="card" x="230" y="455" width="500" height="52" rx="14"/><text class="t-lbl t-c" x="480" y="489">Die übrige Laktose bleibt im Dünndarm</text></g>`;
    }},
    { start: 15.44, svg: () => {
      let mol = '', water = '';
      [[120,110],[300,70],[470,150],[640,80],[800,140],[900,60],[210,170],[720,180]].forEach(([x,y],i)=>{ mol += `<g class="${i%2?'float2':'float'}">${lac(x, y, 15, false)}</g>`; });
      [[80,420],[200,460],[330,410],[450,470],[560,420],[690,460],[810,410],[910,470]].forEach(([x,y],i)=>{ water += `<g ${at(16.2)}><g ${mv(16.7 + i*0.18, 0, -280 + (i%3)*20)}>${drop(x, y, 1.2)}</g></g>`; });
      return gutWall() + `<rect class="flood grow" data-at="18.0" x="0" y="20" width="960" height="200"/>` + mol + water +
        `<g ${at(15.7)}>${arrow(112,450,112,235,'ln-water','ahw')}<rect class="card" x="140" y="440" width="380" height="56" rx="14"/><text class="t-lbl t-water" x="160" y="476">Osmose: Wasser strömt in den Darm</text></g>` +
        `<g ${at(21.7)}><rect class="card" x="300" y="12" width="360" height="52" rx="14"/><text class="t-lbl t-c" x="480" y="46">mehr und flüssiger</text></g>` +
        `<g ${at(22.5)}><rect class="card" x="600" y="250" width="340" height="58" rx="14"/><text class="t-lbl" x="620" y="287">schneller in den Dickdarm</text></g>` +
        `<g ${at(22.5)}>${arrow(680,200,930,200,'ln-water','ahw')}</g>`;
    }},
    { start: 25.78, svg: () => {
      let mol = '', bac = '', bubbles = '', acid = '';
      const pos = [[180,250],[340,180],[500,290],[650,200],[790,300],[420,370]];
      pos.forEach(([x,y],i)=>{ mol += `<g ${at(28.6 + i*0.25,'gone')}><g class="${i%2?'float':'float2'}">${lac(x, y, 15, false)}</g></g>`;
        bac += `<g ${at(27.2 + i*0.1)}><g ${at(28.1,'chomp')}>${bact(x + (i%2?-34:34), y + 34, i*30)}</g></g>`; });
      [[220,'H₂',32.1],[470,'CO₂',32.9],[720,'CH₄',33.7],[340,'H₂',32.3],[600,'H₂',32.5]].forEach(([x,t,s],i)=>{ bubbles += `<g ${at(s,'fade rise')} style="animation-delay:-${i*0.5}s">${gas(x, 150, t)}</g>`; });
      for(let k=0;k<18;k++){ const x=140+(k*47)%700, y=230+((k*53)%170); acid += `<g ${at(38.4 + k*0.04,'pop')}><circle class="acid" cx="${x}" cy="${y}" r="7"/></g>`; }
      return `<rect class="colon" x="40" y="70" width="880" height="400" rx="60"/>
        <g ${at(26.3)}><text class="t-mid" x="80" y="125" style="text-anchor:start">Dickdarm</text></g>` + mol + bac + bubbles + acid +
        `<g ${at(31.7)}><text class="t-sm t-c" x="480" y="50">Gase: Wasserstoff, Kohlenstoffdioxid, Methan</text></g>` +
        `<g ${at(36.0,'pop')}><rect class="card" x="660" y="96" width="220" height="56" rx="14"/><text class="t-lbl t-warm t-c" x="770" y="132">Blähungen</text></g>` +
        `<g ${at(39.0)}><rect class="card" x="170" y="482" width="620" height="50" rx="14"/><circle class="acid" cx="200" cy="507" r="8"/><text class="t-lbl" x="222" y="515">kurzkettige Fettsäuren + Milchsäure</text></g>`;
    }},
    { start: 41.28, svg: () => {
      let parts = '', water = '';
      for(let k=0;k<14;k++){ const a=k*2.4, r=30+ (k%4)*22; parts += `<g ${at(43.3 + k*0.05,'pop')}><circle class="acid" cx="${700+Math.cos(a)*r}" cy="${260+Math.sin(a)*r}" r="9"/></g>`; }
      [[560,470],[640,500],[760,490],[860,460],[900,360],[520,380]].forEach(([x,y],i)=>{ const tx=(700-x)*0.55, ty=(260-y)*0.55; water += `<g ${at(45.3)}><g ${mv(45.6 + i*0.12, tx, ty)}>${drop(x, y, 1.2)}</g></g>`; });
      return `<rect class="colon" x="40" y="40" width="880" height="460" rx="60"/>
        ${lac(220, 260, 34)}
        <text class="t-sm t-c" x="220" y="330">1 Laktose-Molekül</text>
        <g ${at(42.9)}>${arrow(330,260,520,260)}</g>` + parts + water +
        `<g ${at(43.6)}><text class="t-sm t-c" x="700" y="110">viele kleine Teilchen</text></g>` +
        `<g ${at(44.6)}><rect class="card" x="260" y="400" width="440" height="56" rx="14"/><text class="t-lbl t-water t-c" x="480" y="436">ziehen Wasser in den Darm</text></g>` +
        `<g ${at(47.1)}><text class="t-sm t-c" x="480" y="478">so wie vorher die Laktose</text></g>`;
    }},
    { start: 48.88, svg: () => {
      let inside = '';
      [[300,250],[420,300],[560,240],[660,300],[500,270]].forEach(([x,y],i)=>{ inside += i%2 ? drop(x,y,1.2) : gas(x,y,'H₂'); });
      const pains = [[230,150],[700,140],[760,400],[200,390]].map(([x,y])=>`<path class="pain" d="M${x},${y} l14,-18 l-4,16 l16,-14 l-8,24"/>`).join('');
      return `<rect class="lumen" x="0" y="0" width="960" height="540" style="fill:#fdfaf7"/>
        <g ${at(50.5,'swell')}><g ${at(56.1,'cramp')}>
          <rect class="colon" x="180" y="195" width="600" height="150" rx="75"/>
          <g ${at(53.9)}>${[230,330,430,530,630,730].map(x=>`<path class="muscle" d="M${x},200 Q${x+18},270 ${x},340"/>`).join('')}</g>
          ${inside}
        </g></g>
        <g ${at(49.5)}><text class="t-sm t-c" x="480" y="70">Gase + Wasser</text></g>
        <g ${at(50.5)}><text class="t-mid t-c" x="480" y="110">Der Dickdarm dehnt sich</text></g>
        <g ${at(53.1)}><g ${at(53.1,'flash')}>${pains}</g><text class="t-lbl t-bad" x="40" y="480">Bauchschmerzen</text></g>
        <g ${at(53.9)}><text class="t-sm" x="560" y="470">Darmmuskulatur wird gereizt</text></g>
        <g ${at(56.1)}><text class="t-lbl" x="600" y="70">krampfartig</text></g>
        <g ${at(59.4)}>${arrow(818,270,940,270,'ln-water','ahw')}<text class="t-lbl t-water" x="822" y="232">Durchfall</text></g>`;
    }},
    { start: 61.34, svg: () => {
      const cx=250, cy=270, r=140;
      const ang = h => (h/12)*2*Math.PI - Math.PI/2;
      const pt = h => [cx + Math.cos(ang(h))*r*0.82, cy + Math.sin(ang(h))*r*0.82];
      const [ax,ay] = pt(0), [bx,by] = pt(3);
      const ticks = Array.from({length:12},(_,h)=>{ const a=ang(h); return `<line class="grid" x1="${cx+Math.cos(a)*(r-16)}" y1="${cy+Math.sin(a)*(r-16)}" x2="${cx+Math.cos(a)*(r-4)}" y2="${cy+Math.sin(a)*(r-4)}" style="stroke:#9aa3b6; stroke-width:3"/>`; }).join('');
      return `<circle cx="${cx}" cy="${cy}" r="${r}" class="card"/>${ticks}
        <g ${at(63.0)}><path d="M${cx},${cy} L${ax},${ay} A${r*0.82},${r*0.82} 0 0,1 ${bx},${by} Z" fill="#fdeee3" stroke="#e0793c" stroke-width="3"/></g>
        <line class="ln" x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy-r*0.6}"/><circle cx="${cx}" cy="${cy}" r="7" fill="#14213d"/>
        <g ${at(62.0)}><text class="t-sm t-c" x="${cx}" y="${cy+r+40}">Essen oder Trinken</text></g>
        <g ${at(63.1)}><text class="t-lbl t-warm t-c" x="${cx}" y="${cy-r-20}">innerhalb weniger Stunden</text></g>
        <g ${at(65.5)}><text class="t-mid" x="500" y="150" style="text-anchor:start">Wie stark?</text></g>
        <g ${at(66.8)}><text class="t-sm" x="500" y="205">Laktose im Essen</text></g>
        <g ${at(67.2,'grow-x')}><rect x="500" y="218" width="360" height="34" rx="8" fill="#e0793c"/></g>
        <g ${at(70.0)}><text class="t-sm" x="500" y="300">Laktase im Körper</text></g>
        <g ${at(70.7,'grow-x')}><rect x="500" y="313" width="90" height="34" rx="8" fill="#1f9d6b"/></g>
        <g ${at(71.4)}><rect class="card" x="480" y="390" width="440" height="80" rx="14"/>
          <text class="t-lbl" x="500" y="424">viel Laktose + wenig Laktase</text><text class="t-lbl t-bad" x="500" y="456">= starke Beschwerden</text></g>`;
    }},
    { start: 72.64, svg: () => {
      // Körper mit Dickdarm, Blutweg, Lunge und Atem
      const body = `<circle class="body" cx="300" cy="105" r="52"/>
        <path class="body" d="M215,180 Q300,150 385,180 L410,470 Q300,500 190,470 Z"/>
        <ellipse class="lung" cx="265" cy="240" rx="34" ry="52"/><ellipse class="lung" cx="335" cy="240" rx="34" ry="52"/>
        <path class="colon" d="M240,440 L240,360 Q240,340 260,340 L340,340 Q360,340 360,360 L360,440" style="fill:none; stroke-width:16"/>
        <path class="ln ln-bad dash" d="M360,420 Q450,380 430,300 Q410,230 340,230"/>`;
      const step = (t, n, txt, y, cls='') => `<g ${at(t)}><circle cx="580" cy="${y-7}" r="16" fill="#1f4fc4"/><text class="na-t" x="580" y="${y-2}" style="font-size:15px">${n}</text><text class="t-lbl ${cls}" x="606" y="${y}" style="font-size:20px">${txt}</text></g>`;
      return `<g ${at(73.0)}><text class="t-big" x="560" y="140" style="text-anchor:start">H₂-Atemtest</text></g>` + body +
        `<g ${at(76.6)}><text class="t-sm" x="380" y="470">Dickdarm</text></g>
         <g ${at(78.9)}><text class="t-sm t-bad" x="445" y="340">Blut</text></g>
         <g ${at(79.5)}><text class="t-sm" x="150" y="245">Lunge</text></g>
         <g ${at(76.7)}><g ${mv(79.0, 80, -60)}><g ${mv(79.5, -110, -130)}><g ${mv(80.4, 60, -110)}>${g(350,400,'<circle r="18" fill="#2f86d0"/><text class="na-t" y="5">H₂</text>')}</g></g></g></g>
         <g ${at(80.4)}>${arrow(395,100,450,78,'ln-water','ahw')}</g>` +
        step(76.7, 1, 'Wasserstoff entsteht im Dickdarm', 230) +
        step(79.0, 2, 'gelangt ins Blut', 290, 't-bad') +
        step(79.5, 3, 'kommt in die Lunge', 350) +
        step(80.4, 4, 'wird ausgeatmet', 410, 't-water');
    }},
    { start: 81.66, svg: () => {
      // Glas links, Messkurve rechts
      const X0=420, Y0=440, W=470, H=300, px = h => X0 + h/3*W, py = v => Y0 - v*H;
      const pts = [[0,.05],[0.5,.06],[1,.1],[1.5,.35],[2,.62],[2.5,.82],[3,.9]];
      const curve = pts.map(([h,v],i)=>`${i?'L':'M'}${px(h)},${py(v)}`).join(' ');
      const flat = [[0,.05],[3,.09]].map(([h,v],i)=>`${i?'L':'M'}${px(h)},${py(v)}`).join(' ');
      const dots = pts.slice(0,5).map(([h,v],i)=>`<g ${at(85.6 + i*0.6,'pop')}><circle cx="${px(h)}" cy="${py(v)}" r="9" fill="#d4493f"/></g>`).join('');
      return `<g ${at(82.0)}><path d="M100,200 L120,420 Q122,440 142,440 L218,440 Q238,440 240,420 L260,200 Z" fill="#fff" stroke="#9aa3b6" stroke-width="4"/>
          <path d="M108,270 L120,420 Q122,436 142,436 L218,436 Q238,436 240,420 L252,270 Z" fill="#e3eafb"/>
          <text class="t-sm t-c" x="180" y="480">Laktoselösung</text></g>
        <g ${at(85.4)}>
          ${[.25,.5,.75,1].map(v=>`<line class="grid" x1="${X0}" x2="${X0+W}" y1="${py(v)}" y2="${py(v)}"/>`).join('')}
          <path class="axis" d="M${X0},${Y0-H-10} L${X0},${Y0} L${X0+W+10},${Y0}"/>
          <text class="t-sm" x="${X0}" y="${Y0-H-22}">H₂ in der Atemluft</text>
          <text class="t-sm" x="${X0+W}" y="${Y0+62}" text-anchor="end">Zeit (Stunden)</text>
          ${[0,1,2,3].map(h=>`<text class="t-sm t-c" x="${px(h)}" y="${Y0+30}">${h}</text>`).join('')}
        </g>` + dots +
        `<g ${at(89.4)}><path class="ln ln-mut dash" d="${flat}"/><text class="t-sm" x="${px(3)}" y="${py(.09)-14}" text-anchor="end">ohne Laktoseintoleranz</text></g>
         <path class="ln ln-bad draw" data-at="89.5" d="${curve}" style="stroke-width:5"/>
         <g ${at(90.6)}><text class="t-lbl t-bad" x="${px(1.55)}" y="${py(.95)}">steigt deutlich an</text></g>
         <g ${at(92.7)}><rect class="card" x="40" y="22" width="880" height="56" rx="14"/><text class="t-lbl t-c" x="480" y="58">Laktose wurde nicht im Dünndarm verdaut, sondern im Dickdarm</text></g>`;
    }}
  ]
};

const VIDEOS = { 'frage1-teil1': TEIL1, 'frage1-teil2': TEIL2 };

/* ---------- Player ---------- */
const fmt = s => { s = Math.max(0, Math.floor(s)); return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`; };
const ICON_PLAY = '<svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M4 2.5v13l11-6.5z" fill="currentColor"/></svg>';
const ICON_PAUSE = '<svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><rect x="3.5" y="2.5" width="4" height="13" rx="1" fill="currentColor"/><rect x="10.5" y="2.5" width="4" height="13" rx="1" fill="currentColor"/></svg>';
const ICON_BIG = '<svg width="30" height="30" viewBox="0 0 18 18" aria-hidden="true"><path d="M5 2.5v13l11-6.5z" fill="currentColor"/></svg>';

function mount(host, src, id){
  const V = VIDEOS[id]; if(!V) return false;
  const root = document.createElement('div');
  root.className = 'vp'; root.dataset.state = 'paused';
  root.innerHTML = `
    <div class="vp-chip" aria-live="polite"></div>
    <div class="vp-stage">
      <div class="vp-scenes"></div>
      <button class="vp-big" type="button" aria-label="Video abspielen">${ICON_BIG}</button>
    </div>
    <p class="vp-sub"></p>
    <div class="vp-ctl">
      <button class="vp-play" type="button" aria-label="Abspielen">${ICON_PLAY}</button>
      <span class="vp-time">0:00 / ${fmt(V.duration)}</span>
      <div class="vp-bar"><div class="vp-ticks"><div class="fill"></div></div><input class="vp-seek" type="range" min="0" max="${V.duration}" step="0.1" value="0" aria-label="Stelle im Video"></div>
      <button class="vp-cc" type="button" aria-pressed="true" title="Untertitel an/aus">UT</button>
    </div>
    <ol class="vp-chapters" aria-label="Kapitel"></ol>
    <audio preload="metadata" src="${src}"></audio>`;
  host.innerHTML = ''; host.appendChild(root);

  const $ = s => root.querySelector(s);
  const audio = $('audio'), scenesEl = $('.vp-scenes'), chip = $('.vp-chip'), sub = $('.vp-sub'),
        seek = $('.vp-seek'), fill = $('.vp-ticks .fill'), time = $('.vp-time'), play = $('.vp-play');

  // Szenen anlegen
  const scenes = V.scenes.map(sc => {
    const d = document.createElement('div'); d.className = 'vp-scene';
    d.innerHTML = `<svg viewBox="0 0 960 540" role="img" aria-hidden="true">${arrowDefs}${sc.svg()}</svg>`;
    scenesEl.appendChild(d);
    return { el: d, start: sc.start, timed: [...d.querySelectorAll('[data-at]')] };
  });
  // Kapitel-Markierungen und -Liste
  const ticks = $('.vp-ticks');
  V.chapters.forEach(([t]) => { if(t > 0){ const i = document.createElement('i'); i.style.left = (t / V.duration * 100) + '%'; ticks.appendChild(i); } });
  const chList = $('.vp-chapters');
  const chBtns = V.chapters.map(([t, title]) => {
    const li = document.createElement('li');
    li.innerHTML = `<button type="button"><b>${fmt(t)}</b>${title}</button>`;
    li.firstChild.onclick = () => { setTime(t + 0.01); if(audio.paused) toggle(); };
    chList.appendChild(li); return li.firstChild;
  });

  let cur = -1, curCh = -1, curSub = -1, raf = 0;
  function render(t){
    // Szene
    let si = 0; scenes.forEach((s, i) => { if(t >= s.start) si = i; });
    if(si !== cur){ scenes.forEach((s, i) => s.el.classList.toggle('on', i === si)); cur = si; }
    // Zeitgesteuerte Teile der aktiven Szene (und der Nachbarn, damit Überblendungen stimmen)
    scenes.forEach((s, i) => { if(Math.abs(i - si) > 1) return;
      s.timed.forEach(el => {
        const a = parseFloat(el.dataset.at), o = el.dataset.out ? parseFloat(el.dataset.out) : Infinity;
        el.classList.toggle('in', t >= a); el.classList.toggle('out', t >= o);
      });
    });
    // Kapitel
    let ci = 0; V.chapters.forEach(([s], i) => { if(t >= s) ci = i; });
    if(ci !== curCh){ chBtns.forEach((b, i) => b.classList.toggle('on', i === ci)); chip.textContent = V.chapters[ci][1]; curCh = ci; }
    // Untertitel
    let ui = 0; V.subs.forEach(([s], i) => { if(t >= s) ui = i; });
    if(ui !== curSub){ sub.textContent = V.subs[ui][1]; curSub = ui; }
    // Leiste
    const dur = audio.duration && isFinite(audio.duration) ? audio.duration : V.duration;
    seek.value = t; fill.style.width = (t / dur * 100) + '%';
    time.textContent = `${fmt(t)} / ${fmt(dur)}`;
  }
  function loop(){ render(audio.currentTime); raf = requestAnimationFrame(loop); }
  function setTime(t){ try{ audio.currentTime = t; }catch(e){} render(t); }
  function toggle(){
    if(audio.paused){ const p = audio.play(); if(p && p.catch) p.catch(()=>{}); }
    else audio.pause();
  }
  audio.addEventListener('play', () => { root.dataset.state = 'playing'; root.dataset.started = ''; play.innerHTML = ICON_PAUSE; play.setAttribute('aria-label','Pause'); cancelAnimationFrame(raf); loop(); });
  audio.addEventListener('pause', () => { root.dataset.state = 'paused'; play.innerHTML = ICON_PLAY; play.setAttribute('aria-label','Abspielen'); cancelAnimationFrame(raf); render(audio.currentTime); });
  audio.addEventListener('ended', () => { root.dataset.state = 'paused'; play.innerHTML = ICON_PLAY; });
  audio.addEventListener('loadedmetadata', () => { seek.max = audio.duration; render(audio.currentTime); });
  play.onclick = toggle; $('.vp-big').onclick = toggle;
  scenesEl.onclick = toggle;
  seek.addEventListener('input', () => setTime(parseFloat(seek.value)));
  const cc = $('.vp-cc');
  cc.onclick = () => { const on = cc.getAttribute('aria-pressed') !== 'true'; cc.setAttribute('aria-pressed', on); root.dataset.cc = on ? 'on' : 'off'; };
  root.addEventListener('keydown', e => { if(e.key === ' ' && e.target === seek){ e.preventDefault(); toggle(); } });
  render(0);
  return true;
}

window.VideoPlayer = { mount, videos: VIDEOS };
})();
