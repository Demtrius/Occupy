import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableWithoutFeedback, Keyboard, Dimensions } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import DropDownPicker from 'react-native-dropdown-picker';

const { width, height } = Dimensions.get('window');

const CreateClique = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState(null);
  const [occupation, setOccupation] = useState('');
  const [open, setOpen] = useState(false);
  const [levelItems, setLevelItems] = useState([
    { label: 'Private', value: 'PRIVATE' },
    { label: 'Public', value: 'PUBLIC' },
  ]);
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const createClique = () => {
    axios
      .post(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/cliques-list`, {
        name: name,
        level: level,
        occupation: occupation,
        description: description,
      })
      .then((response) => {
        console.log(response.data);
        setFeedbackMessage('Clique created successfully');
      })
      .catch((error) => {
        console.error('There was a problem with the request:', error);
        setFeedbackMessage('Failed to create clique');
      });
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <Text style={styles.title}>Create Clique</Text>

        <Text style={styles.label}>Clique Name</Text>
        <TextInput
          label="Clique Name"
          value={name}
          mode="outlined"
          style={styles.input}
          onChangeText={(text) => setName(text)}
          theme={{ colors: { primary: '#6ba32d' } }}
        />

        <Text style={styles.label}>Occupation</Text>
        <TextInput
          label="Occupation"
          value={occupation}
          mode="outlined"
          style={styles.input}
          onChangeText={(text) => setOccupation(text)}
          theme={{ colors: { primary: '#6ba32d' } }}
        />

        <Text style={styles.label}>Clique Description</Text>
        <TextInput
          label="Description"
          value={description}
          mode="outlined"
          style={[styles.input, { height: 100 }]}
          multiline
          onChangeText={(text) => setDescription(text)}
          theme={{ colors: { primary: '#6ba32d' } }}
        />

        <Text style={styles.label}>Level</Text>
        <DropDownPicker
          open={open}
          value={level}
          items={levelItems}
          setOpen={setOpen}
          setValue={setLevel}
          setItems={setLevelItems}
          style={styles.dropdown}
          placeholder="Select Level"
        />

        <Button mode="contained" style={styles.createButton} onPress={createClique}>
          <Text style={styles.createButtonText}>Create Clique</Text>
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

export default CreateClique;
