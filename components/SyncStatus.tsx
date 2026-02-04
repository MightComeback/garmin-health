import { StyleSheet } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { Text, View } from './Themed';

interface SyncStatusProps {
  configured: boolean;
  authenticated: boolean;
}

export function SyncStatus({ configured, authenticated }: SyncStatusProps) {
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
});
