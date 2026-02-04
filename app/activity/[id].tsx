import { StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { useLocalSearchParams, Stack } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { Text, View } from '@/components/Themed';
import { getSyncUrl } from '@/lib/syncConfig';

type ActivityDetail = {
  id: string;
  name: string;
  type: string;
  startTime: string;
  distanceMeters: number;
  durationSeconds: number;
  calories: number;
  raw: {
    averageSpeed?: number;
    maxSpeed?: number;
    averageHR?: number;
    maxHR?: number;
    elevationGain?: number;
    elevationLoss?: number;
    description?: string;
    locationName?: string;
  } | null;
};

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`;
  }
  return `${Math.round(meters)} m`;
}

function formatPace(seconds: number, meters: number): string {
  if (meters === 0) return '--';
  const pacePerKm = seconds / (meters / 1000);
  const mins = Math.floor(pacePerKm / 60);
  const secs = Math.round(pacePerKm % 60);
  return `${mins}:${secs.toString().padStart(2, '0')} /km`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { 
    weekday: 'long',
    year: 'numeric',
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function ActivityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [activity, setActivity] = useState<ActivityDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        setLoading(true);
        setError(null);
        const syncUrl = await getSyncUrl();
        const res = await fetch(`${syncUrl}/activities/${id}`);
        if (!res.ok) {
          throw new Error('Activity not found');
        }
        const data = await res.json();
        setActivity(data);
      } catch (err) {
        setError('Failed to load activity details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchActivity();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error || !activity) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error || 'Activity not found'}</Text>
      </View>
    );
  }

  const raw = activity.raw || {};
  const hasAdvancedStats = raw.averageSpeed || raw.averageHR || raw.elevationGain;

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: activity.name }} />
      
      <View style={styles.header}>
        <Text style={styles.title}>{activity.name}</Text>
        <Text style={styles.date}>{formatDate(activity.startTime)}</Text>
        <View style={styles.typeBadge}>
          <Text style={styles.typeText}>{activity.type}</Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <FontAwesome name="clock-o" size={24} color="#007AFF" />
          <Text style={styles.statValue}>{formatDuration(activity.durationSeconds)}</Text>
          <Text style={styles.statLabel}>Duration</Text>
        </View>
        
        <View style={styles.statCard}>
          <FontAwesome name="road" size={24} color="#34C759" />
          <Text style={styles.statValue}>{formatDistance(activity.distanceMeters)}</Text>
          <Text style={styles.statLabel}>Distance</Text>
        </View>
        
        <View style={styles.statCard}>
          <FontAwesome name="fire" size={24} color="#FF9500" />
          <Text style={styles.statValue}>{Math.round(activity.calories)}</Text>
          <Text style={styles.statLabel}>Calories</Text>
        </View>
        
        {activity.distanceMeters > 0 && (
          <View style={styles.statCard}>
            <FontAwesome name="tachometer" size={24} color="#5856D6" />
            <Text style={styles.statValue}>{formatPace(activity.durationSeconds, activity.distanceMeters)}</Text>
            <Text style={styles.statLabel}>Avg Pace</Text>
          </View>
        )}
      </View>

      {hasAdvancedStats && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance</Text>
          
          {raw.averageHR && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Average Heart Rate</Text>
              <Text style={styles.detailValue}>{Math.round(raw.averageHR)} bpm</Text>
            </View>
          )}
          
          {raw.maxHR && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Max Heart Rate</Text>
              <Text style={styles.detailValue}>{Math.round(raw.maxHR)} bpm</Text>
            </View>
          )}
          
          {raw.averageSpeed && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Average Speed</Text>
              <Text style={styles.detailValue}>{(raw.averageSpeed * 3.6).toFixed(1)} km/h</Text>
            </View>
          )}
          
          {raw.maxSpeed && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Max Speed</Text>
              <Text style={styles.detailValue}>{(raw.maxSpeed * 3.6).toFixed(1)} km/h</Text>
            </View>
          )}
          
          {raw.elevationGain && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Elevation Gain</Text>
              <Text style={styles.detailValue}>{Math.round(raw.elevationGain)} m</Text>
            </View>
          )}
          
          {raw.elevationLoss && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Elevation Loss</Text>
              <Text style={styles.detailValue}>{Math.round(raw.elevationLoss)} m</Text>
            </View>
          )}
        </View>
      )}

      {raw.description && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <Text style={styles.description}>{raw.description}</Text>
        </View>
      )}

      {raw.locationName && (
        <View style={styles.locationRow}>
          <FontAwesome name="map-marker" size={16} color="#007AFF" />
          <Text style={styles.locationText}>{raw.locationName}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 16,
  },
  header: {
    padding: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  date: {
    fontSize: 15,
    opacity: 0.6,
    marginTop: 4,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#007AFF20',
  },
  typeText: {
    color: '#007AFF',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    width: '47%',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#00000008',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 13,
    opacity: 0.5,
    marginTop: 4,
  },
  section: {
    margin: 16,
    marginTop: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#00000008',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#00000010',
  },
  detailLabel: {
    fontSize: 15,
    opacity: 0.6,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    opacity: 0.8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    marginTop: 0,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#007AFF10',
  },
  locationText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#007AFF',
  },
});
