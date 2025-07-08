import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Vibration,
  Platform,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');

type DifficultyLevel = 1 | 2 | 3; // 1=简单, 2=一般, 3=困难

interface DifficultySelectorProps {
  onSelect: (difficulty: DifficultyLevel) => void;
  disabled?: boolean;
  style?: any;
  showPreview?: boolean;
  previewData?: {
    easy: number;
    normal: number;
    hard: number;
  } | null;
  selectedDifficulty?: DifficultyLevel | null;
}

interface DifficultyOption {
  level: DifficultyLevel;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  description: string;
  keyboardShortcut: string;
}

const difficultyOptions: DifficultyOption[] = [
  {
    level: 1,
    label: '简单',
    icon: 'happy-outline',
    color: '#27ae60',
    description: '很容易记住',
    keyboardShortcut: '1',
  },
  {
    level: 2,
    label: '一般',
    icon: 'remove-outline',
    color: '#f39c12',
    description: '需要思考一下',
    keyboardShortcut: '2',
  },
  {
    level: 3,
    label: '困难',
    icon: 'sad-outline',
    color: '#e74c3c',
    description: '比较难记住',
    keyboardShortcut: '3',
  },
];

/**
 * 难度选择器组件
 * 用于用户选择单词学习的难度等级
 */
export function DifficultySelector({
  onSelect,
  disabled = false,
  style,
  showPreview = false,
  previewData,
  selectedDifficulty = null,
}: DifficultySelectorProps) {
  const [pressedButton, setPressedButton] = useState<DifficultyLevel | null>(null);
  const [buttonAnimations] = useState(() => ({
    1: new Animated.Value(1),
    2: new Animated.Value(1),
    3: new Animated.Value(1),
  }));

  // 处理按钮按下
  const handlePressIn = (level: DifficultyLevel) => {
    setPressedButton(level);
    Animated.spring(buttonAnimations[level], {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  // 处理按钮释放
  const handlePressOut = (level: DifficultyLevel) => {
    setPressedButton(null);
    Animated.spring(buttonAnimations[level], {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  // 处理难度选择
  const handleSelect = (level: DifficultyLevel) => {
    if (disabled) return;

    // 触觉反馈
    if (Platform.OS === 'ios') {
      Vibration.vibrate([10]);
    }

    onSelect(level);
  };

  // 渲染预览信息
  const renderPreview = (option: DifficultyOption) => {
    if (!showPreview || !previewData) return null;

    const days = option.level === 1 
      ? previewData.easy 
      : option.level === 2 
      ? previewData.normal 
      : previewData.hard;

    return (
      <Text style={styles.previewText}>
        {days}天后复习
      </Text>
    );
  };

  // 渲染单个难度按钮
  const renderDifficultyButton = (option: DifficultyOption) => {
    const isSelected = selectedDifficulty === option.level;
    const isPressed = pressedButton === option.level;
    
    const buttonStyle = [
      styles.difficultyButton,
      { borderColor: option.color },
      isSelected && { backgroundColor: option.color },
      disabled && styles.disabledButton,
    ];

    const textStyle = [
      styles.buttonText,
      { color: isSelected ? '#fff' : option.color },
      disabled && styles.disabledText,
    ];

    const iconColor = isSelected ? '#fff' : option.color;

    return (
      <Animated.View
        key={option.level}
        style={{
          transform: [{ scale: buttonAnimations[option.level] }],
        }}
      >
        <TouchableOpacity
          style={buttonStyle}
          onPress={() => handleSelect(option.level)}
          onPressIn={() => handlePressIn(option.level)}
          onPressOut={() => handlePressOut(option.level)}
          disabled={disabled}
          activeOpacity={0.8}
          accessibilityLabel={`${option.label} - ${option.description}`}
          accessibilityHint={`选择${option.label}难度`}
          accessibilityRole="button"
          accessibilityState={{ selected: isSelected }}
        >
          {/* 图标 */}
          <View style={styles.iconContainer}>
            <Ionicons 
              name={option.icon} 
              size={24} 
              color={disabled ? '#bdc3c7' : iconColor} 
            />
          </View>

          {/* 标签 */}
          <Text style={textStyle}>{option.label}</Text>

          {/* 描述 */}
          <Text style={[styles.descriptionText, disabled && styles.disabledText]}>
            {option.description}
          </Text>

          {/* 键盘快捷键提示 */}
          <View style={styles.shortcutContainer}>
            <Text style={[styles.shortcutText, disabled && styles.disabledText]}>
              {option.keyboardShortcut}
            </Text>
          </View>

          {/* 预览信息 */}
          {renderPreview(option)}

          {/* 选中指示器 */}
          {isSelected && (
            <View style={styles.selectedIndicator}>
              <Ionicons name="checkmark" size={16} color="#fff" />
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, style]}>
      {/* 标题 */}
      <View style={styles.headerContainer}>
        <Text style={styles.title}>记忆难度</Text>
        <Text style={styles.subtitle}>
          根据记忆情况选择难度，影响下次复习间隔
        </Text>
      </View>

      {/* 难度按钮组 */}
      <View style={styles.buttonsContainer}>
        {difficultyOptions.map(renderDifficultyButton)}
      </View>

      {/* 键盘快捷键说明 */}
      <View style={styles.hintContainer}>
        <Ionicons name="information-circle-outline" size={16} color="#7f8c8d" />
        <Text style={styles.hintText}>
          按数字键 1、2、3 快速选择
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 25,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 20,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    marginBottom: 20,
  },
  difficultyButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 12,
    marginHorizontal: 6,
    borderRadius: 16,
    borderWidth: 2,
    backgroundColor: '#fff',
    minHeight: 140,
    justifyContent: 'space-between',
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
  disabledButton: {
    opacity: 0.5,
    backgroundColor: '#f8f9fa',
  },
  iconContainer: {
    marginBottom: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 16,
  },
  disabledText: {
    color: '#bdc3c7',
  },
  shortcutContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shortcutText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7f8c8d',
  },
  previewText: {
    fontSize: 11,
    color: '#95a5a6',
    fontWeight: '500',
    marginTop: 6,
    textAlign: 'center',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  hintText: {
    fontSize: 12,
    color: '#7f8c8d',
    marginLeft: 6,
  },
}); 