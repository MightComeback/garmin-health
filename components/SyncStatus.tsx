import { StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { Text, View } from './Themed';

interface SyncStatusProps {
  configured: boolean;
  authenticated: boolean;
  isSyncing?: boolean;
  onSync?: () => void;
  lastSyncTime?: string | null;
}

export function SyncStatus({ 
  configured, 
  authenticated, 
  isSyncing = false,
  onSync,
  lastSyncTime 
}: SyncStatusProps) {
  if (!configured) {
    return (
      <View style={[styles.container, styles.warning]}>
        <FontAwesome name="exclamation-triangle" size={16} color="#FF9500" />
        <Text style={[styles.text, styles.warningText]}>
          Garmin credentials not configured
        </Text>
      </View>
    );
  }

  if (!authenticated) {
    return (
      <View style={[styles.container, styles.warning]}>
        <FontAwesome name="refresh" size={16} color="#FF9500" />
        <Text style={[styles.text, styles.warningText]}>
          Sign in to Garmin Connect required
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, styles.success]}>
      <FontAwesome name="check-circle" size={16} color="#34C759" />
      <Text style={[styles.text, styles.successText]}>
        Connected to Garmin Connect
      </Text>
      {lastSyncTime && (
        <Text style={styles.lastSyncText}>
          Last sync: {new Date(lastSyncTime).toLocaleTimeString()}
        </Text>
      )}
      {onSync && (
        <TouchableOpacity 
          style={[styles.syncButton, isSyncing && styles.syncButtonDisabled]} 
          onPress={onSync}
          disabled={isSyncing}
        >
          {isSyncing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <FontAwesome name="refresh" size={12} color="#fff" />
              <Text style={styles.syncButtonText}>Sync Now</Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 8,
    flexWrap: 'wrap',
  },
  success: {
    backgroundColor: '#34C75915',
  },
  warning: {
    backgroundColor: '#FF950015',
  },
  text: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  successText: {
    color: '#34C759',
  },
  warningText: {
    color: '#FF9500',
  },
  lastSyncText: {
    marginLeft: 'auto',
    fontSize: 12,
    opacity: 0.6,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 'auto',
    gap: 6,
  },
  syncButtonDisabled: {
    opacity: 0.6,
  },
  syncButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
