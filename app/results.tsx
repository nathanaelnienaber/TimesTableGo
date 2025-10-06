import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useFonts, Nunito_400Regular, Nunito_700Bold, Nunito_800ExtraBold } from '@expo-google-fonts/nunito';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Trophy, Star, Zap, Home, RotateCcw } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect } from 'react';

export default function Results() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const score = parseInt(params.score as string);
  const total = parseInt(params.total as string);
  const streak = parseInt(params.streak as string);
  const selectedNumbers = (params.selectedNumbers as string)
    .split(',')
    .map(n => parseInt(n));

  useEffect(() => {
    updateCumulativeStats();
  }, []);

  const updateCumulativeStats = async () => {
    try {
      const savedScore = await AsyncStorage.getItem('cumulativeScore');
      const savedStreak = await AsyncStorage.getItem('cumulativeStreak');
      const currentCumulativeScore = savedScore ? parseInt(savedScore) : 0;
      const currentCumulativeStreak = savedStreak ? parseInt(savedStreak) : 0;
      
      const newCumulativeScore = currentCumulativeScore + score;
      const newCumulativeStreak = Math.max(currentCumulativeStreak, streak);
      
      await AsyncStorage.setItem('cumulativeScore', newCumulativeScore.toString());
      await AsyncStorage.setItem('cumulativeStreak', newCumulativeStreak.toString());
    } catch (error) {
      console.error('Failed to update cumulative stats:', error);
    }
  };
  
  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  if (!fontsLoaded) {
    return null;
  }

  const percentage = Math.round((score / (total * 10)) * 100);
  const isPerfect = percentage === 100;
  const isGreat = percentage >= 80;
  const isGood = percentage >= 60;

  const getMessage = () => {
    if (isPerfect) return "Perfect! You're a math star! 🌟";
    if (isGreat) return "Great job! Keep it up! 🎉";
    if (isGood) return "Good work! Practice makes perfect! 💪";
    return "Keep practicing! You can do it! 🚀";
  };

  const handleSameNumbers = () => {
    router.push({
      pathname: '/quiz',
      params: { selectedNumbers: params.selectedNumbers }
    });
  };

  const handleNewNumbers = () => {
    router.push('/');
  };

  return (
    <View style={styles.container}>
      {/* Trophy Section */}
      <View style={[styles.trophySection, { backgroundColor: isPerfect ? '#FCD34D' : '#10B981' }]}>
        <Trophy 
          size={80} 
          color="#FFFFFF" 
          fill="#FFFFFF"
        />
        <Text style={styles.trophyText}>
          {isPerfect ? 'PERFECT!' : 'COMPLETE!'}
        </Text>
      </View>

      {/* Results Card */}
      <View style={styles.resultsCard}>
        <Text style={styles.message}>{getMessage()}</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Star size={32} color="#FCD34D" fill="#FCD34D" />
            <Text style={styles.statValue}>{percentage}%</Text>
            <Text style={styles.statLabel}>Accuracy</Text>
          </View>

          <View style={styles.statBox}>
            <View style={styles.scoreCircle}>
              <Text style={styles.scoreCircleText}>{score}</Text>
            </View>
            <Text style={styles.statLabel}>Total Score</Text>
          </View>

          <View style={styles.statBox}>
            <Zap size={32} color="#F59E0B" fill="#F59E0B" />
            <Text style={styles.statValue}>{streak}</Text>
            <Text style={styles.statLabel}>Best Streak</Text>
          </View>
        </View>

        <View style={styles.timesTableBadge}>
          <Text style={styles.timesTableText}>
            {selectedNumbers.length === 1 
              ? `${selectedNumbers[0]} × times table`
              : `${selectedNumbers.length} times tables`}
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={handleSameNumbers}
          activeOpacity={0.8}
        >
          <RotateCcw size={24} color="#FFFFFF" />
          <Text style={styles.buttonText}>Same Number's</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={handleNewNumbers}
          activeOpacity={0.8}
        >
          <Home size={24} color="#10B981" />
          <Text style={[styles.buttonText, { color: '#10B981' }]}>New Numbers</Text>
        </TouchableOpacity>
      </View>

      {/* Encouragement */}
      <View style={styles.encouragement}>
        <Text style={styles.encouragementText}>
          {isPerfect 
            ? selectedNumbers.length === 1
              ? `🎯 You mastered the ${selectedNumbers[0]} times table!`
              : `🎯 You mastered ${selectedNumbers.length} times tables!`
            : "💡 Practice daily to improve your score!"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  trophySection: {
    paddingTop: 80,
    paddingBottom: 60,
    alignItems: 'center',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  trophyText: {
    fontSize: 32,
    fontFamily: 'Nunito_800ExtraBold',
    color: '#FFFFFF',
    marginTop: 16,
  },
  resultsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: -30,
    padding: 32,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  message: {
    fontSize: 24,
    fontFamily: 'Nunito_800ExtraBold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 32,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 28,
    fontFamily: 'Nunito_800ExtraBold',
    color: '#1F2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    fontFamily: 'Nunito_700Bold',
    color: '#6B7280',
    marginTop: 4,
  },
  scoreCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreCircleText: {
    fontSize: 24,
    fontFamily: 'Nunito_800ExtraBold',
    color: '#FFFFFF',
  },
  timesTableBadge: {
    backgroundColor: '#E0F2FE',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignSelf: 'center',
    marginTop: 8,
  },
  timesTableText: {
    fontSize: 16,
    fontFamily: 'Nunito_800ExtraBold',
    color: '#0369A1',
  },
  buttonContainer: {
    paddingHorizontal: 20,
    marginTop: 32,
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButton: {
    backgroundColor: '#10B981',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  buttonText: {
    fontSize: 18,
    fontFamily: 'Nunito_800ExtraBold',
    color: '#FFFFFF',
  },
  encouragement: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  encouragementText: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    color: '#6B7280',
    textAlign: 'center',
  },
});
