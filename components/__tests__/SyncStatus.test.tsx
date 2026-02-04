import { describe, it, expect } from 'bun:test';

// Unit tests for SyncStatus helpers
function getSyncStatusMessage(configured: boolean, authenticated: boolean): string {
  if (!configured) return 'Not configured';
  if (!authenticated) return 'Authentication required';
  return 'Connected';
}

function formatLastSyncTime(isoString: string | null): string {
  if (!isoString) return 'Never';
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

describe('SyncStatus helpers', () => {
  describe('getSyncStatusMessage', () => {
    it('returns Not configured when not configured', () => {
      expect(getSyncStatusMessage(false, false)).toBe('Not configured');
    });

    it('returns Authentication required when configured but not authenticated', () => {
      expect(getSyncStatusMessage(true, false)).toBe('Authentication required');
    });

    it('returns Connected when both configured and authenticated', () => {
      expect(getSyncStatusMessage(true, true)).toBe('Connected');
    });
  });

  describe('formatLastSyncTime', () => {
    it('returns Never for null', () => {
      expect(formatLastSyncTime(null)).toBe('Never');
    });

    it('returns Just now for recent timestamp', () => {
      const justNow = new Date(Date.now() - 1000).toISOString();
      expect(formatLastSyncTime(justNow)).toBe('Just now');
    });

    it('returns minutes ago for recent sync', () => {
      const minsAgo = new Date(Date.now() - 5 * 60000).toISOString();
      expect(formatLastSyncTime(minsAgo)).toBe('5m ago');
    });

    it('returns hours ago for older sync', () => {
      const hoursAgo = new Date(Date.now() - 3 * 3600000).toISOString();
      expect(formatLastSyncTime(hoursAgo)).toBe('3h ago');
    });

    it('returns days ago for old sync', () => {
      const daysAgo = new Date(Date.now() - 2 * 86400000).toISOString();
      expect(formatLastSyncTime(daysAgo)).toBe('2d ago');
    });
  });
});
