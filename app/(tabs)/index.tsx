import { StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useState, useEffect, useCallback } from 'react';

import { Text, View } from '@/components/Themed';
import { MetricCard } from '@/components/MetricCard';
import { SyncStatus } from '@/components/SyncStatus';

const SYNC_API_URL = 'http://127.0.0.1:17890';

type DailyMetrics = {
  day: string;
  steps: number;
  restingHeartRate: number | null;
  bodyBattery: number | null;
  sleepSeconds: number | null;
  hrvStatus: string | null;
};

type SyncStatusData = {
  ok: boolean;
  garminConfigured: boolean;
  garminAuthenticated: boolean;
};

function formatDuration(seconds: number | null): string {
  if (!seconds) return '--';
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}

function formatSteps(steps: number): string {
  if (steps >= 1000) {
    return `${(steps / 1000).toFixed(1)}k`;
  }
  return String(steps);
}

export default function TodayScreen() {
  const [metrics, setMetrics] = useState<DailyMetrics | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatusData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      
      // Fetch sync status
      const statusRes = await fetch(`${SYNC_API_URL}/health`);
      const status = await statusRes.json();
      setSyncStatus(status);

      // Fetch today's metrics
      const dailyRes = await fetch(`${SYNC_API_URL}/daily`);
      const daily = await dailyRes.json();
      
      if (daily.items && daily.items.length > 0) {
        setMetrics(daily.items[0]);
      }
    } catch (err) {
      setError('Unable to connect to sync service');
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

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }>
      <View style={styles.header}>
        <Text style={styles.title}>Today</Text>
        <Text style={styles.date}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
      </View>

      <SyncStatus 
        configured={syncStatus?.garminConfigured ?? false}
        authenticated={syncStatus?.garminAuthenticated ?? false}
      />

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.metricsGrid}>
        <MetricCard
          icon="shoe-prints"
          label="Steps"
          value={metrics?.steps ? formatSteps(metrics.steps) : '--'}
          subtitle="Daily goal: 10k"
          color="#007AFF"
        />
        <MetricCard
          icon="bed"
          label="Sleep"
          value={formatDuration(metrics?.sleepSeconds ?? null)}
          subtitle="Last night"
          color="#5856D6"
        />
        <MetricCard
          icon="heart"
          label="Resting HR"
          value={metrics?.restingHeartRate ? `${metrics.restingHeartRate} bpm` : '--'}
          subtitle="Heart rate"
          color="#FF3B30"
        />
        <MetricCard
          icon="battery-full"
          label="Body Battery"
          value={metrics?.bodyBattery ? `${metrics.bodyBattery}%` : '--'}
          subtitle="Energy level"
          color="#34C759"
        />
        <MetricCard
          icon="wave-square"
          label="HRV Status"
          value={metrics?.hrvStatus || '--'}
          subtitle="Recovery"
          color="#FF9500"
        />
      </View>

      <View style={styles.hintBox}>
        <Text style={styles.hintText}>
          Pull down to refresh. Tap the sync button when connected to sync service.
        </Text>
      </View>
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
  date: {
    fontSize: 17,
    opacity: 0.6,
    marginTop: 4,
  },
  metricsGrid: {
    padding: 16,
    gap: 12,
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
  hintBox: {
    padding: 20,
    alignItems: 'center',
  },
  hintText: {
    fontSize: 13,
    opacity: 0.5,
    textAlign: 'center',
  },
});
