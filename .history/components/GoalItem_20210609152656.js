import React from 'react'
import { StyleSheet, Text, View,TouchableOpacity} from "react-native";

const GoalItem = props => {
    return (
        <TouchableOpacity>
        <View style={styles.listItem}>
        <Text>{props.children}</Text>
        </View>
        </TouchableOpacity>
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