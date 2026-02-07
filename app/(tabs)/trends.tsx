import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { WeeklySummary } from '@/components/WeeklySummary';
import { fetchSyncJson } from '@/lib/syncApi';

type DailyMetric = {
  date: string;
  steps: number | null;
  resting_heart_rate: number | null;
  body_battery: number | null;
  sleep_seconds: number | null;
  hrv_status: string | null;
};

type DailyResponse = {
  items: DailyMetric[];
};

function formatDate(value: string): string {
  const date = new Date(value);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatSleep(seconds: number | null): string {
  if (!seconds) return '--';
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}

export default function Trends() {
  const [metrics, setMetrics] = useState<DailyMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetchSyncJson<DailyResponse>('/daily');
        if (isActive) {
          setMetrics(response.items || []);
        }
      } catch (err) {
        if (!isActive) return;
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Unable to load trends');
        }
      } finally {
        if (isActive) setLoading(false);
      }
    };
    load();
    return () => {
      isActive = false;
    };
  }, []);

  const orderedMetrics = useMemo(() => [...metrics].reverse(), [metrics]);
  const steps = orderedMetrics.map(item => item.steps ?? 0);
  const sleepSeconds = orderedMetrics.map(item => item.sleep_seconds);
  const restingHRs = orderedMetrics.map(item => item.resting_heart_rate);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Trends</Text>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>Failed to load trends: {error}</Text>
        </View>
      ) : metrics.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No recent metrics available</Text>
        </View>
      ) : (
        <>
          <WeeklySummary steps={steps} sleepSeconds={sleepSeconds} restingHRs={restingHRs} />
          <View style={styles.list}>
            {orderedMetrics.map((item) => (
              <View key={item.date} style={styles.row}>
                <Text style={styles.date}>{formatDate(item.date)}</Text>
                <Text style={styles.value}>{item.steps?.toLocaleString() || '--'} steps</Text>
                <Text style={styles.value}>{formatSleep(item.sleep_seconds)}</Text>
                <Text style={styles.value}>
                  {item.resting_heart_rate ? `${Math.round(item.resting_heart_rate)} bpm` : '--'}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f7',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1d1d1f',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  row: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  date: {
    fontSize: 13,
    color: '#6e6e73',
    marginBottom: 6,
  },
  value: {
    fontSize: 14,
    color: '#1d1d1f',
    marginBottom: 2,
  },
  center: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 15,
    color: '#b3261e',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#86868b',
  },
});
