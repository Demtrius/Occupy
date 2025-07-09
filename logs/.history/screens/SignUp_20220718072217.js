import React from 'react';
import {View, StyleSheet, Text, Button } from 'react-native';
import { ScreenContainer } from 'react-native-screens';


function Register({ navigation,route,props }){

    const globalContext = useContext(Context)
    const { setIsLoggedIn,occupierObj,setOccupierObj,setToken} = globalContext
    
  
    const [email, setEmail] = useState("") 
    const [ username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [securePassword, setSecurePassword] = useState(true)
    const [ error, setError] = useState("")
  
  
    
   function handleLogin (){
      let body = JSON.stringify({
          'email': username,
          'password':password
      })
      console.log(body)
   fetch(`http://127.0.0.1:8000/auth/login/`,{
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: body
      })
      .then(res =>{
        console.log(res);
        if(res.ok){
          return res.json();
        } 
         else {
           setError("Invalid credentials")
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
        console.log(error)
      })
  }
  
  
      return (
        <View style={styles.container}>
  
          <Text style={styles.logintxt}>LOGIN</Text>
  
  
  
          <Text>{error}</Text>
  
  
          <Text style={styles.email}>Email address</Text>
          <TextInput value={username} onChangeText={text => setUsername(text)} placeholder="Email" style={styles.labelContainer} autoCompleteType="email" textContentType='username'/>
  
          <Text>Password</Text>
          <TextInput secureTextEntry={securePassword} onChangeText={text => setPassword(text)} placeholder="Password" style={styles.labelContainer} autoCompleteType="password" textContentType='password'/>
  
          <TouchableOpacity onPress={() => handleLogin()} style={styles.loginContainer}>
            <Text>Login</Text>
          </TouchableOpacity>
        </View>
      );
    };

export default Register