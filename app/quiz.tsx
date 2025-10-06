import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native';
import { useFonts, Nunito_400Regular, Nunito_700Bold, Nunito_800ExtraBold } from '@expo-google-fonts/nunito';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Heart, X, Zap, ArrowLeft, Check, CheckCircle, XCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

type Question = {
  num1: number;
  num2: number;
  correctAnswer: number;
  options: number[];
};

export default function Quiz() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const selectedNumbers = (params.selectedNumbers as string)
    .split(',')
    .map(n => parseInt(n));
  
  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [scaleAnim] = useState(new Animated.Value(1));
  const [showMilestone, setShowMilestone] = useState(false);
  const [milestoneMessage, setMilestoneMessage] = useState('');
  const [toastOpacity] = useState(new Animated.Value(0));
  const [toastTranslateY] = useState(new Animated.Value(-20));
  const [streakPulse] = useState(new Animated.Value(1));
  const questionPoolRef = useRef<{ num1: number; num2: number }[]>([]);
  const poolIndexRef = useRef(0);

  const totalQuestions = 10;
  const HIGHLIGHT_DELAY = 1200;

  useEffect(() => {
    // Build unique question pool from selected numbers × 1..12 and shuffle
    const pool: { num1: number; num2: number }[] = [];
    selectedNumbers.forEach((n1) => {
      for (let n2 = 1; n2 <= 12; n2++) {
        pool.push({ num1: n1, num2: n2 });
      }
    });
    // Fisher–Yates shuffle
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    questionPoolRef.current = pool;
    poolIndexRef.current = 0;
    generateQuestion();
  }, []);

  useEffect(() => {
    const milestones = [5, 10, 15, 20, 25, 30, 40];
    if (milestones.includes(streak)) {
      const tier = getStreakTier(streak);
      setMilestoneMessage(`${tier.emoji} ${tier.label}! Streak ${streak}!`);
      setShowMilestone(true);
      toastOpacity.setValue(0);
      toastTranslateY.setValue(-20);
      Animated.parallel([
        Animated.timing(toastOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(toastTranslateY, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        })
      ]).start(() => {
        setTimeout(() => {
          Animated.parallel([
            Animated.timing(toastOpacity, {
              toValue: 0,
              duration: 220,
              useNativeDriver: true,
            }),
            Animated.timing(toastTranslateY, {
              toValue: -20,
              duration: 220,
              useNativeDriver: true,
            })
          ]).start(() => setShowMilestone(false));
        }, 1200);
      });
    }
  }, [streak]);

  const generateQuestion = () => {
    // Ensure pool exists; if empty (safety), rebuild from selectedNumbers
    if (questionPoolRef.current.length === 0) {
      const pool: { num1: number; num2: number }[] = [];
      selectedNumbers.forEach((n1) => {
        for (let n2 = 1; n2 <= 12; n2++) {
          pool.push({ num1: n1, num2: n2 });
        }
      });
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      questionPoolRef.current = pool;
      poolIndexRef.current = 0;
    }

    // When we reach the end of pool, reshuffle and start over (safety)
    if (poolIndexRef.current >= questionPoolRef.current.length) {
      const pool = questionPoolRef.current.slice();
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      questionPoolRef.current = pool;
      poolIndexRef.current = 0;
    }

    const pair = questionPoolRef.current[poolIndexRef.current++];
    const num1 = pair.num1;
    const num2 = pair.num2;

    const correctAnswer = num1 * num2;
    const wrongAnswers = new Set<number>();
    while (wrongAnswers.size < 3) {
      const offset = Math.floor(Math.random() * 20) - 10;
      const wrongAnswer = correctAnswer + offset;
      if (wrongAnswer !== correctAnswer && wrongAnswer > 0) {
        wrongAnswers.add(wrongAnswer);
      }
    }
    const options = [correctAnswer, ...Array.from(wrongAnswers)].sort(() => Math.random() - 0.5);
    setCurrentQuestion({
      num1,
      num2,
      correctAnswer,
      options
    });
    setFeedback(null);
    setSelectedAnswer(null);
  };

  const handleAnswer = (answer: number) => {
    if (feedback !== null) return; // Prevent multiple answers
    setSelectedAnswer(answer);
    if (answer === currentQuestion?.correctAnswer) {
      setFeedback('correct');
      setScore(score + 10);
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => { });
      Animated.spring(scaleAnim, {
        toValue: 1.2,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
      streakPulse.setValue(1);
      Animated.sequence([
        Animated.timing(streakPulse, { toValue: 1.25, duration: 150, useNativeDriver: true }),
        Animated.timing(streakPulse, { toValue: 1, duration: 150, useNativeDriver: true })
      ]).start();
      setTimeout(() => {
        scaleAnim.setValue(1); // Reset zoom
        if (questionIndex + 1 < totalQuestions) {
          setQuestionIndex(questionIndex + 1);
          generateQuestion();
        } else {
          router.push({
            pathname: '/results',
            params: { score: score + 10, total: totalQuestions, streak: nextStreak, selectedNumbers: params.selectedNumbers }
          });
        }
      }, 1000);
    } else {
      setFeedback('wrong');
      setStreak(0);
      const newScore = Math.max(0, score - 5); // Subtract 5 points, don't go below 0
      setScore(newScore);
      const newLives = lives - 1;
      setLives(newLives);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => { });
      Animated.spring(scaleAnim, {
        toValue: 1.2,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
      if (newLives === 0) {
        setTimeout(() => {
          scaleAnim.setValue(1); // Reset zoom
          router.push({
            pathname: '/results',
            params: { score: newScore, total: totalQuestions, streak: 0, selectedNumbers: params.selectedNumbers }
          });
        }, HIGHLIGHT_DELAY);
      } else {
        setTimeout(() => {
          scaleAnim.setValue(1); // Reset zoom
          if (questionIndex + 1 < totalQuestions) {
            setQuestionIndex(questionIndex + 1);
            generateQuestion();
          } else {
            router.push({
              pathname: '/results',
              params: { score: newScore, total: totalQuestions, streak, selectedNumbers: params.selectedNumbers }
            });
          }
        }, HIGHLIGHT_DELAY);
      }
    }
  };

  function getStreakTier(count: number): { label: string; emoji: string; color: string } {
    if (count >= 40) return { label: 'Unstoppable', emoji: '🚀', color: '#F59E0B' };
    if (count >= 30) return { label: 'Legend', emoji: '🏆', color: '#8B5CF6' };
    if (count >= 25) return { label: 'Champion', emoji: '💥', color: '#3B82F6' };
    if (count >= 20) return { label: 'Hot Streak', emoji: '🔥', color: '#EF4444' };
    if (count >= 15) return { label: 'Speedster', emoji: '⚡', color: '#10B981' };
    if (count >= 10) return { label: 'Pro', emoji: '⭐', color: '#FCD34D' };
    if (count >= 5) return { label: 'On a roll', emoji: '🎉', color: '#06B6D4' };
    return { label: 'Keep going', emoji: '💪', color: '#6B7280' };
  }

  if (!fontsLoaded || !currentQuestion) {
    return null;
  }

  const progress = ((questionIndex + 1) / totalQuestions) * 100;

  return (
    <View style={styles.container}>
      {showMilestone && (
        <Animated.View
          style={[
            styles.toast,
            { opacity: toastOpacity, transform: [{ translateY: toastTranslateY }] }
          ]}
        >
          <Text style={styles.toastText}>{milestoneMessage}</Text>
        </Animated.View>
      )}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#6B7280" />
        </TouchableOpacity>
        <View style={styles.livesContainer}>
          {Array.from({ length: 3 }).map((_, i) => (
            <View key={i}>
              {i < lives ? <Heart size={28} color="#EF4444" fill="#EF4444" /> : <Heart size={28} color="#E5E7EB" fill="#E5E7EB" />}
            </View>
          ))}
        </View>
        <Animated.View style={[styles.streakBadge, { transform: [{ scale: streakPulse }] }]}>
          <Zap size={18} color="#F59E0B" fill="#F59E0B" />
          <Text style={styles.streakText}>{streak}</Text>
        </Animated.View>
      </View>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${progress}%` }]} />
      </View>
      <Text style={styles.questionCounter}>Question {questionIndex + 1} of {totalQuestions}</Text>
      <Animated.View style={[
        styles.questionCard,
        feedback === 'correct' ? styles.questionCardFeedbackCorrect : feedback === 'wrong' ? styles.questionCardFeedbackWrong : null,
        { transform: [{ scale: scaleAnim }] }
      ]}>
        <Text style={styles.questionText}>
          {feedback ? String(currentQuestion.correctAnswer) : `${currentQuestion.num1} × ${currentQuestion.num2} = ?`}
        </Text>
        {feedback && <Text style={styles.cardFeedbackText}>{feedback === 'correct' ? "that's correct" : 'This is the correct answer'}</Text>}
      </Animated.View>
      <View style={styles.optionsContainer}>
        {currentQuestion.options.map((option, index) => {
          const isCorrect = option === currentQuestion.correctAnswer;
          const isSelected = option === selectedAnswer;
          const showResult = feedback !== null;
          let buttonStyle = styles.optionButton;
          let textStyle = styles.optionText;
          if (showResult) {
            if (isCorrect) {
              buttonStyle = { ...styles.optionButton, borderColor: '#10B981', backgroundColor: '#ECFDF5' };
              textStyle = { ...styles.optionText, color: '#065F46' };
            } else if (isSelected) {
              buttonStyle = { ...styles.optionButton, borderColor: '#EF4444', backgroundColor: '#FEF2F2' };
              textStyle = { ...styles.optionText, color: '#991B1B' };
            } else {
              buttonStyle = { ...styles.optionButton, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF', opacity: 0.6 };
              textStyle = { ...styles.optionText, color: '#6B7280' };
            }
          }
          return (
            <TouchableOpacity
              key={index}
              style={buttonStyle}
              onPress={() => handleAnswer(option)}
              disabled={feedback !== null}
              activeOpacity={0.8}
            >
              <Text style={textStyle}>{option}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={styles.scoreContainer}>
        <Text style={styles.scoreLabel}>Score</Text>
        <Text style={styles.scoreValue}>{score}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingTop: 50,
  },
  toast: {
    position: 'absolute',
    top: 12,
    left: 20,
    right: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#111827',
    borderRadius: 16,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Nunito_800ExtraBold',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  livesContainer: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
    justifyContent: 'center',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  streakText: {
    fontSize: 16,
    fontFamily: 'Nunito_800ExtraBold',
    color: '#92400E',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 20,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  questionCounter: {
    fontSize: 14,
    fontFamily: 'Nunito_700Bold',
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    padding: 40,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 40,
  },
  questionCardFeedbackCorrect: {
    borderWidth: 4,
    borderColor: '#10B981',
    paddingVertical: 48,
  }, questionCardFeedbackWrong: {
    borderWidth: 4,
    borderColor: '#EF4444',
    paddingVertical: 48,
  },
  questionText: {
    fontSize: 48,
    fontFamily: 'Nunito_800ExtraBold',
    color: '#1F2937',
    textAlign: 'center',
  },
  cardFeedbackText: {
    fontSize: 18,
    fontFamily: 'Nunito_700Bold',
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
  },
  optionsContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  optionButton: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 32,
    fontFamily: 'Nunito_800ExtraBold',
    color: '#1F2937',
  }, 
  scoreContainer: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 14,
    fontFamily: 'Nunito_700Bold',
    color: '#6B7280',
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 28,
    fontFamily: 'Nunito_800ExtraBold',
    color: '#10B981',
  },
});