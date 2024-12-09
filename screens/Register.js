import React,{ useContext,useState } from 'react'
import {View,StyleSheet,Text,Button,TouchableOpacity,TextInput} from 'react-native'
import { ScreenContainer } from 'react-native-screens'
import  { Context } from '../components/globalContext/globalContext'
import Home from '../screens/Home'

function Register({ navigation,route,props }){

    const globalContext = useContext(Context)
    const { setIsLoggedIn,occupierObj,setOccupierObj,setToken} = globalContext
    
  
    const [email, setEmail] = useState("") 
    const [ username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [occupation, setOccupation] = useState("")
    const [open, setOpen] = useState(false)
    const [securePassword, setSecurePassword] = useState(true)
    const [ error, setError] = useState("")

  
  
    
   function handleRegister (){
      let body = JSON.stringify({
          'username': username.toLowerCase(),
          'email':email.toLowerCase(),
          'password':password.toLowerCase(),
          'occupations':occupation.toLowerCase(),
      })
      console.log('hi',body)
   fetch(process.env.EXPO_PUBLIC_BACKEND_URL + '/auth/register',{
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: body
      })
      .then(res =>{
        console.log('string',res);
        console.log('bye',res.ok)
        if(res.ok){
          return res.json();
        } 

         else {
          //  setError("Occupier already exists")
           throw res.json();
         }
      })
       .then(json => {
         console.log(json)
         setOccupierObj(json)
         setToken(json.token)
         setIsLoggedIn(true)
      })
      .catch(error =>{
        console.error(error)
      })
  }
  





      return (
        <View style={styles.container}>
  
          <Text style={styles.logintxt}></Text>
  
  
  
          <Text>{error}</Text>
  
  
          <Text style={styles.username}>EMAIL</Text>
          <TextInput value={email} onChangeText={text => setEmail(text)} placeholder="email" style={styles.labelContainer} autoCompleteType="email" textContentType='emailAddress'/>


          <Text style={styles.username}>Username</Text>
          <TextInput value={username} onChangeText={text => setUsername(text)} placeholder="username" style={styles.labelContainer}  textContentType='username'/>



          <Text style={styles.email}>Occupations</Text>
          <TextInput value={occupation} onChangeText={text => setOccupation(text)} placeholder="occupation" style={styles.labelContainer} autoCompleteType="email" textContentType='jobTitle'/>



         



          
          <Text>Password</Text>
          <TextInput secureTextEntry={securePassword} onChangeText={text => setPassword(text)} placeholder="Password" style={styles.labelContainer} autoCompleteType="password" textContentType='password'/>
  
          <TouchableOpacity onPress={() => handleRegister()} style={styles.loginContainer}>
            <Text>Register</Text>
          </TouchableOpacity>
        </View>
      );
    };

    const styles = StyleSheet.create({
      container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
      },
      text: {
        marginBottom:10
      },
      text1: {
        fontWeight:'bold',
        marginBottom:10,
        fontSize: 20
      },
      buttonContainer:{
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      paddingHorizontal: 32,
      borderRadius: 5,
      paddingBottom: 10,
      marginBottom:30,
      elevation: 90,
      backgroundColor: 'grey',
      },
      username:{
      fontWeight:'bold',
      },
      email:{
        fontWeight:'bold',
        },
      labelContainer:{
      width: '100%',
      },
      loginContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 80,
        borderRadius: 15,
        paddingBottom: 10,
        marginBottom:30,
        elevation: 90,
        backgroundColor: 'grey',
        marginTop: 25,
      },
      logintxt:{
        fontSize: 19,
        marginBottom: 40
      }
      })

export default Register