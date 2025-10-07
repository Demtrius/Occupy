import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Entypo, FontAwesome } from "@expo/vector-icons";
import { Post } from "../types";

interface PostItemProps {
  post: Post;
}

export const PostItem: React.FC<PostItemProps> = ({ post }) => {
  const navigation = useNavigation();

  const navigateToPostDetail = (postId: number) => {
    navigation.navigate("PostDetail" as never, { id: postId } as never);
  };

  const navigateToClique = (cliqueId: number) => {
    navigation.navigate(
      "CliquesTab" as never,
      { screen: "CliqueDetail", params: { id: cliqueId } } as never,
    );
  };

  const navigateToProfile = (userId: number) => {
    navigation.navigate(
      "SearchTab" as never,
      { screen: "ViewUser", params: { id: userId } } as never,
    );
  };

  const IconButton: React.FC<{
    count?: number;
    onPress?: () => void;
    icon: string;
    color?: string;
  }> = ({ count = 0, onPress, icon, color = "#6ba32d" }) => {
    return (
      <TouchableOpacity
        style={styles.iconButton}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <FontAwesome name={icon as any} size={22} color={color} />
        <Text style={styles.iconCount}> {count} </Text>
      </TouchableOpacity>
    );
  };

  return (
    <TouchableOpacity
      style={styles.postContainer}
      onPress={() => navigateToPostDetail(post.id)}
      activeOpacity={0.95}
    >
      {/* Post Header */}
      <View style={styles.postHeader}>
        <TouchableOpacity
          onPress={() => navigateToClique(post.cliqueId)}
          style={styles.cliqueButton}
        >
          <Text style={styles.cliqueName}>{post.clique ?? "General"}</Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <Entypo name="dots-three-horizontal" size={16} color="grey" />
        </TouchableOpacity>
      </View>

      {/* Post Content */}
      <View style={styles.mainContainer}>
        <TouchableOpacity onPress={() => navigateToProfile(post.occupier.id)}>
          <Text style={styles.username}>@{post.occupier.username}</Text>
        </TouchableOpacity>

        <Text style={styles.content} numberOfLines={5}>
          {post.content}
        </Text>

        {post.caption && (
          <Text style={styles.caption} numberOfLines={2}>
            {post.caption}
          </Text>
        )}

        <Text style={styles.posted}>{post.posted}</Text>

        {/* Post Footer */}
        <View style={styles.footer}>
          <IconButton
            count={post.likesCount || 0}
            onPress={() => navigateToPostDetail(post.id)}
            icon={post.isLiked ? "heart" : "heart-o"}
            color={post.isLiked ? "#ff6b6b" : "#6ba32d"}
          />
          <IconButton
            count={post.commentsCount || 0}
            onPress={() => navigateToPostDetail(post.id)}
            icon="comment-o"
          />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  postContainer: {
    backgroundColor: "#fff",
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  postHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cliqueButton: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  cliqueName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6ba32d",
  },
  mainContainer: {
    marginTop: 4,
  },
  username: {
    fontSize: 14,
    color: "#6ba32d",
    fontWeight: "600",
    marginBottom: 8,
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
    marginBottom: 8,
  },
  caption: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
    fontStyle: "italic",
  },
  posted: {
    fontSize: 12,
    color: "#999",
    marginBottom: 12,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  iconButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 16,
  },
  iconCount: {
    fontSize: 14,
    color: "#666",
    marginLeft: 4,
  },
});
