import React from "react";
import { View, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../theme";

interface UserAvatarProps {
	profileImage?: string | null;
	size?: number;
	showPlaceholder?: boolean;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
	profileImage,
	size = 100,
	showPlaceholder = true,
}) => {
	const avatarSize = { width: size, height: size, borderRadius: size / 2 };

	return (
		<View style={styles.container}>
			{profileImage ? (
				<Image
					source={{ uri: profileImage }}
					style={[styles.avatar, avatarSize]}
				/>
			) : (
				showPlaceholder && (
					<View style={[styles.placeholder, avatarSize]}>
						<Ionicons name="person" size={size * 0.48} color={Colors.textTertiary} />
					</View>
				)
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		alignItems: "center",
		justifyContent: "center",
	},
	avatar: {
		backgroundColor: Colors.gray100,
	},
	placeholder: {
		backgroundColor: Colors.gray100,
		justifyContent: "center",
		alignItems: "center",
	},
});