// Готовит webp-версии картинок для public/.
//
// На сервере оптимизации нет: у его процессора нет микроархитектуры
// x86-64-v2, которую требуют собранные бинарники sharp, поэтому /_next/image
// отключён (см. next.config.ts). Всё, что попадает на сайт, сжимается здесь,
// на машине разработчика, и коммитится уже готовым.
//
// Запуск: npm run images

import sharp from "sharp";
import { mkdir, readdir, stat } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SOURCES = path.join(ROOT, "assets-src");
const OUT = path.join(ROOT, "public", "img");

// Ширины под каждый вид картинки: больше одного размера нужно только там,
// где картинка тянется на всю ширину экрана.
const PRESETS = {
  hero: { widths: [768, 1280, 1920], quality: 70 },
  card: { widths: [480, 720], quality: 74 },
};

function presetFor(name) {
  return name.startsWith("hero") ? PRESETS.hero : PRESETS.card;
}

async function main() {
  let files;
  try {
    files = await readdir(SOURCES);
  } catch {
    console.log(
      `Положите исходники в ${path.relative(ROOT, SOURCES)}/ — например hero.jpg или object-batumi.jpg.\n` +
        "Имена, начинающиеся на «hero», режутся под фон первого экрана, остальные — под карточки."
    );
    return;
  }

  await mkdir(OUT, { recursive: true });
  const images = files.filter((f) => /\.(jpe?g|png|webp|avif)$/i.test(f));
  if (!images.length) {
    console.log("В assets-src нет картинок.");
    return;
  }

  for (const file of images) {
    const name = path.parse(file).name;
    const { widths, quality } = presetFor(name);
    const src = path.join(SOURCES, file);
    const before = (await stat(src)).size;

    for (const width of widths) {
      const out = path.join(OUT, `${name}-${width}.webp`);
      const info = await sharp(src).resize({ width }).webp({ quality }).toFile(out);
      console.log(
        `${path.relative(ROOT, out)} — ${Math.round(info.size / 1024)} КБ ` +
          `(исходник ${Math.round(before / 1024)} КБ)`
      );
    }
  }
}

await main();
