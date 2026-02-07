import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface WeeklySummaryProps {
  steps: number[];
  sleepSeconds: number[];
  restingHRs: number[];
}

function average(arr: number[]): number {
  const valid = arr.filter(v => v > 0);
  return valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : 0;
}

function formatAvgSteps(stepsAvg: number): string {
  return stepsAvg ? Math.round(stepsAvg).toLocaleString() : '--';
}

function formatAvgSleep(secondsAvg: number): string {
  if (!secondsAvg) return '--';
  const hours = Math.floor(secondsAvg / 3600);
  const mins = Math.floor((secondsAvg % 3600) / 60);
  return `${hours}h ${Math.round(mins)}m`;
}

function formatAvgHR(hrAvg: number): string {
  return hrAvg ? `${Math.round(hrAvg)} bpm` : '--';
}

export function WeeklySummary({ steps, sleepSeconds, restingHRs }: WeeklySummaryProps) {
  const avgSteps = average(steps);
  const avgSleep = average(sleepSeconds);
  const avgHR = average(restingHRs);

  return (
    <View style={styles.container}>
      <View style={styles.summaryRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Avg Steps</Text>
          <Text style={styles.metricValue}>{formatAvgSteps(avgSteps)}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Avg Sleep</Text>
          <Text style={styles.metricValue}>{formatAvgSleep(avgSleep)}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Avg RHR</Text>
          <Text style={styles.metricValue}>{formatAvgHR(avgHR)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  metricCard: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    fontSize: 12,
    color: '#86868b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1d1d1f',
  },
});
