import { View, StyleSheet } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ThemedView } from '@/components/Themed';
import { ThemedText } from '@/components/Themed';

type HealthMetrics = {
  steps: number;
  sleepSeconds: number | null;
  hrvStatus: string | null;
  bodyBattery: number | null;
  avgStressLevel: number | null;
};

function calculateHealthScore(metrics: HealthMetrics): { score: number; label: string; color: string } {
  const { steps, sleepSeconds, hrvStatus, bodyBattery, avgStressLevel } = metrics;

  // Calculate component scores (0-100 each)
  const stepScore = Math.min((steps / 10000) * 100, 100);
  const sleepScore = sleepSeconds
    ? Math.max((sleepSeconds / (8 * 3600)) * 100, (6 * 3600 / (8 * 3600)) * 100)
    : 50; // Default score if no sleep data
  const hrvScore = hrvStatus === 'good' ? 100 : hrvStatus === 'fair' ? 70 : 40;
  const batteryScore = bodyBattery ?? 50;
  const stressScore = avgStressLevel ? Math.max(100 - avgStressLevel, 0) : 50;

  // Weighted calculation: Steps 25%, Sleep 25%, HRV 15%, Body Battery 15%, Stress 20%
  const weightedScore =
    stepScore * 0.25 +
    sleepScore * 0.25 +
    hrvScore * 0.15 +
    batteryScore * 0.15 +
    stressScore * 0.20;

  let label = '';
  let color = '';

  if (weightedScore >= 80) {
    label = 'Excellent';
    color = '#34C759'; // Green
  } else if (weightedScore >= 60) {
    label = 'Good';
    color = '#007AFF'; // Blue
  } else if (weightedScore >= 40) {
    label = 'Fair';
    color = '#FF9500'; // Orange
  } else {
    label = 'Needs Improvement';
    color = '#FF3B30'; // Red
  }

  return {
    score: Math.round(weightedScore),
    label,
    color,
  };
}

interface HealthScoreCardProps {
  metrics: HealthMetrics;
}

export default function HealthScoreCard({ metrics }: HealthScoreCardProps) {
  const { score, label, color } = calculateHealthScore(metrics);

  // Calculate breakdown
  const stepScore = Math.min((metrics.steps / 10000) * 100, 100);
  const sleepScore = metrics.sleepSeconds
    ? Math.max((metrics.sleepSeconds / (8 * 3600)) * 100, (6 * 3600 / (8 * 3600)) * 100)
    : 50;
  const hrvScore = metrics.hrvStatus === 'good' ? 100 : metrics.hrvStatus === 'fair' ? 70 : 40;
  const batteryScore = metrics.bodyBattery ?? 50;
  const stressScore = metrics.avgStressLevel !== null && metrics.avgStressLevel !== undefined
    ? Math.max(100 - metrics.avgStressLevel, 0)
    : 50;

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <FontAwesome name="heart-pulse" size={28} color={color} />
        </View>
        <ThemedText style={styles.label}>Health Score</ThemedText>
      </View>

      <View style={styles.scoreContainer}>
        <ThemedText style={styles.score}>{score}</ThemedText>
        <ThemedText style={styles.label}>{label}</ThemedText>
      </View>

      <View style={styles.breakdown}>
        <BreakdownItem label="Steps" value={`${Math.round(stepScore)}%`} color="#007AFF" />
        <BreakdownItem label="Sleep" value={`${Math.round(sleepScore)}%`} color="#5856D6" />
        <BreakdownItem label="HRV" value={`${Math.round(hrvScore)}%`} color="#FF3B30" />
        <BreakdownItem label="Body Battery" value={`${Math.round(batteryScore)}%`} color="#34C759" />
        <BreakdownItem label="Stress" value={`${Math.round(stressScore)}%`} color="#FF9500" />
      </View>
    </ThemedView>
  );
}

function BreakdownItem({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.breakdownItem}>
      <View style={styles.breakdownLabel}>
        <FontAwesome name="circle" size={4} color={color} />
        <ThemedText style={styles.breakdownText}>{label}</ThemedText>
      </View>
      <ThemedText style={styles.breakdownValue}>{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#00000005',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#00000008',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.6,
    textAlign: 'center',
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  score: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#000',
  },
  breakdown: {
    gap: 12,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  breakdownText: {
    fontSize: 13,
    opacity: 0.6,
  },
  breakdownValue: {
    fontSize: 13,
    fontWeight: '600',
  },
});
