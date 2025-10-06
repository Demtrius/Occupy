import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Switch,
  Platform,
} from 'react-native';
import { useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { bookingService } from '../services';
import { showError, showSuccess } from '../store/app.store';
import { RootStackParamList } from '../types';

type AvailabilityCreateScreenRouteProp = RouteProp<RootStackParamList, 'AvailabilityCreate'>;
type AvailabilityCreateScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface Props {
  route: AvailabilityCreateScreenRouteProp;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
];

const AvailabilityCreateScreen: React.FC<Props> = ({ route }) => {
  const navigation = useNavigation<AvailabilityCreateScreenNavigationProp>();
  const { cliqueId } = route.params;

  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState<number>(1); // Monday by default
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState<boolean>(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState<boolean>(false);
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [endTime, setEndTime] = useState<Date>(new Date());
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Initialize times to reasonable defaults
  React.useEffect(() => {
    const now = new Date();
    const start = new Date(now);
    start.setHours(9, 0, 0, 0);
    setStartTime(start);

    const end = new Date(now);
    end.setHours(17, 0, 0, 0);
    setEndTime(end);
  }, []);

  const formatDateForAPI = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatTimeForAPI = (date: Date): string => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}:00`;
  };

  const formatTimeDisplay = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const validateForm = (): boolean => {
    // Check if start time is before end time
    if (startTime >= endTime) {
      Alert.alert('Validation Error', 'Start time must be before end time');
      return false;
    }

    // If not recurring, check if the date is in the future
    if (!isRecurring) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selected = new Date(selectedDate);
      selected.setHours(0, 0, 0, 0);

      if (selected < today) {
        Alert.alert('Validation Error', 'Please select a future date');
        return false;
      }
    }

    return true;
  };

  const handleCreateAvailability = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);

      const availabilityData = {
        cliqueId,
        startTime: formatTimeForAPI(startTime),
        endTime: formatTimeForAPI(endTime),
        isRecurring,
        ...(isRecurring
          ? { dayOfWeek: selectedDayOfWeek }
          : { date: formatDateForAPI(selectedDate) }),
      };

      await bookingService.createAvailability(availabilityData);
      showSuccess('Availability created successfully!');
      navigation.goBack();
    } catch (error: any) {
      console.error('Error creating availability:', error);
      showError(error.message || 'Failed to create availability');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleStartTimeChange = (event: any, date?: Date) => {
    setShowStartTimePicker(Platform.OS === 'ios');
    if (date) {
      setStartTime(date);
    }
  };

  const handleEndTimeChange = (event: any, date?: Date) => {
    setShowEndTimePicker(Platform.OS === 'ios');
    if (date) {
      setEndTime(date);
    }
  };

  const renderDayButton = (day: { value: number; label: string; short: string }) => {
    const isSelected = selectedDayOfWeek === day.value;
    return (
      <TouchableOpacity
        key={day.value}
        style={[styles.dayButton, isSelected && styles.dayButtonSelected]}
        onPress={() => setSelectedDayOfWeek(day.value)}
      >
        <Text style={[styles.dayButtonText, isSelected && styles.dayButtonTextSelected]}>
          {day.short}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Set Availability</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Recurring Toggle */}
        <View style={styles.section}>
          <View style={styles.switchRow}>
            <View style={styles.switchLabel}>
              <Text style={styles.label}>Recurring Availability</Text>
              <Text style={styles.hint}>
                {isRecurring
                  ? 'Repeats weekly on the selected day'
                  : 'One-time availability for a specific date'}
              </Text>
            </View>
            <Switch
              value={isRecurring}
              onValueChange={setIsRecurring}
              trackColor={{ false: '#ccc', true: '#6ba32d' }}
              thumbColor={isRecurring ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Date/Day Selection */}
        <View style={styles.section}>
          {isRecurring ? (
            <>
              <Text style={styles.label}>
                Select Day of Week <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.daysGrid}>{DAYS_OF_WEEK.map(renderDayButton)}</View>
              <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={18} color="#6ba32d" />
                <Text style={styles.infoBoxText}>
                  This availability will repeat every {DAYS_OF_WEEK[selectedDayOfWeek].label}
                </Text>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.label}>
                Select Date <Text style={styles.required}>*</Text>
              </Text>
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
                <Ionicons name="chevron-down-outline" size={20} color="#999" />
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                />
              )}
            </>
          )}
        </View>

        {/* Time Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Available Hours <Text style={styles.required}>*</Text>
          </Text>

          {/* Start Time */}
          <View style={styles.timeRow}>
            <View style={styles.timeLabel}>
              <Ionicons name="time-outline" size={18} color="#666" />
              <Text style={styles.timeLabelText}>From</Text>
            </View>
            <TouchableOpacity
              style={styles.timeButton}
              onPress={() => setShowStartTimePicker(true)}
            >
              <Text style={styles.timeButtonText}>{formatTimeDisplay(startTime)}</Text>
              <Ionicons name="chevron-down-outline" size={18} color="#999" />
            </TouchableOpacity>
          </View>

          {showStartTimePicker && (
            <DateTimePicker
              value={startTime}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleStartTimeChange}
            />
          )}

          {/* End Time */}
          <View style={styles.timeRow}>
            <View style={styles.timeLabel}>
              <Ionicons name="time-outline" size={18} color="#666" />
              <Text style={styles.timeLabelText}>To</Text>
            </View>
            <TouchableOpacity
              style={styles.timeButton}
              onPress={() => setShowEndTimePicker(true)}
            >
              <Text style={styles.timeButtonText}>{formatTimeDisplay(endTime)}</Text>
              <Ionicons name="chevron-down-outline" size={18} color="#999" />
            </TouchableOpacity>
          </View>

          {showEndTimePicker && (
            <DateTimePicker
              value={endTime}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleEndTimeChange}
            />
          )}

          {/* Duration Display */}
          <View style={styles.durationDisplay}>
            <Ionicons name="hourglass-outline" size={16} color="#6ba32d" />
            <Text style={styles.durationText}>
              Duration:{' '}
              {Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60))} hours{' '}
              {Math.floor(((endTime.getTime() - startTime.getTime()) / (1000 * 60)) % 60)} minutes
            </Text>
          </View>
        </View>

        {/* Info Box */}
        <View style={[styles.infoBox, { margin: 20 }]}>
          <Ionicons name="bulb-outline" size={20} color="#FFA500" />
          <Text style={styles.infoBoxText}>
            Tip: Create multiple availability slots to give clients more booking options. You can
            set different hours for different days.
          </Text>
        </View>

        {/* Create Button */}
        <TouchableOpacity
          style={[styles.createButton, submitting && styles.createButtonDisabled]}
          onPress={handleCreateAvailability}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              <Text style={styles.createButtonText}>Create Availability</Text>
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
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  required: {
    color: '#ff6b6b',
  },
  hint: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: {
    flex: 1,
    marginRight: 16,
  },
  daysGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 16,
  },
  dayButton: {
    flex: 1,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#f9f9f9',
  },
  dayButtonSelected: {
    backgroundColor: '#6ba32d',
    borderColor: '#6ba32d',
  },
  dayButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  dayButtonTextSelected: {
    color: '#fff',
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
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  timeLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  timeLabelText: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f9f9f9',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minWidth: 140,
    justifyContent: 'space-between',
  },
  timeButtonText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '600',
  },
  durationDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#e8f5e9',
    padding: 12,
    borderRadius: 10,
    marginTop: 4,
  },
  durationText: {
    fontSize: 14,
    color: '#6ba32d',
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fffbea',
    padding: 12,
    borderRadius: 10,
    gap: 10,
  },
  infoBoxText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  createButton: {
    backgroundColor: '#6ba32d',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 20,
  },
  createButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  bottomSpacer: {
    height: 40,
  },
});

export default AvailabilityCreateScreen;
