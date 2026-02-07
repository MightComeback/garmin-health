import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { fetchSyncJson } from '@/lib/syncApi';

type ActivityListItem = {
  activityId?: number | string;
  id?: number | string;
  activityName?: string;
  name?: string;
  activityType?: { typeKey?: string; typeName?: string };
  startTimeLocal?: string;
  startTimeGMT?: string;
  startDateLocal?: string;
  distance?: number;
  duration?: number;
  calories?: number;
  summary?: {
    distance?: number;
    duration?: number;
    totalCalories?: number;
    activeCalories?: number;
  };
};

type ActivitiesResponse = {
  ok: boolean;
  activities: ActivityListItem[];
  count: number;
};

function formatDateTime(value?: string): string {
  if (!value) return 'Unknown date';
  const date = new Date(value);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDuration(seconds?: number): string {
  if (!seconds && seconds !== 0) return '--';
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function formatDistance(meters?: number): string {
  if (!meters && meters !== 0) return '--';
  if (meters >= 1000) return `${(meters / 1000).toFixed(2)} km`;
  return `${Math.round(meters)} m`;
}

function formatType(activity: ActivityListItem): string {
  const typeKey = activity.activityType?.typeName || activity.activityType?.typeKey;
  if (typeKey) return typeKey.replace(/_/g, ' ');
  return 'Workout';
}

export default function Workouts() {
  const [activities, setActivities] = useState<ActivityListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetchSyncJson<ActivitiesResponse>('/activities');
        if (isActive) {
          setActivities(response.activities || []);
        }
      } catch (err) {
        if (!isActive) return;
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Unable to load workouts');
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

  const content = useMemo(() => {
    if (loading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.center}>
          <Text style={styles.errorText}>Failed to load workouts: {error}</Text>
        </View>
      );
    }

    if (!activities.length) {
      return (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No workouts yet</Text>
        </View>
      );
    }

    return (
      <View style={styles.list}>
        {activities.map((activity, index) => {
          const id = activity.activityId ?? activity.id;
          const name = activity.activityName || activity.name || formatType(activity);
          const startDate =
            activity.startTimeLocal || activity.startDateLocal || activity.startTimeGMT;
          const distance = activity.distance ?? activity.summary?.distance;
          const duration = activity.duration ?? activity.summary?.duration;
          const calories = activity.calories ?? activity.summary?.totalCalories ?? activity.summary?.activeCalories;

          const card = (
            <View style={styles.card} key={`${id ?? 'activity'}-${index}`}>
              <View style={styles.cardHeader}>
                <Text style={styles.name}>{name}</Text>
                <Text style={styles.type}>{formatType(activity)}</Text>
              </View>
              <Text style={styles.date}>{formatDateTime(startDate)}</Text>
              <View style={styles.metrics}>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Distance</Text>
                  <Text style={styles.metricValue}>{formatDistance(distance)}</Text>
                </View>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Duration</Text>
                  <Text style={styles.metricValue}>{formatDuration(duration)}</Text>
                </View>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Calories</Text>
                  <Text style={styles.metricValue}>{calories ? Math.round(calories).toLocaleString() : '--'}</Text>
                </View>
              </View>
            </View>
          );

          if (!id) return card;

          return (
            <Link key={`${id}-${index}`} href={`/activity/${id}`} asChild>
              <Pressable>{card}</Pressable>
            </Link>
          );
        })}
      </View>
    );
  }, [activities, error, loading]);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Workouts</Text>
      {content}
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
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  name: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1d1d1f',
    flex: 1,
  },
  type: {
    fontSize: 12,
    color: '#6e6e73',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  date: {
    marginTop: 6,
    fontSize: 13,
    color: '#86868b',
  },
  metrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  metric: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 11,
    color: '#86868b',
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1d1d1f',
    marginTop: 2,
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
