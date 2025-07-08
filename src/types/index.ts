// 数据库表对应的类型定义
export type User = {
  id: number;
  name: string;
  age: number;
  email: string;
};

export type Flashcard = {
  id: number;
  word: string;
  usphone?: string;
  ukphone?: string;
  meaning: string;
  example?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
};

export type UserFlashcardProgress = {
  id: number;
  userId: number;
  flashcardId: number;
  difficulty: 1 | 2 | 3; // 1-简单，2-一般，3-困难
  nextReviewDate: string;
  reviewCount: number;
  correctCount: number;
  lastReviewedAt?: string;
  createdAt: string;
};

export type StudySession = {
  id: number;
  userId: number;
  flashcardId: number;
  isCorrect: boolean;
  responseTime: number; // 毫秒
  studiedAt: string;
};

export type UserAlgorithmConfig = {
  id: number;
  userId: number;
  algorithmType: 'anki' | 'supermemo' | 'custom';
  learningMode: 'standard' | 'fast' | 'conservative' | 'custom';
  baseIntervalsEasy: string; // JSON格式
  baseIntervalsNormal: string; // JSON格式
  baseIntervalsHard: string; // JSON格式
  multiplierEasy: number;
  multiplierNormal: number;
  multiplierHard: number;
  maxInterval: number;
  minInterval: number;
  newCardSteps: string; // JSON格式
  lapseSteps: string; // JSON格式
  dailyNewCards: number;
  dailyReviewCards: number;
  createdAt: string;
  updatedAt: string;
};

// 间隔重复算法配置接口
export interface SpacedRepetitionConfig {
  algorithmType: 'anki' | 'supermemo' | 'custom';
  baseIntervals: {
    easy: number[];    // 简单难度的间隔天数
    normal: number[];  // 一般难度的间隔天数  
    hard: number[];    // 困难难度的间隔天数
  };
  multipliers: {
    easy: number;      // 简单难度的倍增系数
    normal: number;    // 一般难度的倍增系数
    hard: number;      // 困难难度的倍增系数
  };
  maxInterval: number; // 最大间隔天数
  minInterval: number; // 最小间隔天数
  newCardSteps: number[]; // 新卡片学习步骤（分钟）
  lapseSteps: number[];   // 遗忘卡片重学步骤（分钟）
  dailyNewCards: number;    // 每日新卡片数量
  dailyReviewCards: number; // 每日复习卡片数量
}

// flashcard.json 中的原始数据格式
export interface FlashcardRawData {
  id: number;
  word: string;
  usphone: string;
  ukphone: string;
  meaning: string;
  example: string;
  imageUrl: string;
}

// 默认算法配置
export const DEFAULT_ALGORITHM_CONFIG: SpacedRepetitionConfig = {
  algorithmType: 'anki',
  baseIntervals: {
    easy: [1, 4, 10],
    normal: [1, 2, 6],
    hard: [1, 1, 4]
  },
  multipliers: {
    easy: 2.5,
    normal: 2.0,
    hard: 1.3
  },
  maxInterval: 365,  // 最长一年
  minInterval: 1,    // 最短一天
  newCardSteps: [1, 10, 1440], // 1分钟、10分钟、1天
  lapseSteps: [10, 1440],        // 10分钟、1天
  dailyNewCards: 20,
  dailyReviewCards: 200
}; 