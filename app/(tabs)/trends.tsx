import { StyleSheet, ScrollView, RefreshControl, Dimensions } from 'react-native';
import { useState, useEffect, useCallback } from 'react';

import { Text, View } from '@/components/Themed';
import { TrendChart } from '@/components/TrendChart';
import { StatSummary } from '@/components/StatSummary';
import { getSyncUrl } from '@/lib/syncConfig';
const { width } = Dimensions.get('window');

type DailyMetrics = {
  day: string;
  steps: number;
  restingHeartRate: number | null;
  bodyBattery: number | null;
  sleepSeconds: number | null;
  hrvStatus: string | null;
};

export default function TrendsScreen() {
  const [metrics, setMetrics] = useState<DailyMetrics[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const syncUrl = await getSyncUrl();
      const res = await fetch(`${syncUrl}/daily`);
      const data = await res.json();
      // Reverse to get chronological order
      setMetrics((data.items || []).slice().reverse());
    } catch (err) {
      setError('Unable to load trend data');
      console.error('Fetch error:', err);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculate averages
  const avgSteps = metrics.length > 0 
    ? Math.round(metrics.reduce((sum, m) => sum + m.steps, 0) / metrics.length)
    : 0;
  
  const avgSleep = metrics.length > 0
    ? Math.round(metrics.reduce((sum, m) => sum + (m.sleepSeconds || 0), 0) / metrics.length / 60)
    : 0;
  
  const avgRHR = metrics.filter(m => m.restingHeartRate).length > 0
    ? Math.round(metrics.filter(m => m.restingHeartRate).reduce((sum, m) => sum + (m.restingHeartRate || 0), 0) / metrics.filter(m => m.restingHeartRate).length)
    : 0;

  // Prepare chart data
  const stepsData = metrics.map(m => ({ day: m.day.slice(5), value: m.steps }));
  const sleepData = metrics.map(m => ({ day: m.day.slice(5), value: Math.round((m.sleepSeconds || 0) / 3600 * 10) / 10 }));
  const rhrData = metrics.filter(m => m.restingHeartRate).map(m => ({ day: m.day.slice(5), value: m.restingHeartRate || 0 }));

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }>
      <View style={styles.header}>
        <Text style={styles.title}>Trends</Text>
        <Text style={styles.subtitle}>Last {metrics.length} days</Text>
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.summaryRow}>
        <StatSummary
          label="Avg Steps"
          value={avgSteps.toLocaleString()}
          change="+5%"
          positive
        />
        <StatSummary
          label="Avg Sleep"
          value={`${Math.floor(avgSleep / 60)}h ${avgSleep % 60}m`}
          change="-2%"
          positive={false}
        />
        <StatSummary
          label="Avg RHR"
          value={`${avgRHR} bpm`}
          change="-3 bpm"
          positive
        />
      </View>

      {metrics.length > 0 ? (
        <View style={styles.chartsContainer}>
          <TrendChart
            title="Steps"
            data={stepsData}
            color="#007AFF"
            unit=""
            goal={10000}
          />
          <TrendChart
            title="Sleep (hours)"
            data={sleepData}
            color="#5856D6"
            unit="h"
          />
          {rhrData.length > 0 && (
            <TrendChart
              title="Resting Heart Rate"
              data={rhrData}
              color="#FF3B30"
              unit=" bpm"
            />
          )}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No trend data yet</Text>
          <Text style={styles.emptySubtext}>
            Sync with Garmin Connect to see your trends
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 17,
    opacity: 0.6,
    marginTop: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  chartsContainer: {
    padding: 16,
    gap: 20,
  },
  errorBox: {
    margin: 16,
    padding: 12,
    backgroundColor: '#FF3B3020',
    borderRadius: 8,
  },
  errorText: {
    color: '#FF3B30',
    textAlign: 'center',
  },
  emptyState: {
    padding: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    opacity: 0.6,
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.4,
    marginTop: 8,
    textAlign: 'center',
  },
});
