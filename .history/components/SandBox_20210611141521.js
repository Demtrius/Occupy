import React from 'react'
import {StyleSheet, View, Text} from 'react-native'


export default function Sandbox(){
return (
   <View style={styles.container}>
       <Text style={styles.boxOne}>one</Text>
       <Text style={styles.boxTwo}>two</Text>
       <Text style={styles.boxThree}>three</Text>
       <Text style={styles.boxFour}>four</Text>
   </View>
)
}

const styles = StyleSheet.create({
container: {
    flex: 1,
    paddingTop: 40,
    backgroundColor: '#ddd'
},
boxOne: {

},
boxTwo: {

},
boxThree: {

},
boxFour: {
    
}
})
