import React from 'react'
import {View,StyleSheet,Text, Button} from 'react-native'

function Home({navigation}){
return (
    <View style={styles.home}>
    <Text>Welcome Home</Text>
    <Button
    title="Go to details"
    onPress={ ()=> navigation.navigate("Details")}
    />
</View>
)
}


function DetailsScreen() {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Details Screen</Text>
      </View>
    );
  }
const styles = StyleSheet.create({
    home: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    }
})

export default Home