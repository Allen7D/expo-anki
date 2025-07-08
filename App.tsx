import { Text, View, TouchableOpacity, StyleSheet } from 'react-native';
import * as SQLite from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { usersTable } from './db/schema';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import migrations from './drizzle/migrations';
import { dataImportService } from './src/services/dataImport';

const expo = SQLite.openDatabaseSync('db.db');

const db = drizzle(expo);

export default function App() {
  const { success, error } = useMigrations(db, migrations);
  const [isDataInitialized, setIsDataInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [dataStats, setDataStats] = useState<any>(null);

  useEffect(() => {
    if (!success) return;

    // 检查数据是否已初始化
    checkDataInitialization();
  }, [success]);

  const checkDataInitialization = async () => {
    const initialized = await dataImportService.isDataInitialized();
    setIsDataInitialized(initialized);
    
    if (initialized) {
      const stats = await dataImportService.getDataStats();
      setDataStats(stats);
    }
  };

  const initializeData = async () => {
    try {
      setIsInitializing(true);
      await dataImportService.initializeData();
      await checkDataInitialization();
    } catch (error) {
      console.error('数据初始化失败:', error);
    } finally {
      setIsInitializing(false);
    }
  };

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>数据库迁移错误: {error.message}</Text>
      </View>
    );
  }

  if (!success) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>数据库迁移中...</Text>
      </View>
    );
  }

  if (!isDataInitialized) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>欢迎使用 Anki 单词闪卡</Text>
        <Text style={styles.subtitle}>首次使用需要初始化数据</Text>
        
        <TouchableOpacity 
          style={[styles.button, isInitializing && styles.buttonDisabled]} 
          onPress={initializeData}
          disabled={isInitializing}
        >
          <Text style={styles.buttonText}>
            {isInitializing ? '初始化中...' : '开始初始化'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Anki 单词闪卡</Text>
      <Text style={styles.subtitle}>数据库已准备就绪</Text>
      
      {dataStats && (
        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>数据统计:</Text>
          <Text style={styles.statsText}>用户: {dataStats.usersCount}</Text>
          <Text style={styles.statsText}>闪卡: {dataStats.flashcardsCount}</Text>
          <Text style={styles.statsText}>学习记录: {dataStats.progressRecordsCount}</Text>
          <Text style={styles.statsText}>算法配置: {dataStats.configsCount}</Text>
        </View>
      )}
      
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>开始学习</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
    color: '#666',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
  },
  statsContainer: {
    marginTop: 20,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 8,
    width: '100%',
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  statsText: {
    fontSize: 14,
    marginBottom: 5,
    color: '#666',
  },
});
