import React from 'react'
import {
    StyleSheet, Text, View,Button,TextInput,ScrollView,FlatList
  } 
  from 'react-native';

const GoalItem = props => {
    return <View style={styles.listItem}>
        <Text>{props.children}</Text>
    </View>

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