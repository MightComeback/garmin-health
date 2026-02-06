import { StyleSheet, ScrollView, RefreshControl, View } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { Text } from '@/components/Themed';
import { SkeletonList } from '@/components/Skeleton';
import { TrendChart } from '@/components/TrendChart';
import { getSyncUrl } from '@/lib/syncConfig';

type TrendsData = {
  period: number;
  latest: any;
  trend: {
    hrv?: number;
    stress?: number;
    bodyBattery: number[];
    sleep: Array<{
      day: string;
      score: number | null;
      duration: number | null;
      deepRatio: number | null;
      quality: string;
    }>;
    avgSteps: number;
  } | null;
  recent: Array<any>;
};

export default function TrendsScreen() {
  const [trends, setTrends] = useState<TrendsData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTrends = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const syncUrl = await getSyncUrl();
      const res = await fetch(`${syncUrl}/trends?days=30`);
      const data = await res.json();
      setTrends(data);
    } catch (err) {
      setError('Unable to load trends');
      console.error('Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTrends();
    setRefreshing(false);
  }, [fetchTrends]);

  useEffect(() => {
    fetchTrends();
  }, [fetchTrends]);

  if (isLoading) {
    return <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <SkeletonList count={6} />
    </ScrollView>;
  }

  const recent = trends?.recent || [];
  const stepsData = recent.map(d => ({ day: d.day.slice(5,10), value: d.steps || 0 }));
  const batteryData = recent.map(d => ({ day: d.day.slice(5,10), value: d.bodyBattery || 0 }));
  const sleepData = recent.map(d => ({ day: d.day.slice(5,10), value: (d.sleepSeconds || 0) / 3600 }));

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Trends</Text>
        <Text style={styles.subtitle}>30-Day Health Overview</Text>
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {trends?.trend && (
        <>
          <View style={styles.metricCard}>
            <Text style={styles.sectionTitle}>Average Steps</Text>
            <Text style={styles.metricValue}>
              {Math.round(trends.trend.avgSteps).toLocaleString()}
            </Text>
          </View>

          <TrendChart title="Steps" data={stepsData} color="#007AFF" goal={10000} unit=" steps" />
          <TrendChart title="Body Battery" data={batteryData} color="#34C759" goal={70} unit="%" />
          <TrendChart title="Sleep Hours" data={sleepData} color="#5856D6" goal={7} unit="h" />

          <View style={styles.recentList}>
            <Text style={styles.sectionTitle}>Recent Days</Text>
            {recent.slice(0, 7).map((day, i) => (
              <View key={i} style={styles.dayRow}>
                <Text style={styles.dayLabel}>{day.day.slice(5)}</Text>
                <Text style={styles.daySteps}>
                  {day.steps?.toLocaleString() || '--'} steps
                </Text>
                <Text style={styles.dayBattery}>
                  {day.bodyBattery || '--'}%
                </Text>
              </View>
            ))}
          </View>
        </>
      )}

      {(!trends || !trends.trend) && !error && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No trends data yet</Text>
          <Text style={styles.emptySubtext}>Sync more days to see trends</Text>
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
  section: {
    padding: 20,
    margin: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    opacity: 0.7,
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  metricCard: {
    padding: 20,
    margin: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  recentList: {
    padding: 16,
    margin: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dayLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  daySteps: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  dayBattery: {
    fontSize: 16,
    textAlign: 'right',
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
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