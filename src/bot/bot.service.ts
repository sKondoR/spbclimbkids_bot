import TelegramBot from 'node-telegram-bot-api';
import { ApiService } from '../api/api.service';

// Интерфейсы — убедитесь, что они где-то определены
interface IRoute {
  name: string;
  region: string;
  grade: string;
}

interface IClimber {
  allClimbId: number;
  name: string;
  leads?: IRoute[];
  boulders?: IRoute[];
  routesCount: number;
  scores: number;
}

export class BotService {
  constructor(
    private bot: TelegramBot,
    private apiService: ApiService,
    private frontUrl: string
  ) {}

  // 🟩 Главный метод для обработки обновлений (вместо bot.on)
  async handleUpdate(update: TelegramBot.Update): Promise<void> {
    if (update.message) {
      const msg = update.message;
      const chatId = msg.chat.id;
      const text = msg.text?.trim();

      if (!text) return;

      // Обработка команд
      if (text.startsWith('/')) {
        await this.handleCommand(chatId, text, msg);
      } else {
        // Обработка обычных сообщений
        await this.bot.sendMessage(
          chatId,
          `Вы сказали: "${text}"\n\nИспользуйте /help для списка команд`
        );
      }
    }
  }

  // 🔄 Обработка команд
  private async handleCommand(chatId: number, text: string, msg: TelegramBot.Message) {
    const climberMatch = text.match(/^\/climber\s+(\d+)$/i);
    const leadsMatch = text.match(/^\/leads\s+(\d+)\s+(.+)$/i);
    const bouldersMatch = text.match(/^\/boulders\s+(\d+)\s+(.+)$/i);
    const climbersMatch = text.match(/^\/climbers$/i);

    if (climbersMatch) {
      await this.handleClimbersCommand(chatId);
    } else if (climberMatch) {
      const allClimbId = parseInt(climberMatch[1], 10);
      await this.handleClimberCommand(chatId, allClimbId);
    } else if (leadsMatch) {
      const allClimbId = parseInt(leadsMatch[1], 10);
      const query = leadsMatch[2].trim();
      await this.handleLeadsCommand(chatId, allClimbId, query);
    } else if (bouldersMatch) {
      const allClimbId = parseInt(bouldersMatch[1], 10);
      const query = bouldersMatch[2].trim();
      await this.handleBouldersCommand(chatId, allClimbId, query);
    } else if (text === '/start') {
      await this.bot.sendMessage(chatId, `👋 Привет! Я бот для SpbClimbKids!
        /start - Начать работу
        /climbers - Получить список загруженных с Allclimb скалолазов
        /climber <allClimbId> - Получить инфу о скалолазе
        /leads <allClimbId> <query> - Получить пролазы трудности скалолаза
        /boulders <allClimbId> <query> - Получить пролазы боулдеров скалолаза
      `,
      );
    } else {
      await this.bot.sendMessage(chatId, 'Неизвестная команда. Используйте:\n/climbers — список скалолазов\n/climber 123 — информация\n/leads 123 запрос — пролазы\n/boulders 123 запрос — боулдеры');
    }
  }

  // === Команды ===

  private async handleClimbersCommand(chatId: number) {
    try {
      await this.bot.sendMessage(chatId, '🔄 Получаю скалолазов...');
      const climbers = await this.apiService.getClimbers();

      if (climbers.length === 0) {
        await this.bot.sendMessage(chatId, 'Скалолазы не найдены');
        return;
      }

      const climbersList = climbers
        .map(
          (climber) =>
            `<code>/climber ${climber.allClimbId}</code> 👤 ${climber.name} / allClimbId: <a href="https://www.allclimb.com/ru/climber/${climber.allClimbId}/">${climber.allClimbId}</a>`
        )
        .join('\n\n');

      await this.bot.sendMessage(
        chatId,
        `Всего сохранённых скалолазов: <b>${climbers.length}</b>\n\n${climbersList}`,
        { parse_mode: 'HTML', disable_web_page_preview: true }
      );
    } catch (error) {
      console.error('Error in /climbers:', error);
      await this.bot.sendMessage(chatId, '❌ Ошибка при получении скалолазов');
    }
  }

  private async handleClimberCommand(chatId: number, allClimbId: number) {
    try {
      const climber = await this.apiService.getClimberByAllclimbId(allClimbId);
      if (!climber) throw new Error('not found');

      await this.showClimberInfo(chatId, climber as IClimber);
    } catch (error) {
      console.log('error: ', error);
      await this.bot.sendMessage(chatId, `❌ Скалолаз с allclimbId ${allClimbId} не найден`);
    }
  }

  private async handleLeadsCommand(chatId: number, allClimbId: number, query: string) {
    try {
      const climber = await this.apiService.getClimberByAllclimbId(allClimbId);
      if (!climber) throw new Error('not found');
      if (!climber.leads) {
        await this.bot.sendMessage(chatId, 'Нет пролазов трудности');
        return;
      }

      const filtered = this.filterRoutes(climber.leads, query);
      await this.bot.sendMessage(chatId, `Пролазы трудности (${filtered.length}):`);
      await this.showRoutes(chatId, filtered);
    } catch (error) {
      await this.bot.sendMessage(chatId, `❌ Скалолаз с allclimbId ${allClimbId} не найден`);
    }
  }

  private async handleBouldersCommand(chatId: number, allClimbId: number, query: string) {
    try {
      const climber = await this.apiService.getClimberByAllclimbId(allClimbId);
      if (!climber) throw new Error('not found');
      if (!climber.boulders) {
        await this.bot.sendMessage(chatId, 'Нет боулдеров');
        return;
      }

      const filtered = this.filterRoutes(climber.boulders, query);
      await this.bot.sendMessage(chatId, `Пролазы боулдеринга (${filtered.length}):`);
      await this.showRoutes(chatId, filtered);
    } catch (error) {
      await this.bot.sendMessage(chatId, `❌ Скалолаз с allclimbId ${allClimbId} не найден`);
    }
  }

  // === Вспомогательные методы ===

  async showClimberInfo(chatId: number, climber: IClimber): Promise<void> {
    const climberInfo = `
👤 <b>${climber.name}</b> / allClimbId: <a href="https://www.allclimb.com/ru/climber/${climber.allClimbId}/">${climber.allClimbId}</a>
Пролазов: ${climber.routesCount} | Баллов: ${climber.scores}
Трудность: ${climber.leads?.length || 0} | Боулдеринг: ${climber.boulders?.length || 0}
    `.trim();

    await this.bot.sendMessage(chatId, climberInfo, {
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    });
  }

  async showRoutes(chatId: number, routes: IRoute[] | null): Promise<void> {
    const BATCH_SIZE = 10;
    const LABEL_WIDTH = 8;

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
      if (message.length > 4000) {
        console.warn('Сообщение слишком длинное, пропуск');
        continue;
      }

      try {
        await this.bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
      } catch (error) {
        console.error('Ошибка отправки сообщения:', error);
      }
    }
  }

  filterRoutes(routes: IRoute[], query: string): IRoute[] {
    if (!query) return routes;
    const q = query.toLowerCase();
    return routes.filter(
      (route) =>
        route.region.toLowerCase().includes(q) ||
        route.name.toLowerCase().includes(q) ||
        route.grade.toLowerCase().startsWith(q)
    );
  }
}
