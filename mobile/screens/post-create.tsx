import { useNavigation } from "@react-navigation/native";
import { showError, showSuccess } from "@store/app.store";
import { useAuthStore } from "@store/auth.store";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import {
	ActivityIndicator,
	Keyboard,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	TouchableWithoutFeedback,
	View,
} from "react-native";
import DropDownPicker, { type ItemType } from "react-native-dropdown-picker";
import {
	FormInput,
	FormLabel,
	InfoBox,
	type Option,
	OptionGrid,
	PrimaryButton,
	ScreenHeader,
} from "../components";
import { cliquesService, postsService } from "../services";
import {
	BorderRadius,
	Colors,
	CommonStyles,
	Spacing,
	Typography,
} from "../theme";
import type { Clique, CreatePostData, ScreenNavigationProp } from "../types";

type Language = "ALL" | "ENGLISH" | "DUTCH" | "GERMAN";

const PostCreateScreen: React.FC = () => {
	const navigation = useNavigation<ScreenNavigationProp<"PostCreateTab">>();
	const { isLoggedIn } = useAuthStore();

	const [caption, setCaption] = useState<string>("");
	const [content, setContent] = useState<string>("");
	const [selectedCliqueId, setSelectedCliqueId] = useState<number | null>(null);
	const [open, setOpen] = useState<boolean>(false);
	const [items, setItems] = useState<ItemType<number>[]>([]);
	const [selectedLanguage, setSelectedLanguage] = useState<Language>("ALL");
	const [loading, setLoading] = useState<boolean>(false);
	const [fetchingCliques, setFetchingCliques] = useState<boolean>(true);

	const fetchCliques = useCallback(async () => {
		try {
			setFetchingCliques(true);
			const cliques = await cliquesService.getAllCliques();
			setItems(
				cliques.map((clique: Clique) => ({
					label: clique.name,
					value: clique.id,
				})),
			);
		} catch (error: unknown) {
			const err = error as Error;
			console.error("Error fetching cliques:", err);
			showError("Failed to load cliques");
		} finally {
			setFetchingCliques(false);
		}
	}, []);

	// Fetch cliques on mount
	useEffect(() => {
		fetchCliques();
	}, [fetchCliques]);

	const validateForm = (): boolean => {
		if (!caption.trim()) {
			showError("Please enter post content");
			return false;
		}

		if (!selectedCliqueId) {
			showError("Please select a clique");
			return false;
		}

		return true;
	};

	const createPost = async () => {
		if (!isLoggedIn) {
			showError("You must be logged in to create a post");
			return;
		}

		if (!validateForm()) {
			return;
		}

		try {
			setLoading(true);

			const postData: CreatePostData = {
				content: content.trim() || caption.trim(),
				caption: caption.trim(),
				cliqueId: selectedCliqueId,
			};

			await postsService.createPost(postData);

			showSuccess("Post created successfully");

			// Reset form
			setCaption("");
			setContent("");
			setSelectedCliqueId(null);
			setSelectedLanguage("ALL");
		} catch (error: unknown) {
			const err = error as Error;
			console.error("Error creating post:", err);
			showError(err.message || "Failed to create post");
		} finally {
			setLoading(false);
		}
	};

	const languageOptions: Option[] = [
		{ value: "ALL", label: "All" },
		{ value: "ENGLISH", label: "English" },
		{ value: "DUTCH", label: "Dutch" },
		{ value: "GERMAN", label: "German" },
	];

	if (!isLoggedIn) {
		return (
			<View style={CommonStyles.container}>
				<View style={CommonStyles.centered}>
					<InfoBox variant="warning">
						<Text style={styles.notLoggedInText}>
							Please log in to create a post
						</Text>
					</InfoBox>
				</View>
			</View>
		);
	}

	return (
		<KeyboardAvoidingView
			style={CommonStyles.container}
			behavior={Platform.OS === "ios" ? "padding" : "height"}
		>
			<ScreenHeader title="Create Post" onBack={() => navigation.goBack()} />
			<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
				<ScrollView
					style={styles.scrollView}
					contentContainerStyle={styles.scrollContent}
					keyboardShouldPersistTaps="handled"
					showsVerticalScrollIndicator={false}
				>
					<View style={styles.content}>
						{fetchingCliques ? (
							<View style={styles.loadingContainer}>
								<ActivityIndicator size="small" color={Colors.primary} />
								<Text style={styles.loadingText}>Loading cliques...</Text>
							</View>
						) : (
							<>
								{/* Post Content */}
								<View style={styles.inputGroup}>
									<FormLabel>Post Content</FormLabel>
									<FormInput
										value={caption}
										onChangeText={setCaption}
										placeholder="Share something with your clique..."
										multiline
										numberOfLines={5}
										style={styles.captionInput}
										maxLength={500}
										showCharacterCount
									/>
								</View>

								{/* Additional Details */}
								<View style={styles.inputGroup}>
									<FormLabel>Additional Details (Optional)</FormLabel>
									<FormInput
										value={content}
										onChangeText={setContent}
										placeholder="Any additional information..."
										multiline
										numberOfLines={3}
										style={styles.contentInput}
									/>
								</View>

								{/* Language Selection */}
								<View style={styles.inputGroup}>
									<FormLabel>Language</FormLabel>
									<OptionGrid
										options={languageOptions}
										selectedValue={selectedLanguage}
										onSelect={(value) => setSelectedLanguage(value as Language)}
									/>
								</View>

								{/* Clique Selection */}
								<View style={styles.inputGroup}>
									<FormLabel>Choose a Clique</FormLabel>
									<DropDownPicker
										open={open}
										value={selectedCliqueId}
										items={items}
										setOpen={setOpen}
										setValue={setSelectedCliqueId}
										setItems={setItems}
										style={styles.dropdown}
										placeholder="Select a clique to post in"
										dropDownContainerStyle={styles.dropdownContainer}
										listMode="SCROLLVIEW"
										scrollViewProps={{
											nestedScrollEnabled: true,
										}}
									/>
								</View>

								{/* Create Button */}
								<PrimaryButton
									title="Create Post"
									onPress={createPost}
									disabled={loading || fetchingCliques}
									loading={loading}
									style={{ marginTop: Spacing.xl }}
								/>
							</>
						)}
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
	inputGroup: {
		marginBottom: Spacing.lg,
	},
	captionInput: {
		minHeight: 120,
	},
	contentInput: {
		minHeight: 80,
	},
	dropdown: {
		borderColor: Colors.border,
		borderRadius: BorderRadius.md,
		backgroundColor: Colors.white,
	},
	dropdownContainer: {
		borderColor: Colors.border,
		maxHeight: 200,
	},
	loadingContainer: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		padding: Spacing.xl,
	},
	loadingText: {
		...Typography.body,
		marginLeft: Spacing.md,
		color: Colors.textSecondary,
	},
	notLoggedInText: {
		...Typography.body,
		color: Colors.textPrimary,
		textAlign: "center",
	},
});

export default PostCreateScreen;
