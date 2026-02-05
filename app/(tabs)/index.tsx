import { StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useState, useEffect, useCallback } from 'react';

import { Text, View } from '@/components/Themed';
import { MetricCard } from '@/components/MetricCard';
import { SyncStatus } from '@/components/SyncStatus';
import { WeeklySummary } from '@/components/WeeklySummary';
import { Skeleton, SkeletonList } from '@/components/Skeleton';
import { getSyncUrl } from '@/lib/syncConfig';

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

type WeeklyMetrics = {
  steps: number[];
  sleepSeconds: (number | null)[];
  restingHRs: (number | null)[];
};

export default function TodayScreen() {
  const [metrics, setMetrics] = useState<DailyMetrics | null>(null);
  const [weeklyMetrics, setWeeklyMetrics] = useState<WeeklyMetrics>({ steps: [], sleepSeconds: [], restingHRs: [] });
  const [syncStatus, setSyncStatus] = useState<SyncStatusData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ activities: number; days: number } | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);
    try {
      const syncUrl = await getSyncUrl();

      // Fetch sync status
      const statusRes = await fetch(`${syncUrl}/health`);
      const status = await statusRes.json();
      setSyncStatus(status);

      // Fetch daily metrics for today and weekly summary
      const dailyRes = await fetch(`${syncUrl}/daily`);
      const daily = await dailyRes.json();

      if (daily.items && daily.items.length > 0) {
        setMetrics(daily.items[0]);

        // Calculate weekly metrics from last 7 days
        const last7Days = daily.items.slice(0, 7);
        setWeeklyMetrics({
          steps: last7Days.map((d: DailyMetrics) => d.steps || 0),
          sleepSeconds: last7Days.map((d: DailyMetrics) => d.sleepSeconds),
          restingHRs: last7Days.map((d: DailyMetrics) => d.restingHeartRate),
        });
      }

      // Fetch last sync time from sync log
      const syncLogRes = await fetch(`${syncUrl}/sync/status`);
      const syncLog = await syncLogRes.json();
      if (syncLog.recent && syncLog.recent.length > 0) {
        const lastSync = syncLog.recent.find((s: { status: string }) => s.status === 'success');
        if (lastSync) {
          setLastSyncTime(lastSync.endedAt || lastSync.startedAt);
        }
      }
    } catch (err) {
      setError('Unable to connect to sync service');
      console.error('Fetch error:', err);
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
      setIsInitialLoad(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  const handleSync = useCallback(async () => {
    try {
      setIsSyncing(true);
      setError(null);
      setIsLoading(true);
      const syncUrl = await getSyncUrl();

      const res = await fetch(`${syncUrl}/sync`, { method: 'POST' });
      const data = await res.json();

      if (data.ok) {
        setSyncResult(data.synced);
        setLastSyncTime(new Date().toISOString());
        // Refresh metrics after sync
        await fetchData(true);
      } else {
        setError('Sync failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      setError('Sync failed: Unable to connect to sync service');
      console.error('Sync error:', err);
    } finally {
      setIsSyncing(false);
      setIsLoading(false);
    }
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const isSkeletonLoading = isInitialLoad || isLoading;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }>
      <View style={styles.header}>
        <Text style={styles.title}>Today</Text>
        <Text style={styles.date}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
      </View>

      {isSkeletonLoading ? (
        <SkeletonList count={4} />
      ) : (
        <>
          <WeeklySummary
            steps={weeklyMetrics.steps}
            sleepSeconds={weeklyMetrics.sleepSeconds}
            restingHRs={weeklyMetrics.restingHRs}
          />

          <SyncStatus
            configured={syncStatus?.garminConfigured ?? false}
            authenticated={syncStatus?.garminAuthenticated ?? false}
            isSyncing={isSyncing}
            onSync={handleSync}
            lastSyncTime={lastSyncTime}
          />

          {syncResult && (
            <View style={styles.successBox}>
              <Text style={styles.successText}>
                Synced {syncResult.activities} activities, {syncResult.days} days
              </Text>
            </View>
          )}

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.metricsGrid}>
            <MetricCard
              icon="blind"
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
              icon="heartbeat"
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
              icon="heart"
              label="HRV Status"
              value={metrics?.hrvStatus || '--'}
              subtitle="Recovery"
              color="#FF9500"
            />
          </View>
        </>
      )}

      {!isSkeletonLoading && (
        <View style={styles.hintBox}>
          <Text style={styles.hintText}>
            Pull down to refresh. Tap the sync button when connected to sync service.
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
  successBox: {
    margin: 16,
    padding: 12,
    backgroundColor: '#34C75920',
    borderRadius: 8,
  },
  successText: {
    color: '#34C759',
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
