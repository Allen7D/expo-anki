import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface IntervalEditorProps {
  label: string;
  intervals: number[];
  onIntervalsChange: (intervals: number[]) => void;
  disabled?: boolean;
  style?: any;
  maxValues?: number[];
  minValues?: number[];
  unit?: string;
  description?: string;
  maxItems?: number;
  color?: string;
}

/**
 * 间隔编辑器组件
 * 用于编辑和管理学习间隔数组
 */
export function IntervalEditor({
  label,
  intervals,
  onIntervalsChange,
  disabled = false,
  style,
  maxValues,
  minValues,
  unit = '天',
  description,
  maxItems = 10,
  color = '#2196f3',
}: IntervalEditorProps) {
  const [inputValues, setInputValues] = useState<string[]>(
    intervals.map(val => val.toString())
  );
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newItemValue, setNewItemValue] = useState('');

  // 同步外部数据变化
  React.useEffect(() => {
    setInputValues(intervals.map(val => val.toString()));
  }, [intervals]);

  // 验证数值
  const validateValue = (value: string, index: number): number | null => {
    const numValue = parseFloat(value);
    
    if (isNaN(numValue) || numValue < 0) {
      return null;
    }

    // 检查最小值限制
    if (minValues && minValues[index] !== undefined && numValue < minValues[index]) {
      return minValues[index];
    }

    // 检查最大值限制
    if (maxValues && maxValues[index] !== undefined && numValue > maxValues[index]) {
      return maxValues[index];
    }

    return numValue;
  };

  // 更新单个间隔值
  const updateInterval = (index: number, value: string) => {
    const validatedValue = validateValue(value, index);
    
    if (validatedValue !== null) {
      const newIntervals = [...intervals];
      newIntervals[index] = validatedValue;
      onIntervalsChange(newIntervals);
    }
    
    setEditingIndex(null);
  };

  // 添加新间隔
  const addInterval = () => {
    if (intervals.length >= maxItems) return;
    
    const value = parseFloat(newItemValue);
    if (isNaN(value) || value < 0) return;
    
    const newIntervals = [...intervals, value];
    onIntervalsChange(newIntervals);
    setNewItemValue('');
  };

  // 删除间隔
  const removeInterval = (index: number) => {
    if (intervals.length <= 1) return; // 至少保留一个间隔
    
    const newIntervals = intervals.filter((_, i) => i !== index);
    onIntervalsChange(newIntervals);
  };

  // 处理输入框变化
  const handleInputChange = (index: number, value: string) => {
    const newInputValues = [...inputValues];
    newInputValues[index] = value;
    setInputValues(newInputValues);
  };

  // 处理输入框失焦
  const handleInputBlur = (index: number) => {
    const value = inputValues[index];
    updateInterval(index, value);
  };

  // 渲染单个间隔项
  const renderIntervalItem = (value: number, index: number) => {
    const isEditing = editingIndex === index;
    const isInvalid = inputValues[index] && isNaN(parseFloat(inputValues[index]));
    
    return (
      <View key={index} style={[styles.intervalItem, isInvalid && styles.invalidItem]}>
        <View style={styles.itemHeader}>
          <Text style={[styles.itemLabel, disabled && styles.disabledText]}>
            第 {index + 1} 次
          </Text>
          
          {/* 删除按钮 */}
          {intervals.length > 1 && (
            <TouchableOpacity
              style={[styles.deleteButton, disabled && styles.disabledButton]}
              onPress={() => removeInterval(index)}
              disabled={disabled}
              accessibilityLabel="删除间隔"
            >
              <Ionicons name="close" size={16} color="#e74c3c" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.itemContent}>
          {isEditing ? (
            <TextInput
              style={[
                styles.input,
                isInvalid && styles.invalidInput,
                { borderColor: color },
              ]}
              value={inputValues[index]}
              onChangeText={(text) => handleInputChange(index, text)}
              onBlur={() => handleInputBlur(index)}
              onSubmitEditing={() => handleInputBlur(index)}
              keyboardType="numeric"
              placeholder="输入间隔"
                             autoFocus
               editable={!disabled}
            />
          ) : (
            <TouchableOpacity
              style={[styles.valueDisplay, disabled && styles.disabledButton]}
              onPress={() => setEditingIndex(index)}
              disabled={disabled}
              accessibilityLabel={`编辑间隔值: ${value}${unit}`}
            >
              <Text style={[styles.valueText, disabled && styles.disabledText]}>
                {value}
              </Text>
              <Text style={[styles.unitText, disabled && styles.disabledText]}>
                {unit}
              </Text>
            </TouchableOpacity>
          )}

          {/* 数值限制提示 */}
          {(minValues?.[index] !== undefined || maxValues?.[index] !== undefined) && (
            <Text style={styles.limitText}>
              {minValues?.[index] !== undefined && `最小: ${minValues[index]}`}
              {minValues?.[index] !== undefined && maxValues?.[index] !== undefined && ' / '}
              {maxValues?.[index] !== undefined && `最大: ${maxValues[index]}`}
            </Text>
          )}
        </View>
      </View>
    );
  };

  // 渲染添加新项目区域
  const renderAddNewItem = () => {
    if (intervals.length >= maxItems || disabled) return null;

    return (
      <View style={styles.addNewContainer}>
        <Text style={styles.addNewLabel}>添加新间隔</Text>
        
        <View style={styles.addNewInputContainer}>
          <TextInput
            style={[styles.input, styles.addNewInput, { borderColor: color }]}
            value={newItemValue}
            onChangeText={setNewItemValue}
            onSubmitEditing={addInterval}
            keyboardType="numeric"
            placeholder={`输入天数 (${unit})`}
            returnKeyType="done"
          />
          
          <TouchableOpacity
            style={[
              styles.addButton,
              { backgroundColor: color },
              (!newItemValue || disabled) && styles.disabledButton,
            ]}
            onPress={addInterval}
            disabled={!newItemValue || disabled}
            accessibilityLabel="添加间隔"
          >
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // 渲染预设建议
  const renderPresets = () => {
    const presets = [
      { name: '标准', values: [1, 3, 7] },
      { name: '快速', values: [1, 2, 4] },
      { name: '保守', values: [1, 4, 10] },
    ];

    return (
      <View style={styles.presetsContainer}>
        <Text style={[styles.presetsLabel, disabled && styles.disabledText]}>
          快速设置
        </Text>
        <View style={styles.presetsButtons}>
          {presets.map((preset, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.presetButton,
                { borderColor: color },
                disabled && styles.disabledButton,
              ]}
              onPress={() => onIntervalsChange(preset.values)}
              disabled={disabled}
              accessibilityLabel={`应用${preset.name}预设`}
            >
              <Text style={[styles.presetButtonText, { color }, disabled && styles.disabledText]}>
                {preset.name}
              </Text>
              <Text style={[styles.presetValues, disabled && styles.disabledText]}>
                {preset.values.join(', ')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, style]}>
      {/* 标题和描述 */}
      <View style={styles.header}>
        <Text style={[styles.label, disabled && styles.disabledText]}>
          {label}
        </Text>
        {description && (
          <Text style={[styles.description, disabled && styles.disabledText]}>
            {description}
          </Text>
        )}
      </View>

      {/* 间隔列表 */}
      <ScrollView style={styles.intervalsList} nestedScrollEnabled>
        {intervals.map((value, index) => renderIntervalItem(value, index))}
      </ScrollView>

      {/* 添加新项目 */}
      {renderAddNewItem()}

      {/* 预设建议 */}
      {renderPresets()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  header: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: '#7f8c8d',
    lineHeight: 18,
  },
  intervalsList: {
    maxHeight: 300,
    marginBottom: 16,
  },
  intervalItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  invalidItem: {
    borderColor: '#e74c3c',
    backgroundColor: '#fef5f5',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
  },
  deleteButton: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
  },
  itemContent: {
    alignItems: 'flex-start',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: '#fff',
    minWidth: 80,
  },
  invalidInput: {
    borderColor: '#e74c3c',
    backgroundColor: '#fef5f5',
  },
  valueDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
    minWidth: 80,
  },
  valueText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  unitText: {
    fontSize: 14,
    color: '#6c757d',
    marginLeft: 4,
  },
  limitText: {
    fontSize: 11,
    color: '#6c757d',
    marginTop: 4,
    fontStyle: 'italic',
  },
  addNewContainer: {
    backgroundColor: '#f1f3f4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
  },
  addNewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 12,
  },
  addNewInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addNewInput: {
    flex: 1,
    marginRight: 12,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
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
  presetsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    paddingTop: 16,
  },
  presetsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 12,
  },
  presetsButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  presetButton: {
    flex: 1,
    minWidth: '30%',
    maxWidth: '32%',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  presetButtonText: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  presetValues: {
    fontSize: 10,
    color: '#6c757d',
  },
  disabledText: {
    opacity: 0.5,
  },
  disabledButton: {
    opacity: 0.5,
  },
}); 