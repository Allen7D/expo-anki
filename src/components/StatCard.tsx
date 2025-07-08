import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  theme?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size?: 'small' | 'medium' | 'large';
  style?: any;
  onPress?: () => void;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value: string;
  };
  showProgress?: boolean;
  progressValue?: number;
  isLoading?: boolean;
}

const themeColors = {
  primary: {
    background: '#f8f9ff',
    border: '#e3f2fd',
    icon: '#2196f3',
    text: '#1976d2',
    value: '#0d47a1',
  },
  success: {
    background: '#f1f8e9',
    border: '#e8f5e8',
    icon: '#4caf50',
    text: '#2e7d32',
    value: '#1b5e20',
  },
  warning: {
    background: '#fffbf0',
    border: '#fff3e0',
    icon: '#ff9800',
    text: '#f57c00',
    value: '#e65100',
  },
  danger: {
    background: '#fef5f5',
    border: '#ffebee',
    icon: '#f44336',
    text: '#d32f2f',
    value: '#b71c1c',
  },
  info: {
    background: '#f0fdff',
    border: '#e0f2f1',
    icon: '#00bcd4',
    text: '#00838f',
    value: '#006064',
  },
  neutral: {
    background: '#f8f9fa',
    border: '#e9ecef',
    icon: '#6c757d',
    text: '#495057',
    value: '#212529',
  },
};

const sizeConfig = {
  small: {
    padding: 12,
    titleSize: 12,
    valueSize: 18,
    subtitleSize: 10,
    iconSize: 20,
    minHeight: 80,
  },
  medium: {
    padding: 16,
    titleSize: 14,
    valueSize: 24,
    subtitleSize: 12,
    iconSize: 24,
    minHeight: 100,
  },
  large: {
    padding: 20,
    titleSize: 16,
    valueSize: 32,
    subtitleSize: 14,
    iconSize: 28,
    minHeight: 120,
  },
};

/**
 * 统计卡片组件
 * 用于显示数值统计和趋势信息
 */
export function StatCard({
  title,
  value,
  subtitle,
  icon,
  iconColor,
  theme = 'neutral',
  size = 'medium',
  style,
  onPress,
  trend,
  showProgress = false,
  progressValue = 0,
  isLoading = false,
}: StatCardProps) {
  const colors = themeColors[theme];
  const config = sizeConfig[size];

  // 格式化数值显示
  const formatValue = (val: string | number): string => {
    if (typeof val === 'number') {
      if (val >= 1000000) {
        return `${(val / 1000000).toFixed(1)}M`;
      }
      if (val >= 1000) {
        return `${(val / 1000).toFixed(1)}K`;
      }
      return val.toString();
    }
    return val;
  };

  // 渲染图标
  const renderIcon = () => {
    if (!icon) return null;

    return (
      <View style={styles.iconContainer}>
        <Ionicons
          name={icon}
          size={config.iconSize}
          color={iconColor || colors.icon}
        />
      </View>
    );
  };

  // 渲染趋势指示器
  const renderTrend = () => {
    if (!trend) return null;

    const trendIconName = trend.direction === 'up' ? 'trending-up' : 
                         trend.direction === 'down' ? 'trending-down' : 
                         'remove-outline';
    
    const trendColor = trend.direction === 'up' ? '#4caf50' : 
                      trend.direction === 'down' ? '#f44336' : 
                      '#9e9e9e';

    return (
      <View style={styles.trendContainer}>
        <Ionicons name={trendIconName} size={12} color={trendColor} />
        <Text style={[styles.trendText, { color: trendColor }]}>
          {trend.value}
        </Text>
      </View>
    );
  };

  // 渲染进度条
  const renderProgress = () => {
    if (!showProgress) return null;

    const progress = Math.min(Math.max(progressValue, 0), 100);

    return (
      <View style={styles.progressContainer}>
        <View style={[styles.progressBackground, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: colors.icon,
                width: `${progress}%`,
              },
            ]}
          />
        </View>
        <Text style={[styles.progressText, { color: colors.text }]}>
          {progress}%
        </Text>
      </View>
    );
  };

  // 渲染加载状态
  const renderLoadingState = () => {
    if (!isLoading) return null;

    return (
      <View style={styles.loadingOverlay}>
        <View style={[styles.loadingShimmer, { backgroundColor: colors.border }]} />
      </View>
    );
  };

  const cardStyle = [
    styles.card,
    {
      backgroundColor: colors.background,
      borderColor: colors.border,
      padding: config.padding,
      minHeight: config.minHeight,
    },
    style,
  ];

  const CardComponent = onPress ? TouchableOpacity : View;

  return (
    <CardComponent
      style={cardStyle}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      accessibilityRole={onPress ? "button" : "text"}
      accessibilityLabel={`${title}: ${value}`}
      accessibilityHint={subtitle}
    >
      {renderLoadingState()}
      
      {/* 头部区域 */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {renderIcon()}
          <Text
            style={[
              styles.title,
              {
                fontSize: config.titleSize,
                color: colors.text,
              },
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
        </View>
        {renderTrend()}
      </View>

      {/* 数值区域 */}
      <View style={styles.valueContainer}>
        <Text
          style={[
            styles.value,
            {
              fontSize: config.valueSize,
              color: colors.value,
            },
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {formatValue(value)}
        </Text>
      </View>

      {/* 副标题 */}
      {subtitle && (
        <Text
          style={[
            styles.subtitle,
            {
              fontSize: config.subtitleSize,
              color: colors.text,
            },
          ]}
          numberOfLines={2}
        >
          {subtitle}
        </Text>
      )}

      {/* 进度条 */}
      {renderProgress()}
    </CardComponent>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    marginRight: 8,
  },
  title: {
    fontWeight: '600',
    flex: 1,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 2,
  },
  valueContainer: {
    marginVertical: 4,
  },
  value: {
    fontWeight: 'bold',
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 4,
    opacity: 0.8,
    lineHeight: 16,
  },
  progressContainer: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBackground: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    fontWeight: '600',
    minWidth: 30,
    textAlign: 'right',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
    overflow: 'hidden',
  },
  loadingShimmer: {
    flex: 1,
    opacity: 0.6,
  },
});

// 预设的统计卡片样式
export const StatCardPresets = {
  // 学习统计卡片
  StudyStats: (props: Partial<StatCardProps> & { title: string; value: string | number }) => (
    <StatCard
      theme="primary"
      size="medium"
      icon="book-outline"
      {...props}
    />
  ),

  // 进度统计卡片
  ProgressStats: (props: Partial<StatCardProps> & { title: string; value: string | number }) => (
    <StatCard
      theme="success"
      size="medium"
      icon="checkmark-circle-outline"
      showProgress
      {...props}
    />
  ),

  // 时间统计卡片
  TimeStats: (props: Partial<StatCardProps> & { title: string; value: string | number }) => (
    <StatCard
      theme="info"
      size="medium"
      icon="time-outline"
      {...props}
    />
  ),

  // 准确率统计卡片
  AccuracyStats: (props: Partial<StatCardProps> & { title: string; value: string | number }) => (
    <StatCard
      theme="warning"
      size="medium"
      icon="analytics-outline"
      showProgress
      {...props}
    />
  ),

  // 简单统计卡片
  SimpleStats: (props: Partial<StatCardProps> & { title: string; value: string | number }) => (
    <StatCard
      theme="neutral"
      size="small"
      {...props}
    />
  ),
}; 