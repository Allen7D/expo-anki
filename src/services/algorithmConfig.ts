import * as SQLite from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { eq } from 'drizzle-orm';
import { userAlgorithmConfigTable } from '../../db/schema';
import { SpacedRepetitionConfig, DEFAULT_ALGORITHM_CONFIG, PRESET_CONFIGS } from '../types';

// 数据库实例
const expo = SQLite.openDatabaseSync('db.db');
const db = drizzle(expo);

/**
 * 算法配置服务
 * 负责用户算法配置的存储、读取和管理
 */
export class AlgorithmConfigService {

  /**
   * 获取用户的算法配置
   * @param userId 用户ID
   * @returns 算法配置对象
   */
  async getUserConfig(userId: number): Promise<SpacedRepetitionConfig> {
    try {
      const userConfig = await db.select()
        .from(userAlgorithmConfigTable)
        .where(eq(userAlgorithmConfigTable.userId, userId))
        .limit(1);

      if (userConfig.length === 0) {
        // 如果没有配置，返回默认配置
        console.log(`用户 ${userId} 没有算法配置，返回默认配置`);
        return DEFAULT_ALGORITHM_CONFIG;
      }

      // 反序列化配置
      return this.deserializeConfig(userConfig[0]);
    } catch (error) {
      console.error('获取用户算法配置失败:', error);
      return DEFAULT_ALGORITHM_CONFIG;
    }
  }

  /**
   * 保存用户的算法配置
   * @param userId 用户ID
   * @param config 算法配置
   */
  async saveUserConfig(userId: number, config: SpacedRepetitionConfig): Promise<void> {
    try {
      const serializedConfig = this.serializeConfig(userId, config);

      await db.insert(userAlgorithmConfigTable)
        .values(serializedConfig)
        .onConflictDoUpdate({
          target: userAlgorithmConfigTable.userId,
          set: {
            algorithmType: serializedConfig.algorithmType,
            learningMode: serializedConfig.learningMode,
            baseIntervalsEasy: serializedConfig.baseIntervalsEasy,
            baseIntervalsNormal: serializedConfig.baseIntervalsNormal,
            baseIntervalsHard: serializedConfig.baseIntervalsHard,
            multiplierEasy: serializedConfig.multiplierEasy,
            multiplierNormal: serializedConfig.multiplierNormal,
            multiplierHard: serializedConfig.multiplierHard,
            maxInterval: serializedConfig.maxInterval,
            minInterval: serializedConfig.minInterval,
            newCardSteps: serializedConfig.newCardSteps,
            lapseSteps: serializedConfig.lapseSteps,
            dailyNewCards: serializedConfig.dailyNewCards,
            dailyReviewCards: serializedConfig.dailyReviewCards,
            updatedAt: serializedConfig.updatedAt
          }
        });

      console.log(`用户 ${userId} 的算法配置已保存`);
    } catch (error) {
      console.error('保存用户算法配置失败:', error);
      throw error;
    }
  }

  /**
   * 更新用户的部分算法配置
   * @param userId 用户ID
   * @param partialConfig 部分配置更新
   */
  async updateUserConfig(userId: number, partialConfig: Partial<SpacedRepetitionConfig>): Promise<void> {
    try {
      const currentConfig = await this.getUserConfig(userId);
      const updatedConfig = { ...currentConfig, ...partialConfig };
      await this.saveUserConfig(userId, updatedConfig);
    } catch (error) {
      console.error('更新用户算法配置失败:', error);
      throw error;
    }
  }

  /**
   * 删除用户的算法配置（恢复默认）
   * @param userId 用户ID
   */
  async deleteUserConfig(userId: number): Promise<void> {
    try {
      await db.delete(userAlgorithmConfigTable)
        .where(eq(userAlgorithmConfigTable.userId, userId));
      
      console.log(`用户 ${userId} 的算法配置已删除，将使用默认配置`);
    } catch (error) {
      console.error('删除用户算法配置失败:', error);
      throw error;
    }
  }

  /**
   * 应用预设配置
   * @param userId 用户ID
   * @param presetName 预设名称
   */
  async applyPresetConfig(userId: number, presetName: keyof typeof PRESET_CONFIGS): Promise<void> {
    try {
      const presetConfig = PRESET_CONFIGS[presetName];
      if (!presetConfig) {
        throw new Error(`预设配置 ${presetName} 不存在`);
      }

      await this.saveUserConfig(userId, presetConfig);
      console.log(`用户 ${userId} 已应用预设配置: ${presetName}`);
    } catch (error) {
      console.error('应用预设配置失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户当前使用的预设名称
   * @param userId 用户ID
   * @returns 预设名称或 null（如果是自定义配置）
   */
  async getUserPresetName(userId: number): Promise<keyof typeof PRESET_CONFIGS | null> {
    try {
      const userConfig = await this.getUserConfig(userId);
      
      // 比较用户配置与各个预设配置
      for (const [presetName, presetConfig] of Object.entries(PRESET_CONFIGS)) {
        if (this.configsEqual(userConfig, presetConfig)) {
          return presetName as keyof typeof PRESET_CONFIGS;
        }
      }
      
      return null; // 自定义配置
    } catch (error) {
      console.error('获取用户预设名称失败:', error);
      return null;
    }
  }

  /**
   * 检查两个配置是否相等
   */
  private configsEqual(config1: SpacedRepetitionConfig, config2: SpacedRepetitionConfig): boolean {
    return JSON.stringify(this.normalizeConfig(config1)) === JSON.stringify(this.normalizeConfig(config2));
  }

  /**
   * 标准化配置对象（用于比较）
   */
  private normalizeConfig(config: SpacedRepetitionConfig): any {
    return {
      algorithmType: config.algorithmType,
      baseIntervals: config.baseIntervals,
      multipliers: config.multipliers,
      maxInterval: config.maxInterval,
      minInterval: config.minInterval,
      newCardSteps: config.newCardSteps,
      lapseSteps: config.lapseSteps,
      dailyNewCards: config.dailyNewCards,
      dailyReviewCards: config.dailyReviewCards
    };
  }

  /**
   * 序列化配置对象为数据库格式
   */
  private serializeConfig(userId: number, config: SpacedRepetitionConfig) {
    const now = new Date().toISOString();
    
    return {
      userId,
      algorithmType: config.algorithmType,
      learningMode: this.getPresetName(config) || 'custom',
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
      createdAt: now,
      updatedAt: now
    };
  }

  /**
   * 反序列化数据库记录为配置对象
   */
  private deserializeConfig(dbRecord: any): SpacedRepetitionConfig {
    try {
      return {
        algorithmType: dbRecord.algorithmType,
        baseIntervals: {
          easy: JSON.parse(dbRecord.baseIntervalsEasy),
          normal: JSON.parse(dbRecord.baseIntervalsNormal),
          hard: JSON.parse(dbRecord.baseIntervalsHard)
        },
        multipliers: {
          easy: dbRecord.multiplierEasy,
          normal: dbRecord.multiplierNormal,
          hard: dbRecord.multiplierHard
        },
        maxInterval: dbRecord.maxInterval,
        minInterval: dbRecord.minInterval,
        newCardSteps: JSON.parse(dbRecord.newCardSteps),
        lapseSteps: JSON.parse(dbRecord.lapseSteps),
        dailyNewCards: dbRecord.dailyNewCards,
        dailyReviewCards: dbRecord.dailyReviewCards
      };
    } catch (error) {
      console.error('反序列化配置失败:', error);
      return DEFAULT_ALGORITHM_CONFIG;
    }
  }

  /**
   * 根据配置获取对应的预设名称
   */
  private getPresetName(config: SpacedRepetitionConfig): keyof typeof PRESET_CONFIGS | null {
    for (const [presetName, presetConfig] of Object.entries(PRESET_CONFIGS)) {
      if (this.configsEqual(config, presetConfig)) {
        return presetName as keyof typeof PRESET_CONFIGS;
      }
    }
    return null;
  }

  /**
   * 验证配置并返回验证结果
   * @param config 要验证的配置
   * @returns 验证结果
   */
  async validateAndSaveConfig(userId: number, config: SpacedRepetitionConfig): Promise<{
    success: boolean;
    errors: string[];
  }> {
    try {
      // 这里可以添加更详细的验证逻辑
      const validation = this.validateConfig(config);
      
      if (!validation.isValid) {
        return {
          success: false,
          errors: validation.errors
        };
      }

      await this.saveUserConfig(userId, config);
      
      return {
        success: true,
        errors: []
      };
    } catch (error) {
      return {
        success: false,
        errors: [`保存配置时发生错误: ${error instanceof Error ? error.message : String(error)}`]
      };
    }
  }

  /**
   * 基础配置验证
   */
  private validateConfig(config: SpacedRepetitionConfig): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 验证算法类型
    if (!['anki', 'supermemo', 'custom'].includes(config.algorithmType)) {
      errors.push('无效的算法类型');
    }

    // 验证基础间隔
    ['easy', 'normal', 'hard'].forEach(difficulty => {
      const intervals = config.baseIntervals[difficulty as keyof typeof config.baseIntervals];
      if (!Array.isArray(intervals) || intervals.length === 0) {
        errors.push(`${difficulty} 难度的基础间隔不能为空`);
      }
      if (intervals.some(interval => interval <= 0)) {
        errors.push(`${difficulty} 难度的间隔必须大于0`);
      }
    });

    // 验证倍增系数
    ['easy', 'normal', 'hard'].forEach(difficulty => {
      const multiplier = config.multipliers[difficulty as keyof typeof config.multipliers];
      if (multiplier <= 1) {
        errors.push(`${difficulty} 难度的倍增系数必须大于1`);
      }
    });

    // 验证间隔范围
    if (config.minInterval <= 0) {
      errors.push('最小间隔必须大于0');
    }
    if (config.maxInterval <= config.minInterval) {
      errors.push('最大间隔必须大于最小间隔');
    }

    // 验证每日限制
    if (config.dailyNewCards <= 0 || config.dailyReviewCards <= 0) {
      errors.push('每日卡片数量必须大于0');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// 导出单例实例
export const algorithmConfigService = new AlgorithmConfigService(); 