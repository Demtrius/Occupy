import React,{useContext} from 'react'
import {View,StyleSheet,Text,TouchableOpacity} from 'react-native'
import { Context } from '../components/globalContext/globalContext'
import SignIn from '../screens/SignIn'
import Home from '../screens/Home'
import Register from '../screens/Register'

function Landing({navigation,route,props}){

    const globalContext = useContext(Context)
    const {isLoggedIn} = Context
    return (
        <View style={styles.container}>
            <Text style={styles.greeting}>Hello Occupier !</Text>
            <Text style={styles.status}>You are {(isLoggedIn)? '' : "Not"} Logged in</Text>
            <TouchableOpacity style={styles.buttonContainer} onPress={()=> navigation.navigate("SignIn")}>
                <Text>Sign in</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.buttonContainer} onPress={()=> navigation.navigate("Register")}>
                <Text> Register</Text>
            </TouchableOpacity>
        </View>
    )


}
const styles = StyleSheet.create({
container: {
flex: 1,
justifyContent: 'center',  
padding: 20,
margin:10
},
greeting: {
flex: 1,
width: '100%',
justifyContent: 'center',
alignItems: 'center',
textAlign: 'center',
},
status: {
flex: 1,
width: '100%',
justifyContent: 'center',
alignItems: 'center',
textAlign: 'center',
},
buttonContainer: {
// flex: 0.28,
// alignItems: 'center',
// justifyContent: 'center',
// paddingBottom: 78,
// justifyContent: "center",
// backgroundColor: "grey",
// padding: 4,
// margin: 100,
// borderRadius:10,
// borderWidth: 6,
// height: 25,
alignItems: 'center',
justifyContent: 'center',
paddingVertical: 12,
paddingHorizontal: 32,
borderRadius: 5,
paddingBottom: 10,
marginBottom:30,
elevation: 90,
backgroundColor: 'grey',
}
})

export default Landing