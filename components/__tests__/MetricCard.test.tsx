import { describe, it, expect } from 'bun:test';

// Simple unit tests for MetricCard logic
function formatMetricValue(value: string | number | null): string {
  if (value === null || value === undefined) return '--';
  return String(value);
}

function getMetricColor(label: string): string {
  const colors: Record<string, string> = {
    'Steps': '#007AFF',
    'Sleep': '#5856D6',
    'Resting HR': '#FF3B30',
    'Body Battery': '#34C759',
    'HRV Status': '#FF9500',
  };
  return colors[label] || '#007AFF';
}

describe('MetricCard logic', () => {
  describe('formatMetricValue', () => {
    it('returns -- for null', () => {
      expect(formatMetricValue(null as any)).toBe('--');
    });

    it('returns -- for undefined', () => {
      expect(formatMetricValue(undefined)).toBe('--');
    });

    it('returns string for number', () => {
      expect(formatMetricValue(62)).toBe('62');
    });

    it('returns string as-is', () => {
      expect(formatMetricValue('10.2k')).toBe('10.2k');
    });
  });

  describe('getMetricColor', () => {
    it('returns correct color for Steps', () => {
      expect(getMetricColor('Steps')).toBe('#007AFF');
    });

    it('returns correct color for Sleep', () => {
      expect(getMetricColor('Sleep')).toBe('#5856D6');
    });

    it('returns correct color for Resting HR', () => {
      expect(getMetricColor('Resting HR')).toBe('#FF3B30');
    });

    it('returns default color for unknown label', () => {
      expect(getMetricColor('Unknown')).toBe('#007AFF');
    });
  });
});
