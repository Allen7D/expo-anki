import { PRESET_CONFIGS, SpacedRepetitionConfig } from '../types';

/**
 * 预设配置的元信息
 */
export interface PresetMetadata {
  name: keyof typeof PRESET_CONFIGS;
  displayName: string;
  description: string;
  characteristics: {
    speed: '快速' | '标准' | '保守';
    retention: '一般' | '较好' | '很好';
    workload: '轻松' | '适中' | '密集';
  };
  recommendedFor: string[];
  maxInterval: number;
  dailyNewCards: number;
}

/**
 * 预设配置管理器
 * 提供预设配置的查询、比较和应用功能
 */
export class PresetManager {
  
  /**
   * 获取所有预设配置的元信息
   */
  getPresetMetadata(): PresetMetadata[] {
    return [
      {
        name: 'standard',
        displayName: '标准模式',
        description: '适合大多数用户的平衡配置，在学习效率和记忆保持之间取得良好平衡。',
        characteristics: {
          speed: '标准',
          retention: '较好',
          workload: '适中'
        },
        recommendedFor: [
          '刚开始使用间隔重复的用户',
          '希望平衡学习效率和记忆保持的用户',
          '每天有适中时间投入学习的用户'
        ],
        maxInterval: 365,
        dailyNewCards: 20
      },
      {
        name: 'fast',
        displayName: '快速模式',
        description: '加速学习进度，适合需要快速掌握大量内容的用户。间隔增长更快，但可能需要更多复习。',
        characteristics: {
          speed: '快速',
          retention: '一般',
          workload: '密集'
        },
        recommendedFor: [
          '需要快速掌握大量内容的用户',
          '有足够时间投入密集学习的用户',
          '对遗忘容忍度较高的用户'
        ],
        maxInterval: 180,
        dailyNewCards: 30
      },
      {
        name: 'conservative',
        displayName: '保守模式',
        description: '注重长期记忆保持，间隔增长较慢，确保更好的记忆巩固。适合重要内容的学习。',
        characteristics: {
          speed: '保守',
          retention: '很好',
          workload: '轻松'
        },
        recommendedFor: [
          '重视长期记忆保持的用户',
          '学习重要或复杂内容的用户',
          '每天学习时间有限的用户',
          '对遗忘敏感的用户'
        ],
        maxInterval: 730,
        dailyNewCards: 10
      },
      {
        name: 'custom',
        displayName: '自定义模式',
        description: '完全自定义的配置，可以根据个人需求精确调整各项参数。',
        characteristics: {
          speed: '标准',
          retention: '较好',
          workload: '适中'
        },
        recommendedFor: [
          '有经验的用户',
          '有特殊学习需求的用户',
          '希望精确控制学习参数的用户'
        ],
        maxInterval: 365,
        dailyNewCards: 20
      }
    ];
  }

  /**
   * 根据名称获取预设配置
   */
  getPresetConfig(name: keyof typeof PRESET_CONFIGS): SpacedRepetitionConfig {
    const config = PRESET_CONFIGS[name];
    if (!config) {
      throw new Error(`预设配置 "${name}" 不存在`);
    }
    return { ...config }; // 返回深拷贝避免修改原始配置
  }

  /**
   * 获取预设配置的元信息
   */
  getPresetInfo(name: keyof typeof PRESET_CONFIGS): PresetMetadata {
    const metadata = this.getPresetMetadata().find(meta => meta.name === name);
    if (!metadata) {
      throw new Error(`预设配置 "${name}" 的元信息不存在`);
    }
    return metadata;
  }

  /**
   * 比较两个配置的差异
   */
  compareConfigs(config1: SpacedRepetitionConfig, config2: SpacedRepetitionConfig): {
    differences: Array<{
      field: string;
      value1: any;
      value2: any;
      impact: '轻微' | '中等' | '重大';
    }>;
    overallImpact: '轻微' | '中等' | '重大';
  } {
    const differences: Array<{
      field: string;
      value1: any;
      value2: any;
      impact: '轻微' | '中等' | '重大';
    }> = [];

    // 比较算法类型
    if (config1.algorithmType !== config2.algorithmType) {
      differences.push({
        field: '算法类型',
        value1: config1.algorithmType,
        value2: config2.algorithmType,
        impact: '重大'
      });
    }

    // 比较基础间隔
    ['easy', 'normal', 'hard'].forEach(difficulty => {
      const intervals1 = config1.baseIntervals[difficulty as keyof typeof config1.baseIntervals];
      const intervals2 = config2.baseIntervals[difficulty as keyof typeof config2.baseIntervals];
      
      if (JSON.stringify(intervals1) !== JSON.stringify(intervals2)) {
        differences.push({
          field: `${difficulty}难度基础间隔`,
          value1: intervals1,
          value2: intervals2,
          impact: this.assessIntervalImpact(intervals1, intervals2)
        });
      }
    });

    // 比较倍增系数
    ['easy', 'normal', 'hard'].forEach(difficulty => {
      const mult1 = config1.multipliers[difficulty as keyof typeof config1.multipliers];
      const mult2 = config2.multipliers[difficulty as keyof typeof config2.multipliers];
      
      if (mult1 !== mult2) {
        differences.push({
          field: `${difficulty}难度倍增系数`,
          value1: mult1,
          value2: mult2,
          impact: this.assessMultiplierImpact(mult1, mult2)
        });
      }
    });

    // 比较间隔范围
    if (config1.maxInterval !== config2.maxInterval) {
      differences.push({
        field: '最大间隔',
        value1: config1.maxInterval,
        value2: config2.maxInterval,
        impact: Math.abs(config1.maxInterval - config2.maxInterval) > 180 ? '重大' : '中等'
      });
    }

    if (config1.minInterval !== config2.minInterval) {
      differences.push({
        field: '最小间隔',
        value1: config1.minInterval,
        value2: config2.minInterval,
        impact: '轻微'
      });
    }

    // 比较每日限制
    if (config1.dailyNewCards !== config2.dailyNewCards) {
      differences.push({
        field: '每日新卡片',
        value1: config1.dailyNewCards,
        value2: config2.dailyNewCards,
        impact: Math.abs(config1.dailyNewCards - config2.dailyNewCards) > 10 ? '中等' : '轻微'
      });
    }

    if (config1.dailyReviewCards !== config2.dailyReviewCards) {
      differences.push({
        field: '每日复习卡片',
        value1: config1.dailyReviewCards,
        value2: config2.dailyReviewCards,
        impact: Math.abs(config1.dailyReviewCards - config2.dailyReviewCards) > 50 ? '中等' : '轻微'
      });
    }

    // 评估整体影响
    const overallImpact = this.assessOverallImpact(differences);

    return { differences, overallImpact };
  }

  /**
   * 根据用户学习习惯推荐预设配置
   */
  recommendPreset(userProfile: {
    studyTimePerDay: number; // 分钟
    experienceLevel: 'beginner' | 'intermediate' | 'advanced';
    retentionPreference: 'speed' | 'balance' | 'retention';
    contentDifficulty: 'easy' | 'medium' | 'hard';
  }): {
    recommended: keyof typeof PRESET_CONFIGS;
    reason: string;
    alternatives: Array<{
      name: keyof typeof PRESET_CONFIGS;
      reason: string;
    }>;
  } {
    const { studyTimePerDay, experienceLevel, retentionPreference, contentDifficulty } = userProfile;

    // 基于用户偏好的推荐逻辑
    if (retentionPreference === 'speed' && studyTimePerDay > 30) {
      return {
        recommended: 'fast',
        reason: '您偏好快速学习且有充足的学习时间，快速模式能帮您更快掌握内容。',
        alternatives: [
          { name: 'standard', reason: '如果觉得快速模式太密集，可以尝试标准模式' }
        ]
      };
    }

    if (retentionPreference === 'retention' || contentDifficulty === 'hard') {
      return {
        recommended: 'conservative',
        reason: '您重视长期记忆保持或内容较难，保守模式能提供更好的记忆巩固。',
        alternatives: [
          { name: 'standard', reason: '如果觉得进度太慢，可以尝试标准模式' }
        ]
      };
    }

    if (experienceLevel === 'advanced') {
      return {
        recommended: 'custom',
        reason: '您是有经验的用户，建议使用自定义模式来精确控制学习参数。',
        alternatives: [
          { name: 'standard', reason: '如果不想花时间调整参数，标准模式是很好的选择' }
        ]
      };
    }

    // 默认推荐标准模式
    return {
      recommended: 'standard',
      reason: '标准模式适合大多数用户，在学习效率和记忆保持之间取得良好平衡。',
      alternatives: [
        { name: 'fast', reason: '如果想加快学习进度，可以尝试快速模式' },
        { name: 'conservative', reason: '如果更重视记忆保持，可以尝试保守模式' }
      ]
    };
  }

  /**
   * 生成配置预览信息
   */
  generateConfigPreview(config: SpacedRepetitionConfig): {
    summary: string;
    keyFeatures: string[];
    estimatedWorkload: {
      newCardsPerDay: number;
      reviewCardsPerDay: number;
      timePerDayMinutes: number;
    };
    intervalExamples: {
      easy: number[];
      normal: number[];
      hard: number[];
    };
  } {
    const presetName = this.identifyPreset(config);
    const metadata = presetName ? this.getPresetInfo(presetName) : null;

    return {
      summary: metadata ? metadata.description : '自定义配置',
      keyFeatures: [
        `算法类型: ${config.algorithmType}`,
        `最大间隔: ${config.maxInterval} 天`,
        `每日新卡片: ${config.dailyNewCards} 张`,
        `每日复习: ${config.dailyReviewCards} 张`
      ],
      estimatedWorkload: {
        newCardsPerDay: config.dailyNewCards,
        reviewCardsPerDay: config.dailyReviewCards,
        timePerDayMinutes: Math.round((config.dailyNewCards * 0.5 + config.dailyReviewCards * 0.3))
      },
      intervalExamples: {
        easy: config.baseIntervals.easy.slice(0, 3),
        normal: config.baseIntervals.normal.slice(0, 3),
        hard: config.baseIntervals.hard.slice(0, 3)
      }
    };
  }

  /**
   * 识别配置对应的预设名称
   */
  private identifyPreset(config: SpacedRepetitionConfig): keyof typeof PRESET_CONFIGS | null {
    for (const [presetName, presetConfig] of Object.entries(PRESET_CONFIGS)) {
      if (JSON.stringify(this.normalizeConfig(config)) === JSON.stringify(this.normalizeConfig(presetConfig))) {
        return presetName as keyof typeof PRESET_CONFIGS;
      }
    }
    return null;
  }

  /**
   * 标准化配置用于比较
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
   * 评估间隔变化的影响
   */
  private assessIntervalImpact(intervals1: number[], intervals2: number[]): '轻微' | '中等' | '重大' {
    const avgChange = intervals1.reduce((sum, val, idx) => {
      return sum + Math.abs(val - (intervals2[idx] || 0));
    }, 0) / intervals1.length;

    if (avgChange > 5) return '重大';
    if (avgChange > 2) return '中等';
    return '轻微';
  }

  /**
   * 评估倍增系数变化的影响
   */
  private assessMultiplierImpact(mult1: number, mult2: number): '轻微' | '中等' | '重大' {
    const change = Math.abs(mult1 - mult2);
    if (change > 0.5) return '重大';
    if (change > 0.2) return '中等';
    return '轻微';
  }

  /**
   * 评估整体影响
   */
  private assessOverallImpact(differences: Array<{ impact: '轻微' | '中等' | '重大' }>): '轻微' | '中等' | '重大' {
    const hasHeavy = differences.some(d => d.impact === '重大');
    const hasMedium = differences.some(d => d.impact === '中等');
    
    if (hasHeavy || differences.filter(d => d.impact === '中等').length > 2) {
      return '重大';
    }
    if (hasMedium || differences.length > 3) {
      return '中等';
    }
    return '轻微';
  }
}

// 导出单例实例
export const presetManager = new PresetManager(); 