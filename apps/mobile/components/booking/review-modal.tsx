import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@shopify/restyle";
import { Controller, useForm } from "react-hook-form";
import { Alert, Pressable, ScrollView } from "react-native";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppModal } from "@/components/ui/modal";
import { Box, Text } from "@/components/ui/restyle-components";
import { useCreateReviewMutation } from "@/hooks/use-reviews";
import type { Booking } from "@/types";

interface ReviewModalProps {
	visible: boolean;
	onClose: () => void;
	booking: Booking | null;
}

interface ReviewFormData {
	rating: number;
	comment: string;
}

export function ReviewModal({ visible, onClose, booking }: ReviewModalProps) {
	const theme = useTheme();
	const createReviewMutation = useCreateReviewMutation();

	const {
		control,
		handleSubmit,
		formState: { isValid },
		setValue,
		watch,
	} = useForm<ReviewFormData>({
		defaultValues: {
			rating: 5,
			comment: "",
		},
	});

	const currentRating = watch("rating");

	const handleRatingPress = (rating: number) => {
		setValue("rating", rating);
	};

	const onSubmit = async (data: ReviewFormData) => {
		if (!booking) {
			Alert.alert("Error", "No booking found");
			return;
		}

		try {
			await createReviewMutation.mutateAsync({
				params: {
					path: { bookingId: booking.id },
				},
				body: {
					rating: data.rating,
					comment: data.comment || null,
				},
			});

			Alert.alert("Success", "Review submitted successfully!");
			onClose();
		} catch (_error) {
			Alert.alert("Error", "Failed to submit review. Please try again.");
		}
	};

	const renderStars = () => {
		return (
			<Box flexDirection="row" justifyContent="center" marginVertical="m">
				{[1, 2, 3, 4, 5].map((star) => (
					<Pressable
						key={star}
						onPress={() => handleRatingPress(star)}
						style={{
							padding: 8,
							minWidth: 40,
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						<Ionicons
							name={star <= currentRating ? "star" : "star-outline"}
							size={32}
							color={
								star <= currentRating
									? theme.colors.primary
									: theme.colors["muted-foreground"]
							}
						/>
					</Pressable>
				))}
			</Box>
		);
	};

	if (!booking) return null;

	return (
		<AppModal visible={visible} onClose={onClose} title="Write a Review">
			<ScrollView showsVerticalScrollIndicator={false}>
				<Box gap="m">
					{/* Booking Info */}
					<Box>
						<Text variant="body" fontWeight="600" marginBottom="s">
							Booking Details
						</Text>
						<Text variant="body" color="muted-foreground">
							{booking.service?.title || "Service"}
						</Text>
						<Text variant="caption" color="muted-foreground">
							{new Date(booking.startTs).toLocaleDateString()} at{" "}
							{new Date(booking.startTs).toLocaleTimeString([], {
								hour: "2-digit",
								minute: "2-digit",
							})}
						</Text>
					</Box>

					{/* Rating */}
					<Box>
						<Text
							variant="body"
							fontWeight="600"
							marginBottom="s"
							textAlign="center"
						>
							Rating
						</Text>
						{renderStars()}
						<Text variant="caption" color="muted-foreground" textAlign="center">
							Tap to rate
						</Text>
					</Box>

					{/* Comment */}
					<Box>
						<Text variant="body" fontWeight="600" marginBottom="s">
							Comment (Optional)
						</Text>
						<Controller
							control={control}
							name="comment"
							render={({ field: { onChange, onBlur, value } }) => (
								<Input
									multiline
									numberOfLines={4}
									value={value}
									onBlur={onBlur}
									onChangeText={onChange}
									placeholder="Share your experience..."
									textAlignVertical="top"
									style={{ minHeight: 100 }}
								/>
							)}
						/>
					</Box>
				</Box>
			</ScrollView>

			<Box marginTop="s" gap="s">
				<Button
					variant="primary"
					onPress={handleSubmit(onSubmit)}
					disabled={!isValid || createReviewMutation.isPending}
				>
					{createReviewMutation.isPending ? "Submitting..." : "Submit Review"}
				</Button>
				<Button variant="secondary" onPress={onClose}>
					Cancel
				</Button>
			</Box>
		</AppModal>
	);
}
