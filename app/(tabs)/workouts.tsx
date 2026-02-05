import { StyleSheet, FlatList, RefreshControl, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { addDays, format, isAfter, isBefore, subDays } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import FontAwesome from '@expo/vector-icons/FontAwesome';

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

type ActivityFilter = 'all' | 'running' | 'cycling' | 'walking' | 'strength' | 'swimming' | 'other';

type DateRangeFilter = 'all' | 'today' | 'week' | 'month';

const FILTER_OPTIONS: { key: ActivityFilter; label: string; icon: string }[] = [
  { key: 'all', label: 'All', icon: 'list' },
  { key: 'running', label: 'Run', icon: 'running' },
  { key: 'cycling', label: 'Cycle', icon: 'bicycle' },
  { key: 'walking', label: 'Walk', icon: 'walking' },
  { key: 'strength', label: 'Strength', icon: 'dumbbell' },
  { key: 'swimming', label: 'Swim', icon: 'swimmer' },
  { key: 'other', label: 'Other', icon: 'heartbeat' },
];

const DATE_RANGE_OPTIONS: { key: DateRangeFilter; label: string }[] = [
  { key: 'all', label: 'All time' },
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This week' },
  { key: 'month', label: 'This month' },
];

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
  const [activeFilter, setActiveFilter] = useState<ActivityFilter>('all');
  const [activeDateRange, setActiveDateRange] = useState<DateRangeFilter>('all');
  const [customStartDate, setCustomStartDate] = useState<string | null>(null);
  const [customEndDate, setCustomEndDate] = useState<string | null>(null);

  const filteredActivities = activities.filter(act => {
    // Activity type filter
    if (activeFilter === 'all') return true;
    if (activeFilter === 'other') {
      return !['running', 'cycling', 'walking', 'strength', 'swimming'].includes(act.type.toLowerCase());
    }
    return act.type.toLowerCase() === activeFilter;
  });

  const filteredByDateRange = filteredActivities.filter(act => {
    const activityDate = new Date(act.startTime);
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    switch (activeDateRange) {
      case 'today':
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return isAfter(activityDate, today) && isBefore(activityDate, tomorrow);

      case 'week':
        const oneWeekAgo = new Date(now);
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        return isAfter(activityDate, oneWeekAgo);

      case 'month':
        const oneMonthAgo = new Date(now);
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        return isAfter(activityDate, oneMonthAgo);

      case 'all':
      default:
        return true;
    }
  });

  const dateFilteredActivities = customStartDate || customEndDate
    ? filteredByDateRange.filter(act => {
        const activityDate = new Date(act.startTime);
        const startDate = customStartDate ? new Date(customStartDate) : undefined;
        const endDate = customEndDate ? new Date(customEndDate) : undefined;

        if (startDate && isBefore(activityDate, startDate)) return false;
        if (endDate && isAfter(activityDate, endDate)) return false;
        return true;
      })
    : filteredByDateRange;

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
        <Text style={styles.subtitle}>
          {dateFilteredActivities.length} of {activities.length} activities
        </Text>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterBar}
      >
        {FILTER_OPTIONS.map(filter => (
          <TouchableOpacity
            key={filter.key}
            style={[styles.filterChip, activeFilter === filter.key && styles.filterChipActive]}
            onPress={() => setActiveFilter(filter.key)}
          >
            <FontAwesome 
              name={filter.icon as any} 
              size={12} 
              color={activeFilter === filter.key ? '#fff' : '#007AFF'} 
              style={styles.filterIcon}
            />
            <Text style={[styles.filterText, activeFilter === filter.key && styles.filterTextActive]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dateFilterBar}
      >
        {DATE_RANGE_OPTIONS.map(option => (
          <TouchableOpacity
            key={option.key}
            style={[styles.dateFilterChip, activeDateRange === option.key && styles.dateFilterChipActive]}
            onPress={() => setActiveDateRange(option.key)}
          >
            <Text
              style={[
                styles.dateFilterText,
                activeDateRange === option.key && styles.dateFilterTextActive,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlatList
        data={dateFilteredActivities}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {activities.length === 0 ? 'No activities yet' : 'No activities match this filter'}
            </Text>
            <Text style={styles.emptySubtext}>
              {activities.length === 0 
                ? 'Sync with Garmin Connect to see your workouts here'
                : 'Try selecting a different filter or sync for more data'}
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
    paddingBottom: 12,
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
  filterBar: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#007AFF15',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#007AFF',
  },
  filterIcon: {
    marginRight: 6,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#007AFF',
  },
  filterTextActive: {
    color: '#fff',
  },
  dateFilterBar: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  dateFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#00000008',
    minWidth: 70,
    alignItems: 'center',
  },
  dateFilterChipActive: {
    backgroundColor: '#007AFF',
  },
  dateFilterText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#007AFF',
  },
  dateFilterTextActive: {
    color: '#fff',
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
