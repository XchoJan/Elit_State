// Одноразовый вход в Telegram: спрашивает телефон, код из приложения и
// (если включена) двухфакторную защиту, затем печатает строку сессии.
// Строку положите в .env как TG_SESSION — после этого index.js будет
// подключаться сам, без кода.
//
// Строка сессии = полный доступ к вашему аккаунту. Не коммитьте её в git
// и не пересылайте никому.

import "dotenv/config";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { TelegramClient } from "teleproto";
import { StringSession } from "teleproto/sessions/index.js";

const apiId = Number(process.env.TG_API_ID);
const apiHash = process.env.TG_API_HASH;

if (!apiId || !apiHash) {
  console.error(
    "Сначала заполните TG_API_ID и TG_API_HASH в lead-radar/.env\n" +
      "Взять их: https://my.telegram.org → API development tools"
  );
  process.exit(1);
}

const rl = readline.createInterface({ input, output });
const client = new TelegramClient(new StringSession(""), apiId, apiHash, {
  connectionRetries: 5,
});

await client.start({
  phoneNumber: () => rl.question("Телефон (в формате +374…): "),
  password: () => rl.question("Пароль двухфакторной защиты (если есть): "),
  phoneCode: () => rl.question("Код из Telegram: "),
  onError: (err) => console.error(err),
});

console.log("\nГотово. Скопируйте строку ниже в lead-radar/.env как TG_SESSION:\n");
console.log(client.session.save());

await rl.close();
await client.disconnect();
process.exit(0);
