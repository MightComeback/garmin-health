import { describe, it, expect } from 'bun:test';

// Unit tests for ActivityRow helpers
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

describe('ActivityRow helpers', () => {
  describe('formatDuration', () => {
    it('formats less than an hour', () => {
      expect(formatDuration(2700)).toBe('45m');
    });

    it('formats more than an hour', () => {
      expect(formatDuration(5400)).toBe('1h 30m');
    });

    it('formats zero seconds', () => {
      expect(formatDuration(0)).toBe('0m');
    });
  });

  describe('formatDistance', () => {
    it('formats meters', () => {
      expect(formatDistance(500)).toBe('500 m');
    });

    it('formats kilometers', () => {
      expect(formatDistance(5200)).toBe('5.20 km');
    });

    it('formats exactly 1km', () => {
      expect(formatDistance(1000)).toBe('1.00 km');
    });
  });

  describe('getActivityIcon', () => {
    it('returns running icon', () => {
      expect(getActivityIcon('running')).toBe('running');
    });

    it('returns cycling icon', () => {
      expect(getActivityIcon('cycling')).toBe('bicycle');
    });

    it('returns swimming icon', () => {
      expect(getActivityIcon('swimming')).toBe('swimmer');
    });

    it('returns default for unknown type', () => {
      expect(getActivityIcon('unknown')).toBe('heartbeat');
    });

    it('handles case insensitively', () => {
      expect(getActivityIcon('RUNNING')).toBe('running');
    });
  });
});
