import * as SQLite from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { eq } from 'drizzle-orm';
import { 
  usersTable, 
  flashcardsTable, 
  userFlashcardProgressTable, 
  userAlgorithmConfigTable 
} from '../../db/schema';
import { 
  FlashcardRawData, 
  DEFAULT_ALGORITHM_CONFIG,
  SpacedRepetitionConfig 
} from '../types';
import flashcardData from '../../flashcard.json';

// 数据库实例
const expo = SQLite.openDatabaseSync('db.db');
const db = drizzle(expo);

export class DataImportService {
  
  /**
   * 初始化数据库数据
   * 包括导入闪卡数据、创建默认用户、初始化学习进度和算法配置
   */
  async initializeData(): Promise<void> {
    try {
      console.log('开始初始化数据库数据...');
      
      // 1. 创建默认用户
      const defaultUser = await this.createDefaultUser();
      console.log('默认用户创建完成:', defaultUser);
      
      // 2. 导入闪卡数据
      const importedFlashcards = await this.importFlashcards();
      console.log(`成功导入 ${importedFlashcards.length} 张闪卡`);
      
      // 3. 初始化用户学习进度
      await this.initializeUserProgress(defaultUser.id, importedFlashcards);
      console.log('用户学习进度初始化完成');
      
      // 4. 设置默认算法配置
      await this.setupDefaultAlgorithmConfig(defaultUser.id);
      console.log('默认算法配置设置完成');
      
      console.log('数据库初始化完成!');
    } catch (error) {
      console.error('数据库初始化失败:', error);
      throw error;
    }
  }

  /**
   * 创建默认用户
   */
  private async createDefaultUser() {
    // 检查是否已存在默认用户
    const existingUsers = await db.select().from(usersTable).limit(1);
    
    if (existingUsers.length > 0) {
      console.log('默认用户已存在，跳过创建');
      return existingUsers[0];
    }

    // 创建新的默认用户
    const newUser = {
      name: '默认用户',
      age: 25,
      email: 'default@anki.app'
    };

    const insertedUsers = await db.insert(usersTable).values(newUser).returning();
    return insertedUsers[0];
  }

  /**
   * 从 flashcard.json 导入闪卡数据
   */
  private async importFlashcards() {
    // 检查是否已导入数据
    const existingFlashcards = await db.select().from(flashcardsTable).limit(1);
    
    if (existingFlashcards.length > 0) {
      console.log('闪卡数据已存在，跳过导入');
      // 返回所有现有闪卡
      return await db.select().from(flashcardsTable);
    }

    // 转换 flashcard.json 数据格式
    const flashcardsToInsert = (flashcardData as FlashcardRawData[]).map(card => ({
      word: card.word,
      usphone: card.usphone,
      ukphone: card.ukphone,
      meaning: card.meaning,
      example: card.example,
      imageUrl: card.imageUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));

    // 批量插入闪卡数据
    const insertedFlashcards = await db
      .insert(flashcardsTable)
      .values(flashcardsToInsert)
      .returning();

    return insertedFlashcards;
  }

  /**
   * 初始化用户学习进度
   * 为所有闪卡创建初始学习记录
   */
  private async initializeUserProgress(userId: number, flashcards: any[]) {
    // 检查是否已有学习进度
    const existingProgress = await db
      .select()
      .from(userFlashcardProgressTable)
      .where(eq(userFlashcardProgressTable.userId, userId))
      .limit(1);

    if (existingProgress.length > 0) {
      console.log('用户学习进度已存在，跳过初始化');
      return;
    }

    // 为每张闪卡创建初始学习进度
    const now = new Date();
    const progressRecords = flashcards.map(flashcard => ({
      userId,
      flashcardId: flashcard.id,
      difficulty: 2 as const, // 默认一般难度
      nextReviewDate: now.toISOString(), // 立即可学习
      reviewCount: 0,
      correctCount: 0,
      lastReviewedAt: null,
      createdAt: now.toISOString()
    }));

    // 批量插入学习进度记录
    await db.insert(userFlashcardProgressTable).values(progressRecords);
  }

  /**
   * 设置默认算法配置
   */
  private async setupDefaultAlgorithmConfig(userId: number) {
    // 检查是否已有算法配置
    const existingConfig = await db
      .select()
      .from(userAlgorithmConfigTable)
      .where(eq(userAlgorithmConfigTable.userId, userId))
      .limit(1);

    if (existingConfig.length > 0) {
      console.log('用户算法配置已存在，跳过设置');
      return;
    }

    // 创建默认算法配置
    const config = DEFAULT_ALGORITHM_CONFIG;
    const configRecord = {
      userId,
      algorithmType: config.algorithmType,
      learningMode: 'standard' as const,
      baseIntervalsEasy: JSON.stringify(config.baseIntervals.easy),
      baseIntervalsNormal: JSON.stringify(config.baseIntervals.normal),
      baseIntervalsHard: JSON.stringify(config.baseIntervals.hard),
      multiplierEasy: config.multipliers.easy,
      multiplierNormal: config.multipliers.normal,
      multiplierHard: config.multipliers.hard,
      maxInterval: config.maxInterval,
      minInterval: config.minInterval,
      newCardSteps: JSON.stringify(config.newCardSteps),
      lapseSteps: JSON.stringify(config.lapseSteps),
      dailyNewCards: config.dailyNewCards,
      dailyReviewCards: config.dailyReviewCards,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await db.insert(userAlgorithmConfigTable).values(configRecord);
  }

  /**
   * 检查数据库是否已初始化
   */
  async isDataInitialized(): Promise<boolean> {
    try {
      const userCount = await db.select().from(usersTable).limit(1);
      const flashcardCount = await db.select().from(flashcardsTable).limit(1);
      
      return userCount.length > 0 && flashcardCount.length > 0;
    } catch (error) {
      console.error('检查数据初始化状态失败:', error);
      return false;
    }
  }

  /**
   * 获取数据统计信息
   */
  async getDataStats() {
    try {
      const users = await db.select().from(usersTable);
      const flashcards = await db.select().from(flashcardsTable);
      const progress = await db.select().from(userFlashcardProgressTable);
      const configs = await db.select().from(userAlgorithmConfigTable);

      return {
        usersCount: users.length,
        flashcardsCount: flashcards.length,
        progressRecordsCount: progress.length,
        configsCount: configs.length
      };
    } catch (error) {
      console.error('获取数据统计失败:', error);
      return {
        usersCount: 0,
        flashcardsCount: 0,
        progressRecordsCount: 0,
        configsCount: 0
      };
    }
  }
}

// 导出单例实例
export const dataImportService = new DataImportService(); 