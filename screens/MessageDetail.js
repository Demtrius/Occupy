import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { HeaderBackButton } from '@react-navigation/elements';
import axios from 'axios';
import Notifications from './Notifications';

function MessageDetail({ route, navigation }) {
  const { messageId } = route.params;
  const [message, setMessage] = useState(null);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    // Hardcoded message for testing
    const hardcodedMessage = {
      id: 1,
      sender: 'John Doe',
      text: 'Hello, this is a test message.',
      replies: [
        { id: 1, sender: 'Jane Doe', text: 'Hi John, got your message.' },
        { id: 2, sender: 'John Doe', text: 'Great! Let\'s catch up soon.' }
      ]
    };
    setMessage(hardcodedMessage);
  }, [messageId]);

  const sendMessage = () => {
    const newReply = {
      id: message.replies.length + 1,
      sender: 'You',
      text: newMessage,
    };
    setMessage((prevMessage) => ({
      ...prevMessage,
      replies: [...prevMessage.replies, newReply],
    }));
    setNewMessage('');
  };

  return (
    <View style={styles.container}>
      <HeaderBackButton onPress={() => navigation.navigate('Notifications')} />
      {message && (
        <>
          <Text style={styles.sender}>{message.sender}</Text>
          <Text style={styles.text}>{message.text}</Text>
          <FlatList
            data={message.replies}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.replyContainer}>
                <Text style={styles.replySender}>{item.sender}</Text>
                <Text style={styles.replyText}>{item.text}</Text>
              </View>
            )}
          />
          <TextInput
            style={styles.input}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type a message"
          />
          <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    paddingTop: 100,//temp
  },
  sender: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  text: {
    fontSize: 16,
    marginBottom: 20,
  },
  replyContainer: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  replySender: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  replyText: {
    fontSize: 14,
    color: '#555',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  sendButton: {
    backgroundColor: '#6ba32d',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default MessageDetail;
