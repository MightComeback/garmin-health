import { StyleSheet, View, ViewProps, Dimensions } from 'react-native';
import { Text } from './Themed';

interface TrendChartProps extends ViewProps {
  title: string;
  data: { day: string; value: number }[];
  color: string;
  unit?: string;
  goal?: number;
}

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 64;
const CHART_HEIGHT = 120;

export function TrendChart({ title, data, color, unit = '', goal, style, ...rest }: TrendChartProps) {
  if (data.length === 0) return null;

  const values = data.map(d => d.value);
  const max = Math.max(...values, goal || 0);
  const min = Math.min(...values) * 0.8;
  const range = max - min || 1;

  // Simple bar chart
  const barWidth = Math.max(4, (CHART_WIDTH - (data.length - 1) * 4) / data.length);

  return (
    <View style={[styles.container, style]} {...rest}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.chartContainer}>
        {data.map((item, index) => {
          const height = Math.max(4, ((item.value - min) / range) * CHART_HEIGHT);
          const isGoalMet = goal ? item.value >= goal : false;

          return (
            <View key={index} style={styles.barColumn}>
              {goal && (
                <View
                  style={[
                    styles.goalLine,
                    { bottom: ((goal - min) / range) * CHART_HEIGHT }
                  ]}
                />
              )}
              <View
                style={[
                  styles.bar,
                  {
                    height,
                    width: barWidth,
                    backgroundColor: isGoalMet ? color : color + '80',
                  },
                ]}
              />
              {index % Math.ceil(data.length / 6) === 0 && (
                <Text style={styles.dayLabel}>{item.day}</Text>
              )}
            </View>
          );
        })}
      </View>
      <View style={styles.statsRow}>
        <Text style={styles.stat}>Avg: {Math.round(values.reduce((a, b) => a + b, 0) / values.length)}{unit}</Text>
        <Text style={styles.stat}>Max: {Math.round(max)}{unit}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#00000008',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: CHART_HEIGHT + 20,
    gap: 4,
  },
  barColumn: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  goalLine: {
    position: 'absolute',
    width: 2,
    backgroundColor: color,
    borderRadius: 1,
  },
  bar: {
    borderRadius: 2,
    minHeight: 4,
  },
  dayLabel: {
    fontSize: 10,
    opacity: 0.4,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 16,
  },
  stat: {
    fontSize: 13,
    opacity: 0.6,
  },
});
