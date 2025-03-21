import React from 'react'
import { View , Text, StyleSheet, TouchableHighlight } from 'react-native'

const GoalItem = props => {
    return (
        <TouchableHighlight activeOpacity={0.8} onPress={props.onDelete} >
        <View style={styles.listItem}>
        <Text>{props.children}</Text>
        </View>
        </TouchableHighlight>
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