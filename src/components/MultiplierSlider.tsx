import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');

interface MultiplierSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onValueChange: (value: number) => void;
  disabled?: boolean;
  style?: any;
  showValue?: boolean;
  unit?: string;
  color?: string;
  description?: string;
  previewCallback?: (value: number) => string;
}

const SLIDER_WIDTH = screenWidth - 80;
const THUMB_SIZE = 24;
const TRACK_HEIGHT = 4;

/**
 * 倍增系数滑块组件
 * 支持点击调整和精确数值控制
 */
export function MultiplierSlider({
  label,
  value,
  min,
  max,
  step,
  onValueChange,
  disabled = false,
  style,
  showValue = true,
  unit = '',
  color = '#2196f3',
  description,
  previewCallback,
}: MultiplierSliderProps) {
  // 计算当前位置
  const getPositionFromValue = useCallback((val: number): number => {
    return ((val - min) / (max - min)) * SLIDER_WIDTH;
  }, [min, max]);

  // 处理减少
  const handleDecrease = () => {
    if (disabled) return;
    const newValue = Math.max(min, value - step);
    onValueChange(Number(newValue.toFixed(2)));
  };

  // 处理增加
  const handleIncrease = () => {
    if (disabled) return;
    const newValue = Math.min(max, value + step);
    onValueChange(Number(newValue.toFixed(2)));
  };

  // 计算进度百分比
  const progressPercentage = ((value - min) / (max - min)) * 100;

  // 格式化显示值
  const formatValue = (val: number): string => {
    if (step < 0.1) {
      return val.toFixed(2);
    } else if (step < 1) {
      return val.toFixed(1);
    } else {
      return val.toString();
    }
  };

  // 渲染刻度线
  const renderTicks = () => {
    const tickCount = Math.min(5, Math.floor((max - min) / step) + 1);
    const tickStep = (max - min) / (tickCount - 1);
    
    return (
      <View style={styles.ticksContainer}>
        {Array.from({ length: tickCount }, (_, index) => {
          const tickValue = min + index * tickStep;
          const position = getPositionFromValue(tickValue);
          
          return (
            <View
              key={index}
              style={[
                styles.tick,
                {
                  left: position,
                  backgroundColor: disabled ? '#ccc' : '#999',
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  // 渲染数值标签
  const renderLabels = () => {
    return (
      <View style={styles.labelsContainer}>
        <Text style={[styles.labelText, disabled && styles.disabledText]}>
          {formatValue(min)}{unit}
        </Text>
        <Text style={[styles.labelText, disabled && styles.disabledText]}>
          {formatValue(max)}{unit}
        </Text>
      </View>
    );
  };

  // 渲染预览信息
  const renderPreview = () => {
    if (!previewCallback) return null;
    
    const previewText = previewCallback(value);
    
    return (
      <View style={styles.previewContainer}>
        <Text style={[styles.previewText, disabled && styles.disabledText]}>
          {previewText}
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, style]}>
      {/* 标题和当前值 */}
      <View style={styles.header}>
        <Text style={[styles.label, disabled && styles.disabledText]}>
          {label}
        </Text>
        {showValue && (
          <View style={styles.valueContainer}>
            <TouchableOpacity
              style={[styles.controlButton, disabled && styles.disabledButton]}
              onPress={handleDecrease}
              disabled={disabled || value <= min}
            >
              <Ionicons name="remove" size={16} color={disabled ? '#ccc' : color} />
            </TouchableOpacity>
            <Text style={[styles.valueText, { color }, disabled && styles.disabledText]}>
              {formatValue(value)}{unit}
            </Text>
            <TouchableOpacity
              style={[styles.controlButton, disabled && styles.disabledButton]}
              onPress={handleIncrease}
              disabled={disabled || value >= max}
            >
              <Ionicons name="add" size={16} color={disabled ? '#ccc' : color} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* 描述文本 */}
      {description && (
        <Text style={[styles.description, disabled && styles.disabledText]}>
          {description}
        </Text>
      )}

      {/* 滑块容器 */}
      <View style={styles.sliderContainer}>
        {/* 背景轨道 */}
        <View
          style={[
            styles.track,
            {
              backgroundColor: disabled ? '#e0e0e0' : '#e0e0e0',
            },
          ]}
        />

        {/* 进度轨道 */}
        <View
          style={[
            styles.progressTrack,
            {
              backgroundColor: disabled ? '#ccc' : color,
              width: `${progressPercentage}%`,
            },
          ]}
        />

        {/* 刻度线 */}
        {renderTicks()}

        {/* 滑块拇指 */}
        <View
          style={[
            styles.thumb,
            {
              backgroundColor: disabled ? '#ccc' : color,
              borderColor: disabled ? '#999' : '#fff',
              left: `${progressPercentage}%`,
              marginLeft: -THUMB_SIZE / 2,
            },
          ]}
        >
          <View
            style={[
              styles.thumbInner,
              {
                backgroundColor: disabled ? '#999' : '#fff',
              },
            ]}
          />
        </View>
      </View>

      {/* 数值标签 */}
      {renderLabels()}

      {/* 预览信息 */}
      {renderPreview()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  valueText: {
    fontSize: 16,
    fontWeight: 'bold',
    minWidth: 60,
    textAlign: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  description: {
    fontSize: 13,
    color: '#7f8c8d',
    marginBottom: 16,
    lineHeight: 18,
  },
  sliderContainer: {
    height: 40,
    justifyContent: 'center',
    marginHorizontal: THUMB_SIZE / 2,
    position: 'relative',
  },
  track: {
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    position: 'absolute',
    width: SLIDER_WIDTH,
  },
  progressTrack: {
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    position: 'absolute',
  },
  ticksContainer: {
    position: 'absolute',
    width: SLIDER_WIDTH,
    height: TRACK_HEIGHT,
  },
  tick: {
    position: 'absolute',
    width: 2,
    height: 8,
    top: -2,
    borderRadius: 1,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    position: 'absolute',
    top: (40 - THUMB_SIZE) / 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  thumbInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  labelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginHorizontal: THUMB_SIZE / 2,
  },
  labelText: {
    fontSize: 12,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  previewContainer: {
    marginTop: 12,
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    alignItems: 'center',
  },
  previewText: {
    fontSize: 12,
    color: '#6c757d',
    fontStyle: 'italic',
  },
  disabledText: {
    opacity: 0.5,
  },
}); 