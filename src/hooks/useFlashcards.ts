import { useState, useEffect, useCallback } from 'react';
import * as SQLite from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { eq, and, lte, or, isNull } from 'drizzle-orm';
import { flashcardsTable, userFlashcardProgressTable } from '../../db/schema';
import { Flashcard, UserFlashcardProgress, StudyQueueItem } from '../types';

// 数据库实例
const expo = SQLite.openDatabaseSync('db.db');
const db = drizzle(expo);

/**
 * 闪卡管理 Hook
 * 负责获取待学习/复习的闪卡数据
 */
export const useFlashcards = (userId: number) => {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [studyQueue, setStudyQueue] = useState<StudyQueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 获取所有闪卡
   */
  const fetchAllFlashcards = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const allFlashcards = await db.select()
        .from(flashcardsTable)
        .orderBy(flashcardsTable.id);

      setFlashcards(allFlashcards);
      return allFlashcards;
    } catch (err) {
      const errorMessage = `获取闪卡失败: ${err instanceof Error ? err.message : String(err)}`;
      console.error(errorMessage);
      setError(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 获取今日待学习的新卡片
   */
  const fetchNewCards = useCallback(async (limit: number = 20): Promise<StudyQueueItem[]> => {
    try {
      // 查询没有学习进度记录的卡片（新卡片）
      const newFlashcards = await db.select({
        flashcard: flashcardsTable,
      })
        .from(flashcardsTable)
        .leftJoin(
          userFlashcardProgressTable,
          and(
            eq(userFlashcardProgressTable.flashcardId, flashcardsTable.id),
            eq(userFlashcardProgressTable.userId, userId)
          )
        )
        .where(isNull(userFlashcardProgressTable.id))
        .limit(limit);

      return newFlashcards.map(item => ({
        flashcard: item.flashcard,
        progress: {
          id: 0,
          userId,
          flashcardId: item.flashcard.id,
          difficulty: 2,
          nextReviewDate: new Date().toISOString(),
          reviewCount: 0,
          correctCount: 0,
          lastReviewedAt: null,
          createdAt: new Date().toISOString()
        },
        isNew: true,
        isDue: false
      }));
    } catch (err) {
      console.error('获取新卡片失败:', err);
      return [];
    }
  }, [userId]);

  /**
   * 获取今日待复习的卡片
   */
  const fetchDueCards = useCallback(async (limit: number = 200): Promise<StudyQueueItem[]> => {
    try {
      const today = new Date().toISOString().split('T')[0] + 'T23:59:59.999Z'; // 今天结束时间

      const dueCards = await db.select({
        flashcard: flashcardsTable,
        progress: userFlashcardProgressTable
      })
        .from(userFlashcardProgressTable)
        .innerJoin(
          flashcardsTable,
          eq(flashcardsTable.id, userFlashcardProgressTable.flashcardId)
        )
        .where(
          and(
            eq(userFlashcardProgressTable.userId, userId),
            lte(userFlashcardProgressTable.nextReviewDate, today)
          )
        )
        .orderBy(userFlashcardProgressTable.nextReviewDate)
        .limit(limit);

      return dueCards.map(item => ({
        flashcard: item.flashcard,
        progress: item.progress,
        isNew: false,
        isDue: true
      }));
    } catch (err) {
      console.error('获取到期卡片失败:', err);
      return [];
    }
  }, [userId]);

  /**
   * 获取今日学习队列
   * 按优先级排序：到期复习卡片 > 新卡片
   */
  const fetchTodayStudyQueue = useCallback(async (
    maxNewCards: number = 20,
    maxReviewCards: number = 200
  ): Promise<StudyQueueItem[]> => {
    try {
      setIsLoading(true);
      setError(null);

      // 获取到期的复习卡片
      const dueCards = await fetchDueCards(maxReviewCards);
      
      // 计算剩余名额，获取新卡片
      const remainingSlots = Math.max(0, maxNewCards);
      const newCards = remainingSlots > 0 ? await fetchNewCards(remainingSlots) : [];

      // 合并并排序队列：优先复习到期卡片
      const queue = [...dueCards, ...newCards];
      
      setStudyQueue(queue);
      return queue;
    } catch (err) {
      const errorMessage = `获取学习队列失败: ${err instanceof Error ? err.message : String(err)}`;
      console.error(errorMessage);
      setError(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [fetchDueCards, fetchNewCards]);

  /**
   * 根据ID获取单个闪卡
   */
  const getFlashcardById = useCallback(async (flashcardId: number): Promise<Flashcard | null> => {
    try {
      const result = await db.select()
        .from(flashcardsTable)
        .where(eq(flashcardsTable.id, flashcardId))
        .limit(1);

      return result.length > 0 ? result[0] : null;
    } catch (err) {
      console.error('获取闪卡详情失败:', err);
      return null;
    }
  }, []);

  /**
   * 获取用户的学习进度
   */
  const getUserProgress = useCallback(async (flashcardId: number): Promise<UserFlashcardProgress | null> => {
    try {
      const result = await db.select()
        .from(userFlashcardProgressTable)
        .where(
          and(
            eq(userFlashcardProgressTable.userId, userId),
            eq(userFlashcardProgressTable.flashcardId, flashcardId)
          )
        )
        .limit(1);

      return result.length > 0 ? result[0] : null;
    } catch (err) {
      console.error('获取学习进度失败:', err);
      return null;
    }
  }, [userId]);

  /**
   * 搜索闪卡
   */
  const searchFlashcards = useCallback(async (keyword: string): Promise<Flashcard[]> => {
    if (!keyword.trim()) {
      return flashcards;
    }

    try {
      setIsLoading(true);
      const searchPattern = `%${keyword.toLowerCase()}%`;
      
      // 这里简化处理，实际应该使用 LIKE 查询
      const results = flashcards.filter(card => 
        card.word.toLowerCase().includes(keyword.toLowerCase()) ||
        card.meaning.toLowerCase().includes(keyword.toLowerCase()) ||
        (card.example && card.example.toLowerCase().includes(keyword.toLowerCase()))
      );

      return results;
    } catch (err) {
      console.error('搜索闪卡失败:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [flashcards]);

  /**
   * 获取学习统计
   */
  const getStudyStats = useCallback(async (): Promise<{
    totalCards: number;
    newCards: number;
    dueCards: number;
    masteredCards: number;
    todayReviewed: number;
  }> => {
    try {
      // 总卡片数
      const totalCards = flashcards.length;

      // 新卡片数（没有学习记录的）
      const newCardsResult = await db.select({
        count: flashcardsTable.id
      })
        .from(flashcardsTable)
        .leftJoin(
          userFlashcardProgressTable,
          and(
            eq(userFlashcardProgressTable.flashcardId, flashcardsTable.id),
            eq(userFlashcardProgressTable.userId, userId)
          )
        )
        .where(isNull(userFlashcardProgressTable.id));

      const newCards = newCardsResult.length;

      // 到期卡片数
      const today = new Date().toISOString().split('T')[0] + 'T23:59:59.999Z';
      const dueCardsResult = await db.select()
        .from(userFlashcardProgressTable)
        .where(
          and(
            eq(userFlashcardProgressTable.userId, userId),
            lte(userFlashcardProgressTable.nextReviewDate, today)
          )
        );

      const dueCards = dueCardsResult.length;

      // 已掌握卡片数（复习次数 >= 3 且正确率 >= 80%）
      const allProgressResult = await db.select()
        .from(userFlashcardProgressTable)
        .where(eq(userFlashcardProgressTable.userId, userId));

      const masteredCards = allProgressResult.filter(progress => 
        progress.reviewCount >= 3 && 
        (progress.correctCount / progress.reviewCount) >= 0.8
      ).length;

      // 今日已复习数（简化处理，实际应该查询学习记录表）
      const todayReviewed = 0; // 需要从 studySessionsTable 查询

      return {
        totalCards,
        newCards,
        dueCards,
        masteredCards,
        todayReviewed
      };
    } catch (err) {
      console.error('获取学习统计失败:', err);
      return {
        totalCards: 0,
        newCards: 0,
        dueCards: 0,
        masteredCards: 0,
        todayReviewed: 0
      };
    }
  }, [flashcards.length, userId]);

  /**
   * 刷新数据
   */
  const refresh = useCallback(async () => {
    await fetchAllFlashcards();
  }, [fetchAllFlashcards]);

  // 初始化时加载数据
  useEffect(() => {
    fetchAllFlashcards();
  }, [fetchAllFlashcards]);

  return {
    // 数据状态
    flashcards,
    studyQueue,
    isLoading,
    error,

    // 方法
    fetchAllFlashcards,
    fetchNewCards,
    fetchDueCards,
    fetchTodayStudyQueue,
    getFlashcardById,
    getUserProgress,
    searchFlashcards,
    getStudyStats,
    refresh
  };
}; 