import React,{useState} from 'react';
import {
    StyleSheet, Text, View,Button,TextInput,ScrollView,FlatList,Modal
  } 
  from 'react-native';
const GoalInput = props => {
    const [enteredGoal, setEnteredGoal] = useState('');

    const goalInputHandler = (enteredText) => {
        setEnteredGoal(enteredText);
      };
    return (
      <Modal visible={props.visible} animationType="slide">
        <View style={styles.inputContainer}>
        <TextInput
          placeholder="Course Goal"
          style={styles.input}
          onChangeText={goalInputHandler}
          value={enteredGoal}
        />
        
        <Button title="ADD" onPress={props.onAddGoal.bind(this, enteredGoal)} />
        </View>
        </Modal>
    )
    };

const styles = StyleSheet.create({
        inputContainer: {

            justifyContent: 'space-between',
            alignItems: 'center'
          },
          input: {
            width: '80%',
            borderColor: 'black',
            borderWidth: 1,
            padding: 10
          },
    })
export default GoalInput;