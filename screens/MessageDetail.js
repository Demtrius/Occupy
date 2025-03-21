import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { HeaderBackButton } from '@react-navigation/elements';

const { height } = Dimensions.get('window');

function MessageDetail({ route, navigation }) {
  const { messageId } = route.params;
  const [message, setMessage] = useState(null);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    // Hardcoded message for testing
    const hardcodedMessage = {
      id: 1,
      sender: 'Brooke Davis',
      text: "Hey Lucas! How's your project going?",
      replies: [
        { id: 1, sender: 'Lucas', text: "Hi Brooke! It's going well. Thanks for asking!" },
        { id: 2, sender: 'Brooke Davis', text: 'No worries. Let me know if you need any help 😊' },
      ],
    };
    setMessage(hardcodedMessage);
  }, [messageId]);

  const sendMessage = () => {
    if (newMessage.trim().length === 0) return;

    const newReply = {
      id: message.replies.length + 1,
      sender: 'You',
      text: newMessage.trim(),
    };
    setMessage((prevMessage) => ({
      ...prevMessage,
      replies: [...prevMessage.replies, newReply],
    }));
    setNewMessage('');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <HeaderBackButton
          onPress={() => navigation.navigate('Notification')}
          tintColor="#6ba32d" // Change to green
        />
        <Text style={styles.headerTitle}>{message?.sender}</Text>
      </View>
      {message && (
        <>
          <FlatList
            data={message.replies}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.messageBubble,
                  item.sender === 'You' ? styles.userMessage : styles.otherMessage,
                ]}
              >
                <Text style={styles.messageSender}>{item.sender}</Text>
                <Text style={styles.messageText}>{item.text}</Text>
              </View>
            )}
            ListHeaderComponent={() => (
              <View style={styles.messageBubble}>
                <Text style={styles.messageSender}>{message.sender}</Text>
                <Text style={styles.messageText}>{message.text}</Text>
              </View>
            )}
            contentContainerStyle={styles.messageList}
          />
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Type a message"
              placeholderTextColor="black" // Change placeholder text color to black
            />
            <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
              <Text style={styles.sendButtonText}>Send</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: height * 0.08, // Add padding to avoid content getting under the dynamic island
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6ba32d', // Change to green
    marginLeft: 8,
  },
  messageList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  messageBubble: {
    backgroundColor: '#ddd',
    padding: 12,
    borderRadius: 20,
    marginVertical: 6,
    maxWidth: '80%',
  },
  userMessage: {
    backgroundColor: '#d1f7c4',
    alignSelf: 'flex-end',
  },
  otherMessage: {
    backgroundColor: '#ddd',
    alignSelf: 'flex-start',
  },
  messageSender: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,

    // backgroundColor: '#ffffff',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    fontSize: 14,
  },
  sendButton: {
    marginLeft: 12,
    backgroundColor: '#6ba32d', // Change to green
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default MessageDetail;
