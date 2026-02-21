import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Platform } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { apiClient } from '../../utils/api';
import { useAuthStore } from '../../store/authStore';

export default function AppointmentsScreen() {
    const user = useAuthStore(state => state.user);
    const [selectedDate, setSelectedDate] = useState('');
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Common styling colors
    const themeColor = '#D4A574';

    // When a date is selected on the calendar, fetch its availability overrides
    const fetchSlotsForDate = async (dateString: string) => {
        setIsLoadingSlots(true);
        setSelectedSlot(''); // Reset any selected slot if date changes
        setAvailableSlots([]);

        try {
            // Re-using the exact backend endpoint from server.js
            const response = await apiClient.get(`/available-slots?date=${dateString}`);

            // Backend returns [] if no slots are available/overridden
            setAvailableSlots(response.data);
        } catch (error) {
            Alert.alert('Error', 'Could not load available times.');
        } finally {
            setIsLoadingSlots(false);
        }
    };

    const handleDayPress = (day: any) => {
        setSelectedDate(day.dateString);
        fetchSlotsForDate(day.dateString);
    };

    const handleBookAppointment = async () => {
        if (!selectedDate || !selectedSlot) {
            Alert.alert('Missing Details', 'Please select a date and a time slot.');
            return;
        }

        setIsSubmitting(true);
        try {
            // Call the existing appointment creation endpoint in server.js
            await apiClient.post('/appointments', {
                name: user?.displayName || user?.username || 'Client',
                email: user?.email || 'client@example.com',
                date: selectedDate,
                time: selectedSlot,
                service: 'consultation', // Defaulting to consultation for the prototype
                message: 'Booked via mobile app'
            });

            Alert.alert(
                'Success!',
                `Your appointment is booked for ${selectedDate} at ${selectedSlot}. You will receive a confirmation email soon.`,
                [{
                    text: 'OK', onPress: () => {
                        setSelectedDate('');
                        setSelectedSlot('');
                    }
                }]
            );
        } catch (error: any) {
            const message = error.response?.data?.error || 'Failed to book appointment.';
            Alert.alert('Booking Failed', message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Format current date to disable past dates
    const today = new Date();
    const minDate = today.toISOString().split('T')[0];

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
            <Text style={styles.title}>Book a Session</Text>
            <Text style={styles.subtitle}>Select an available day to view times.</Text>

            <View style={styles.calendarCard}>
                <Calendar
                    minDate={minDate}
                    onDayPress={handleDayPress}
                    markedDates={{
                        [selectedDate]: { selected: true, selectedColor: themeColor }
                    }}
                    theme={{
                        todayTextColor: themeColor,
                        selectedDayBackgroundColor: themeColor,
                        arrowColor: themeColor,
                        textDayFontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
                        textMonthFontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
                        textDayHeaderFontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
                        textMonthFontWeight: 'bold',
                    }}
                />
            </View>

            {selectedDate ? (
                <View style={styles.slotsSection}>
                    <Text style={styles.sectionTitle}>Available Times on {selectedDate}</Text>

                    {isLoadingSlots ? (
                        <ActivityIndicator style={{ marginTop: 20 }} color={themeColor} />
                    ) : availableSlots.length > 0 ? (
                        <View style={styles.slotGrid}>
                            {availableSlots.map((slot) => (
                                <TouchableOpacity
                                    key={slot}
                                    onPress={() => setSelectedSlot(slot)}
                                    style={[
                                        styles.slotButton,
                                        selectedSlot === slot && styles.slotButtonActive
                                    ]}
                                >
                                    <Text style={[
                                        styles.slotText,
                                        selectedSlot === slot && styles.slotTextActive
                                    ]}>
                                        {slot}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    ) : (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyStateText}>No availability on this date.</Text>
                        </View>
                    )}

                    {selectedSlot ? (
                        <TouchableOpacity
                            style={styles.bookButton}
                            onPress={handleBookAppointment}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={styles.bookButtonText}>Confirm Booking</Text>
                            )}
                        </TouchableOpacity>
                    ) : null}
                </View>
            ) : null}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
        padding: 24,
        paddingTop: 60,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#000000',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#666666',
        marginBottom: 24,
    },
    calendarCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        marginBottom: 24,
    },
    slotsSection: {
        marginTop: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333333',
        marginBottom: 16,
    },
    slotGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    slotButton: {
        width: '48%',
        paddingVertical: 14,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#EAEAEA',
        alignItems: 'center',
    },
    slotButtonActive: {
        borderColor: '#D4A574',
        backgroundColor: '#F7EFE5', // Subtle gold tint
    },
    slotText: {
        fontSize: 16,
        color: '#333333',
        fontWeight: '500',
    },
    slotTextActive: {
        color: '#D4A574',
        fontWeight: '700',
    },
    emptyState: {
        padding: 24,
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
    },
    emptyStateText: {
        color: '#888888',
        fontSize: 15,
    },
    bookButton: {
        backgroundColor: '#D4A574',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 32,
    },
    bookButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    }
});
