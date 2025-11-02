import { ActionSheetIOS, Alert, Platform } from "react-native";

export interface OverflowMenuAction {
	label: string;
	onPress: () => void;
	destructive?: boolean;
}

interface PresentOverflowMenuOptions {
	title?: string;
	message?: string;
	cancelLabel?: string;
}

/**
 * Presents a platform-appropriate overflow menu with the provided actions.
 */
export function presentOverflowMenu(
	actions: OverflowMenuAction[],
	{ title, message, cancelLabel = "Cancel" }: PresentOverflowMenuOptions = {},
) {
	if (actions.length === 0) {
		return;
	}

	if (Platform.OS === "ios") {
		const optionLabels = [
			...actions.map((action) => action.label),
			cancelLabel,
		];
		const destructiveIndex = actions.findIndex((action) => action.destructive);
		ActionSheetIOS.showActionSheetWithOptions(
			{
				title,
				message,
				options: optionLabels,
				cancelButtonIndex: optionLabels.length - 1,
				destructiveButtonIndex:
					destructiveIndex !== -1 ? destructiveIndex : undefined,
			},
			(selectedIndex) => {
				if (selectedIndex == null || selectedIndex < 0) {
					return;
				}
				if (selectedIndex >= actions.length) {
					return;
				}
				const action = actions[selectedIndex];
				if (action) {
					action.onPress();
				}
			},
		);
		return;
	}

	Alert.alert(
		title ?? "",
		message ?? undefined,
		[
			...actions.map((action) => ({
				text: action.label,
				onPress: action.onPress,
				...(action.destructive ? { style: "destructive" as const } : {}),
			})),
			{
				text: cancelLabel,
				style: "cancel" as const,
			},
		],
		{ cancelable: true },
	);
}
