import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, Keyboard, Dimensions } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import DropDownPicker from 'react-native-dropdown-picker';
import axios from 'axios';
import { Context } from '../components/globalContext/globalContext';

const { width, height } = Dimensions.get('window');

const Post = () => {
  const globalContext = useContext(Context);
  const { occupierObj } = globalContext;
  const [content, setContent] = useState('');
  const [caption, setCaption] = useState('');
  const [posted, setPosted] = useState(new Date());
  const [clique, setClique] = useState([]);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(null);
  const [items, setItems] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState('ALL');
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const fetchCliques = () => {
    fetch(process.env.EXPO_PUBLIC_BACKEND_URL + '/api/cliques-list')
      .then((response) => response.json())
      .then((data) =>
        setItems(data.map((item) => ({ label: item.name, value: item.name })))
      );
  };

  useEffect(() => fetchCliques(), []);

  const createPost = () => {
    axios.post(process.env.EXPO_PUBLIC_BACKEND_URL + '/api/post-create', {
      content: content,
      caption: caption,
      posted: new Date(),
      clique: clique,
    }, {
      headers: {
        'Authorization': 'Bearer ' + occupierObj.token,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    })
      .then((response) => { 
        setFeedbackMessage('Post created successfully');
      })
      .catch((error) => { 
        setFeedbackMessage('Failed to create post');
      });
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <Text style={styles.title}>Create post</Text>

        <Text style={styles.label}>Your post name</Text>
        <TextInput
          label="Post Name"
          value={content}
          mode="outlined"
          style={styles.input}
          onChangeText={(text) => setContent(text)}
          theme={{ colors: { primary: '#6ba32d' } }}
        />

        <Text style={styles.label}>Post Information</Text>
        <TextInput
          label="Information"
          value={caption}
          mode="outlined"
          style={[styles.input, { height: 100 }]}
          multiline
          onChangeText={(text) => setCaption(text)}
          theme={{ colors: { primary: '#6ba32d' } }}
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
              onPress={() => setSelectedLanguage(language)}
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
          value={clique}
          items={items}
          setOpen={setOpen}
          setValue={setClique}
          setItems={setItems}
          style={styles.dropdown}
          placeholder="Select Clique"
        />

        <Button mode="contained" style={styles.createButton} onPress={createPost}>
          <Text style={styles.createButtonText}>Create post</Text>
        </Button>

        {feedbackMessage ? (
          <Text style={styles.feedbackMessage}>{feedbackMessage}</Text>
        ) : null}
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#ffffff',
    paddingTop: height * 0.08, // Add padding to avoid content getting under the dynamic island
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 10,
  },
  input: {
    marginBottom: 20,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  tag: {
    backgroundColor: '#E5E7EB',
    paddingVertical: 5,
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
  },
  selectedTagText: {
    color: '#ffffff',
  },
  dropdown: {
    marginBottom: 20,
    borderColor: '#dcdcdc',
  },
  createButton: {
    backgroundColor: '#6ba32d',
    paddingVertical: 10,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  feedbackMessage: {
    marginTop: 20,
    fontSize: 16,
    color: 'green',
    textAlign: 'center',
  },
});

export default Post;
