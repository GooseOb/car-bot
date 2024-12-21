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

const { TELEGRAM_TOKEN, APP_URL, PORT } = process.env;

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

const orders = new Map(); // phoneNumber -> [{ id, name, phone }, ...]
const userMapping = new Map(); // phoneNumber -> chatId
const isUserPhone = (chatId) => {
  for (const { 1: value } of userMapping) {
    if (value === chatId) return true;
  }
  return false;
};

app.use(express.static(distPath));
app.use(bodyParser.json());
app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

const sendOrder = (chatId, id, name, phone) => {
  bot.sendMessage(chatId, `Order #${id}\nName: ${name}\nPhone: ${phone}`, {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Car",
            web_app: {
              url: `${APP_URL}?orderId=${id}`,
            },
          },
        ],
      ],
    },
  });
};

bot.on("message", (msg) => {
  if (msg.contact) {
    const chatId = msg.chat.id;
    const phoneNumber = msg.contact.phone_number;

    bot.sendMessage(
      chatId,
      "Thank you! Your phone number has been linked to your orders.",
    );

    userMapping.set(phoneNumber, chatId);

    for (const { id, name, phone } of orders.get(phoneNumber)) {
      sendOrder(chatId, id, name, phone);
    }
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

app.post("/api/order/:id", (req, res) => {
  const { id } = req.params;
  const { name, phone } = req.body;

  if (userMapping.has(phone)) {
    sendOrder(userMapping.get(phone), id, name, phone);
  }

  if (!orders.has(phone)) {
    orders.set(phone, []);
  }
  orders.get(phone).push({ id, name, phone });

  res.status(200).send({ message: "Order saved" });
});

app.post("/api/order/:id/car", (req, res) => {
  const { id } = req.params;
  const { carName } = req.body;

  const [phone, order] = orders
    .entries()
    .find(({ 1: orders }) => orders.some((order) => order.id === id));

  const chatId = userMapping.get(phone);

  if (!chatId) {
    return res
      .status(400)
      .send({ error: "Phone number is not registered in Telegram." });
  }

  bot.sendMessage(chatId, `Order #${id}\nCar: ${carName}`);

  const ownerChatId = userMapping.get(OWNER_PHONE);
  bot.sendMessage(
    ownerChatId,
    `Order #${id}\nCar: ${carName}\nName: ${order.name}\nPhone: ${order.phone}`,
  );

  res.status(200).send({ message: "Car name sent to Telegram." });
});

app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`),
);
