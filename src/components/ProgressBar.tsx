import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');

interface ProgressBarProps {
  current: number;
  total: number;
  label?: string;
  showPercentage?: boolean;
  showFraction?: boolean;
  theme?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'small' | 'medium' | 'large';
  animated?: boolean;
  style?: any;
  showIcon?: boolean;
  backgroundColor?: string;
  borderRadius?: number;
}

const themeColors = {
  primary: {
    background: '#e3f2fd',
    fill: '#2196f3',
    text: '#1976d2',
  },
  success: {
    background: '#e8f5e8',
    fill: '#4caf50',
    text: '#2e7d32',
  },
  warning: {
    background: '#fff3e0',
    fill: '#ff9800',
    text: '#f57c00',
  },
  danger: {
    background: '#ffebee',
    fill: '#f44336',
    text: '#d32f2f',
  },
  info: {
    background: '#e0f2f1',
    fill: '#00bcd4',
    text: '#00838f',
  },
};

const sizeConfig = {
  small: {
    height: 6,
    labelSize: 12,
    iconSize: 16,
  },
  medium: {
    height: 8,
    labelSize: 14,
    iconSize: 18,
  },
  large: {
    height: 12,
    labelSize: 16,
    iconSize: 20,
  },
};

/**
 * 动态进度条组件
 * 支持多种主题和尺寸，带有动画效果
 */
export function ProgressBar({
  current,
  total,
  label,
  showPercentage = true,
  showFraction = false,
  theme = 'primary',
  size = 'medium',
  animated = true,
  style,
  showIcon = false,
  backgroundColor,
  borderRadius,
}: ProgressBarProps) {
  const animatedWidth = useRef(new Animated.Value(0)).current;
  const animatedOpacity = useRef(new Animated.Value(0)).current;

  // 计算进度值
  const progress = total > 0 ? Math.min(current / total, 1) : 0;
  const percentage = Math.round(progress * 100);

  // 获取主题配置
  const colors = themeColors[theme];
  const config = sizeConfig[size];

  // 动画效果
  useEffect(() => {
    if (animated) {
      // 进度条动画
      Animated.timing(animatedWidth, {
        toValue: progress,
        duration: 800,
        useNativeDriver: false,
      }).start();

      // 透明度动画
      Animated.timing(animatedOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    } else {
      animatedWidth.setValue(progress);
      animatedOpacity.setValue(1);
    }
  }, [progress, animated, animatedWidth, animatedOpacity]);

  // 获取进度条宽度样式
  const getProgressWidth = () => {
    if (animated) {
      return animatedWidth.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
        extrapolate: 'clamp',
      });
    }
    return `${percentage}%`;
  };

  // 渲染图标
  const renderIcon = () => {
    if (!showIcon) return null;

    let iconName: keyof typeof Ionicons.glyphMap = 'analytics-outline';
    
    if (percentage === 100) {
      iconName = 'checkmark-circle';
    } else if (percentage >= 75) {
      iconName = 'trending-up';
    } else if (percentage >= 50) {
      iconName = 'analytics-outline';
    } else if (percentage >= 25) {
      iconName = 'trending-down';
    } else {
      iconName = 'time-outline';
    }

    return (
      <View style={styles.iconContainer}>
        <Ionicons name={iconName} size={config.iconSize} color={colors.text} />
      </View>
    );
  };

  // 渲染标签和数值
  const renderLabel = () => {
    const hasLabel = label || showPercentage || showFraction;
    if (!hasLabel) return null;

    return (
      <View style={styles.labelContainer}>
        <View style={styles.labelLeft}>
          {renderIcon()}
          {label && (
            <Text style={[styles.label, { fontSize: config.labelSize, color: colors.text }]}>
              {label}
            </Text>
          )}
        </View>
        
        <View style={styles.labelRight}>
          {showFraction && (
            <Text style={[styles.fractionText, { fontSize: config.labelSize, color: colors.text }]}>
              {current}/{total}
            </Text>
          )}
          {showPercentage && (
            <Text style={[styles.percentageText, { fontSize: config.labelSize, color: colors.text }]}>
              {percentage}%
            </Text>
          )}
        </View>
      </View>
    );
  };

  // 渲染进度指示点
  const renderProgressDots = () => {
    if (total <= 1 || total > 20) return null; // 只在合适的范围内显示点

    return (
      <View style={styles.dotsContainer}>
        {Array.from({ length: total }, (_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor: index < current ? colors.fill : colors.background,
                borderColor: colors.fill,
              },
            ]}
          />
        ))}
      </View>
    );
  };

  const progressBarStyle = [
    styles.progressBar,
    {
      height: config.height,
      backgroundColor: backgroundColor || colors.background,
      borderRadius: borderRadius !== undefined ? borderRadius : config.height / 2,
    },
  ];

  return (
    <Animated.View style={[styles.container, style, { opacity: animatedOpacity }]}>
      {renderLabel()}
      
      <View style={progressBarStyle}>
        <View 
          style={[
            styles.progressFill,
            {
              backgroundColor: colors.fill,
              borderRadius: borderRadius !== undefined ? borderRadius : config.height / 2,
              width: `${percentage}%`
            }
          ]}
        />
        
        {/* 进度条上的小点装饰 */}
        {progress > 0 && progress < 1 && (
          <View
            style={[
              styles.progressIndicator,
              {
                left: `${percentage}%`,
                backgroundColor: colors.fill,
                transform: [{ translateX: -4 }],
              },
            ]}
          />
        )}
      </View>

      {/* 离散进度点 */}
      {renderProgressDots()}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  labelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  labelRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 6,
  },
  label: {
    fontWeight: '600',
  },
  fractionText: {
    fontWeight: '500',
    marginRight: 8,
  },
  percentageText: {
    fontWeight: '600',
    minWidth: 35,
    textAlign: 'right',
  },
  progressBar: {
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  progressFill: {
    height: '100%',
    minWidth: 2, // 确保即使很小的进度也能看到
  },
  progressIndicator: {
    position: 'absolute',
    top: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
  },
});

// 导出一些预设的进度条样式
export const ProgressBarPresets = {
  // 学习进度条
  StudyProgress: (props: Partial<ProgressBarProps> & { current: number; total: number }) => (
    <ProgressBar
      theme="primary"
      size="medium"
      showIcon
      showPercentage
      showFraction
      {...props}
    />
  ),

  // 完成度进度条
  CompletionProgress: (props: Partial<ProgressBarProps> & { current: number; total: number }) => (
    <ProgressBar
      theme="success"
      size="large"
      showIcon
      showPercentage
      {...props}
    />
  ),

  // 简单进度条
  SimpleProgress: (props: Partial<ProgressBarProps> & { current: number; total: number }) => (
    <ProgressBar
      theme="info"
      size="small"
      showPercentage={false}
      showIcon={false}
      {...props}
    />
  ),

  // 警告进度条
  WarningProgress: (props: Partial<ProgressBarProps> & { current: number; total: number }) => (
    <ProgressBar
      theme="warning"
      size="medium"
      showIcon
      showPercentage
      {...props}
    />
  ),
}; 