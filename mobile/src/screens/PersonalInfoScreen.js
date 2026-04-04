import React, { useEffect, useState } from 'react';
import { Alert, Button, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';

const DEFAULT_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  studentId: '',
  dateOfBirth: '',
  address: '',
  emergencyContact: '',
  emergencyPhone: ''
};

export default function PersonalInfoScreen() {
  const { token, refreshProfile } = useAuth();
  const [form, setForm] = useState(DEFAULT_FORM);

  useEffect(() => {
    (async () => {
      try {
        const result = await apiRequest('/personalinfo', { token });
        if (result.personalInfo) {
          setForm({ ...DEFAULT_FORM, ...result.personalInfo });
        }
      } catch (error) {
        Alert.alert('Load failed', error.message);
      }
    })();
  }, [token]);

  const save = async () => {
    try {
      await apiRequest('/personalinfo', {
        method: 'POST',
        token,
        body: form
      });
      await refreshProfile();
      Alert.alert('Saved', 'Personal info updated');
    } catch (error) {
      Alert.alert('Save failed', error.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {Object.keys(DEFAULT_FORM).map((key) => (
        <View key={key} style={styles.field}>
          <Text style={styles.label}>{key}</Text>
          <TextInput
            style={styles.input}
            value={form[key] || ''}
            onChangeText={(value) => setForm((current) => ({ ...current, [key]: value }))}
          />
        </View>
      ))}
      <Button title="Save" onPress={save} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  field: { gap: 6 },
  label: { fontWeight: '600', textTransform: 'capitalize' },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 10 }
});
