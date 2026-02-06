import { StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useState, useEffect, useCallback } from 'react';

import { Text, View } from '@/components/Themed';
import { MetricCard } from '@/components/MetricCard';
import { SyncStatus } from '@/components/SyncStatus';
import { WeeklySummary } from '@/components/WeeklySummary';
import { HealthScoreCard } from '@/components/HealthScoreCard';
import { SkeletonList } from '@/components/Skeleton';
import { getSyncUrl } from '@/lib/syncConfig';

type DailyMetrics = {
  day: string;
  steps: number | null;
  restingHeartRate: number | null;
  bodyBattery: number | null;
  sleepSeconds: number | null;
  hrvStatus: string | null;
  stress: number | null;
  sleepScore: number | null;
};

type SyncStatusData = {
  ok: boolean;
  garminConfigured: boolean;
  garminAuthenticated: boolean;
};

type WellnessResponse = {
  ok: boolean;
  date: string;
  wellness: {
    restingHeartRate?: number | null;
    sleep?: { duration?: number | null } | null;
    hrvStatus?: string | null;
    bodyBattery?: { value?: number | null } | null;
    stress?: number | null;
    sleepScore?: number | null;
    steps?: number | null;
  };
};

type DailyMetricsResponse = {
  items?: Array<{
    date: string;
    steps: number | null;
    resting_heart_rate: number | null;
    body_battery: number | null;
    sleep_seconds: number | null;
    hrv_status: string | null;
  }>;
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

function formatSleepQuality(sleepScore: number | null, sleepSeconds: number | null): string {
  if (sleepScore !== null && sleepScore !== undefined) {
    return `${Math.round(sleepScore)}%`;
  }
  if (!sleepSeconds) return '--';
  const quality = Math.min((sleepSeconds / (8 * 3600)) * 100, 100);
  return `${Math.round(quality)}%`;
}

function formatStress(stress: number | null, hrvStatus: string | null): string {
  if (stress !== null && stress !== undefined) {
    return `${Math.round(stress)}`;
  }
  if (!hrvStatus) return '--';
  const normalized = hrvStatus.toLowerCase();
  if (normalized.includes('high')) return 'High';
  if (normalized.includes('low')) return 'Low';
  if (normalized.includes('good')) return 'Low';
  if (normalized.includes('fair')) return 'Moderate';
  if (normalized.includes('poor')) return 'High';
  return hrvStatus;
}

function getLocalDateString(date = new Date()): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
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
      const todayDate = getLocalDateString();

      const [statusRes, wellnessRes, dailyRes, syncLogRes] = await Promise.all([
        fetch(`${syncUrl}/health`),
        fetch(`${syncUrl}/wellness/${todayDate}`),
        fetch(`${syncUrl}/daily`),
        fetch(`${syncUrl}/sync/status`),
      ]);

      const status = await statusRes.json();
      setSyncStatus(status);

      const wellnessData = (await wellnessRes.json()) as WellnessResponse;
      const daily = (await dailyRes.json()) as DailyMetricsResponse;

      const dailyItems = daily.items || [];
      const todayDaily = dailyItems.find((item) => item.date === todayDate) || dailyItems[0];

      if (dailyItems.length > 0) {
        const last7Days = dailyItems.slice(0, 7);
        setWeeklyMetrics({
          steps: last7Days.map((d) => d.steps || 0),
          sleepSeconds: last7Days.map((d) => d.sleep_seconds ?? null),
          restingHRs: last7Days.map((d) => d.resting_heart_rate ?? null),
        });
      }

      const wellness = wellnessData.wellness || {};
      const sleepSeconds = wellness.sleep?.duration ?? todayDaily?.sleep_seconds ?? null;
      const restingHeartRate = wellness.restingHeartRate ?? todayDaily?.resting_heart_rate ?? null;
      const steps = wellness.steps ?? todayDaily?.steps ?? null;

      setMetrics({
        day: todayDate,
        steps,
        restingHeartRate,
        bodyBattery: wellness.bodyBattery?.value ?? todayDaily?.body_battery ?? null,
        sleepSeconds,
        hrvStatus: wellness.hrvStatus ?? todayDaily?.hrv_status ?? null,
        stress: wellness.stress ?? null,
        sleepScore: wellness.sleepScore ?? null,
      });

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

          {metrics && (
            <HealthScoreCard
              metrics={{
                steps: metrics.steps ?? 0,
                sleepSeconds: metrics.sleepSeconds,
                hrvStatus: metrics.hrvStatus,
                bodyBattery: metrics.bodyBattery,
                avgStressLevel: metrics.stress,
              }}
            />
          )}

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
              value={metrics?.steps !== null && metrics?.steps !== undefined ? formatSteps(metrics.steps) : '--'}
              subtitle="Today"
              color="#007AFF"
            />
            <MetricCard
              icon="moon-o"
              label="Sleep Quality"
              value={formatSleepQuality(metrics?.sleepScore ?? null, metrics?.sleepSeconds ?? null)}
              subtitle="Last night"
              color="#5856D6"
            />
            <MetricCard
              icon="heartbeat"
              label="Heart Rate"
              value={metrics?.restingHeartRate ? `${Math.round(metrics.restingHeartRate)} bpm` : '--'}
              subtitle="Resting"
              color="#FF3B30"
            />
            <MetricCard
              icon="bolt"
              label="Stress"
              value={formatStress(metrics?.stress ?? null, metrics?.hrvStatus ?? null)}
              subtitle="Daily load"
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
