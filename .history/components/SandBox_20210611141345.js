import React from 'react'
import {StyleSheet, View, Text} from 'react-native'


export default function Sandbox(){
return (
   <View style={styles.container}>
       <Text style={styles.boxOne}>one</Text>

   </View>
)
}

const styles = StyleSheet.create({
container: {
    flex: 1,
    paddingTop: 40,
    backgroundColor: '#ddd'
}
})
