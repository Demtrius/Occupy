import React from 'react'
import { StyleSheet, Text, View,TouchableOpacity,TouchableHighlight,TouchableNativeFeedback} from "react-native";

const GoalItem = props => {
    return (
        <TouchableNativeFeedback activeOpacity={0.8} underlayColor={'#6495ED'}  onPress={props.onDelete}>
        <View style={styles.listItem}>
        <Text>{props.children}</Text>
        </View>
        </TouchableNativeFeedback>
    )
}

const styles = StyleSheet.create({
    listItem: {
        padding: 10,
        marginVertical: 10,
        backgroundColor: 'grey',
        borderColor: 'black',
        borderWidth: 1
      }
})


export default GoalItem;