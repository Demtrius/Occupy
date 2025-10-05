import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import axios from 'axios';

// Types
interface Post {
  title: string;
  content: string;
}

type RootStackParamList = {
  PostDetail: { id: number };
};

type PostDetailScreenRouteProp = RouteProp<RootStackParamList, 'PostDetail'>;

interface Props {
  route: PostDetailScreenRouteProp;
}

const PostDetail: React.FC<Props> = ({ route }) => {
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const { id } = route.params;

  useEffect(() => {
    axios.get<Post>(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/posts/${id}/`)
      .then(response => {
        setPost(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.log(error);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  if (!post) {
    return <Text>Post does not exist</Text>;
  }

  return (
    <View>
      <Text>{post.title}</Text>
      <Text>{post.content}</Text>
    </View>
  );
}

export default PostDetail;
