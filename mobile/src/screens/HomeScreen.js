import React, { useCallback, useState } from 'react';
import { Alert, Button, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function HomeScreen({ navigation }) {
  const { token, user, logout } = useAuth();
  const [items, setItems] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setRefreshing(true);
      const result = await apiRequest('/timeblocks', { token });
      setItems(result.timeBlocks || []);
    } catch (error) {
      Alert.alert('Load failed', error.message);
    } finally {
      setRefreshing(false);
    }
  }, [token]);

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Hello, {user?.username}</Text>
      <View style={styles.actions}>
        <Button title="Refresh" onPress={load} />
        <Button title="Profile" onPress={() => navigation.navigate('PersonalInfo')} />
        <Button title="Logout" onPress={logout} />
      </View>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
        ListEmptyComponent={<Text style={styles.empty}>No schedule items yet.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text>{item.date} | {item.startTime} - {item.endTime}</Text>
            <Text>{item.type}</Text>
            {item.location ? <Text>{item.location}</Text> : null}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  heading: { fontSize: 24, fontWeight: '700' },
  actions: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  card: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 12, marginBottom: 10, backgroundColor: '#fff' },
  cardTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  empty: { textAlign: 'center', marginTop: 24, color: '#6b7280' }
});
