import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFonts, Nunito_400Regular, Nunito_700Bold, Nunito_800ExtraBold } from '@expo-google-fonts/nunito';
import { useRouter } from 'expo-router';
import { Star, Flame, Trophy } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Home() {
  const router = useRouter();
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [cumulativeScore, setCumulativeScore] = useState(0);
  const [cumulativeStreak, setCumulativeStreak] = useState(0);
  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  useEffect(() => {
    loadCumulativeStats();
  }, []);

  const loadCumulativeStats = async () => {
    try {
      const savedScore = await AsyncStorage.getItem('cumulativeScore');
      const savedStreak = await AsyncStorage.getItem('cumulativeStreak');
      if (savedScore) setCumulativeScore(parseInt(savedScore));
      if (savedStreak) setCumulativeStreak(parseInt(savedStreak));
    } catch (error) {
      console.error('Failed to load cumulative stats:', error);
    }
  };

  const handleStartOver = async () => {
    try {
      await AsyncStorage.setItem('cumulativeScore', '0');
      await AsyncStorage.setItem('cumulativeStreak', '0');
      setCumulativeScore(0);
      setCumulativeStreak(0);
    } catch (error) {
      console.error('Failed to reset stats:', error);
    }
  };

  if (!fontsLoaded) {
    return null;
  }

  const numbers = Array.from({ length: 12 }, (_, i) => i + 1);

  const handleNumberToggle = (number: number) => {
    setSelectedNumbers(prev => {
      if (prev.includes(number)) {
        return prev.filter(n => n !== number);
      } else {
        return [...prev, number];
      }
    });
  };

  const handleStartQuiz = () => {
    if (selectedNumbers.length > 0) {
      router.push({
        pathname: '/quiz',
        params: { selectedNumbers: selectedNumbers.join(',') }
      });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Times Tables Go!</Text>
        <Text style={styles.subtitle}>
          {selectedNumbers.length === 0 
            ? 'Choose your times tables! 🎯' 
            : `${selectedNumbers.length} table${selectedNumbers.length > 1 ? 's' : ''} selected`}
        </Text>
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Flame size={20} color="#F59E0B" />
            <Text style={styles.statText}>{cumulativeStreak} streak</Text>
          </View>
          <View style={styles.statItem}>
            <Trophy size={20} color="#10B981" />
            <Text style={styles.statText}>{cumulativeScore} points</Text>
          </View>
        </View>
        
        {(cumulativeScore > 0 || cumulativeStreak > 0) && (
          <TouchableOpacity style={styles.startOverButton} onPress={handleStartOver}>
            <Text style={styles.startOverText}>Start Over</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
      >
        <View style={styles.grid}>
          {numbers.map((number) => {
            const isSelected = selectedNumbers.includes(number);
            return (
              <TouchableOpacity
                key={number}
                style={[
                  styles.numberTile,
                  { backgroundColor: getColorForNumber(number) },
                  isSelected && styles.selectedTile
                ]}
                onPress={() => handleNumberToggle(number)}
                activeOpacity={0.8}
              >
                <Text style={styles.numberText}>{number}</Text>
                <Text style={styles.timesText}>× table</Text>
                {isSelected && (
                  <View style={styles.checkBadge}>
                    <Star size={20} color="#FFFFFF" fill="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {selectedNumbers.length > 0 && (
        <SafeAreaView edges={['bottom']} style={styles.bottomSafeArea}>
          <View>
            <TouchableOpacity
              style={[styles.startButton, styles.startButtonFixed]}
              onPress={handleStartQuiz}
              activeOpacity={0.9}
            >
              <Text style={styles.startButtonText}>Start Quiz</Text>
              <Text style={styles.startButtonSubtext}>
                {selectedNumbers.length} table{selectedNumbers.length > 1 ? 's' : ''}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      )}
    </View>
  );
}

const getColorForNumber = (num: number): string => {
  const colors = [
    '#10B981', // Green
    '#3B82F6', // Blue
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#14B8A6', // Teal
    '#6366F1', // Indigo
    '#F97316', // Orange
    '#84CC16', // Lime
    '#06B6D4', // Cyan
    '#A855F7', // Violet
  ];
  return colors[(num - 1) % colors.length];
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 36,
    fontFamily: 'Nunito_800ExtraBold',
    color: '#10B981',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    fontFamily: 'Nunito_700Bold',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    fontFamily: 'Nunito_700Bold',
    color: '#374151',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 160,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
  },
  numberTile: {
    width: 160,
    height: 140,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    position: 'relative',
  },
  numberText: {
    fontSize: 56,
    fontFamily: 'Nunito_800ExtraBold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  timesText: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    color: '#FFFFFF',
    opacity: 0.9,
  },
  starBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedTile: {
    borderWidth: 4,
    borderColor: '#FFFFFF',
    transform: [{ scale: 0.95 }],
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(16, 185, 129, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  startButton: {
    backgroundColor: '#10B981',
    marginHorizontal: 24,
    marginTop: 24,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: 24,
    fontFamily: 'Nunito_800ExtraBold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  startButtonSubtext: {
    fontSize: 14,
    fontFamily: 'Nunito_700Bold',
    color: '#FFFFFF',
    opacity: 0.9,
  },
  bottomSafeArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    paddingTop: 12,
    backgroundColor: 'transparent',
  },
  startButtonFixed: {
    marginHorizontal: 0,
    marginTop: 0,
  },
  startOverButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    alignSelf: 'center',
  },
  startOverText: {
    fontSize: 14,
    fontFamily: 'Nunito_700Bold',
    color: '#EF4444',
  },
});
