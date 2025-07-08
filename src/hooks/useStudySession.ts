import { useState, useCallback, useEffect } from 'react';
import * as SQLite from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { eq, and } from 'drizzle-orm';
import { userFlashcardProgressTable, studySessionsTable } from '../../db/schema';
import { StudyQueueItem, StudyResult, SpacedRepetitionConfig } from '../types';
import { SpacedRepetitionEngine } from '../services/studyAlgorithm';
import { algorithmConfigService } from '../services/algorithmConfig';

// 数据库实例
const expo = SQLite.openDatabaseSync('db.db');
const db = drizzle(expo);

/**
 * 学习会话管理 Hook
 * 负责学习流程、进度更新和算法应用
 */
export const useStudySession = (userId: number) => {
  // 状态管理
  const [currentSession, setCurrentSession] = useState<{
    queue: StudyQueueItem[];
    currentIndex: number;
    isActive: boolean;
    startTime: Date | null;
    sessionStats: {
      totalCards: number;
      correctAnswers: number;
      totalResponseTime: number;
    };
  }>({
    queue: [],
    currentIndex: 0,
    isActive: false,
    startTime: null,
    sessionStats: {
      totalCards: 0,
      correctAnswers: 0,
      totalResponseTime: 0
    }
  });

  const [algorithmEngine, setAlgorithmEngine] = useState<SpacedRepetitionEngine | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 初始化算法引擎
   */
  const initializeAlgorithmEngine = useCallback(async () => {
    try {
      const config = await algorithmConfigService.getUserConfig(userId);
      const engine = new SpacedRepetitionEngine(config);
      setAlgorithmEngine(engine);
      return engine;
    } catch (err) {
      console.error('初始化算法引擎失败:', err);
      throw err;
    }
  }, [userId]);

  /**
   * 开始学习会话
   */
  const startStudySession = useCallback(async (studyQueue: StudyQueueItem[]) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!algorithmEngine) {
        await initializeAlgorithmEngine();
      }

      setCurrentSession(prev => ({
        ...prev,
        queue: studyQueue,
        currentIndex: 0,
        isActive: true,
        startTime: new Date(),
        sessionStats: {
          totalCards: 0,
          correctAnswers: 0,
          totalResponseTime: 0
        }
      }));

      console.log(`开始学习会话，共 ${studyQueue.length} 张卡片`);
    } catch (err) {
      const errorMessage = `开始学习会话失败: ${err instanceof Error ? err.message : String(err)}`;
      console.error(errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [algorithmEngine, initializeAlgorithmEngine]);

  /**
   * 提交学习结果
   */
  const submitStudyResult = useCallback(async (studyResult: StudyResult): Promise<boolean> => {
    if (!currentSession.isActive || !algorithmEngine) {
      console.error('学习会话未激活或算法引擎未初始化');
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);

      const currentItem = currentSession.queue[currentSession.currentIndex];
      if (!currentItem) {
        console.error('当前学习项不存在');
        return false;
      }

             // 使用算法引擎计算下次复习时间
       const algorithmResult = algorithmEngine.processStudyResult(studyResult, {
         reviewCount: currentItem.progress.reviewCount,
         correctCount: currentItem.progress.correctCount,
         lastInterval: currentItem.isNew ? 0 : calculateDaysBetween(
           currentItem.progress.lastReviewedAt,
           new Date().toISOString()
         )
       });

       // 更新或创建用户学习进度
       await updateUserProgress(
         userId,
         studyResult.flashcardId,
         currentItem.isNew,
         {
           difficulty: studyResult.difficulty,
           nextReviewDate: algorithmResult.nextReviewDate,
           reviewCount: algorithmResult.updatedReviewCount,
           correctCount: algorithmResult.updatedCorrectCount,
           lastReviewedAt: new Date().toISOString()
         }
       );

       // 记录学习会话
       await recordStudySession(userId, studyResult);

      // 更新会话统计
      setCurrentSession(prev => ({
        ...prev,
        sessionStats: {
          totalCards: prev.sessionStats.totalCards + 1,
          correctAnswers: prev.sessionStats.correctAnswers + (studyResult.isCorrect ? 1 : 0),
          totalResponseTime: prev.sessionStats.totalResponseTime + studyResult.responseTime
        }
      }));

      console.log(`学习结果已提交: 卡片 ${studyResult.flashcardId}, 正确: ${studyResult.isCorrect}`);
      return true;
    } catch (err) {
      const errorMessage = `提交学习结果失败: ${err instanceof Error ? err.message : String(err)}`;
      console.error(errorMessage);
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [currentSession, algorithmEngine, userId]);

  /**
   * 移动到下一张卡片
   */
  const moveToNextCard = useCallback(() => {
    setCurrentSession(prev => {
      const nextIndex = prev.currentIndex + 1;
      const isSessionComplete = nextIndex >= prev.queue.length;

      if (isSessionComplete) {
        console.log('学习会话已完成');
        return {
          ...prev,
          currentIndex: nextIndex,
          isActive: false
        };
      }

      return {
        ...prev,
        currentIndex: nextIndex
      };
    });
  }, []);

  /**
   * 结束学习会话
   */
  const endStudySession = useCallback(() => {
    const sessionDuration = currentSession.startTime 
      ? Date.now() - currentSession.startTime.getTime() 
      : 0;

    console.log('学习会话结束', {
      总卡片数: currentSession.sessionStats.totalCards,
      正确数: currentSession.sessionStats.correctAnswers,
      正确率: currentSession.sessionStats.totalCards > 0 
        ? (currentSession.sessionStats.correctAnswers / currentSession.sessionStats.totalCards * 100).toFixed(1) + '%'
        : '0%',
      总时长: Math.round(sessionDuration / 1000) + '秒'
    });

    setCurrentSession(prev => ({
      ...prev,
      isActive: false
    }));
  }, [currentSession]);

  /**
   * 获取当前卡片
   */
  const getCurrentCard = useCallback((): StudyQueueItem | null => {
    const { queue, currentIndex } = currentSession;
    return queue[currentIndex] || null;
  }, [currentSession]);

  /**
   * 获取学习进度
   */
  const getSessionProgress = useCallback(() => {
    const { queue, currentIndex, sessionStats } = currentSession;
    return {
      current: currentIndex + 1,
      total: queue.length,
      completed: sessionStats.totalCards,
      correctAnswers: sessionStats.correctAnswers,
      accuracy: sessionStats.totalCards > 0 
        ? sessionStats.correctAnswers / sessionStats.totalCards 
        : 0,
      averageResponseTime: sessionStats.totalCards > 0 
        ? sessionStats.totalResponseTime / sessionStats.totalCards 
        : 0,
      isComplete: currentIndex >= queue.length
    };
  }, [currentSession]);

  /**
   * 预览不同难度选择的效果
   */
  const previewDifficultyEffects = useCallback((flashcardId: number) => {
    if (!algorithmEngine) return null;

    const currentItem = getCurrentCard();
    if (!currentItem || currentItem.flashcard.id !== flashcardId) return null;

         const lastInterval = currentItem.isNew ? 0 : calculateDaysBetween(
       currentItem.progress.lastReviewedAt,
       new Date().toISOString()
     );

    return algorithmEngine.previewIntervals(
      currentItem.progress.reviewCount,
      lastInterval
    );
  }, [algorithmEngine, getCurrentCard]);

  /**
   * 更新用户学习进度
   */
  const updateUserProgress = async (
    userId: number,
    flashcardId: number,
    isNew: boolean,
    progressData: {
      difficulty: number;
      nextReviewDate: string;
      reviewCount: number;
      correctCount: number;
      lastReviewedAt: string;
    }
  ) => {
    if (isNew) {
      // 创建新的学习进度记录
      await db.insert(userFlashcardProgressTable).values({
        userId,
        flashcardId,
        difficulty: progressData.difficulty,
        nextReviewDate: progressData.nextReviewDate,
        reviewCount: progressData.reviewCount,
        correctCount: progressData.correctCount,
        lastReviewedAt: progressData.lastReviewedAt,
        createdAt: new Date().toISOString()
      });
    } else {
      // 更新现有的学习进度记录
      await db.update(userFlashcardProgressTable)
        .set({
          difficulty: progressData.difficulty,
          nextReviewDate: progressData.nextReviewDate,
          reviewCount: progressData.reviewCount,
          correctCount: progressData.correctCount,
          lastReviewedAt: progressData.lastReviewedAt
        })
        .where(
          and(
            eq(userFlashcardProgressTable.userId, userId),
            eq(userFlashcardProgressTable.flashcardId, flashcardId)
          )
        );
    }
  };

     /**
    * 记录学习会话
    */
   const recordStudySession = async (userId: number, studyResult: StudyResult) => {
     await db.insert(studySessionsTable).values({
       userId,
       flashcardId: studyResult.flashcardId,
       isCorrect: studyResult.isCorrect ? 1 : 0,
       responseTime: studyResult.responseTime,
       studiedAt: new Date().toISOString()
     });
   };

  /**
   * 计算两个日期之间的天数差
   */
  const calculateDaysBetween = (dateStr1: string | null, dateStr2: string): number => {
    if (!dateStr1) return 0;
    
    const date1 = new Date(dateStr1);
    const date2 = new Date(dateStr2);
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  /**
   * 重置会话状态
   */
  const resetSession = useCallback(() => {
    setCurrentSession({
      queue: [],
      currentIndex: 0,
      isActive: false,
      startTime: null,
      sessionStats: {
        totalCards: 0,
        correctAnswers: 0,
        totalResponseTime: 0
      }
    });
    setError(null);
  }, []);

  // 初始化时加载算法引擎
  useEffect(() => {
    initializeAlgorithmEngine().catch(err => {
      console.error('初始化算法引擎失败:', err);
      setError('初始化学习算法失败');
    });
  }, [initializeAlgorithmEngine]);

  return {
    // 状态
    currentSession,
    algorithmEngine,
    isLoading,
    error,

    // 学习流程方法
    startStudySession,
    submitStudyResult,
    moveToNextCard,
    endStudySession,
    resetSession,

    // 查询方法
    getCurrentCard,
    getSessionProgress,
    previewDifficultyEffects,

    // 算法引擎
    initializeAlgorithmEngine
  };
}; 