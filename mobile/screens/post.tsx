import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import DropDownPicker, { ItemType } from 'react-native-dropdown-picker';
import { useAuthStore } from '@store/auth.store';
import { postsService, cliquesService } from '../services';
import { showError, showSuccess } from '@store/app.store';
import { Clique, CreatePostData } from '../types';

const { width, height } = Dimensions.get('window');

type Language = 'ALL' | 'ENGLISH' | 'DUTCH' | 'GERMAN';

const Post: React.FC = () => {
  const { user, isLoggedIn } = useAuthStore();

  const [caption, setCaption] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [selectedCliqueId, setSelectedCliqueId] = useState<number | null>(null);
  const [open, setOpen] = useState<boolean>(false);
  const [items, setItems] = useState<ItemType<number>[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('ALL');
  const [loading, setLoading] = useState<boolean>(false);
  const [fetchingCliques, setFetchingCliques] = useState<boolean>(true);

  // Fetch cliques on mount
  useEffect(() => {
    fetchCliques();
  }, []);

  const fetchCliques = async () => {
    try {
      setFetchingCliques(true);
      const cliques = await cliquesService.getAllCliques();
      setItems(
        cliques.map((clique: Clique) => ({
          label: clique.name,
          value: clique.id,
        }))
      );
    } catch (error) {
      console.error('Error fetching cliques:', error);
      showError('Failed to load cliques');
    } finally {
      setFetchingCliques(false);
    }
  };

  const validateForm = (): boolean => {
    if (!caption.trim()) {
      showError('Please enter post content');
      return false;
    }

    if (!selectedCliqueId) {
      showError('Please select a clique');
      return false;
    }

    return true;
  };

  const createPost = async () => {
    if (!isLoggedIn) {
      showError('You must be logged in to create a post');
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const postData: CreatePostData = {
        content: content.trim() || caption.trim(), // Use caption as content if content is empty
        caption: caption.trim(),
        cliqueId: selectedCliqueId!,
      };

      await postsService.createPost(postData);

      showSuccess('Post created successfully');

      // Reset form
      setCaption('');
      setContent('');
      setSelectedCliqueId(null);
      setSelectedLanguage('ALL');
    } catch (error: any) {
      console.error('Error creating post:', error);
      showError(error.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <View style={styles.container}>
        <View style={styles.notLoggedInContainer}>
          <Text style={styles.notLoggedInText}>
            Please log in to create a post
          </Text>
        </View>
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <Text style={styles.title}>Create Post</Text>

        {fetchingCliques ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#6ba32d" />
            <Text style={styles.loadingText}>Loading cliques...</Text>
          </View>
        ) : (
          <>
            <Text style={styles.label}>Post Content</Text>
            <TextInput
              label="What's on your mind?"
              value={caption}
              mode="outlined"
              style={[styles.input, { height: 120 }]}
              multiline
              numberOfLines={5}
              onChangeText={setCaption}
              theme={{ colors: { primary: '#6ba32d' } }}
              placeholder="Share something with your clique..."
            />

            <Text style={styles.label}>Additional Details (Optional)</Text>
            {/* @ts-ignore - react-native-paper TextInput type issue */}
            <TextInput
              label="Add more details"
              value={content}
              mode="outlined"
              style={[styles.input, { height: 80 }]}
              multiline
              numberOfLines={3}
              onChangeText={setContent}
              theme={{ colors: { primary: '#6ba32d' } }}
              placeholder="Any additional information..."
            />

            <Text style={styles.label}>Language</Text>
            <View style={styles.tags}>
              {['ALL', 'ENGLISH', 'DUTCH', 'GERMAN'].map((language) => (
                <TouchableOpacity
                  key={language}
                  style={[
                    styles.tag,
                    selectedLanguage === language && styles.selectedTag,
                  ]}
                  onPress={() => setSelectedLanguage(language as Language)}
                >
                  <Text
                    style={[
                      styles.tagText,
                      selectedLanguage === language && styles.selectedTagText,
                    ]}
                  >
                    {language}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Choose a Clique</Text>
            <DropDownPicker
              open={open}
              value={selectedCliqueId}
              items={items}
              setOpen={setOpen}
              setValue={setSelectedCliqueId}
              setItems={setItems}
              style={styles.dropdown}
              placeholder="Select a clique to post in"
              dropDownContainerStyle={styles.dropdownContainer}
              listMode="SCROLLVIEW"
              scrollViewProps={{
                nestedScrollEnabled: true,
              }}
            />

            <Button
              mode="contained"
              style={styles.createButton}
              onPress={createPost}
              disabled={loading || fetchingCliques}
              loading={loading}
            >
              <Text style={styles.createButtonText}>
                {loading ? 'Creating...' : 'Create Post'}
              </Text>
            </Button>
          </>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#ffffff',
    paddingTop: height * 0.08,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#1F2937',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 10,
    color: '#374151',
  },
  input: {
    marginBottom: 20,
    backgroundColor: '#ffffff',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  tag: {
    backgroundColor: '#E5E7EB',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
  },
  selectedTag: {
    backgroundColor: '#6ba32d',
  },
  tagText: {
    color: '#374151',
    fontWeight: '500',
    fontSize: 14,
  },
  selectedTagText: {
    color: '#ffffff',
  },
  dropdown: {
    marginBottom: 20,
    borderColor: '#dcdcdc',
    borderRadius: 8,
  },
  dropdownContainer: {
    borderColor: '#dcdcdc',
    maxHeight: 200,
  },
  createButton: {
    backgroundColor: '#6ba32d',
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  createButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#6B7280',
  },
  notLoggedInContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notLoggedInText: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default Post;
