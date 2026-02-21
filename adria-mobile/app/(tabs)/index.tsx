import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { apiClient } from '../../utils/api';
import { useRouter } from 'expo-router';

export default function MemberDashboard() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const response = await apiClient.get('/appointments');
        setAppointments(response.data.slice(0, 3)); // Just show recent 3 for demo
      } catch (error) {
        console.error('Failed to fetch appointments', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAppointments();
  }, []);

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.displayName || user?.username || 'Member'}!</Text>
          <Text style={styles.subtitle}>Welcome back to your Style Portal.</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Upcoming Services</Text>
        {isLoading ? (
          <ActivityIndicator color="#D4A574" />
        ) : appointments.length > 0 ? (
          appointments.map((appt: any) => (
            <View key={appt.id} style={styles.card}>
              <Text style={styles.cardTitle}>{appt.service || 'Styling Session'}</Text>
              <Text style={styles.cardDate}>{appt.date} at {appt.time}</Text>
            </View>
          ))
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No upcoming appointments.</Text>
            <TouchableOpacity style={styles.linkButton} onPress={() => router.push('/appointments')}>
              <Text style={styles.linkText}>Book a Session</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/matcher')}>
            <Text style={styles.actionEmoji}>👗</Text>
            <Text style={styles.actionTitle}>Clothing Matcher</Text>
            <Text style={styles.actionDesc}>Find perfect pairings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/appointments')}>
            <Text style={styles.actionEmoji}>📅</Text>
            <Text style={styles.actionTitle}>Book a Session</Text>
            <Text style={styles.actionDesc}>Schedule styling</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderColor: '#EAEAEA',
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
  },
  section: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#D4A574',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  cardDate: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#CCCCCC',
  },
  emptyText: {
    color: '#666666',
    marginBottom: 12,
  },
  linkButton: {
    backgroundColor: '#F7EFE5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  linkText: {
    color: '#D4A574',
    fontWeight: '600',
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 4,
  },
  actionDesc: {
    fontSize: 12,
    color: '#888888',
  },
  logoutButton: {
    margin: 24,
    padding: 16,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: {
    color: '#D32F2F',
    fontWeight: '600',
  },
});
