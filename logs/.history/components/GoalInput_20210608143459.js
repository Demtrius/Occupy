import React from 'react';
import {
    StyleSheet, Text, View,Button,TextInput,ScrollView,FlatList
  } 
  from 'react-native';
const GoalInput = props => {
    return (
        <View>
        <View style={styles.inputContainer}>
        <TextInput
          placeholder="Course Goal"
          style={styles.input}
          onChangeText={goalInputHandler}
          value={enteredGoal}
        />
        </View>
        <Button title="ADD" onPress={addGoalHandler} />
        </View>
    )
};

export default GoalInput;