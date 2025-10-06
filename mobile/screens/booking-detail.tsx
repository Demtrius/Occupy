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

  const getStatusColor = (status: BookingStatus): string => {
    switch (status) {
      case 'pending':
        return '#FFA500';
      case 'confirmed':
        return '#6ba32d';
      case 'cancelled':
        return '#ff6b6b';
      case 'completed':
        return '#4CAF50';
      default:
        return '#999';
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6ba32d" />
        <Text style={styles.loadingText}>Loading booking details...</Text>
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#ff6b6b" />
        <Text style={styles.errorText}>Booking not found</Text>
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
        <Text style={styles.headerTitle}>Booking Details</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Badge */}
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) }]}>
            <Ionicons name={getStatusIcon(booking.status) as any} size={24} color="#fff" />
            <Text style={styles.statusText}>{booking.status.toUpperCase()}</Text>
          </View>
        </View>

        {/* Service Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service</Text>
          <View style={styles.serviceCard}>
            <Text style={styles.serviceName}>{booking.service.title}</Text>
            <Text style={styles.serviceDescription}>{booking.service.description}</Text>
            {booking.service.price && (
              <View style={styles.priceRow}>
                <Ionicons name="cash-outline" size={18} color="#6ba32d" />
                <Text style={styles.priceText}>${booking.service.price}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Date & Time */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Date & Time</Text>
          <View style={styles.dateTimeCard}>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color="#6ba32d" />
              <Text style={styles.infoText}>{formatDate(booking.date)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={20} color="#6ba32d" />
              <Text style={styles.infoText}>
                {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
              </Text>
            </View>
          </View>
        </View>

        {/* Client/Provider Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{isProvider ? 'Client' : 'Service Provider'}</Text>
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
        </View>

        {/* Business/Clique */}
        {booking.cliqueName && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Business</Text>
            <View style={styles.infoCard}>
              <Ionicons name="business-outline" size={20} color="#6ba32d" />
              <Text style={styles.infoText}>{booking.cliqueName}</Text>
            </View>
          </View>
        )}

        {/* Notes */}
        {booking.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{booking.notes}</Text>
            </View>
          </View>
        )}

        {/* Cancellation Reason */}
        {booking.status === 'cancelled' && booking.cancellationReason && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cancellation Reason</Text>
            <View style={styles.cancellationCard}>
              <Ionicons name="information-circle-outline" size={20} color="#ff6b6b" />
              <Text style={styles.cancellationText}>{booking.cancellationReason}</Text>
            </View>
          </View>
        )}

        {/* Booking Metadata */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Booking Information</Text>
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
        </View>

        {/* Action Buttons */}
        {booking.status === 'pending' && (
          <View style={styles.actionsSection}>
            {isProvider && (
              <>
                <TouchableOpacity
                  style={[styles.actionButton, styles.confirmButton]}
                  onPress={handleConfirmBooking}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                      <Text style={styles.actionButtonText}>Confirm Booking</Text>
                    </>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={handleCancelBooking}
                  disabled={actionLoading}
                >
                  <Ionicons name="close-circle-outline" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Decline Booking</Text>
                </TouchableOpacity>
              </>
            )}
            {isClient && (
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={handleCancelBooking}
                disabled={actionLoading}
              >
                <Ionicons name="close-circle-outline" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Cancel Booking</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {booking.status === 'confirmed' && (
          <View style={styles.actionsSection}>
            {isProvider && (
              <>
                <TouchableOpacity
                  style={[styles.actionButton, styles.completeButton]}
                  onPress={handleCompleteBooking}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-done-circle-outline" size={20} color="#fff" />
                      <Text style={styles.actionButtonText}>Mark as Completed</Text>
                    </>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={handleCancelBooking}
                  disabled={actionLoading}
                >
                  <Ionicons name="close-circle-outline" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Cancel Booking</Text>
                </TouchableOpacity>
              </>
            )}
            {isClient && (
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={handleCancelBooking}
                disabled={actionLoading}
              >
                <Ionicons name="close-circle-outline" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Cancel Booking</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

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
  statusContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  statusText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  serviceCard: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 6,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6ba32d',
  },
  dateTimeCard: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  userCard: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#6ba32d',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  notesCard: {
    backgroundColor: '#fffbea',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffd966',
  },
  notesText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  cancellationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#ffebee',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ff6b6b',
  },
  cancellationText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  metadataCard: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    gap: 10,
  },
  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metadataLabel: {
    fontSize: 14,
    color: '#666',
  },
  metadataValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  actionsSection: {
    padding: 20,
    gap: 12,
    backgroundColor: '#fff',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
  },
  confirmButton: {
    backgroundColor: '#6ba32d',
  },
  completeButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButton: {
    backgroundColor: '#ff6b6b',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  bottomSpacer: {
    height: 40,
  },
});

export default BookingDetailScreen;
