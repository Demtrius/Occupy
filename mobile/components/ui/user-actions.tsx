import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, Typography, BorderRadius } from "../../theme";

interface UserActionsProps {
	showFollowButton?: boolean;
	isFollowing?: boolean;
	onFollow?: () => void;
	onUnfollow?: () => void;
	onContact?: () => void;
	isOwnProfile?: boolean;
	disabled?: boolean;
}

export const UserActions: React.FC<UserActionsProps> = ({
	showFollowButton = false,
	isFollowing = false,
	onFollow,
	onUnfollow,
	onContact,
	isOwnProfile = false,
	disabled = false,
}) => {
	if (isOwnProfile) {
		return null; // Don't show actions for own profile
	}

	return (
		<View style={styles.container}>
			{showFollowButton ? (
				<TouchableOpacity
					style={[
						styles.actionButton,
						isFollowing ? styles.unfollowButton : styles.followButton,
						disabled && styles.disabledButton,
					]}
					onPress={isFollowing ? onUnfollow : onFollow}
					disabled={disabled}
				>
					<Ionicons
						name={isFollowing ? "person-remove" : "person-add"}
						size={20}
						color={Colors.white}
					/>
					<Text style={styles.actionButtonText}>
						{isFollowing ? "Unfollow" : "Follow"}
					</Text>
				</TouchableOpacity>
			) : (
				onContact && (
					<TouchableOpacity
						style={[styles.actionButton, styles.contactButton, disabled && styles.disabledButton]}
						onPress={onContact}
						disabled={disabled}
					>
						<Ionicons name="chatbubble-outline" size={20} color={Colors.white} />
						<Text style={styles.actionButtonText}>Contact</Text>
					</TouchableOpacity>
				)
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		marginTop: Spacing.lg,
		alignItems: "center",
	},
	actionButton: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: Spacing.md,
		paddingHorizontal: Spacing.xl,
		borderRadius: BorderRadius.md,
		minWidth: 120,
		justifyContent: "center",
	},
	followButton: {
		backgroundColor: Colors.primary,
	},
	unfollowButton: {
		backgroundColor: Colors.error,
	},
	contactButton: {
		backgroundColor: Colors.primary,
	},
	disabledButton: {
		opacity: 0.5,
	},
	actionButtonText: {
		...Typography.bodyBold,
		color: Colors.white,
		marginLeft: Spacing.sm,
	},
});