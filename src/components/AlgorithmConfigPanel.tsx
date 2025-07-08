import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { PresetSelector } from './PresetSelector';
import { MultiplierSlider } from './MultiplierSlider';
import { IntervalEditor } from './IntervalEditor';
import { SpacedRepetitionConfig, PRESET_CONFIGS } from '../types';

type PresetMode = keyof typeof PRESET_CONFIGS;

interface AlgorithmConfigPanelProps {
  config: SpacedRepetitionConfig;
  onConfigChange: (config: SpacedRepetitionConfig) => void;
  onPresetSelect: (preset: PresetMode) => void;
  disabled?: boolean;
  style?: any;
  showPreview?: boolean;
}

/**
 * 算法配置面板主组件
 * 整合预设选择、间隔编辑和倍增系数配置
 */
export function AlgorithmConfigPanel({
  config,
  onConfigChange,
  onPresetSelect,
  disabled = false,
  style,
  showPreview = true,
}: AlgorithmConfigPanelProps) {
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced'>('basic');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // 检测当前配置是否匹配某个预设
  const currentPreset = useMemo((): PresetMode => {
    const presets = Object.entries(PRESET_CONFIGS) as [PresetMode, SpacedRepetitionConfig][];
    
    for (const [key, preset] of presets) {
      if (
        JSON.stringify(preset.baseIntervals) === JSON.stringify(config.baseIntervals) &&
        JSON.stringify(preset.multipliers) === JSON.stringify(config.multipliers) &&
        preset.maxInterval === config.maxInterval &&
        preset.minInterval === config.minInterval
      ) {
        return key;
      }
    }
    
    return 'custom';
  }, [config]);

  // 处理预设选择
  const handlePresetSelect = (preset: PresetMode) => {
    onPresetSelect(preset);
    if (preset !== 'custom') {
      setActiveTab('basic');
    } else {
      setActiveTab('advanced');
    }
  };

  // 处理配置更新
  const updateConfig = (updates: Partial<SpacedRepetitionConfig>) => {
    const newConfig = { ...config, ...updates };
    onConfigChange(newConfig);
  };

  // 处理基础间隔更新
  const updateBaseIntervals = (difficulty: 'easy' | 'normal' | 'hard', intervals: number[]) => {
    updateConfig({
      baseIntervals: {
        ...config.baseIntervals,
        [difficulty]: intervals,
      },
    });
  };

  // 处理倍增系数更新
  const updateMultipliers = (difficulty: 'easy' | 'normal' | 'hard', value: number) => {
    updateConfig({
      multipliers: {
        ...config.multipliers,
        [difficulty]: value,
      },
    });
  };

  // 预览计算下次间隔
  const previewInterval = (difficulty: 'easy' | 'normal' | 'hard', multiplier: number): string => {
    const baseInterval = config.baseIntervals[difficulty];
    const lastInterval = baseInterval[baseInterval.length - 1] || 1;
    const nextInterval = Math.round(lastInterval * multiplier);
    return `${nextInterval}天`;
  };

  // 渲染标签页
  const renderTabs = () => {
    const tabs = [
      { key: 'basic', label: '基础设置', icon: 'settings-outline' },
      { key: 'advanced', label: '高级设置', icon: 'construct-outline' },
    ];

    return (
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && styles.activeTab,
              disabled && styles.disabledButton,
            ]}
            onPress={() => setActiveTab(tab.key as 'basic' | 'advanced')}
            disabled={disabled}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected: activeTab === tab.key }}
          >
            <Ionicons
              name={tab.icon as any}
              size={16}
              color={activeTab === tab.key ? '#2196f3' : '#6c757d'}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.activeTabText,
                disabled && styles.disabledText,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // 渲染可折叠区域
  const renderCollapsibleSection = (
    key: string,
    title: string,
    description: string,
    children: React.ReactNode,
    icon?: string
  ) => {
    const isExpanded = expandedSection === key;

    return (
      <View style={styles.sectionContainer}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => setExpandedSection(isExpanded ? null : key)}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={`${isExpanded ? '收起' : '展开'}${title}`}
        >
          <View style={styles.sectionHeaderLeft}>
            {icon && (
              <Ionicons
                name={icon as any}
                size={20}
                color="#2196f3"
                style={styles.sectionIcon}
              />
            )}
            <View style={styles.sectionTitleContainer}>
              <Text style={[styles.sectionTitle, disabled && styles.disabledText]}>
                {title}
              </Text>
              <Text style={[styles.sectionDescription, disabled && styles.disabledText]}>
                {description}
              </Text>
            </View>
          </View>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#6c757d"
          />
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.sectionContent}>
            {children}
          </View>
        )}
      </View>
    );
  };

  // 渲染基础设置
  const renderBasicSettings = () => {
    return (
      <View style={styles.tabContent}>
        {/* 预设选择器 */}
        <PresetSelector
          selectedPreset={currentPreset}
          onPresetSelect={handlePresetSelect}
          disabled={disabled}
          showDescription
          style={styles.presetSelector}
        />

        {/* 配置预览 */}
        {showPreview && currentPreset === 'custom' && (
          <View style={styles.previewContainer}>
            <Text style={styles.previewTitle}>当前配置预览</Text>
            <View style={styles.previewGrid}>
              <View style={styles.previewItem}>
                <Text style={styles.previewLabel}>简单难度</Text>
                <Text style={styles.previewValue}>
                  {config.baseIntervals.easy.join(' → ')}天
                </Text>
              </View>
              <View style={styles.previewItem}>
                <Text style={styles.previewLabel}>一般难度</Text>
                <Text style={styles.previewValue}>
                  {config.baseIntervals.normal.join(' → ')}天
                </Text>
              </View>
              <View style={styles.previewItem}>
                <Text style={styles.previewLabel}>困难难度</Text>
                <Text style={styles.previewValue}>
                  {config.baseIntervals.hard.join(' → ')}天
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>
    );
  };

  // 渲染高级设置
  const renderAdvancedSettings = () => {
    return (
      <View style={styles.tabContent}>
        {/* 间隔设置 */}
        {renderCollapsibleSection(
          'intervals',
          '学习间隔设置',
          '配置不同难度的复习间隔序列',
          <View>
            <IntervalEditor
              label="简单难度间隔"
              intervals={config.baseIntervals.easy}
              onIntervalsChange={(intervals) => updateBaseIntervals('easy', intervals)}
              disabled={disabled}
              color="#27ae60"
              description="对于容易记住的单词，复习间隔可以相对较长"
              style={styles.intervalEditor}
            />
            <IntervalEditor
              label="一般难度间隔"
              intervals={config.baseIntervals.normal}
              onIntervalsChange={(intervals) => updateBaseIntervals('normal', intervals)}
              disabled={disabled}
              color="#f39c12"
              description="对于需要一定努力记住的单词的复习间隔"
              style={styles.intervalEditor}
            />
            <IntervalEditor
              label="困难难度间隔"
              intervals={config.baseIntervals.hard}
              onIntervalsChange={(intervals) => updateBaseIntervals('hard', intervals)}
              disabled={disabled}
              color="#e74c3c"
              description="对于难以记住的单词，需要更频繁的复习"
              style={styles.intervalEditor}
            />
          </View>,
          'calendar-outline'
        )}

        {/* 倍增系数设置 */}
        {renderCollapsibleSection(
          'multipliers',
          '倍增系数设置',
          '控制后续复习间隔的增长速度',
          <View>
            <MultiplierSlider
              label="简单难度倍增系数"
              value={config.multipliers.easy}
              min={1.0}
              max={5.0}
              step={0.1}
              onValueChange={(value) => updateMultipliers('easy', value)}
              disabled={disabled}
              color="#27ae60"
              description="控制简单单词的间隔增长速度，值越大增长越快"
              previewCallback={(value) => previewInterval('easy', value)}
              style={styles.multiplierSlider}
            />
            <MultiplierSlider
              label="一般难度倍增系数"
              value={config.multipliers.normal}
              min={1.0}
              max={4.0}
              step={0.1}
              onValueChange={(value) => updateMultipliers('normal', value)}
              disabled={disabled}
              color="#f39c12"
              description="控制一般单词的间隔增长速度"
              previewCallback={(value) => previewInterval('normal', value)}
              style={styles.multiplierSlider}
            />
            <MultiplierSlider
              label="困难难度倍增系数"
              value={config.multipliers.hard}
              min={1.0}
              max={3.0}
              step={0.1}
              onValueChange={(value) => updateMultipliers('hard', value)}
              disabled={disabled}
              color="#e74c3c"
              description="控制困难单词的间隔增长速度，通常设置较小的值"
              previewCallback={(value) => previewInterval('hard', value)}
              style={styles.multiplierSlider}
            />
          </View>,
          'trending-up-outline'
        )}

        {/* 限制设置 */}
        {renderCollapsibleSection(
          'limits',
          '间隔限制设置',
          '设置复习间隔的上下限',
          <View>
            <MultiplierSlider
              label="最大间隔天数"
              value={config.maxInterval}
              min={30}
              max={730}
              step={1}
              onValueChange={(value) => updateConfig({ maxInterval: value })}
              disabled={disabled}
              unit="天"
              description="复习间隔的上限，防止间隔过长导致遗忘"
              style={styles.multiplierSlider}
            />
            <MultiplierSlider
              label="最小间隔天数"
              value={config.minInterval}
              min={1}
              max={7}
              step={1}
              onValueChange={(value) => updateConfig({ minInterval: value })}
              disabled={disabled}
              unit="天"
              description="复习间隔的下限，确保有足够的间隔时间"
              style={styles.multiplierSlider}
            />
          </View>,
          'speedometer-outline'
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, style]}>
      {/* 标题 */}
      <View style={styles.header}>
        <Text style={[styles.title, disabled && styles.disabledText]}>
          算法配置
        </Text>
        <Text style={[styles.subtitle, disabled && styles.disabledText]}>
          调整间隔重复算法参数以优化学习效果
        </Text>
      </View>

      {/* 标签页 */}
      {renderTabs()}

      {/* 内容区域 */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        {activeTab === 'basic' ? renderBasicSettings() : renderAdvancedSettings()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 20,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#fff',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6c757d',
    marginLeft: 6,
  },
  activeTabText: {
    color: '#2196f3',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  tabContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  presetSelector: {
    marginBottom: 20,
  },
  previewContainer: {
    backgroundColor: '#f8f9ff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e3f2fd',
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976d2',
    marginBottom: 12,
  },
  previewGrid: {
    gap: 8,
  },
  previewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  previewLabel: {
    fontSize: 14,
    color: '#495057',
    fontWeight: '500',
  },
  previewValue: {
    fontSize: 14,
    color: '#1976d2',
    fontWeight: '600',
  },
  sectionContainer: {
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionIcon: {
    marginRight: 12,
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 2,
  },
  sectionDescription: {
    fontSize: 13,
    color: '#6c757d',
    lineHeight: 18,
  },
  sectionContent: {
    padding: 16,
  },
  intervalEditor: {
    marginBottom: 16,
  },
  multiplierSlider: {
    marginBottom: 16,
  },
  disabledText: {
    opacity: 0.5,
  },
  disabledButton: {
    opacity: 0.5,
  },
}); 