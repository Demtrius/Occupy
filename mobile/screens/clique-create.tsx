import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { cliquesService } from "../services";
import { showError, showSuccess } from "../store/app.store";
import { useAuthStore } from "../store/auth.store";
import {
  ScreenNavigationProp,
  ScreenRouteProp,
} from "../types";
import {
  ScreenHeader,
  FormLabel,
  FormInput,
  PrimaryButton,
  InfoBox,
} from "../components";
import {
  Colors,
  Spacing,
  Typography,
  BorderRadius,
  CommonStyles,
}
from "../theme";

type Level = "PRIVATE" | "PUBLIC";

interface LevelItem {
  label: string;
  value: Level;
}

interface FormErrors {
  name?: string;
  occupation?: string;
  description?: string;
  level?: string;
}

interface Props {
  route: ScreenRouteProp<"CliqueCreate">;
}

const CliqueCreate: React.FC<Props> = ({ route }) => {
  const navigation = useNavigation<ScreenNavigationProp<"CliqueCreate">>();
  const user = useAuthStore((state) => state.user);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [level, setLevel] = useState<Level | null>("PUBLIC");
  const [occupation, setOccupation] = useState<string>("");
  const [open, setOpen] = useState<boolean>(false);
  const [levelItems, setLevelItems] = useState<LevelItem[]>([
    { label: "Public - Anyone can join", value: "PUBLIC" },
    { label: "Private - Invite only", value: "PRIVATE" },
  ]);
  const [loading, setLoading] = useState<boolean>(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // Validate form
  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!name.trim()) {
      errors.name = "Clique name is required";
    } else if (name.trim().length < 3) {
      errors.name = "Clique name must be at least 3 characters";
    }

    if (!occupation.trim()) {
      errors.occupation = "Occupation is required";
    } else if (occupation.trim().length < 2) {
      errors.occupation = "Occupation must be at least 2 characters";
    }

    if (!description.trim()) {
      errors.description = "Description is required";
    } else if (description.trim().length < 10) {
      errors.description = "Description must be at least 10 characters";
    }

    if (!level) {
      errors.level = "Please select a privacy level";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Create clique handler
  const handleCreateClique = async () => {
    // Check authentication
    if (!isLoggedIn || !user) {
      showError("You must be logged in to create a clique");
      navigation.navigate("SignIn");
      return;
    }

    // Clear previous errors
    setFormErrors({});

    // Validate form
    if (!validateForm()) {
      showError("Please fill in all required fields correctly");
      return;
    }

    setLoading(true);

    try {
      const cliqueData = {
        name: name.trim(),
        level: level!,
        occupation: occupation.trim(),
        description: description.trim(),
      };

      await cliquesService.createClique(cliqueData);

      showSuccess("Clique created successfully!");

      // Reset form
      setName("");
      setDescription("");
      setOccupation("");
      setLevel("PUBLIC");

      // Navigate to cliques list
      setTimeout(() => {
        navigation.navigate("Cliques");
      }, 500);
    } catch (error: any) {
      console.error("Error creating clique:", error);
      const errorMessage =
        error.message || "Failed to create clique. Please try again.";
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={CommonStyles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScreenHeader
        title="Create New Clique"
        onBack={() => navigation.goBack()}
      />

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* Subtitle */}
            <Text style={styles.subtitle}>
              Build a community around your interests and occupation
            </Text>

            {/* Clique Name */}
            <View style={styles.inputGroup}>
              <FormLabel required>Clique Name</FormLabel>
              <FormInput
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  if (formErrors.name) {
                    setFormErrors({ ...formErrors, name: undefined });
                  }
                }}
                placeholder="e.g., Software Developers Hub"
                editable={!loading}
                maxLength={100}
              />
              {formErrors.name && (
                <Text style={styles.errorText}>{formErrors.name}</Text>
              )}
            </View>

            {/* Occupation */}
            <View style={styles.inputGroup}>
              <FormLabel required>Occupation</FormLabel>
              <FormInput
                value={occupation}
                onChangeText={(text) => {
                  setOccupation(text);
                  if (formErrors.occupation) {
                    setFormErrors({ ...formErrors, occupation: undefined });
                  }
                }}
                placeholder="e.g., Software Development, Design"
                editable={!loading}
                maxLength={100}
              />
              {formErrors.occupation && (
                <Text style={styles.errorText}>{formErrors.occupation}</Text>
              )}
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <FormLabel required>Description</FormLabel>
              <FormInput
                value={description}
                onChangeText={(text) => {
                  setDescription(text);
                  if (formErrors.description) {
                    setFormErrors({ ...formErrors, description: undefined });
                  }
                }}
                placeholder="Describe what this clique is about..."
                multiline
                editable={!loading}
                maxLength={500}
                showCharacterCount
              />
              {formErrors.description && (
                <Text style={styles.errorText}>{formErrors.description}</Text>
              )}
            </View>

            {/* Privacy Level */}
            <View style={styles.inputGroup}>
              <FormLabel required>Privacy Level</FormLabel>
              <DropDownPicker
                open={open}
                value={level}
                items={levelItems}
                setOpen={setOpen}
                setValue={setLevel}
                setItems={setLevelItems}
                style={[
                  styles.dropdown,
                  formErrors.level && styles.dropdownError,
                ]}
                placeholder="Select privacy level"
                dropDownContainerStyle={styles.dropdownContainer}
                disabled={loading}
                theme="LIGHT"
                listMode="SCROLLVIEW"
              />
              {formErrors.level && (
                <Text style={styles.errorText}>{formErrors.level}</Text>
              )}
            </View>

            {/* Info Box */}
            <InfoBox
              variant={level === "PUBLIC" ? "info" : "warning"}
              style={styles.infoBox}
            >
              <Text style={styles.infoText}>
                {level === "PUBLIC"
                  ? "Public cliques are visible to everyone and anyone can join."
                  : "Private cliques require an invitation to join and are only visible to members."}
              </Text>
            </InfoBox>

            {/* Create Button */}
            <PrimaryButton
              title="Create Clique"
              onPress={handleCreateClique}
              disabled={loading}
              loading={loading}
              style={{ marginBottom: Spacing.md }}
            />

            {/* Cancel Button */}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => navigation.goBack()}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    padding: Spacing.xl,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.xxxl,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
  dropdown: {
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.white,
  },
  dropdownError: {
    borderColor: Colors.error,
  },
  dropdownContainer: {
    borderColor: Colors.border,
  },
  infoBox: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  infoText: {
    ...Typography.body,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  cancelButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelButtonText: {
    ...Typography.bodyBold,
    color: Colors.textSecondary,
  },
});

export default CliqueCreate;
