import express from "express";
import bodyParser from "body-parser";
import TelegramBot from "node-telegram-bot-api";
import path from "path";
import { fileURLToPath } from "url";

const distPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "frontend/dist",
);

const app = express();

const { TELEGRAM_TOKEN, PORT } = process.env;

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

const userMapping = new Map(); // phoneNumber -> chatId
const isUserPhone = (chatId) => {
  for (const { 1: value } of userMapping) {
    if (value === chatId) return true;
  }
  return false;
};
const orderQueue = new Map(); // phoneNumber -> [{ id, name, phone }, ...]

app.use(express.static(distPath));
app.use(bodyParser.json());
app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

bot.on("message", (msg) => {
  if (msg.contact) {
    const chatId = msg.chat.id;
    const phoneNumber = msg.contact.phone_number;

    bot.sendMessage(
      chatId,
      "Thank you! Your phone number has been linked to your orders.",
    );

    userMapping.set(phoneNumber, chatId);

    for (const { id, name, phone } of orderQueue.get(phoneNumber)) {
      bot.sendMessage(chatId, `Order #${id}\nName: ${name}\nPhone: ${phone}`, {
        reply_markup: {
          inline_keyboard: [[{ text: "Car", callback_data: `car_${id}` }]],
        },
      });
    }

    orderQueue.delete(phoneNumber);
  }
});

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  if (!isUserPhone(chatId)) {
    bot.sendMessage(
      chatId,
      "Welcome! Your phone number will be used to link your orders.",
      {
        reply_markup: {
          keyboard: [
            [
              {
                text: "Send phone number",
                request_contact: true,
              },
            ],
          ],
          one_time_keyboard: true,
        },
      },
    );
  }
});

// bot.on("callback_query", (query) => {
//   const [type, id] = query.data.split("_");
//   if (type === "car") {
//     bot.sendMessage(
//       query.message.chat.id,
//       `Please enter the car name for order #${id}`,
//     );
//   }
// });

app.post("/api/order/:id", (req, res) => {
  const { id } = req.params;
  const { name, phone } = req.body;

  let message;

  if (userMapping.has(phone)) {
    bot.sendMessage(
      userMapping.get(phone),
      `Order #${id}\nName: ${name}\nPhone: ${phone}`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "Car",
                webapp: {
                  url: `${APP_URL}?orderId=${id}`,
                },
              },
            ],
          ],
        },
      },
    );
    message = "Order sent to Telegram.";
  } else {
    if (!orderQueue.has(phone)) {
      orderQueue.set(phone, []);
    }
    orderQueue.get(phone).push({ id, name, phone });
    message = "Order queued until user interacts with the bot.";
  }

  res.status(200).send({ message });
});

app.post("/api/order/:id/car", (req, res) => {
  const { id } = req.params;
  const { carName, phone } = req.body;

  const chatId = userMapping.get(phone);
  if (!chatId) {
    return res
      .status(400)
      .send({ error: "Phone number is not registered in Telegram." });
  }

  bot.sendMessage(chatId, `Order #${id}\nCar: ${carName}`);
  res.status(200).send({ message: "Car name sent to Telegram." });
});

app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`),
);
