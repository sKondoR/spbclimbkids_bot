// api/webhook.ts – Совместимо с Vercel
import { VercelRequest, VercelResponse } from '@vercel/node';

// Получаем токен из переменных окружения
const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error('FATAL: TELEGRAM_BOT_TOKEN is missing');
  process.exit(1); // Это остановит инициализацию функции
}

const TELEGRAM_API = `https://api.telegram.org/bot${token}`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const update = req.body;
  console.log('Update received:', JSON.stringify(update, null, 2));

  try {
    if (update.message) {
      const chatId = update.message.chat.id;
      const text = update.message.text;

      let replyText = 'Пока я только умею отвечать на /start :)';
      if (text === '/start') {
        replyText = '👋 Привет! Я бот для SpbClimbKids!';
      }

      // Отправляем сообщение через Telegram HTTP API
      await fetch(`${TELEGRAM_API}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: replyText,
          parse_mode: 'HTML',
        }),
      });
    }

    // Всегда отвечаем 200
    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error('Error sending message:', err);
    return res.status(200).json({ ok: true, warning: 'Message send failed' });
  }
}
