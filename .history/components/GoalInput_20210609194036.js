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
const addGoalHandler = () => {
  props.onAddGoal();
  setEnteredGoal('')
}



    return (
      <Modal visible={props.visible} animationType="slide">
        <View style={styles.inputContainer}>
        <TextInput
          placeholder="Course Goal"
          style={styles.input}
          onChangeText={goalInputHandler}
          value={enteredGoal}
        />
        <Button title="CANCEL" color="red"/>
        <Button title="ADD" onPress={addGoalHandler} />
        </View>
        </Modal>
    )
    };

const styles = StyleSheet.create({
        inputContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center'
          },
          input: {
            width: '80%',
            borderColor: 'black',
            borderWidth: 1,
            padding: 10,
            marginBottom: 10,

          },
    })
export default GoalInput;