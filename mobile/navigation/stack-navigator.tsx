import React from "react";
import {
	createStackNavigator,
	StackNavigationOptions,
} from "@react-navigation/stack";
import { NavigationContainer } from "@react-navigation/native";
import Feed from "@screens/feed";
import PostDetail from "../screens/post-detail";

// Define the param list for this stack
type FeedStackParamList = {
	Feed: undefined;
	PostDetail: { id: number };
};

const Stack = createStackNavigator<FeedStackParamList>();

// Screen options
const screenOptions: StackNavigationOptions = {
	headerShown: true,
	headerStyle: {
		backgroundColor: "#6ba32d",
	},
	headerTintColor: "#fff",
	headerTitleStyle: {
		fontWeight: "bold",
	},
};

/**
 * Stack Navigator for Feed and Post Detail screens
 *
 * Used for navigation between feed and individual post details
 */
export default function StackNavigator(): React.ReactElement {
	return (
		<NavigationContainer>
			<Stack.Navigator
				initialRouteName="Feed"
				screenOptions={screenOptions}
				id={undefined}
			>
				<Stack.Screen
					name="Feed"
					component={Feed}
					options={{ title: "Feed" }}
				/>
				<Stack.Screen
					name="PostDetail"
					component={PostDetail}
					options={{ title: "Post Details" }}
				/>
			</Stack.Navigator>
		</NavigationContainer>
	);
}
