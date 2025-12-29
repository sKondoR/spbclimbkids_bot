import TelegramBot from 'node-telegram-bot-api';
import { ApiService } from '../api/api.service';
import { IClimber, IRoute } from './climber.interface';

export class BotService {
  constructor(
    private bot: TelegramBot,
    private apiService: ApiService,
    private frontURL: string,
  ) {}

  registerCommands(): void {
    // Команда /start
    this.bot.onText(/\/start/, async (msg) => {
      const chatId = msg.chat.id;
      const welcomeText = `
        👋 Привет! Я бот с интеграцией ${this.frontURL}.

        Доступные команды:
        /start - Начать работу
        /climbers - Получить список загруженных с Allclimb скалолазов
        /climber :allclimbId - Получить инфу о скалолазе
        /leads :allclimbId - Получить пролазы трудности скалолаза
        /boulders :allclimbId - Получить пролазы боулдеров скалолаза
      `;

// /user <id> - Получить пользователя по ID
// /createuser <имя> <email> - Создать пользователя
// /orders - Получить список заказов
// /help - Помощь
      
      await this.bot.sendMessage(chatId, welcomeText);
    });

    // Команда /help
    this.bot.onText(/\/help/, async (msg) => {
      const chatId = msg.chat.id;
      const helpText = `
        📚 Помощь по командам:

        /start - Начать работу
        /climbers - Получить список загруженных с Allclimb скалолазов
        /climber <allClimbId> - Получить инфу о скалолазе
        /leads <allClimbId> <query> - Получить пролазы трудности скалолаза
        /boulders <allClimbId> <query> - Получить пролазы боулдеров скалолаза
      `;      
      await this.bot.sendMessage(chatId, helpText);
    });

    // Получение всех пользователей
    this.bot.onText(/\/climbers/, async (msg) => {
      const chatId = msg.chat.id;
      
      try {
        await this.bot.sendMessage(chatId, '🔄 Получаю скалолазов...');
        
        const climbers = await this.apiService.getClimbers();
        
        if (climbers.length === 0) {
          await this.bot.sendMessage(chatId, 'Скалолазы не найдены');
          return;
        }

        const climbersList = climbers.map(climber => 
          `<code>/climber ${climber.allClimbId}</code>👤 ${climber.name}</a> / allClimbId: <a href="https://www.allclimb.com/ru/climber/${climber.allClimbId}/">${climber.allClimbId}</a>`
        ).join('\n');

        await this.bot.sendMessage(chatId,
          `Всего сохраненных с Allclimb скалолазов: ${climbers.length}\n\n${climbersList}`, 
          { parse_mode: 'HTML',
            disable_web_page_preview: true,            
           }
        );
      } catch (error) {
        await this.bot.sendMessage(chatId, '❌ Ошибка при получении скалолазов');
      }
    });


    // Команда /climber <allClimbId>
    // получение информации о скалолазе
    this.bot.onText(/\/climber (\d+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const allClimbId = match ? parseInt(match[1]) : null;

      if (!allClimbId) {
        await this.bot.sendMessage(chatId, 'Укажите allclimbId скалолаза: /climber 1');
        return;
      }

      try {
        const climber = await this.apiService.getClimberByAllclimbId(allClimbId);
        if (!climber) throw 'не найден';  
        await this.showClimberInfo(chatId, climber);
      } catch (error) {
        console.log('error: ', error);
        await this.bot.sendMessage(chatId, `❌ Скалолаз с allclimbId ${allClimbId} не найден`);
      }
    });

    // Команда /leads <allClimbId> <query>(поиск по имени, региону и категории)
    // получение пролазов трудности скалолаза
    this.bot.onText(/\/leads (\d+) (.+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const allClimbId = match ? parseInt(match[1]) : null;
      const query = match ? match[2].trim() : '';

      if (!allClimbId) {
        await this.bot.sendMessage(chatId, 'Укажите allclimbId скалолаза: /leads 1 Гуамка');
        return;
      }

      try {
        const climber = await this.apiService.getClimberByAllclimbId(allClimbId);  
        if (!climber) throw 'не найден'; 
        if (!climber?.leads) return;
        const filtered = this.filterRoutes(climber.leads, query);
        await this.bot.sendMessage(chatId, `Пролазы трудность ${filtered.length}: `); 
        await this.showRoutes(chatId, filtered);
      } catch (error) {
        console.log('error: ', error);
        await this.bot.sendMessage(chatId, `❌ Скалолаз с allclimbId ${allClimbId} не найден`);
      }
    });

    // Команда /boulders <allClimbId> <query>(поиск по имени, региону и категории)
    // получение пролазов боулдеров скалолаза
    this.bot.onText(/\/boulders (\d+) (.+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const allClimbId = match ? parseInt(match[1]) : null;
      const query = match ? match[2].trim() : '';

      if (!allClimbId) {
        await this.bot.sendMessage(chatId, 'Укажите allclimbId скалолаза: /boulders 1 Гуамка');
        return;
      }

      try {
        const climber = await this.apiService.getClimberByAllclimbId(allClimbId);    
        if (!climber) throw 'не найден';   
        if (!climber?.boulders) return;
        const filtered = this.filterRoutes(climber.boulders, query);
        await this.bot.sendMessage(chatId, `Пролазы боулдеринг ${filtered.length}: `); 
        await this.showRoutes(chatId, filtered);
      } catch (error) {
        console.log('error: ', error);
        await this.bot.sendMessage(chatId, `❌ Скалолаз с allclimbId ${allClimbId} не найден`);
      }
    });

    // Обработка обычных сообщений
    this.bot.on('message', async (msg) => {
      const chatId = msg.chat.id;
      
      // Игнорируем команды
      if (msg.text?.startsWith('/')) return;

      // Простой эхо-бот для демонстрации
      if (msg.text) {
        await this.bot.sendMessage(chatId, `Вы сказали: "${msg.text}"\n\nИспользуйте /help для списка команд`);
      }
    });

    // Обработка ошибок
    this.bot.on('polling_error', (error) => {
      console.error('Polling error:', error);
    });
  }

  async showClimberInfo(chatId: number, climber: IClimber): Promise<void> {
    const climberInfo = `
      👤 ${climber.name} / allClimbId: <a href="https://www.allclimb.com/ru/climber/${climber.allClimbId}/">${climber.allClimbId}</a>\n
      пролазов ${climber.routesCount} / баллов ${climber.scores}\n
      трудность ${climber?.leads ? climber?.leads.length : 0} / боулдеринг ${climber?.boulders ? climber.boulders.length : 0}
    `;
    await this.bot.sendMessage(chatId, climberInfo, { parse_mode: 'HTML', disable_web_page_preview: true });
  }

  async showRoutes(chatId: number, routes: IRoute[] | null): Promise<void> {
    const BATCH_SIZE = 10;
    const LABEL_WIDTH = 8;

    // Экранируем HTML
    const escapeHtml = (text: string) => 
      text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    if (!routes || routes.length === 0) {
      return;
    }

    for (let i = 0; i < routes.length; i += BATCH_SIZE) {
      const batch = routes.slice(i, i + BATCH_SIZE);
      const lines: string[] = [];

      for (const item of batch) {
        const paddedGrade = item.grade.padEnd(LABEL_WIDTH);
        const emptyGrade = ''.padEnd(LABEL_WIDTH);
        lines.push(
          `${paddedGrade} ${escapeHtml(item.name)}`,
          `${emptyGrade} ${escapeHtml(item.region)}`
        );
      }

      const message = `<code>${lines.join('\n')}</code>`;

      // Проверка длины сообщения
      if (message.length > 4000) {
        console.warn('Сообщение слишком длинное, пропуск');
        continue;
      }

      try {
        await this.bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
      } catch (error) {
        console.error('Ошибка отправки сообщения:', error);
        // Обработка ошибки (повтор, лог, уведомление)
      }
    }
  }

  filterRoutes(routes: IRoute[], query: string): IRoute[] {
    if (!query) return routes;
    const q = query.toLowerCase();
    return routes.filter(route =>
      route.region.toLowerCase().includes(q)
      || route.name.toLowerCase().includes(q)
      || route.grade.toLowerCase().startsWith(q)
    )
  }
}