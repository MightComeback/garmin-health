import { StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { Text, View } from '@/components/Themed';

const DEFAULT_SYNC_URL = 'http://127.0.0.1:17890';
const SYNC_URL_KEY = '@garmin_sync_url';

export default function SettingsScreen() {
  const [syncUrl, setSyncUrl] = useState(DEFAULT_SYNC_URL);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const url = await AsyncStorage.getItem(SYNC_URL_KEY);
      if (url) setSyncUrl(url);
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  const saveSettings = async () => {
    try {
      await AsyncStorage.setItem(SYNC_URL_KEY, syncUrl);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  };

  const resetToDefault = () => {
    setSyncUrl(DEFAULT_SYNC_URL);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Configure your sync preferences</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sync Service</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Sync API URL</Text>
          <TextInput
            style={styles.input}
            value={syncUrl}
            onChangeText={setSyncUrl}
            placeholder="http://127.0.0.1:17890"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          <Text style={styles.hint}>
            The URL of your garmin-health-sync service
          </Text>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton]} 
            onPress={resetToDefault}
          >
            <Text style={styles.secondaryButtonText}>Reset</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.primaryButton, saved && styles.successButton]} 
            onPress={saveSettings}
          >
            <FontAwesome 
              name={saved ? 'check' : 'save'} 
              size={16} 
              color="#fff" 
              style={styles.buttonIcon}
            />
            <Text style={styles.primaryButtonText}>
              {saved ? 'Saved!' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Version</Text>
          <Text style={styles.infoValue}>1.0.0</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Build</Text>
          <Text style={styles.infoValue}>2025.02.04</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Platform</Text>
          <Text style={styles.infoValue}>Expo (React Native)</Text>
        </View>
      </View>

      <View style={styles.hintBox}>
        <FontAwesome name="info-circle" size={14} color="#007AFF" />
        <Text style={styles.hintText}>
          Changes to the sync URL take effect on the next data refresh. Pull down on any screen to refresh.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 17,
    opacity: 0.6,
    marginTop: 4,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#00000008',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    opacity: 0.8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#00000015',
  },
  hint: {
    fontSize: 13,
    opacity: 0.5,
    marginTop: 6,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  successButton: {
    backgroundColor: '#34C759',
  },
  secondaryButton: {
    backgroundColor: '#00000010',
  },
  buttonIcon: {
    marginRight: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#00000010',
  },
  infoLabel: {
    fontSize: 15,
    opacity: 0.6,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '500',
  },
  hintBox: {
    flexDirection: 'row',
    margin: 16,
    marginTop: 0,
    padding: 12,
    backgroundColor: '#007AFF10',
    borderRadius: 8,
    gap: 8,
  },
  hintText: {
    flex: 1,
    fontSize: 13,
    opacity: 0.7,
    lineHeight: 18,
  },
});
