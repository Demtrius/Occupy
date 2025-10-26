import { Pressable } from "react-native";
import { Box, Text } from "./restyle-components";

interface TabsHeaderProps<T extends string> {
	tabs: Array<{ key: T; label: string }>;
	activeTab: T;
	onTabChange: (tab: T) => void;
}

export function TabsHeader<T extends string>({
	tabs,
	activeTab,
	onTabChange,
}: TabsHeaderProps<T>) {
	return (
		<Box
			flexDirection="row"
			paddingTop="m"
			borderBottomWidth={1}
			borderBottomColor="border"
		>
			{tabs.map((tab) => (
				<Pressable
					key={tab.key}
					onPress={() => onTabChange(tab.key)}
					style={{ flex: 1 }}
				>
					<Box
						alignItems="center"
						paddingVertical="s"
						borderBottomWidth={activeTab === tab.key ? 2 : 0}
						borderBottomColor="primary"
					>
						<Text
							variant="body"
							fontWeight={activeTab === tab.key ? "600" : "400"}
						>
							{tab.label}
						</Text>
					</Box>
				</Pressable>
			))}
		</Box>
	);
}
