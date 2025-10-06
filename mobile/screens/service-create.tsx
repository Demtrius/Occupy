import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { bookingService } from '../services';
import { showError, showSuccess } from '../store/app.store';
import { RootStackParamList } from '../types';
import {
  ScreenHeader,
  FormSection,
  FormLabel,
  FormInput,
  PrimaryButton,
  InfoBox,
  OptionGrid,
  SwitchRow,
  Option,
} from '../components';
import { Colors, Spacing, Typography, BorderRadius, CommonStyles } from '../theme';

type ServiceCreateScreenRouteProp = RouteProp<RootStackParamList, 'ServiceCreate'>;
type ServiceCreateScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface Props {
  route: ServiceCreateScreenRouteProp;
}

const ServiceCreateScreen: React.FC<Props> = ({ route }) => {
  const navigation = useNavigation<ServiceCreateScreenNavigationProp>();
  const { cliqueId } = route.params;

  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [durationMinutes, setDurationMinutes] = useState<string>('30');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const validateForm = (): boolean => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please enter a service title');
      return false;
    }

    if (!description.trim()) {
      Alert.alert('Validation Error', 'Please enter a service description');
      return false;
    }

    if (!durationMinutes || parseInt(durationMinutes) < 1) {
      Alert.alert('Validation Error', 'Please enter a valid duration (minimum 1 minute)');
      return false;
    }

    if (price && isNaN(parseFloat(price))) {
      Alert.alert('Validation Error', 'Please enter a valid price');
      return false;
    }

    if (price && parseFloat(price) < 0) {
      Alert.alert('Validation Error', 'Price cannot be negative');
      return false;
    }

    return true;
  };

  const handleCreateService = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);

      const serviceData = {
        cliqueId,
        title: title.trim(),
        description: description.trim(),
        price: price.trim() || undefined,
        durationMinutes: parseInt(durationMinutes),
        isActive,
      };

      await bookingService.createService(serviceData);
      showSuccess('Service created successfully!');
      navigation.goBack();
    } catch (error: any) {
      console.error('Error creating service:', error);
      showError(error.message || 'Failed to create service');
    } finally {
      setSubmitting(false);
    }
  };

  const durationOptions: Option[] = [
    { value: '15', label: '15 min' },
    { value: '30', label: '30 min' },
    { value: '45', label: '45 min' },
    { value: '60', label: '1 hour' },
    { value: '90', label: '1.5 hours' },
    { value: '120', label: '2 hours' },
  ];

  return (
    <View style={CommonStyles.container}>
      <ScreenHeader
        title="Create Service"
        onBack={() => navigation.goBack()}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <FormSection>
          <FormLabel required>Service Title</FormLabel>
          <FormInput
            placeholder="e.g., Haircut, Massage, Consultation"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
        </FormSection>

        {/* Description */}
        <FormSection>
          <FormLabel required>Description</FormLabel>
          <TextInput
            style={styles.textArea}
            placeholder="Describe what this service includes..."
            placeholderTextColor={Colors.textTertiary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            maxLength={500}
          />
          <Text style={styles.characterCount}>{description.length}/500</Text>
        </FormSection>

        {/* Price */}
        <FormSection>
          <FormLabel>Price (Optional)</FormLabel>
          <View style={styles.priceInputContainer}>
            <Text style={styles.currencySymbol}>$</Text>
            <FormInput
              placeholder="0.00"
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
              style={styles.priceInput}
            />
          </View>
          <Text style={styles.hint}>Leave empty if pricing varies or is free</Text>
        </FormSection>

        {/* Duration */}
        <FormSection>
          <FormLabel required>Duration</FormLabel>
          <OptionGrid
            options={durationOptions}
            selectedValue={durationMinutes}
            onSelect={(value) => setDurationMinutes(value)}
          />
          <FormLabel style={styles.customDurationLabel}>Custom Duration (minutes)</FormLabel>
          <FormInput
            placeholder="Enter duration in minutes"
            value={durationMinutes}
            onChangeText={setDurationMinutes}
            keyboardType="number-pad"
          />
        </FormSection>

        {/* Active Status */}
        <FormSection>
          <SwitchRow
            label="Active Service"
            description={
              isActive
                ? 'Clients can book this service'
                : 'Service is hidden from clients'
            }
            value={isActive}
            onValueChange={setIsActive}
          />
        </FormSection>

        {/* Info Box */}
        <InfoBox variant="info" style={styles.infoBox}>
          <Text style={styles.infoText}>
            After creating your service, make sure to set up your availability so clients can
            book appointments.
          </Text>
        </InfoBox>

        {/* Create Button */}
        <PrimaryButton
          title="Create Service"
          onPress={handleCreateService}
          disabled={submitting}
          loading={submitting}
          style={styles.createButton}
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
  textArea: {
    ...Typography.body,
    color: Colors.textPrimary,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    minHeight: 120,
    paddingTop: Spacing.lg,
  },
  characterCount: {
    ...Typography.caption,
    color: Colors.textTertiary,
    textAlign: 'right',
    marginTop: Spacing.xs,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  currencySymbol: {
    ...Typography.h3,
    color: Colors.primary,
  },
  priceInput: {
    flex: 1,
  },
  hint: {
    ...Typography.small,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
  },
  customDurationLabel: {
    marginTop: Spacing.lg,
  },
  infoBox: {
    marginTop: Spacing.lg,
  },
  infoText: {
    ...Typography.body,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  createButton: {
    marginTop: Spacing.lg,
  },
  bottomSpacer: {
    height: Spacing.xl,
  },
});

export default ServiceCreateScreen;
