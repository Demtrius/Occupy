import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { cliquesService, postsService } from "../services";
import { showError } from "../store/app.store";
import { useAuthStore } from "../store/auth.store";
import {
    Clique,
  Post,
  ScreenNavigationProp,
} from "../types";
import { useDebounce } from "../hooks";
import { PostItem } from "../components";
import { Button, Searchbar } from "react-native-paper";

const { width, height } = Dimensions.get("window");

const FeedScreen: React.FC = () => {
  const navigation = useNavigation<ScreenNavigationProp<"Feed">>();

  const [posts, setPosts] = useState<Post[]>([]);
  const [cliques, setCliques] = useState<Clique[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const [search, setSearch] = useState<string>("");
  const [filteredDataSource, setFilteredDataSource] = useState<Post[]>([]);
  const [category, setCategory] = useState<number | "all">("all");

  const [nearYouPosts, setNearYouPosts] = useState<Post[]>([]);

  const debouncedSearch = useDebounce(search, 500);

  // Fetch cliques
  const getCliques = async () => {
    try {
      const data = await cliquesService.getAllCliques();
      setCliques(data);
    } catch (error) {
      console.error("Error fetching cliques:", error);
      showError("Failed to load cliques");
    } finally {
      setLoading(false);
    }
  };

  // Fetch posts
  const getPosts = async () => {
    try {
      const data = await postsService.getFeedPosts();
      setPosts(data);
      setFilteredDataSource(data.slice(0, 3));
    } catch (error) {
      console.error("Error fetching posts:", error);
      showError("Failed to load posts");
    }
  };

  // Fetch posts for "near you" section
  const getPostsHorizontal = async () => {
    try {
      const data = await postsService.getFeedPosts();
      setNearYouPosts(data.slice(0, 5));
    } catch (error) {
      console.error("Error fetching near you posts:", error);
    }
  };

  // Refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([getCliques(), getPosts(), getPostsHorizontal()]);
    } catch (error) {
      console.error("Error refreshing:", error);
    } finally {
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    getCliques();
    getPosts();
    getPostsHorizontal();
  }, []);

  // Search filter with debounce
  useEffect(() => {
    if (debouncedSearch) {
      const filtered = posts.filter((item) => {
        const itemData = item.caption ? item.caption.toUpperCase() : "";
        return itemData.includes(debouncedSearch.toUpperCase());
      });
      setFilteredDataSource(filtered.slice(0, 3));
    } else {
      filterByCategory(category);
    }
  }, [debouncedSearch, category]);

  // Filter by category
  const filterByCategory = (selectedCategory: number | "all") => {
    setCategory(selectedCategory);
    if (selectedCategory === "all") {
      setFilteredDataSource(posts.slice(0, 3));
    } else {
      const filtered = posts.filter(
        (item) => item.cliqueId === selectedCategory,
      );
      setFilteredDataSource(filtered.slice(0, 3));
    }
  };

  // Navigate to messages
  const navigateToMessages = (userId: number) => {
    navigation.navigate(
      "NotificationsTab",
      {
        screen: "MessageDetail",
        params: { id: userId },
      },
    );
  };

  // Render near you posts
  const renderNearYou = ({ item }: { item: Post }) => {
    const cliqueName =
      cliques.find((clique) => clique.id === item.cliqueId)?.name ||
      "Unknown Clique";

    return (
      <TouchableOpacity
        style={styles.nearYouCard}
        onPress={() =>
          navigation.navigate("PostDetail", { id: item.id })
        }
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <Image
            source={{
              uri: item.avatar || "https://via.placeholder.com/300x200",
            }}
            style={styles.cardImage}
          />
          <Text style={styles.dateBadge}>{item.posted || "Recent"}</Text>
        </View>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.caption}
        </Text>
        <Text style={styles.cardSubtitle} numberOfLines={1}>
          {cliqueName}
        </Text>
        <TouchableOpacity
          style={styles.contactButton}
          onPress={(e) => {
            e.stopPropagation();
            navigateToMessages(item.userId);
          }}
        >
          <Text style={styles.contactButtonText}>Contact</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6ba32d" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Searchbar
        style={styles.searchBar}
        placeholder="Search"
        value={search}
        onChangeText={setSearch}
      />

      <View style={styles.categoryContainer}>
        <ScrollView
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollViewContent}
        >
          <Button
            mode={category === "all" ? "contained" : "outlined"}
            onPress={() => filterByCategory("all")}
            color="#6ba32d"
            contentStyle={styles.buttonContent}
            style={styles.button}
          >
            All
          </Button>
          {cliques.map((clique) => (
            <Button
              key={clique.id}
              mode={category === clique.id ? "contained" : "outlined"}
              onPress={() => filterByCategory(clique.id)}
              color="#6ba32d"
              contentStyle={styles.buttonContent}
              style={styles.button}
            >
              {clique.name}
            </Button>
          ))}
        </ScrollView>
      </View>

      <Text
        style={[
          styles.sectionTitle,
          { marginLeft: width * 0.04, marginTop: height * 0.02 },
        ]}
      >
        Posts for you
      </Text>

      <View style={{ paddingHorizontal: 8 }}>
        {filteredDataSource.length === 0 ? (
          <Text style={styles.noPostsText}>No posts available</Text>
        ) : (
          <FlatList
            data={filteredDataSource}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => <PostItem post={item} />}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            style={{ flexGrow: 0 }}
          />
        )}
      </View>

      <View style={styles.nearYouSection}>
        <Text
          style={[
            styles.sectionTitle,
            { marginLeft: width * 0.04, marginBottom: 8 },
          ]}
        >
          Near you
        </Text>
        <FlatList
          horizontal
          data={nearYouPosts}
          keyExtractor={(item) => `near-${item.id}`}
          renderItem={renderNearYou}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.nearYouContainer}
          style={styles.nearYouList}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    paddingTop: height * 0.08,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
  searchBar: {
    marginHorizontal: width * 0.04,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: height * 0.01,
    paddingHorizontal: width * 0.01,
  },
  scrollViewContent: {
    paddingHorizontal: width * 0.04,
  },
  button: {
    borderRadius: 20,
    paddingHorizontal: 0,
    marginRight: 10,
  },
  buttonContent: {
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 1,
  },
  noPostsText: {
    textAlign: "center",
    fontSize: 16,
    color: "#888",
    marginTop: 20,
  },
  nearYouSection: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "white",
    paddingBottom: 20,
  },
  nearYouContainer: {
    paddingHorizontal: width * 0.04,
  },
  nearYouList: {
    maxHeight: 200,
  },
  nearYouCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
    marginRight: 16,
    width: width * 0.4,
    padding: 16,
  },
  cardHeader: {
    position: "relative",
  },
  cardImage: {
    width: "100%",
    height: 80,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: "#E5E7EB",
  },
  dateBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#6ba32d",
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 12,
  },
  contactButton: {
    borderWidth: 1,
    borderColor: "#6ba32d",
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: "center",
  },
  contactButtonText: {
    fontSize: 14,
    color: "#6ba32d",
    fontWeight: "600",
  },
});

export default FeedScreen;
