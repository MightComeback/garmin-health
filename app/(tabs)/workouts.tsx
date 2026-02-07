import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';

export default function Workouts() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3000/workouts')
      .then(res => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <ActivityIndicator />;

  return (
    <ScrollView>
      <Text>Workouts</Text>
      {data ? (
        <Text>{JSON.stringify(data, null, 2)}</Text>
      ) : (
        <Text>No data</Text>
      )}
    </ScrollView>
  );
}