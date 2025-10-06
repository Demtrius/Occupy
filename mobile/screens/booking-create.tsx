import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { bookingService } from '../services';
import { showError, showSuccess } from '../store/app.store';
import { useAuthStore } from '../store/auth.store';
import { Service, Availability, TimeSlot } from '../types';
import { RootStackParamList } from '../types';

type BookingCreateScreenRouteProp = RouteProp<RootStackParamList, 'BookingCreate'>;
type BookingCreateScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface Props {
  route: BookingCreateScreenRouteProp;
}

const BookingCreateScreen: React.FC<Props> = ({ route }) => {
  const navigation = useNavigation<BookingCreateScreenNavigationProp>();
  const user = useAuthStore((state) => state.user);
  const { serviceId } = route.params;

  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{ start: string; end: string } | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);

  useEffect(() => {
    loadServiceData();
  }, [serviceId]);

  useEffect(() => {
    if (service) {
      loadAvailability();
    }
  }, [selectedDate, service]);

  const loadServiceData = async () => {
    try {
      setLoading(true);
      const serviceData = await bookingService.getServiceById(serviceId);
      setService(serviceData);
    } catch (error: any) {
      console.error('Error loading service:', error);
      showError(error.message || 'Failed to load service');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const loadAvailability = async () => {
    if (!service) return;

    try {
      setLoadingSlots(true);
      const dateStr = formatDateForAPI(selectedDate);
      const availabilityData = await bookingService.getCliqueAvailability(
        service.clique.id,
        dateStr,
        dateStr
      );
      setAvailability(availabilityData);
    } catch (error: any) {
      console.error('Error loading availability:', error);
      showError('Failed to load available time slots');
    } finally {
      setLoadingSlots(false);
    }
  };

  const formatDateForAPI = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatTime = (time: string): string => {
    // Format time from HH:MM:SS to HH:MM AM/PM
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const generateTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const dayOfWeek = selectedDate.getDay();

    // Filter availability for selected date
    const dayAvailability = availability.filter((avail) => {
      if (avail.date) {
        // Specific date availability
        return avail.date === formatDateForAPI(selectedDate);
      } else if (avail.isRecurring && avail.dayOfWeek !== undefined) {
        // Recurring availability
        return avail.dayOfWeek === dayOfWeek;
      }
      return false;
    });

    // Generate 30-minute slots from availability
    dayAvailability.forEach((avail) => {
      const startTime = avail.startTime;
      const endTime = avail.endTime;

      if (service) {
        const duration = service.durationMinutes || 30;
        const slotCount = Math.floor(
          (parseTimeToMinutes(endTime) - parseTimeToMinutes(startTime)) / duration
        );

        for (let i = 0; i < slotCount; i++) {
          const slotStart = addMinutesToTime(startTime, i * duration);
          const slotEnd = addMinutesToTime(startTime, (i + 1) * duration);

          slots.push({
            startTime: slotStart,
            endTime: slotEnd,
            available: true,
          });
        }
      }
    });

    return slots.sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const parseTimeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const addMinutesToTime = (time: string, minutesToAdd: number): string => {
    const totalMinutes = parseTimeToMinutes(time) + minutesToAdd;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
  };

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) {
      setSelectedDate(date);
      setSelectedTimeSlot(null); // Reset time slot when date changes
    }
  };

  const handleTimeSlotSelect = (slot: TimeSlot) => {
    setSelectedTimeSlot({ start: slot.startTime, end: slot.endTime });
  };

  const handleCreateBooking = async () => {
    if (!selectedTimeSlot) {
      Alert.alert('Error', 'Please select a time slot');
      return;
    }

    if (!service) {
      Alert.alert('Error', 'Service not found');
      return;
    }

    try {
      setSubmitting(true);

      const bookingData = {
        serviceId: service.id,
        date: formatDateForAPI(selectedDate),
        startTime: selectedTimeSlot.start,
        endTime: selectedTimeSlot.end,
        notes: notes.trim() || undefined,
      };

      await bookingService.createBooking(bookingData);
      showSuccess('Booking created successfully!');
      navigation.goBack();
    } catch (error: any) {
      console.error('Error creating booking:', error);
      showError(error.message || 'Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  };

  const timeSlots = generateTimeSlots();
  const minDate = new Date();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6ba32d" />
        <Text style={styles.loadingText}>Loading service details...</Text>
      </View>
    );
  }

  if (!service) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#ff6b6b" />
        <Text style={styles.errorText}>Service not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Service</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Service Info */}
        <View style={styles.serviceCard}>
          <Text style={styles.serviceTitle}>{service.title}</Text>
          <Text style={styles.serviceDescription}>{service.description}</Text>
          <View style={styles.serviceMetaRow}>
            <View style={styles.serviceMeta}>
              <Ionicons name="time-outline" size={16} color="#666" />
              <Text style={styles.serviceMetaText}>{service.durationMinutes} min</Text>
            </View>
            {service.price && (
              <View style={styles.serviceMeta}>
                <Ionicons name="cash-outline" size={16} color="#666" />
                <Text style={styles.serviceMetaText}>${service.price}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Date Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Date</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color="#6ba32d" />
            <Text style={styles.dateButtonText}>
              {selectedDate.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              minimumDate={minDate}
            />
          )}
        </View>

        {/* Time Slot Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Time</Text>
          {loadingSlots ? (
            <View style={styles.loadingSlotsContainer}>
              <ActivityIndicator size="small" color="#6ba32d" />
              <Text style={styles.loadingSlotsText}>Loading available slots...</Text>
            </View>
          ) : timeSlots.length > 0 ? (
            <View style={styles.timeSlotsGrid}>
              {timeSlots.map((slot, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.timeSlot,
                    selectedTimeSlot?.start === slot.startTime && styles.timeSlotSelected,
                    !slot.available && styles.timeSlotDisabled,
                  ]}
                  onPress={() => handleTimeSlotSelect(slot)}
                  disabled={!slot.available}
                >
                  <Text
                    style={[
                      styles.timeSlotText,
                      selectedTimeSlot?.start === slot.startTime && styles.timeSlotTextSelected,
                      !slot.available && styles.timeSlotTextDisabled,
                    ]}
                  >
                    {formatTime(slot.startTime)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.noSlotsContainer}>
              <Ionicons name="calendar-outline" size={48} color="#ccc" />
              <Text style={styles.noSlotsText}>No available time slots for this date</Text>
              <Text style={styles.noSlotsSubtext}>Please select a different date</Text>
            </View>
          )}
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes (Optional)</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Add any special requests or notes..."
            placeholderTextColor="#999"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Book Button */}
        <TouchableOpacity
          style={[styles.bookButton, (!selectedTimeSlot || submitting) && styles.bookButtonDisabled]}
          onPress={handleCreateBooking}
          disabled={!selectedTimeSlot || submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              <Text style={styles.bookButtonText}>Confirm Booking</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#333',
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#6ba32d',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  content: {
    flex: 1,
  },
  serviceCard: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  serviceTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  serviceMetaRow: {
    flexDirection: 'row',
    gap: 16,
  },
  serviceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  serviceMetaText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dateButtonText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  loadingSlotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 10,
  },
  loadingSlotsText: {
    fontSize: 14,
    color: '#666',
  },
  timeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeSlot: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#f9f9f9',
    minWidth: 100,
    alignItems: 'center',
  },
  timeSlotSelected: {
    backgroundColor: '#6ba32d',
    borderColor: '#6ba32d',
  },
  timeSlotDisabled: {
    backgroundColor: '#f0f0f0',
    borderColor: '#e0e0e0',
    opacity: 0.5,
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  timeSlotTextSelected: {
    color: '#fff',
  },
  timeSlotTextDisabled: {
    color: '#999',
  },
  noSlotsContainer: {
    alignItems: 'center',
    padding: 40,
  },
  noSlotsText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    fontWeight: '600',
  },
  noSlotsSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  notesInput: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#333',
    minHeight: 100,
  },
  bookButton: {
    backgroundColor: '#6ba32d',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 8,
  },
  bookButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  bottomSpacer: {
    height: 40,
  },
});

export default BookingCreateScreen;
