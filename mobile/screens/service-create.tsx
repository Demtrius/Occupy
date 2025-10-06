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
} from 'react-native';
import { useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { bookingService } from '../services';
import { showError, showSuccess } from '../store/app.store';
import { RootStackParamList } from '../types';

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

  const renderDurationOption = (minutes: number, label: string) => {
    const isSelected = durationMinutes === minutes.toString();
    return (
      <TouchableOpacity
        key={minutes}
        style={[styles.durationOption, isSelected && styles.durationOptionSelected]}
        onPress={() => setDurationMinutes(minutes.toString())}
      >
        <Text style={[styles.durationText, isSelected && styles.durationTextSelected]}>
          {label}
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
        <Text style={styles.headerTitle}>Create Service</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Service Title <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Haircut, Massage, Consultation"
            placeholderTextColor="#999"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Description <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe what this service includes..."
            placeholderTextColor="#999"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            maxLength={500}
          />
          <Text style={styles.characterCount}>{description.length}/500</Text>
        </View>

        {/* Price */}
        <View style={styles.section}>
          <Text style={styles.label}>Price (Optional)</Text>
          <View style={styles.priceInputContainer}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={[styles.input, styles.priceInput]}
              placeholder="0.00"
              placeholderTextColor="#999"
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
            />
          </View>
          <Text style={styles.hint}>Leave empty if pricing varies or is free</Text>
        </View>

        {/* Duration */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Duration <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.durationGrid}>
            {renderDurationOption(15, '15 min')}
            {renderDurationOption(30, '30 min')}
            {renderDurationOption(45, '45 min')}
            {renderDurationOption(60, '1 hour')}
            {renderDurationOption(90, '1.5 hours')}
            {renderDurationOption(120, '2 hours')}
          </View>
          <Text style={[styles.label, { marginTop: 16 }]}>
            Custom Duration (minutes)
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Enter duration in minutes"
            placeholderTextColor="#999"
            value={durationMinutes}
            onChangeText={setDurationMinutes}
            keyboardType="number-pad"
          />
        </View>

        {/* Active Status */}
        <View style={styles.section}>
          <View style={styles.switchRow}>
            <View style={styles.switchLabel}>
              <Text style={styles.label}>Active Service</Text>
              <Text style={styles.hint}>
                {isActive
                  ? 'Clients can book this service'
                  : 'Service is hidden from clients'}
              </Text>
            </View>
            <Switch
              value={isActive}
              onValueChange={setIsActive}
              trackColor={{ false: '#ccc', true: '#6ba32d' }}
              thumbColor={isActive ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color="#6ba32d" />
          <Text style={styles.infoText}>
            After creating your service, make sure to set up your availability so clients can
            book appointments.
          </Text>
        </View>

        {/* Create Button */}
        <TouchableOpacity
          style={[styles.createButton, submitting && styles.createButtonDisabled]}
          onPress={handleCreateService}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="add-circle-outline" size={20} color="#fff" />
              <Text style={styles.createButtonText}>Create Service</Text>
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
    marginBottom: 8,
  },
  required: {
    color: '#ff6b6b',
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#333',
  },
  textArea: {
    minHeight: 120,
    paddingTop: 16,
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6ba32d',
    marginRight: 8,
  },
  priceInput: {
    flex: 1,
  },
  hint: {
    fontSize: 13,
    color: '#999',
    marginTop: 6,
  },
  durationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  durationOption: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#f9f9f9',
  },
  durationOptionSelected: {
    backgroundColor: '#6ba32d',
    borderColor: '#6ba32d',
  },
  durationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  durationTextSelected: {
    color: '#fff',
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
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#e8f5e9',
    padding: 16,
    marginHorizontal: 20,
    marginTop: 8,
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
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
    marginTop: 16,
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

export default ServiceCreateScreen;
