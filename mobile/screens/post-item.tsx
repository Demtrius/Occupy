import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Text, Image, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { FontAwesome } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';

// Types
interface Post {
  avatar: string;
  occupier: string;
  clique: string;
  posted: string;
  content: string;
  caption: string;
}

type RootStackParamList = {};

type PostItemNavigationProp = StackNavigationProp<RootStackParamList>;

const PostItem: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const navigation = useNavigation<PostItemNavigationProp>();

  const getPosts = () => {
    axios.get<Post[]>(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/post-list`)
      .then((response) => {
        const myPost = response.data;
        setPosts(myPost);
      })
      .catch((error) => console.error(error))
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    getPosts();
  }, []);

  const renderPosts = ({ item }: { item: Post }) => (
    <View style={styles.container}>
      <Image source={{ uri: item.avatar }} style={styles.avatar} />
      <View style={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.name}>{item.occupier}</Text>
          <Text style={styles.handle}> @{item.clique} Â· {item.posted}</Text>
        </View>
        <Text style={styles.content}>{item.content}</Text>
        <Text style={styles.caption}>{item.caption}</Text>
        <View style={styles.engagement}>
          <FontAwesome name="comment-o" size={16} color="gray" />
          <FontAwesome name="retweet" size={16} color="gray" style={styles.icon} />
          <FontAwesome name="heart-o" size={16} color="gray" style={styles.icon} />
          <FontAwesome name="share" size={16} color="gray" style={styles.icon} />
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.mainContainer}>
      {loading ? <ActivityIndicator /> : (
        <FlatList
          data={posts}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderPosts}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    padding: 10,
  },
  container: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: 'lightgrey',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  contentContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontWeight: 'bold',
  },
  handle: {
    color: 'gray',
  },
  content: {
    lineHeight: 18,
    marginTop: 5,
  },
  caption: {
    color: 'gray',
    marginTop: 5,
  },
  engagement: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '70%',
    marginTop: 10,
  },
  icon: {
    marginLeft: 15,
  },
});

export default PostItem;
