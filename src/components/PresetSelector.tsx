import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PRESET_CONFIGS } from '../types';

const { width: screenWidth } = Dimensions.get('window');

type PresetMode = keyof typeof PRESET_CONFIGS;

interface PresetSelectorProps {
  selectedPreset: PresetMode;
  onPresetSelect: (preset: PresetMode) => void;
  disabled?: boolean;
  style?: any;
  showDescription?: boolean;
  compact?: boolean;
}

interface PresetInfo {
  key: PresetMode;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  benefits: string[];
  suitable: string;
}

const presetInfoMap: Record<PresetMode, PresetInfo> = {
  standard: {
    key: 'standard',
    title: '标准模式',
    description: '适合大多数用户的均衡学习方式',
    icon: 'checkmark-circle-outline',
    color: '#2196f3',
    benefits: ['均衡的学习节奏', '适中的复习间隔', '稳定的记忆强化'],
    suitable: '适合日常学习，想要稳定进步的用户',
  },
  fast: {
    key: 'fast',
    title: '快速模式',
    description: '加速学习，适合时间紧张的用户',
    icon: 'flash-outline',
    color: '#ff9800',
    benefits: ['更短的复习间隔', '快速记忆建立', '高强度学习'],
    suitable: '适合备考冲刺，短期内需要快速掌握的用户',
  },
  conservative: {
    key: 'conservative',
    title: '保守模式',
    description: '更牢固的记忆，适合追求深度记忆的用户',
    icon: 'shield-checkmark-outline',
    color: '#4caf50',
    benefits: ['更长的记忆保持', '深度理解强化', '减少遗忘风险'],
    suitable: '适合长期学习，追求扎实记忆基础的用户',
  },
  custom: {
    key: 'custom',
    title: '自定义模式',
    description: '完全控制学习参数，适合有经验的用户',
    icon: 'settings-outline',
    color: '#9c27b0',
    benefits: ['完全自定义控制', '个性化学习体验', '精细参数调整'],
    suitable: '适合了解间隔重复算法，希望个性化配置的用户',
  },
};

/**
 * 算法预设选择器组件
 * 用于选择不同的学习模式预设配置
 */
export function PresetSelector({
  selectedPreset,
  onPresetSelect,
  disabled = false,
  style,
  showDescription = true,
  compact = false,
}: PresetSelectorProps) {
  const [expandedPreset, setExpandedPreset] = useState<PresetMode | null>(null);

  // 处理预设选择
  const handlePresetSelect = (preset: PresetMode) => {
    if (disabled) return;
    onPresetSelect(preset);
  };

  // 处理展开/收起详情
  const handleToggleExpanded = (preset: PresetMode) => {
    setExpandedPreset(expandedPreset === preset ? null : preset);
  };

  // 渲染紧凑模式的预设按钮
  const renderCompactPreset = (preset: PresetInfo) => {
    const isSelected = selectedPreset === preset.key;
    
    return (
      <TouchableOpacity
        key={preset.key}
        style={[
          styles.compactPresetButton,
          {
            borderColor: preset.color,
            backgroundColor: isSelected ? preset.color : 'transparent',
          },
          disabled && styles.disabledButton,
        ]}
        onPress={() => handlePresetSelect(preset.key)}
        disabled={disabled}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={preset.title}
        accessibilityHint={preset.description}
        accessibilityState={{ selected: isSelected }}
      >
        <Ionicons
          name={preset.icon}
          size={16}
          color={isSelected ? '#fff' : preset.color}
        />
        <Text
          style={[
            styles.compactPresetText,
            {
              color: isSelected ? '#fff' : preset.color,
            },
            disabled && styles.disabledText,
          ]}
        >
          {preset.title}
        </Text>
      </TouchableOpacity>
    );
  };

  // 渲染完整模式的预设卡片
  const renderFullPreset = (preset: PresetInfo) => {
    const isSelected = selectedPreset === preset.key;
    const isExpanded = expandedPreset === preset.key;
    
    return (
      <View
        key={preset.key}
        style={[
          styles.presetCard,
          {
            borderColor: isSelected ? preset.color : '#e0e0e0',
            backgroundColor: isSelected ? `${preset.color}10` : '#fff',
          },
        ]}
      >
        {/* 主要内容区域 */}
        <TouchableOpacity
          style={styles.presetMainContent}
          onPress={() => handlePresetSelect(preset.key)}
          disabled={disabled}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={preset.title}
          accessibilityHint={preset.description}
          accessibilityState={{ selected: isSelected }}
        >
          <View style={styles.presetHeader}>
            <View style={styles.presetIconContainer}>
              <Ionicons
                name={preset.icon}
                size={24}
                color={preset.color}
              />
            </View>
            
            <View style={styles.presetInfo}>
              <Text style={[styles.presetTitle, disabled && styles.disabledText]}>
                {preset.title}
              </Text>
              {showDescription && (
                <Text style={[styles.presetDescription, disabled && styles.disabledText]}>
                  {preset.description}
                </Text>
              )}
            </View>

            {/* 选中指示器 */}
            <View style={styles.presetIndicator}>
              {isSelected && (
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={preset.color}
                />
              )}
            </View>
          </View>
        </TouchableOpacity>

        {/* 展开/收起按钮 */}
        <TouchableOpacity
          style={styles.expandButton}
          onPress={() => handleToggleExpanded(preset.key)}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={isExpanded ? "收起详情" : "展开详情"}
        >
          <Ionicons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={16}
            color="#666"
          />
        </TouchableOpacity>

        {/* 展开的详细信息 */}
        {isExpanded && (
          <View style={styles.presetDetails}>
            <Text style={styles.detailsTitle}>优势特点</Text>
            {preset.benefits.map((benefit, index) => (
              <View key={index} style={styles.benefitItem}>
                <Ionicons
                  name="checkmark"
                  size={12}
                  color={preset.color}
                />
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
            
            <Text style={styles.detailsTitle}>适用场景</Text>
            <Text style={styles.suitableText}>{preset.suitable}</Text>
          </View>
        )}
      </View>
    );
  };

  const presets = Object.values(presetInfoMap);

  if (compact) {
    return (
      <View style={[styles.compactContainer, style]}>
        <Text style={styles.selectorTitle}>学习模式</Text>
        <View style={styles.compactPresetsGrid}>
          {presets.map(renderCompactPreset)}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.selectorTitle}>选择学习模式</Text>
      <Text style={styles.selectorSubtitle}>
        不同的学习模式会影响复习间隔和学习强度
      </Text>
      
      <ScrollView
        style={styles.presetsScrollView}
        showsVerticalScrollIndicator={false}
      >
        {presets.map(renderFullPreset)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  compactContainer: {
    paddingVertical: 8,
  },
  selectorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  selectorSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 20,
    lineHeight: 20,
  },
  presetsScrollView: {
    flex: 1,
  },
  presetCard: {
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  presetMainContent: {
    padding: 16,
  },
  presetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  presetIconContainer: {
    marginRight: 12,
  },
  presetInfo: {
    flex: 1,
  },
  presetTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  presetDescription: {
    fontSize: 13,
    color: '#7f8c8d',
    lineHeight: 18,
  },
  presetIndicator: {
    width: 24,
    alignItems: 'center',
  },
  expandButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  presetDetails: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34495e',
    marginBottom: 8,
    marginTop: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  benefitText: {
    fontSize: 13,
    color: '#7f8c8d',
    marginLeft: 8,
    lineHeight: 18,
  },
  suitableText: {
    fontSize: 13,
    color: '#7f8c8d',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  compactPresetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  compactPresetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
    minWidth: '48%',
  },
  compactPresetText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.5,
  },
}); 