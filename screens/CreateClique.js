import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableWithoutFeedback, Keyboard, Dimensions } from 'react-native';
import { TextInput, Button } from 'react-native-paper';

const { width, height } = Dimensions.get('window');

const CreateClique = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState(null);
  const [occupation, setOccupation] = useState('');

  const createClique = () => {
    fetch(process.env.EXPO_PUBLIC_BACKEND_URL + '/api/cliques-list', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        name: name,
        level: level,
        occupation: occupation,
        description: description,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then((responseJson) => {
        console.log(responseJson);
      })
      .catch((error) => {
        console.error('There was a problem with the fetch operation:', error);
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

        <Text style={styles.label}>Level</Text>
        <TextInput
          label="Level"
          value={level}
          mode="outlined"
          style={styles.input}
          onChangeText={(text) => setLevel(text)}
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

        <Button mode="contained" style={styles.createButton} onPress={createClique}>
          <Text style={styles.createButtonText}>Create Clique</Text>
        </Button>
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
});

export default CreateClique;
