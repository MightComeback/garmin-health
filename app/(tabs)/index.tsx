import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';

export default function Today() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3000/wellness/today')
      .then(res => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <ActivityIndicator />;

  return (
    <ScrollView>
      <Text>Today Dashboard</Text>
      {data ? (
        <Text>{JSON.stringify(data, null, 2)}</Text>
      ) : (
        <Text>No data</Text>
      )}
    </ScrollView>
  );
}