import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, RouteProp, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { bookingService } from '../services';
import { showError, showSuccess } from '../store/app.store';
import { useAuthStore } from '../store/auth.store';
import { BookingDetail as BookingDetailType, BookingStatus } from '../types';
import { RootStackParamList } from '../types';
import {
  ScreenHeader,
  FormSection,
  PrimaryButton,
  InfoBox,
} from '../components';
import { Colors, Spacing, Typography, BorderRadius, CommonStyles } from '../theme';

type BookingDetailScreenRouteProp = RouteProp<RootStackParamList, 'BookingDetail'>;
type BookingDetailScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface Props {
  route: BookingDetailScreenRouteProp;
}

const BookingDetailScreen: React.FC<Props> = ({ route }) => {
  const navigation = useNavigation<BookingDetailScreenNavigationProp>();
  const user = useAuthStore((state) => state.user);
  const { id } = route.params;

  const [booking, setBooking] = useState<BookingDetailType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const isProvider = booking && user && booking.provider.id === user.id;
  const isClient = booking && user && booking.client.id === user.id;

  useFocusEffect(
    React.useCallback(() => {
      loadBookingData();
    }, [id])
  );

  const loadBookingData = async () => {
    try {
      setLoading(true);
      const bookingData = await bookingService.getBookingById(id);
      setBooking(bookingData);
    } catch (error: any) {
      console.error('Error loading booking:', error);
      showError(error.message || 'Failed to load booking');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmBooking = async () => {
    if (!booking) return;

    Alert.alert(
      'Confirm Booking',
      'Are you sure you want to confirm this booking?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              setActionLoading(true);
              await bookingService.confirmBooking(booking.id);
              showSuccess('Booking confirmed successfully');
              await loadBookingData();
            } catch (error: any) {
              console.error('Error confirming booking:', error);
              showError(error.message || 'Failed to confirm booking');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleCancelBooking = async () => {
    if (!booking) return;

    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(true);
              await bookingService.cancelBooking(booking.id);
              showSuccess('Booking cancelled successfully');
              await loadBookingData();
            } catch (error: any) {
              console.error('Error cancelling booking:', error);
              showError(error.message || 'Failed to cancel booking');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleCompleteBooking = async () => {
    if (!booking) return;

    Alert.alert(
      'Complete Booking',
      'Mark this booking as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            try {
              setActionLoading(true);
              await bookingService.completeBooking(booking.id);
              showSuccess('Booking completed successfully');
              await loadBookingData();
            } catch (error: any) {
              console.error('Error completing booking:', error);
              showError(error.message || 'Failed to complete booking');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleWriteReview = () => {
    if (!booking) return;
    (navigation as any).navigate('ReviewCreate', { bookingId: booking.id });
  };

  const getStatusColor = (status: BookingStatus): string => {
    switch (status) {
      case 'pending':
        return Colors.pending;
      case 'confirmed':
        return Colors.primary;
      case 'cancelled':
        return Colors.cancelled;
      case 'completed':
        return Colors.completed;
      default:
        return Colors.textTertiary;
    }
  };

  const getStatusIcon = (status: BookingStatus): string => {
    switch (status) {
      case 'pending':
        return 'time-outline';
      case 'confirmed':
        return 'checkmark-circle-outline';
      case 'cancelled':
        return 'close-circle-outline';
      case 'completed':
        return 'checkmark-done-circle-outline';
      default:
        return 'help-circle-outline';
    }
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (loading) {
    return (
      <View style={CommonStyles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading booking details...</Text>
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={CommonStyles.centered}>
        <Ionicons name="alert-circle-outline" size={64} color={Colors.error} />
        <Text style={styles.errorText}>Booking not found</Text>
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
      <ScreenHeader
        title="Booking Details"
        onBack={() => navigation.goBack()}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Badge */}
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) }]}>
            <Ionicons name={getStatusIcon(booking.status) as any} size={24} color={Colors.white} />
            <Text style={styles.statusText}>{booking.status.toUpperCase()}</Text>
          </View>
        </View>

        {/* Service Information */}
        <FormSection>
          <FormLabel>SERVICE</FormLabel>
          <InfoBox variant="info" style={styles.serviceCard}>
            <Text style={styles.serviceName}>{booking.service.title}</Text>
            <Text style={styles.serviceDescription}>{booking.service.description}</Text>
            {booking.service.price && (
              <View style={styles.priceRow}>
                <Ionicons name="cash-outline" size={18} color={Colors.primary} />
                <Text style={styles.priceText}>${booking.service.price}</Text>
              </View>
            )}
          </InfoBox>
        </FormSection>

        {/* Date & Time */}
        <FormSection>
          <FormLabel>DATE & TIME</FormLabel>
          <View style={styles.dateTimeCard}>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
              <Text style={styles.infoText}>{formatDate(booking.date)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={20} color={Colors.primary} />
              <Text style={styles.infoText}>
                {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
              </Text>
            </View>
          </View>
        </FormSection>

        {/* Client/Provider Information */}
        <FormSection>
          <FormLabel>{isProvider ? 'CLIENT' : 'SERVICE PROVIDER'}</FormLabel>
          <View style={styles.userCard}>
            <View style={styles.userInfo}>
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {isProvider
                    ? booking.client.username.charAt(0).toUpperCase()
                    : booking.provider.username.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View>
                <Text style={styles.userName}>
                  {isProvider ? booking.client.username : booking.provider.username}
                </Text>
                <Text style={styles.userEmail}>
                  {isProvider ? booking.client.email : booking.provider.email}
                </Text>
              </View>
            </View>
          </View>
        </FormSection>

        {/* Business/Clique */}
        {booking.cliqueName && (
          <FormSection>
            <FormLabel>BUSINESS</FormLabel>
            <View style={styles.infoCard}>
              <Ionicons name="business-outline" size={20} color={Colors.primary} />
              <Text style={styles.infoText}>{booking.cliqueName}</Text>
            </View>
          </FormSection>
        )}

        {/* Notes */}
        {booking.notes && (
          <FormSection>
            <FormLabel>NOTES</FormLabel>
            <InfoBox variant="warning" style={styles.notesCard}>
              <Text style={styles.notesText}>{booking.notes}</Text>
            </InfoBox>
          </FormSection>
        )}

        {/* Cancellation Reason */}
        {booking.status === 'cancelled' && booking.cancellationReason && (
          <FormSection>
            <FormLabel>CANCELLATION REASON</FormLabel>
            <InfoBox variant="error">
              <Text style={styles.cancellationText}>{booking.cancellationReason}</Text>
            </InfoBox>
          </FormSection>
        )}

        {/* Booking Metadata */}
        <FormSection>
          <FormLabel>BOOKING INFORMATION</FormLabel>
          <View style={styles.metadataCard}>
            <View style={styles.metadataRow}>
              <Text style={styles.metadataLabel}>Booking ID:</Text>
              <Text style={styles.metadataValue}>#{booking.id}</Text>
            </View>
            <View style={styles.metadataRow}>
              <Text style={styles.metadataLabel}>Created:</Text>
              <Text style={styles.metadataValue}>
                {new Date(booking.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.metadataRow}>
              <Text style={styles.metadataLabel}>Last Updated:</Text>
              <Text style={styles.metadataValue}>
                {new Date(booking.updatedAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </FormSection>

        {/* Action Buttons */}
        {booking.status === 'pending' && (
          <View style={styles.actionsSection}>
            {isProvider && (
              <>
                <PrimaryButton
                  title="Confirm Booking"
                  onPress={handleConfirmBooking}
                  disabled={actionLoading}
                  loading={actionLoading}
                  style={styles.confirmButton}
                />
                <PrimaryButton
                  title="Decline Booking"
                  onPress={handleCancelBooking}
                  disabled={actionLoading}
                  style={styles.cancelButton}
                />
              </>
            )}
            {isClient && (
              <PrimaryButton
                title="Cancel Booking"
                onPress={handleCancelBooking}
                disabled={actionLoading}
                style={styles.cancelButton}
              />
            )}
          </View>
        )}

        {booking.status === 'confirmed' && (
          <View style={styles.actionsSection}>
            {isProvider && (
              <>
                <PrimaryButton
                  title="Mark as Completed"
                  onPress={handleCompleteBooking}
                  disabled={actionLoading}
                  loading={actionLoading}
                  style={styles.completeButton}
                />
                <PrimaryButton
                  title="Cancel Booking"
                  onPress={handleCancelBooking}
                  disabled={actionLoading}
                  style={styles.cancelButton}
                />
              </>
            )}
            {isClient && (
              <PrimaryButton
                title="Cancel Booking"
                onPress={handleCancelBooking}
                disabled={actionLoading}
                style={styles.cancelButton}
              />
            )}
          </View>
        )}

        {booking.status === 'completed' && (
          <View style={styles.actionsSection}>
            {isClient && (
              <PrimaryButton
                title="Write Review"
                onPress={handleWriteReview}
                style={styles.reviewButton}
              />
            )}
          </View>
        )}

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
  statusContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    backgroundColor: Colors.white,
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    ...Typography.bodyBold,
    color: Colors.white,
    letterSpacing: 1,
  },
  serviceCard: {
    padding: 0,
  },
  serviceName: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  serviceDescription: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  priceText: {
    ...Typography.h4,
    color: Colors.primary,
  },
  dateTimeCard: {
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  infoText: {
    ...Typography.body,
    color: Colors.textPrimary,
  },
  userCard: {
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...Typography.h3,
    color: Colors.white,
  },
  userName: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
  },
  userEmail: {
    ...Typography.small,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  notesCard: {
    padding: 0,
  },
  notesText: {
    ...Typography.body,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  cancellationText: {
    ...Typography.body,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  metadataCard: {
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metadataLabel: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  metadataValue: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
  },
  actionsSection: {
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  confirmButton: {
    backgroundColor: Colors.primary,
  },
  completeButton: {
    backgroundColor: Colors.completed,
  },
  cancelButton: {
    backgroundColor: Colors.cancelled,
  },
  reviewButton: {
    backgroundColor: Colors.warning,
  },
  bottomSpacer: {
    height: Spacing.xl,
  },
});

export default BookingDetailScreen;
