import React from 'react'
import { View , Text, StyleSheet, Touchable } from 'react-native'

function GoalItem (this.props.) {
    return (
    <Touchable>
    <View style={styles.listItem}>
        <Text>{props.children}</Text>
        </View>
     </Touchable>
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