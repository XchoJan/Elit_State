// Генератор типовых планировок.
// Комнаты задаются прямоугольниками в метрах, площади в подписях считаются
// из геометрии — так чертёж и цифры не могут разойтись.
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DIR = dirname(fileURLToPath(import.meta.url));

const NAVY = "#0f2438";
const GOLD = "#c9a24b";
const GOLD_LIGHT = "#e3c078";
const PAPER = "#faf8f5";

// x, y, w, h — в метрах, начало координат в левом верхнем углу
const PLANS = [
  {
    file: "plan-50-1",
    subtitle: "1 спальня",
    canvas: [8.0, 7.0],
    rooms: [
      { name: "Балкон", rect: [0, 0, 2.0, 1.0], type: "balcony" },
      { name: "Гостиная-кухня", rect: [0, 1.0, 4.6, 4.8] },
      { name: "Прихожая", rect: [0, 5.8, 4.6, 1.2], type: "service" },
      { name: "Спальня", rect: [4.6, 1.0, 3.4, 4.6] },
      { name: "Санузел", rect: [4.6, 5.6, 3.4, 1.4], type: "service" },
    ],
  },
  {
    file: "plan-50-2",
    subtitle: "Студия с гардеробной",
    canvas: [7.5, 7.2],
    rooms: [
      { name: "Балкон", rect: [0, 0, 2.4, 0.8], type: "balcony" },
      { name: "Кухня-гостиная-спальня", rect: [0, 0.8, 5.4, 6.4] },
      { name: "Гардеробная", rect: [5.4, 0.8, 2.1, 1.7], type: "service" },
      { name: "Санузел", rect: [5.4, 2.5, 2.1, 2.2], type: "service" },
      { name: "Прихожая", rect: [5.4, 4.7, 2.1, 2.5], type: "service" },
    ],
  },
  {
    file: "plan-60-1",
    subtitle: "2 спальни",
    canvas: [9.0, 7.2],
    rooms: [
      { name: "Балкон", rect: [0, 0, 3.0, 0.8], type: "balcony" },
      { name: "Гостиная-кухня", rect: [0, 0.8, 4.2, 5.3] },
      { name: "Прихожая", rect: [0, 6.1, 4.2, 1.1], type: "service" },
      { name: "Спальня 1", rect: [4.2, 0.8, 4.8, 3.0] },
      { name: "Спальня 2", rect: [4.2, 3.8, 3.1, 3.4] },
      { name: "Санузел", rect: [7.3, 3.8, 1.7, 3.4], type: "service" },
    ],
  },
  {
    file: "plan-60-2",
    subtitle: "Спальня и кабинет",
    canvas: [8.5, 7.6],
    rooms: [
      { name: "Балкон", rect: [0, 0, 2.75, 0.8], type: "balcony" },
      { name: "Гостиная-кухня", rect: [0, 0.8, 4.6, 5.6] },
      { name: "Прихожая", rect: [0, 6.4, 4.6, 1.2], type: "service" },
      { name: "Спальня", rect: [4.6, 0.8, 3.9, 3.7] },
      { name: "Кабинет", rect: [4.6, 4.5, 3.9, 1.8] },
      { name: "Санузел", rect: [4.6, 6.3, 3.9, 1.3], type: "service" },
    ],
  },
  {
    file: "plan-70-1",
    subtitle: "2 спальни, 2 санузла",
    canvas: [9.6, 7.8],
    rooms: [
      { name: "Балкон", rect: [0, 0, 3.5, 0.8], type: "balcony" },
      { name: "Гостиная-кухня", rect: [0, 0.8, 4.8, 5.6] },
      { name: "Прихожая", rect: [0, 6.4, 4.8, 1.4], type: "service" },
      { name: "Спальня 1", rect: [4.8, 0.8, 4.8, 3.2] },
      { name: "Спальня 2", rect: [4.8, 4.0, 2.9, 3.8] },
      { name: "Ванная", rect: [7.7, 4.0, 1.9, 1.9], type: "service" },
      { name: "Санузел", rect: [7.7, 5.9, 1.9, 1.9], type: "service" },
    ],
  },
  {
    file: "plan-70-2",
    subtitle: "3 спальни",
    canvas: [9.6, 7.8],
    rooms: [
      { name: "Балкон", rect: [0, 0, 3.5, 0.8], type: "balcony" },
      { name: "Гостиная-кухня", rect: [0, 0.8, 4.2, 5.3] },
      { name: "Прихожая", rect: [0, 6.1, 4.2, 1.7], type: "service" },
      { name: "Спальня 1", rect: [4.2, 0.8, 2.7, 3.6] },
      { name: "Спальня 2", rect: [6.9, 0.8, 2.7, 3.6] },
      { name: "Спальня 3", rect: [4.2, 4.4, 3.4, 3.4] },
      { name: "Ванная", rect: [7.6, 4.4, 2.0, 1.8], type: "service" },
      { name: "Санузел", rect: [7.6, 6.2, 2.0, 1.6], type: "service" },
    ],
  },
];

const FILL = {
  living: "#ffffff",
  service: "#eee9e0",
  balcony: "#f3ece0",
};

function render(plan) {
  const [cw, ch] = plan.canvas;
  const PAD = 74;
  const AVAIL_W = 1080 - PAD * 2;
  const AVAIL_H = 640;
  const scale = Math.min(AVAIL_W / cw, AVAIL_H / ch);
  const planW = cw * scale;
  const planH = ch * scale;
  const offX = (1080 - planW) / 2;

  const rooms = plan.rooms.map((r) => {
    const [x, y, w, h] = r.rect;
    return { ...r, area: Math.round(w * h * 10) / 10, px: [x * scale, y * scale, w * scale, h * scale] };
  });

  const interior = rooms.filter((r) => r.type !== "balcony");
  const balconies = rooms.filter((r) => r.type === "balcony");
  const totalInterior = Math.round(interior.reduce((s, r) => s + r.area, 0) * 10) / 10;
  const totalBalcony = Math.round(balconies.reduce((s, r) => s + r.area, 0) * 10) / 10;
  const total = Math.round((totalInterior + totalBalcony) * 10) / 10;
  const bathrooms = rooms.filter((r) => /Санузел|Ванная/.test(r.name)).length;
  const bathroomWord = bathrooms === 1 ? "санузел" : "санузла";

  const shapes = rooms
    .map((r) => {
      const [x, y, w, h] = r.px;
      const fill = FILL[r.type ?? "living"] ?? FILL.living;
      const dash = r.type === "balcony" ? ' stroke-dasharray="7 6"' : "";
      const stroke = r.type === "balcony" ? GOLD : NAVY;
      const sw = r.type === "balcony" ? 2.5 : 3.5;
      // Подпись: если комната узкая — уменьшаем кегль
      const small = Math.min(w, h) < 90;
      const nameSize = small ? 18 : 23;
      const areaSize = small ? 20 : 27;
      const cx = x + w / 2;
      const cy = y + h / 2;
      return `
      <rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}"
            fill="${fill}" stroke="${stroke}" stroke-width="${sw}"${dash} />
      <text x="${cx.toFixed(1)}" y="${(cy - 6).toFixed(1)}" text-anchor="middle"
            font-family="Manrope, sans-serif" font-size="${nameSize}" font-weight="600"
            fill="${NAVY}" opacity="0.78">${r.name}</text>
      <text x="${cx.toFixed(1)}" y="${(cy + areaSize).toFixed(1)}" text-anchor="middle"
            font-family="Manrope, sans-serif" font-size="${areaSize}" font-weight="800"
            fill="${GOLD}">${r.area.toFixed(1).replace(".", ",")} м²</text>`;
    })
    .join("");

  // Внешний контур жилой части — толстая линия поверх комнат
  const ix = Math.min(...interior.map((r) => r.px[0]));
  const iy = Math.min(...interior.map((r) => r.px[1]));
  const ix2 = Math.max(...interior.map((r) => r.px[0] + r.px[2]));
  const iy2 = Math.max(...interior.map((r) => r.px[1] + r.px[3]));

  return `<!doctype html>
<html lang="ru"><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Playfair+Display:wght@700;900&display=swap" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:1080px;height:1080px;overflow:hidden;background:${PAPER};font-family:"Manrope",sans-serif}
  .wrap{position:relative;width:1080px;height:1080px;display:flex;flex-direction:column;padding:52px 74px 44px}
  .top{display:flex;align-items:center;justify-content:space-between}
  .brand{display:flex;align-items:center;gap:14px}
  .mark{display:flex;align-items:flex-end;gap:4px;height:32px}
  .mark i{display:block;width:8px;border-radius:2px 2px 0 0;background:linear-gradient(180deg,${GOLD_LIGHT},${GOLD})}
  .mark i:nth-child(1){height:19px}.mark i:nth-child(2){height:32px}.mark i:nth-child(3){height:25px}
  .bname{font-family:"Playfair Display",serif;font-weight:700;font-size:23px;letter-spacing:.19em;color:${NAVY}}
  .tag{font-size:12px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:${GOLD};
       border:1px solid rgba(201,162,75,.5);border-radius:999px;padding:8px 16px}
  h1{margin-top:26px;font-family:"Playfair Display",serif;font-weight:900;font-size:70px;line-height:1;color:${NAVY}}
  h1 em{font-style:normal;color:${GOLD}}
  .sub{margin-top:9px;font-size:24px;font-weight:600;color:rgba(15,36,56,.62)}
  .plan{flex:1;display:flex;align-items:center;justify-content:center;margin-top:8px}
  .foot{display:flex;align-items:center;justify-content:space-between;border-top:1px solid rgba(15,36,56,.13);padding-top:20px}
  .metrics{display:flex;gap:34px}
  .metric b{display:block;font-size:26px;font-weight:800;color:${NAVY};line-height:1.1}
  .metric span{font-size:13px;font-weight:600;color:rgba(15,36,56,.5)}
  .site{font-size:17px;font-weight:700;letter-spacing:.05em;color:${GOLD}}
</style></head>
<body><div class="wrap">
  <div class="top">
    <div class="brand"><div class="mark"><i></i><i></i><i></i></div><div class="bname">ELITE ESTATE</div></div>
    <div class="tag">Типовая планировка</div>
  </div>

  <h1>${total.toFixed(0)} <em>м²</em></h1>
  <div class="sub">${plan.subtitle}</div>

  <div class="plan">
    <svg width="${planW.toFixed(0)}" height="${planH.toFixed(0)}" viewBox="0 0 ${planW.toFixed(1)} ${planH.toFixed(1)}">
      ${shapes}
      <rect x="${ix.toFixed(1)}" y="${iy.toFixed(1)}" width="${(ix2 - ix).toFixed(1)}" height="${(iy2 - iy).toFixed(1)}"
            fill="none" stroke="${NAVY}" stroke-width="7" />
    </svg>
  </div>

  <div class="foot">
    <div class="metrics">
      <div class="metric"><b>${totalInterior.toFixed(1).replace(".", ",")} м²</b><span>без балкона</span></div>
      <div class="metric"><b>${totalBalcony.toFixed(1).replace(".", ",")} м²</b><span>балкон</span></div>
      <div class="metric"><b>${bathrooms}</b><span>${bathroomWord}</span></div>
    </div>
    <div class="site">eliteestate.online</div>
  </div>
</div></body></html>`;
}

const report = [];
for (const plan of PLANS) {
  const html = render(plan);
  writeFileSync(join(DIR, plan.file + ".html"), html);
  const rooms = plan.rooms.map((r) => {
    const [, , w, h] = r.rect;
    return { name: r.name, area: Math.round(w * h * 10) / 10, type: r.type ?? "living" };
  });
  const sum = Math.round(rooms.reduce((s, r) => s + r.area, 0) * 10) / 10;
  report.push({ file: plan.file, итого: sum, комнаты: rooms.map((r) => `${r.name} ${r.area}`).join(", ") });
}
console.log(JSON.stringify(report, null, 2));
