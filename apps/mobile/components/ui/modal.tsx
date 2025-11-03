import type React from "react";
import {
	KeyboardAvoidingView,
	Modal,
	Platform,
	ScrollView,
	TouchableWithoutFeedback,
	useWindowDimensions,
} from "react-native";
import { Box, Text } from "./restyle-components";

export interface AppModalProps {
	visible: boolean;
	onClose: () => void;
	title?: string;
	children: React.ReactNode;
	footer?: React.ReactNode;
	dismissOnBackdropPress?: boolean;
}

export function AppModal({
	visible,
	onClose,
	title,
	children,
	footer,
	dismissOnBackdropPress = true,
}: AppModalProps) {
	const { height: screenHeight } = useWindowDimensions();
	const modalMaxHeight = screenHeight * 0.85;

	const handleBackdropPress = () => {
		if (dismissOnBackdropPress) {
			onClose();
		}
	};

	return (
		<Modal
			visible={visible}
			transparent
			animationType="fade"
			onRequestClose={onClose}
		>
			<TouchableWithoutFeedback onPress={handleBackdropPress}>
				<Box
					flex={1}
					style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
					justifyContent="flex-end"
					padding="s"
					paddingBottom="l"
				>
					<TouchableWithoutFeedback onPress={() => undefined}>
						<KeyboardAvoidingView
							behavior={Platform.OS === "ios" ? "padding" : undefined}
							style={{ width: "100%" }}
						>
							<Box
								backgroundColor="background"
								borderRadius="xl"
								padding="l"
								gap="l"
								shadowOffset={{ width: 0, height: 8 }}
								shadowOpacity={0.2}
								shadowRadius={24}
								elevation={12}
								alignSelf={"stretch"}
								maxHeight={modalMaxHeight}
								style={{
									shadowColor: "#000000",
								}}
							>
								{title ? (
									<Text variant="subheader" fontWeight="600">
										{title}
									</Text>
								) : null}
								<ScrollView showsVerticalScrollIndicator={false}>
									<Box flexShrink={1}>{children}</Box>
								</ScrollView>
								{footer ? (
									<Box marginTop="s" gap="s">
										{footer}
									</Box>
								) : null}
							</Box>
						</KeyboardAvoidingView>
					</TouchableWithoutFeedback>
				</Box>
			</TouchableWithoutFeedback>
		</Modal>
	);
}
