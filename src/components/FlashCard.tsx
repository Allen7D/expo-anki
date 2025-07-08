import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Flashcard } from '../types';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface FlashCardProps {
  flashcard: Flashcard;
  isFlipped: boolean;
  onFlip: () => void;
  onPress?: () => void;
  style?: any;
  disabled?: boolean;
}

/**
 * 闪卡组件
 * 支持正面显示单词和音标，背面显示释义例句和图片，并实现流畅的翻转动画效果
 */
export function FlashCard({
  flashcard,
  isFlipped,
  onFlip,
  onPress,
  style,
  disabled = false
}: FlashCardProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const flipAnimation = useRef(new Animated.Value(0)).current;

  // 动画值处理
  React.useEffect(() => {
    Animated.timing(flipAnimation, {
      toValue: isFlipped ? 1 : 0,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [isFlipped, flipAnimation]);

  // 正面翻转动画插值
  const frontInterpolate = flipAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  // 背面翻转动画插值
  const backInterpolate = flipAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  // 正面样式
  const frontAnimatedStyle = {
    transform: [{ rotateY: frontInterpolate }],
  };

  // 背面样式
  const backAnimatedStyle = {
    transform: [{ rotateY: backInterpolate }],
  };

  // 处理图片加载错误
  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  // 处理图片加载完成
  const handleImageLoad = () => {
    setImageLoading(false);
  };

  // 渲染音标
  const renderPhonetic = (usphone: string | null, ukphone: string | null) => {
    if (!usphone && !ukphone) return null;

    return (
      <View style={styles.phoneticContainer}>
        {usphone && (
          <Text style={styles.phoneticText}>
            🇺🇸 {usphone}
          </Text>
        )}
        {ukphone && (
          <Text style={styles.phoneticText}>
            🇬🇧 {ukphone}
          </Text>
        )}
      </View>
    );
  };

  // 渲染图片
  const renderImage = () => {
    if (!flashcard.imageUrl || imageError) {
      return (
        <View style={styles.imagePlaceholder}>
          <Ionicons name="image-outline" size={40} color="#ccc" />
          <Text style={styles.imagePlaceholderText}>暂无图片</Text>
        </View>
      );
    }

    return (
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: flashcard.imageUrl }}
          style={styles.cardImage}
          onError={handleImageError}
          onLoad={handleImageLoad}
          resizeMode="cover"
        />
        {imageLoading && (
          <View style={styles.imageLoadingOverlay}>
            <Ionicons name="image-outline" size={30} color="#999" />
          </View>
        )}
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={[styles.cardContainer, style]}
      onPress={onPress || onFlip}
      disabled={disabled}
      activeOpacity={0.95}
      accessibilityLabel={`闪卡: ${flashcard.word}`}
      accessibilityHint={isFlipped ? "显示单词正面" : "显示单词背面"}
      accessibilityRole="button"
    >
      {/* 正面 */}
      <Animated.View style={[styles.cardFace, styles.cardFront, frontAnimatedStyle]}>
        <View style={styles.cardContent}>
          {/* 翻转指示器 */}
          <View style={styles.flipIndicator}>
            <Ionicons name="repeat-outline" size={20} color="#666" />
            <Text style={styles.flipHint}>点击翻转</Text>
          </View>

          {/* 单词 */}
          <View style={styles.wordContainer}>
            <Text style={styles.wordText} numberOfLines={2} adjustsFontSizeToFit>
              {flashcard.word}
            </Text>
          </View>

          {/* 音标 */}
          {renderPhonetic(flashcard.usphone, flashcard.ukphone)}

          {/* 卡片类型标识 */}
          <View style={styles.cardTypeIndicator}>
            <Text style={styles.cardTypeText}>单词卡片</Text>
          </View>
        </View>
      </Animated.View>

      {/* 背面 */}
      <Animated.View style={[styles.cardFace, styles.cardBack, backAnimatedStyle]}>
        <View style={styles.cardContent}>
          {/* 翻转指示器 */}
          <View style={styles.flipIndicator}>
            <Ionicons name="repeat-outline" size={20} color="#666" />
            <Text style={styles.flipHint}>点击翻转</Text>
          </View>

          {/* 释义 */}
          <View style={styles.meaningContainer}>
            <Text style={styles.meaningText} numberOfLines={4}>
              {flashcard.meaning}
            </Text>
          </View>

          {/* 例句 */}
          {flashcard.example && (
            <View style={styles.exampleContainer}>
              <Text style={styles.exampleLabel}>例句</Text>
              <Text style={styles.exampleText} numberOfLines={3}>
                {flashcard.example}
              </Text>
            </View>
          )}

          {/* 图片 */}
          {renderImage()}

          {/* 单词提示 */}
          <View style={styles.wordHint}>
            <Text style={styles.wordHintText}>{flashcard.word}</Text>
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: screenWidth * 0.9,
    height: screenHeight * 0.6,
    alignSelf: 'center',
    marginVertical: 20,
  },
  cardFace: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 20,
    backgroundColor: '#fff',
    backfaceVisibility: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  cardFront: {
    backgroundColor: '#f8f9ff',
  },
  cardBack: {
    backgroundColor: '#fff8f0',
  },
  cardContent: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  flipIndicator: {
    alignItems: 'center',
    marginBottom: 10,
  },
  flipHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  wordContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  wordText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    letterSpacing: 1,
  },
  phoneticContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  phoneticText: {
    fontSize: 16,
    color: '#7f8c8d',
    marginVertical: 2,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  cardTypeIndicator: {
    alignItems: 'center',
  },
  cardTypeText: {
    fontSize: 12,
    color: '#95a5a6',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  meaningContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 10,
  },
  meaningText: {
    fontSize: 20,
    color: '#2c3e50',
    textAlign: 'center',
    lineHeight: 28,
    fontWeight: '500',
  },
  exampleContainer: {
    marginVertical: 15,
    padding: 15,
    backgroundColor: '#f1f3f4',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  exampleLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    fontWeight: '600',
    marginBottom: 5,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  exampleText: {
    fontSize: 16,
    color: '#34495e',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  imageContainer: {
    height: 120,
    marginVertical: 10,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f8f9fa',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  imageLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(248, 249, 250, 0.8)',
  },
  imagePlaceholder: {
    height: 120,
    marginVertical: 10,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
  },
  imagePlaceholderText: {
    fontSize: 14,
    color: '#adb5bd',
    marginTop: 8,
  },
  wordHint: {
    alignItems: 'center',
    marginTop: 10,
  },
  wordHintText: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
  },
}); 