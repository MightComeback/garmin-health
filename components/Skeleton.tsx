import { ActivityIndicator, StyleSheet, View } from 'react-native';

export function Skeleton({ width, height, style }: { width?: number | string, height?: number, style?: any }) {
  return (
    <View style={[styles.skeleton, width && { width }, height && { height }, style]}>
      <ActivityIndicator size="small" color="#888" />
    </View>
  );
}

export function SkeletonCard() {
  return (
    <View style={styles.card}>
      <Skeleton width="70%" height={20} style={{ marginBottom: 12 }} />
      <Skeleton width="30%" height={20} style={{ marginBottom: 12 }} />
      <View style={styles.skeletonRow}>
        <Skeleton width={60} height={16} />
        <Skeleton width={60} height={16} />
        <Skeleton width={60} height={16} />
      </View>
    </View>
  );
}

export function SkeletonRow() {
  return (
    <View style={styles.row}>
      <Skeleton width={40} height={40} />
      <View style={styles.rowContent}>
        <Skeleton width="60%" height={20} />
        <Skeleton width="40%" height={16} />
      </View>
    </View>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#E5E5EA',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  rowContent: {
    flex: 1,
  },
  skeletonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  list: {
    padding: 16,
  },
});
