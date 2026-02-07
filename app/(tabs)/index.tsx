import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';

interface WellnessData {
  ok: boolean;
  date: string;
  wellness: {
    steps?: number;
    restingHeartRate?: number;
    sleep?: { duration: number };
    sleepScore?: number;
    bodyBattery?: { value: number };
    hrvStatus?: string;
    stress?: number;
  };
}

export default function Today() {
  const [data, setData] = useState<WellnessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    fetch(`http://127.0.0.1:17890/wellness/${today}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error || !data?.ok || !data.wellness) {
    return (
      <ScrollView style={styles.container}>
        <Text style={styles.error}>No data available{error ? `: ${error}` : ''}</Text>
      </ScrollView>
    );
  }

  const w = data.wellness;
  const sleepHours = w.sleep?.duration ? Math.round(w.sleep.duration / 3600) : 0;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Today</Text>
      <Text style={styles.date}>{data.date}</Text>

      <View style={styles.metrics}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Steps</Text>
          <Text style={styles.metricValue}>{w.steps?.toLocaleString() || '—'}</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>RHR</Text>
          <Text style={styles.metricValue}>{w.restingHeartRate || '—'} bpm</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Body Battery</Text>
          <Text style={styles.metricValue}>{w.bodyBattery?.value || '—'}%</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Sleep</Text>
          <Text style={styles.metricValue}>{sleepHours}h</Text>
          {w.sleepScore && <Text style={styles.subtext}>Score: {w.sleepScore}</Text>}
        </View>
      </View>

      {w.hrvStatus && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>HRV Status</Text>
          <Text style={styles.hrv}>{w.hrvStatus}</Text>
        </View>
      )}

      {w.stress !== undefined && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Stress</Text>
          <Text style={styles.metricValue}>{w.stress}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f7',
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1d1d1f',
  },
  date: {
    fontSize: 17,
    color: '#86868b',
    marginBottom: 32,
  },
  metrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  metricCard: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  metricLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#86868b',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1d1d1f',
  },
  subtext: {
    fontSize: 14,
    color: '#86868b',
    marginTop: 4,
  },
  card: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1d1d1f',
    marginBottom: 8,
  },
  hrv: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: {
    fontSize: 17,
    textAlign: 'center',
    color: '#86868b',
    padding: 40,
  },
});
