import type React from "react";
import { useEffect } from "react";
import {
	View,
	StyleSheet,
	Text,
	FlatList,
	ActivityIndicator,
	RefreshControl,
} from "react-native";
import { useAuthStore } from "../store/auth.store";
import { usePostsStore } from "../store";
import {
	ScreenHeader,
	PostItem,
	EmptyState,
	NotLoggedInState,
} from "../components";

const HomeScreen: React.FC = () => {
	const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
	const { posts, loading, refreshing, fetchPosts, refreshPosts } = usePostsStore();

	// Initial load
	useEffect(() => {
		if (isLoggedIn) {
			fetchPosts();
		}
	}, [isLoggedIn, fetchPosts]);

	// Refresh handler
	const onRefresh = async () => {
		await refreshPosts();
	};

	// Not logged in state
	if (!isLoggedIn) {
		return <NotLoggedInState />;
	}

	// Loading state
	if (loading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" color="#6ba32d" />
				<Text style={styles.loadingText}>Loading your feed...</Text>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			{/* Header */}
			<ScreenHeader title="Home Feed" showBackButton={false} />

			{/* Posts List */}
			{posts.length === 0 ? (
				<EmptyState
					message="Follow cliques to see posts in your feed"
					actionText="Explore Cliques"
				/>
			) : (
				<FlatList
					data={posts}
					keyExtractor={(item) => item.id.toString()}
					renderItem={({ item }) => <PostItem post={item} />}
					refreshControl={
						<RefreshControl
							refreshing={refreshing}
							onRefresh={onRefresh}
							colors={["#6ba32d"]}
							tintColor="#6ba32d"
						/>
					}
					contentContainerStyle={styles.listContent}
					showsVerticalScrollIndicator={false}
				/>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#f5f5f5",
	},
	loadingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#f5f5f5",
	},
	loadingText: {
		marginTop: 12,
		fontSize: 16,
		color: "#666",
	},
	notLoggedInContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#f5f5f5",
		padding: 32,
	},
	notLoggedInTitle: {
		fontSize: 24,
		fontWeight: "600",
		color: "#333",
		marginTop: 16,
		marginBottom: 8,
	},
	notLoggedInText: {
		fontSize: 16,
		color: "#666",
		textAlign: "center",
	},

	emptyTitle: {
		fontSize: 20,
		fontWeight: "600",
		color: "#333",
		marginTop: 16,
		marginBottom: 8,
	},
	emptyText: {
		fontSize: 16,
		color: "#666",
		textAlign: "center",
	},
	listContent: {
		paddingVertical: 16,
	},
});

export default HomeScreen;
