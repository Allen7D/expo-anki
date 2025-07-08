import { SpacedRepetitionConfig, StudyResult } from '../types';

/**
 * 间隔重复算法引擎
 * 支持 Anki、SuperMemo SM-2、自定义算法
 */
export class SpacedRepetitionEngine {
  private config: SpacedRepetitionConfig;

  constructor(config: SpacedRepetitionConfig) {
    this.config = config;
  }

  /**
   * 计算下次复习间隔（天数）
   * @param difficulty 难度等级 1=简单, 2=一般, 3=困难
   * @param reviewCount 复习次数
   * @param previousInterval 上次间隔天数
   * @param isCorrect 是否答对
   * @returns 下次复习间隔（天数）
   */
  calculateNextInterval(
    difficulty: 1 | 2 | 3,
    reviewCount: number,
    previousInterval: number,
    isCorrect: boolean
  ): number {
    // 如果答错了，使用遗忘重学间隔
    if (!isCorrect) {
      return this.calculateLapseInterval();
    }

    // 根据算法类型选择计算方法
    switch (this.config.algorithmType) {
      case 'anki':
        return this.calculateAnkiInterval(difficulty, reviewCount, previousInterval);
      case 'supermemo':
        return this.calculateSuperMemoInterval(difficulty, reviewCount, previousInterval);
      case 'custom':
        return this.calculateCustomInterval(difficulty, reviewCount, previousInterval);
      default:
        return this.calculateAnkiInterval(difficulty, reviewCount, previousInterval);
    }
  }

  /**
   * Anki 算法实现
   * 基于预设间隔和倍增系数
   */
  private calculateAnkiInterval(
    difficulty: 1 | 2 | 3,
    reviewCount: number,
    previousInterval: number
  ): number {
    const difficultyKey = difficulty === 1 ? 'easy' : difficulty === 2 ? 'normal' : 'hard';
    const baseIntervals = this.config.baseIntervals[difficultyKey];
    const multiplier = this.config.multipliers[difficultyKey];

    let interval: number;

    if (reviewCount < baseIntervals.length) {
      // 使用预设间隔
      interval = baseIntervals[reviewCount];
    } else {
      // 使用倍增系数计算
      interval = Math.round(previousInterval * multiplier);
    }

    return this.clampInterval(interval);
  }

  /**
   * SuperMemo SM-2 算法实现
   * 基于遗忘曲线和难度因子
   */
  private calculateSuperMemoInterval(
    difficulty: 1 | 2 | 3,
    reviewCount: number,
    previousInterval: number
  ): number {
    // 将难度转换为 SM-2 的质量评分 (0-5)
    // 1=困难->1, 2=一般->3, 3=简单->5
    const quality = difficulty === 1 ? 1 : difficulty === 2 ? 3 : 5;
    
    // 第一次复习
    if (reviewCount === 0) {
      return quality < 3 ? 1 : 1;
    }
    
    // 第二次复习
    if (reviewCount === 1) {
      return quality < 3 ? 1 : 6;
    }

    // 计算 EF (easiness factor) - 难度因子
    let ef = this.calculateEasinessFactor(quality, 2.5); // 默认EF为2.5

    // 计算新间隔
    const interval = Math.round(previousInterval * ef);
    return this.clampInterval(interval);
  }

  /**
   * 计算SM-2算法的难度因子
   */
  private calculateEasinessFactor(quality: number, currentEF: number): number {
    // SM-2 公式：EF' = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
    let newEF = currentEF + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    
    // EF 最小值为 1.3
    return Math.max(1.3, newEF);
  }

  /**
   * 自定义算法实现
   * 用户可完全自定义的算法逻辑
   */
  private calculateCustomInterval(
    difficulty: 1 | 2 | 3,
    reviewCount: number,
    previousInterval: number
  ): number {
    const difficultyKey = difficulty === 1 ? 'easy' : difficulty === 2 ? 'normal' : 'hard';
    const baseIntervals = this.config.baseIntervals[difficultyKey];
    
    if (reviewCount < baseIntervals.length) {
      return baseIntervals[reviewCount];
    }
    
    const multiplier = this.config.multipliers[difficultyKey];
    const interval = Math.round(previousInterval * multiplier);
    return this.clampInterval(interval);
  }

  /**
   * 计算遗忘重学间隔
   * 当用户答错时使用
   */
  private calculateLapseInterval(): number {
    // 使用配置中的第一个遗忘步骤，转换为天数
    const lapseMinutes = this.config.lapseSteps[0];
    return Math.max(this.config.minInterval, lapseMinutes / (24 * 60));
  }

  /**
   * 限制间隔在配置的范围内
   */
  private clampInterval(interval: number): number {
    return Math.min(
      Math.max(interval, this.config.minInterval),
      this.config.maxInterval
    );
  }

  /**
   * 获取新卡片学习步骤
   */
  getNewCardSteps(): number[] {
    return this.config.newCardSteps;
  }

  /**
   * 获取遗忘重学步骤
   */
  getLapseSteps(): number[] {
    return this.config.lapseSteps;
  }

  /**
   * 更新算法配置
   */
  updateConfig(newConfig: Partial<SpacedRepetitionConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * 获取当前配置
   */
  getConfig(): SpacedRepetitionConfig {
    return { ...this.config };
  }

  /**
   * 处理学习结果，计算下次复习时间
   * @param studyResult 学习结果
   * @param currentProgress 当前学习进度
   * @returns 更新后的进度信息
   */
  processStudyResult(
    studyResult: StudyResult,
    currentProgress: { reviewCount: number; correctCount: number; lastInterval?: number }
  ): {
    nextReviewDate: string;
    newInterval: number;
    updatedReviewCount: number;
    updatedCorrectCount: number;
  } {
    const { difficulty, isCorrect } = studyResult;
    const { reviewCount, correctCount, lastInterval = 0 } = currentProgress;

    // 计算下次复习间隔
    const newInterval = this.calculateNextInterval(
      difficulty,
      reviewCount,
      lastInterval,
      isCorrect
    );

    // 计算下次复习时间
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

    // 更新统计数据
    const updatedReviewCount = reviewCount + 1;
    const updatedCorrectCount = isCorrect ? correctCount + 1 : correctCount;

    return {
      nextReviewDate: nextReviewDate.toISOString(),
      newInterval,
      updatedReviewCount,
      updatedCorrectCount
    };
  }

  /**
   * 预测学习效果
   * 根据当前设置预测不同难度选择的间隔效果
   */
  previewIntervals(reviewCount: number, previousInterval: number): {
    easy: number;
    normal: number;
    hard: number;
  } {
    return {
      easy: this.calculateNextInterval(1, reviewCount, previousInterval, true),
      normal: this.calculateNextInterval(2, reviewCount, previousInterval, true),
      hard: this.calculateNextInterval(3, reviewCount, previousInterval, true)
    };
  }

  /**
   * 验证配置是否合理
   */
  validateConfig(config: SpacedRepetitionConfig): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // 检查基础间隔
    Object.entries(config.baseIntervals).forEach(([difficulty, intervals]) => {
      if (!Array.isArray(intervals) || intervals.length === 0) {
        errors.push(`${difficulty} 难度的基础间隔不能为空`);
      }
      if (intervals.some(interval => interval <= 0)) {
        errors.push(`${difficulty} 难度的间隔必须大于0`);
      }
    });

    // 检查倍增系数
    Object.entries(config.multipliers).forEach(([difficulty, multiplier]) => {
      if (multiplier <= 1) {
        errors.push(`${difficulty} 难度的倍增系数必须大于1`);
      }
    });

    // 检查间隔范围
    if (config.minInterval <= 0) {
      errors.push('最小间隔必须大于0');
    }
    if (config.maxInterval <= config.minInterval) {
      errors.push('最大间隔必须大于最小间隔');
    }

    // 检查每日限制
    if (config.dailyNewCards <= 0 || config.dailyReviewCards <= 0) {
      errors.push('每日卡片数量必须大于0');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
} 