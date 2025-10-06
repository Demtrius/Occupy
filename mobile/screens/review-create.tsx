import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { bookingService, socialService } from '../services';
import { showError, showSuccess } from '../store/app.store';
import { BookingDetail } from '../types';
import { RootStackParamList } from '../types';
import {
  ScreenHeader,
  FormSection,
  FormLabel,
  PrimaryButton,
  InfoBox,
} from '../components';
import { Colors, Spacing, Typography, BorderRadius, CommonStyles } from '../theme';

type ReviewCreateScreenRouteProp = RouteProp<RootStackParamList, 'ReviewCreate'>;
type ReviewCreateScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface Props {
  route: ReviewCreateScreenRouteProp;
}

const ReviewCreateScreen: React.FC<Props> = ({ route }) => {
  const navigation = useNavigation<ReviewCreateScreenNavigationProp>();
  const { bookingId } = route.params;

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');

  useEffect(() => {
    loadBookingData();
  }, [bookingId]);

  const loadBookingData = async () => {
    try {
      setLoading(true);
      const bookingData = await bookingService.getBookingById(bookingId);
      setBooking(bookingData);
    } catch (error: any) {
      console.error('Error loading booking:', error);
      showError(error.message || 'Failed to load booking');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (rating === 0) {
      showError('Please select a rating');
      return;
    }

    if (!booking) {
      showError('Booking data not available');
      return;
    }

    try {
      setSubmitting(true);

      const reviewData = {
        bookingId: booking.id,
        rating,
        comment: comment.trim() || undefined,
      };

      await socialService.createReview(reviewData);
      showSuccess('Review submitted successfully!');
      navigation.goBack();
    } catch (error: any) {
      console.error('Error creating review:', error);
      showError(error.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity
          key={i}
          onPress={() => setRating(i)}
          style={styles.starButton}
        >
          <Ionicons
            name={i <= rating ? 'star' : 'star-outline'}
            size={40}
            color={i <= rating ? Colors.warning : Colors.textDisabled}
          />
        </TouchableOpacity>
      );
    }
    return stars;
  };

  const getRatingLabel = (rating: number): string => {
    switch (rating) {
      case 1:
        return 'Poor';
      case 2:
        return 'Fair';
      case 3:
        return 'Good';
      case 4:
        return 'Very Good';
      case 5:
        return 'Excellent';
      default:
        return 'Select a rating';
    }
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
        title="Write Review"
        onBack={() => navigation.goBack()}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Service Info */}
        <InfoBox variant="info" style={styles.serviceCard}>
          <Text style={styles.serviceTitle}>{booking.service.title}</Text>
          <Text style={styles.serviceDescription}>{booking.service.description}</Text>
          {booking.cliqueName && (
            <View style={styles.businessRow}>
              <Ionicons name="business-outline" size={16} color={Colors.textSecondary} />
              <Text style={styles.businessName}>{booking.cliqueName}</Text>
            </View>
          )}
        </InfoBox>

        {/* Rating Section */}
        <FormSection>
          <FormLabel required>Rating</FormLabel>
          <View style={styles.starsContainer}>{renderStars()}</View>
          <Text style={[styles.ratingLabel, rating > 0 && styles.ratingLabelActive]}>
            {getRatingLabel(rating)}
          </Text>
        </FormSection>

        {/* Comment Section */}
        <FormSection>
          <FormLabel>Your Review (Optional)</FormLabel>
          <TextInput
            style={styles.commentInput}
            placeholder="Share your experience with this service..."
            placeholderTextColor={Colors.textTertiary}
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            maxLength={500}
          />
          <Text style={styles.characterCount}>{comment.length}/500</Text>
        </FormSection>

        {/* Info Box */}
        <InfoBox variant="info" style={styles.infoBox}>
          <Text style={styles.infoText}>
            Your review will help others make better decisions and help the service provider
            improve their services.
          </Text>
        </InfoBox>

        {/* Submit Button */}
        <PrimaryButton
          title="Submit Review"
          onPress={handleSubmitReview}
          disabled={rating === 0 || submitting}
          loading={submitting}
          style={styles.submitButton}
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
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  businessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  businessName: {
    ...Typography.small,
    color: Colors.textSecondary,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  starButton: {
    padding: Spacing.xs,
  },
  ratingLabel: {
    ...Typography.bodyBold,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
  ratingLabelActive: {
    color: Colors.primary,
  },
  commentInput: {
    ...Typography.body,
    color: Colors.textPrimary,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    minHeight: 120,
  },
  characterCount: {
    ...Typography.caption,
    color: Colors.textTertiary,
    textAlign: 'right',
    marginTop: Spacing.xs,
  },
  infoBox: {
    marginTop: Spacing.lg,
  },
  infoText: {
    ...Typography.body,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  submitButton: {
    marginTop: Spacing.lg,
  },
  bottomSpacer: {
    height: Spacing.xl,
  },
});

export default ReviewCreateScreen;
