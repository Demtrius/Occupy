import React, { useState, useEffect } from "react";
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
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { bookingService } from "../services";
import { showError, showSuccess } from "../store/app.store";
import { useAuthStore } from "../store/auth.store";
import {
  Service,
  Availability,
  TimeSlot,
  ScreenRouteProp,
  ScreenNavigationProp,
} from "../types";
import {
  ScreenHeader,
  FormSection,
  FormLabel,
  PrimaryButton,
  InfoBox,
} from "../components";
import {
  Colors,
  Spacing,
  Typography,
  BorderRadius,
  CommonStyles,
} from "../theme";

interface Props {
  route: ScreenRouteProp<"BookingCreate">;
}

const BookingCreateScreen: React.FC<Props> = ({ route }) => {
  const navigation = useNavigation<ScreenNavigationProp<"BookingCreate">>();
  const user = useAuthStore((state) => state.user);
  const { serviceId } = route.params;

  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{
    start: string;
    end: string;
  } | null>(null);
  const [notes, setNotes] = useState<string>("");
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
      console.error("Error loading service:", error);
      showError(error.message || "Failed to load service");
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
        dateStr,
      );
      setAvailability(availabilityData);
    } catch (error: any) {
      console.error("Error loading availability:", error);
      showError("Failed to load available time slots");
    } finally {
      setLoadingSlots(false);
    }
  };

  const formatDateForAPI = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatTime = (time: string): string => {
    // Format time from HH:MM:SS to HH:MM AM/PM
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
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
          (parseTimeToMinutes(endTime) - parseTimeToMinutes(startTime)) /
            duration,
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
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const addMinutesToTime = (time: string, minutesToAdd: number): string => {
    const totalMinutes = parseTimeToMinutes(time) + minutesToAdd;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;
  };

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
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
      Alert.alert("Error", "Please select a time slot");
      return;
    }

    if (!service) {
      Alert.alert("Error", "Service not found");
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
      showSuccess("Booking created successfully!");
      navigation.goBack();
    } catch (error: any) {
      console.error("Error creating booking:", error);
      showError(error.message || "Failed to create booking");
    } finally {
      setSubmitting(false);
    }
  };

  const timeSlots = generateTimeSlots();
  const minDate = new Date();

  if (loading) {
    return (
      <View style={CommonStyles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading service details...</Text>
      </View>
    );
  }

  if (!service) {
    return (
      <View style={CommonStyles.centered}>
        <Ionicons name="alert-circle-outline" size={64} color={Colors.error} />
        <Text style={styles.errorText}>Service not found</Text>
        <PrimaryButton
          title="Go Back"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        />
      </View>
    );
  }

  return (
    <View style={CommonStyles.container}>
      <ScreenHeader title="Book Service" onBack={() => navigation.goBack()} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Service Info */}
        <InfoBox variant="info" style={styles.serviceCard}>
          <Text style={styles.serviceTitle}>{service.title}</Text>
          <Text style={styles.serviceDescription}>{service.description}</Text>
          <View style={styles.serviceMetaRow}>
            <View style={styles.serviceMeta}>
              <Ionicons
                name="time-outline"
                size={16}
                color={Colors.textSecondary}
              />
              <Text style={styles.serviceMetaText}>
                {service.durationMinutes} min
              </Text>
            </View>
            {service.price && (
              <View style={styles.serviceMeta}>
                <Ionicons
                  name="cash-outline"
                  size={16}
                  color={Colors.textSecondary}
                />
                <Text style={styles.serviceMetaText}>${service.price}</Text>
              </View>
            )}
          </View>
        </InfoBox>

        {/* Date Selection */}
        <FormSection>
          <FormLabel>Select Date</FormLabel>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons
              name="calendar-outline"
              size={20}
              color={Colors.primary}
            />
            <Text style={styles.dateButtonText}>
              {selectedDate.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={handleDateChange}
              minimumDate={minDate}
            />
          )}
        </FormSection>

        {/* Time Slot Selection */}
        <FormSection>
          <FormLabel>Select Time</FormLabel>
          {loadingSlots ? (
            <View style={styles.loadingSlotsContainer}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.loadingSlotsText}>
                Loading available slots...
              </Text>
            </View>
          ) : timeSlots.length > 0 ? (
            <View style={styles.timeSlotsGrid}>
              {timeSlots.map((slot, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.timeSlot,
                    selectedTimeSlot?.start === slot.startTime &&
                      styles.timeSlotSelected,
                    !slot.available && styles.timeSlotDisabled,
                  ]}
                  onPress={() => handleTimeSlotSelect(slot)}
                  disabled={!slot.available}
                >
                  <Text
                    style={[
                      styles.timeSlotText,
                      selectedTimeSlot?.start === slot.startTime &&
                        styles.timeSlotTextSelected,
                      !slot.available && styles.timeSlotTextDisabled,
                    ]}
                  >
                    {formatTime(slot.startTime)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <InfoBox variant="warning">
              <View style={styles.noSlotsContainer}>
                <Ionicons
                  name="calendar-outline"
                  size={48}
                  color={Colors.textTertiary}
                />
                <Text style={styles.noSlotsText}>
                  No available time slots for this date
                </Text>
                <Text style={styles.noSlotsSubtext}>
                  Please select a different date
                </Text>
              </View>
            </InfoBox>
          )}
        </FormSection>

        {/* Notes */}
        <FormSection>
          <FormLabel>Notes (Optional)</FormLabel>
          <TextInput
            style={styles.notesInput}
            placeholder="Add any special requests or notes..."
            placeholderTextColor={Colors.textTertiary}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </FormSection>

        {/* Book Button */}
        <PrimaryButton
          title="Confirm Booking"
          onPress={handleCreateBooking}
          disabled={!selectedTimeSlot || submitting}
          loading={submitting}
          style={styles.bookButton}
        />

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  errorText: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  backButton: {
    marginTop: Spacing.lg,
  },
  serviceCard: {
    marginBottom: Spacing.lg,
  },
  serviceTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  serviceDescription: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  serviceMetaRow: {
    flexDirection: "row",
    gap: Spacing.lg,
  },
  serviceMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  serviceMetaText: {
    ...Typography.small,
    color: Colors.textSecondary,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  dateButtonText: {
    ...Typography.body,
    color: Colors.textPrimary,
    flex: 1,
  },
  loadingSlotsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  loadingSlotsText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  timeSlotsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  timeSlot: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    minWidth: 100,
    alignItems: "center",
  },
  timeSlotSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  timeSlotDisabled: {
    backgroundColor: Colors.gray100,
    borderColor: Colors.borderLight,
    opacity: 0.5,
  },
  timeSlotText: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
  },
  timeSlotTextSelected: {
    color: Colors.white,
  },
  timeSlotTextDisabled: {
    color: Colors.textDisabled,
  },
  noSlotsContainer: {
    alignItems: "center",
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  noSlotsText: {
    ...Typography.body,
    color: Colors.textPrimary,
    textAlign: "center",
  },
  noSlotsSubtext: {
    ...Typography.small,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  notesInput: {
    ...Typography.body,
    color: Colors.textPrimary,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    minHeight: 100,
  },
  bookButton: {
    marginTop: Spacing.lg,
  },
  bottomSpacer: {
    height: Spacing.xl,
  },
});

export default BookingCreateScreen;
