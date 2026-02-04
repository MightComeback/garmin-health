import { StyleSheet, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { Text } from './Themed';

type WeeklySummaryProps = {
  steps: number[];
  sleepSeconds: (number | null)[];
  restingHRs: (number | null)[];
};

function calculateTrend(values: number[]): 'up' | 'down' | 'flat' {
  if (values.length < 3) return 'flat';
  const firstHalf = values.slice(0, Math.floor(values.length / 2));
  const secondHalf = values.slice(Math.floor(values.length / 2));
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  const diff = ((secondAvg - firstAvg) / firstAvg) * 100;
  if (diff > 5) return 'up';
  if (diff < -5) return 'down';
  return 'flat';
}

function formatTrend(trend: 'up' | 'down' | 'flat', invert = false): { icon: string; color: string; text: string } {
  const isUp = invert ? trend === 'down' : trend === 'up';
  const isDown = invert ? trend === 'up' : trend === 'down';
  
  if (isUp) return { icon: 'arrow-up', color: '#34C759', text: '↑' };
  if (isDown) return { icon: 'arrow-down', color: '#FF3B30', text: '↓' };
  return { icon: 'minus', color: '#8E8E93', text: '→' };
}

export function WeeklySummary({ steps, sleepSeconds, restingHRs }: WeeklySummaryProps) {
  // Calculate averages
  const avgSteps = steps.length > 0 ? Math.round(steps.reduce((a, b) => a + b, 0) / steps.length) : 0;
  const validSleep = sleepSeconds.filter((s): s is number => s !== null);
  const avgSleep = validSleep.length > 0 
    ? validSleep.reduce((a, b) => a + b, 0) / validSleep.length 
    : 0;
  const validHR = restingHRs.filter((hr): hr is number => hr !== null);
  const avgHR = validHR.length > 0 
    ? Math.round(validHR.reduce((a, b) => a + b, 0) / validHR.length) 
    : 0;

  // Calculate trends
  const stepsTrend = calculateTrend(steps);
  const sleepTrend = calculateTrend(validSleep);
  const hrTrend = calculateTrend(validHR);

  const stepsTrendInfo = formatTrend(stepsTrend);
  const sleepTrendInfo = formatTrend(sleepTrend);
  const hrTrendInfo = formatTrend(hrTrend, true); // Invert for HR (lower is better)

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Last 7 Days</Text>
      
      <View style={styles.row}>
        <View style={styles.stat}>
          <View style={styles.iconRow}>
            <FontAwesome name="blind" size={14} color="#007AFF" />
            <Text style={[styles.trendText, { color: stepsTrendInfo.color }]}>
              {stepsTrendInfo.text}
            </Text>
          </View>
          <Text style={styles.value}>{avgSteps.toLocaleString()}</Text>
          <Text style={styles.label}>avg steps</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.stat}>
          <View style={styles.iconRow}>
            <FontAwesome name="bed" size={14} color="#5856D6" />
            <Text style={[styles.trendText, { color: sleepTrendInfo.color }]}>
              {sleepTrendInfo.text}
            </Text>
          </View>
          <Text style={styles.value}>
            {avgSleep > 0 ? `${Math.floor(avgSleep / 3600)}h${Math.floor((avgSleep % 3600) / 60)}m` : '--'}
          </Text>
          <Text style={styles.label}>avg sleep</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.stat}>
          <View style={styles.iconRow}>
            <FontAwesome name="heartbeat" size={14} color="#FF3B30" />
            <Text style={[styles.trendText, { color: hrTrendInfo.color }]}>
              {hrTrendInfo.text}
            </Text>
          </View>
          <Text style={styles.value}>{avgHR > 0 ? `${avgHR} bpm` : '--'}</Text>
          <Text style={styles.label}>avg RHR</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#00000008',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
    opacity: 0.8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  value: {
    fontSize: 17,
    fontWeight: 'bold',
  },
  label: {
    fontSize: 12,
    opacity: 0.5,
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: '#00000010',
  },
});
