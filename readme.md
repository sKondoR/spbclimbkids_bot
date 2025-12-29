# @spbclimbkids_bot
Телеграмм-бот, позволяющий быстро посмотреть данные и пролазы скалолазов с Allclimb.
Написан на nodejs.

Для получения данных используется API [https://spbclimbkids.vercel.app/allclimb](https://spbclimbkids.vercel.app/allclimb)

## Навигация
- [Что умеет бот](#что-умеет-бот)
- [Используемые библиотеки](#используемые-библиотеки)
- [Запуск бота](#запуск-бота)
 
## Что умеет бот:
- команда "/start" - Начать работу
- команда "/climbers" - выдает список уже загруженных с Allclimb на spbclimbkids скалолазов
- команда "/climber <allClimbId>" - выдает инфу о скалолазе: имя, баллы, пролазы
- команда "/leads <allClimbId> <query>" - Получить пролазы трудности скалолаза, можно добавить query с поиском по названию трассы, региону или категории ("Show must go on"; "Гуамка"; "7")
- команда "/boulders <allClimbId> <query>"  - Получить пролазы боудеров скалолаза, можно добавить query с поиском по названию трассы, региону или категории ("Show must go on"; "Гуамка"; "7")
  
## Используемые библиотеки
- **node-telegram-bot-api** - библиотека-обертка для работы с api телеграмма

## .env
TELEGRAM_BOT_TOKEN=Токен бота от @BotFather<br>
FRONT_URL=URL прод фронта<br>
API_URL=URL вашего NestJS API<br>
Дополнительные настройки (опционально):<br>
NODE_ENV=development<br>
LOG_LEVEL=info<br>

## Запуск бота
1. Загрузи все используемые библиотеки командой: <br>
`npm i`<br>
2. Запуск в dev режиме: <br>
`npm run dev:watch`<br>

<br><br>

## Проверки
- проверка Webhook Configuration
https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://your-vercel-app.vercel.app/api/webhook
- Webhook Was Set
https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo
{
  "url": "https://spbclimbkids-bot.vercel.app/api/webhook",
  "has_custom_certificate": false,
  "pending_update_count": 0,       👈 should be 0
  "last_error_message": "",        👈 should be empty
  "last_error_date": 0,            👈 or missing
  "max_connections": 40,
  "ip_address": "123.123.123.123"
}