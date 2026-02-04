import { StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';

import { Text, View } from '@/components/Themed';
import { ActivityRow } from '@/components/ActivityRow';
import { getSyncUrl } from '@/lib/syncConfig';

type Activity = {
  id: string;
  startTime: string;
  type: string;
  name: string;
  distanceMeters: number;
  durationSeconds: number;
  calories: number;
};

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`;
  }
  return `${Math.round(meters)} m`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getActivityIcon(type: string): string {
  const icons: Record<string, string> = {
    running: 'running',
    cycling: 'bicycle',
    swimming: 'swimmer',
    walking: 'walking',
    hiking: 'hiking',
    strength: 'dumbbell',
    yoga: 'spa',
    default: 'heartbeat',
  };
  return icons[type.toLowerCase()] || icons.default;
}

export default function WorkoutsScreen() {
  const router = useRouter();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = useCallback(async () => {
    try {
      setError(null);
      const syncUrl = await getSyncUrl();
      const res = await fetch(`${syncUrl}/activities`);
      const data = await res.json();
      setActivities(data.items || []);
    } catch (err) {
      setError('Unable to load activities');
      console.error('Fetch error:', err);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchActivities();
    setRefreshing(false);
  }, [fetchActivities]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const renderItem = ({ item }: { item: Activity }) => (
    <ActivityRow
      icon={getActivityIcon(item.type)}
      title={item.name}
      subtitle={`${formatDate(item.startTime)} • ${item.type}`}
      stats={[
        { label: 'Duration', value: formatDuration(item.durationSeconds) },
        { label: 'Distance', value: formatDistance(item.distanceMeters) },
        { label: 'Calories', value: `${Math.round(item.calories)}` },
      ]}
      onPress={() => router.push(`/activity/${item.id}`)}
    />
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Workouts</Text>
        <Text style={styles.subtitle}>{activities.length} activities</Text>
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlatList
        data={activities}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No activities yet</Text>
            <Text style={styles.emptySubtext}>
              Sync with Garmin Connect to see your workouts here
            </Text>
          </View>
        }
      />
    </View>
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
  list: {
    padding: 16,
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
    padding: 40,
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
