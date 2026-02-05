import { StyleSheet, ScrollView, RefreshControl, View } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { Text } from '@/components/Themed';
import { SkeletonList } from '@/components/Skeleton';
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
  const [trends, setTrends] = useState&lt;TrendsData | null&gt;(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState&lt;string | null&gt;(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTrends = useCallback(async () =&gt; {
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

  const onRefresh = useCallback(async () =&gt; {
    setRefreshing(true);
    await fetchTrends();
    setRefreshing(false);
  }, [fetchTrends]);

  useEffect(() =&gt; {
    fetchTrends();
  }, [fetchTrends]);

  if (isLoading) {
    return &lt;ScrollView refreshControl={&lt;RefreshControl refreshing={refreshing} onRefresh={onRefresh} /&gt;}&gt;
      &lt;SkeletonList count={6} /&gt;
    &lt;/ScrollView&gt;;
  }

  return (
    &lt;ScrollView
      style={styles.container}
      refreshControl={&lt;RefreshControl refreshing={refreshing} onRefresh={onRefresh} /&gt;}
    &gt;
      &lt;View style={styles.header}&gt;
        &lt;Text style={styles.title}&gt;Trends&lt;/Text&gt;
        &lt;Text style={styles.subtitle}&gt;30-Day Health Overview&lt;/Text&gt;
      &lt;/View&gt;

      {error &amp;&amp; (
        &lt;View style={styles.errorBox}&gt;
          &lt;Text style={styles.errorText}&gt;{error}&lt;/Text&gt;
        &lt;/View&gt;
      )}

      {trends?.trend &amp;&amp; (
        &lt;&gt;
          &lt;View style={styles.section}&gt;
            &lt;Text style={styles.sectionTitle}&gt;Average Steps&lt;/Text&gt;
            &lt;Text style={styles.metricValue}&gt;
              {Math.round(trends.trend.avgSteps).toLocaleString()}
            &lt;/Text&gt;
          &lt;/View&gt;

          &lt;View style={styles.section}&gt;
            &lt;Text style={styles.sectionTitle}&gt;Average Stress&lt;/Text&gt;
            &lt;Text style={styles.metricValue}&gt;
              {trends.trend.stress?.toFixed(1) || '--'}
            &lt;/Text&gt;
          &lt;/View&gt;

          &lt;View style={styles.section}&gt;
            &lt;Text style={styles.sectionTitle}&gt;Sleep Quality (Avg)&lt;/Text&gt;
            &lt;Text style={styles.metricValue}&gt;
              {trends.trend.sleep
                ?.reduce((sum, s) =&gt; sum + (s.quality === 'excellent' ? 4 : s.quality === 'good' ? 3 : s.quality === 'fair' ? 2 : 1), 0) /
                trends.trend.sleep.length || 0 | 0}
              /4
            &lt;/Text&gt;
          &lt;/View&gt;

          &lt;View style={styles.recentList}&gt;
            &lt;Text style={styles.sectionTitle}&gt;Recent Days&lt;/Text&gt;
            {trends.recent.slice(0, 7).map((day, i) =&gt; (
              &lt;View key={i} style={styles.dayRow}&gt;
                &lt;Text style={styles.dayLabel}&gt;{day.day.slice(5)}&lt;/Text&gt;
                &lt;Text style={styles.daySteps}&gt;
                  {day.steps?.toLocaleString() || '--'} steps
                &lt;/Text&gt;
                &lt;Text style={styles.dayBattery}&gt;
                  {day.bodyBattery || '--'}%
                &lt;/Text&gt;
              &lt;/View&gt;
            ))}
          &lt;/View&gt;
        &lt;/&gt;
      )}

      {(!trends || !trends.trend) &amp;&amp; !error &amp;&amp; (
        &lt;View style={styles.emptyState}&gt;
          &lt;Text style={styles.emptyText}&gt;No trends data yet&lt;/Text&gt;
          &lt;Text style={styles.emptySubtext}&gt;Sync more days to see trends&lt;/Text&gt;
        &lt;/View&gt;
      )}
    &lt;/ScrollView&gt;
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
