import { useTheme } from "@shopify/restyle";
import { ScrollView, View } from "react-native";
import type { Theme } from "@/config/theme";
import { Button } from "./button";
import { Box } from "./restyle-components";

interface ScrollableTabsProps<T extends string> {
	tabs: Array<{ key: T; label: string }>;
	activeTab: T;
	onTabChange: (tab: T) => void;
}

export function ScrollableTabs<T extends string>({
	tabs,
	activeTab,
	onTabChange,
}: ScrollableTabsProps<T>) {
	const theme = useTheme<Theme>();

	return (
		<Box borderBottomWidth={1} borderBottomColor="border">
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={{
					paddingHorizontal: theme.spacing.m,
				}}
			>
				<View style={{ flexDirection: "row" }}>
					{tabs.map((tab, index) => {
						const isActive = tab.key === activeTab;
						const isLast = index === tabs.length - 1;
						return (
							<View
								key={tab.key}
								style={{
									marginRight: isLast ? 0 : theme.spacing.m,
								}}
							>
								<Box
									alignItems="center"
									paddingVertical="s"
									paddingHorizontal="m"
									borderBottomWidth={isActive ? 2 : 0}
									borderBottomColor="primary"
								>
									<Button
										variant="ghost"
										onPress={() => onTabChange(tab.key)}
										textProps={{
											fontWeight: isActive ? "600" : "400",
											color: isActive ? "primary" : "foreground",
										}}
									>
										{tab.label}
									</Button>
								</Box>
							</View>
						);
					})}
				</View>
			</ScrollView>
		</Box>
	);
}
