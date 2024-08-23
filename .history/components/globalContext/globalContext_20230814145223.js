 import React, {useEffect,useState,useRef,createContext,useContext} from 'react'
 import * as SecureStore from 'expo-secure-store'
 import jwt_decode from "jwt-decode";
import AsyncStorage from '@react-native-async-storage/async-storage';
const Context = createContext()

const Provider = ( { children } ) => {
  const [domain,setDomain] = useState("http://127.0.0.1:8000")
  const [isLoggedIn,setIsLoggedIn] = useState(false)
  const [occupierObj,setOccupierObj] = useState()
  const [authTokens,setAuthTokens] = useState( )

//AsyncStorage.getItem('authTokens') ? AsyncStorage.getItem('authTokens') : null
  const setToken = async (token) => {
    await SecureStore.setItemAsync('token', token)
  }
  let handleLogin = async () => {
    const  response = await fetch(`http://127.0.0.1:8000/auth/token/`,{
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({username: username, password: password})
    })
    let data = await response.json()
    console.log('data:' , data)
    console.log('response:',response)
  
    if(response.status === 200){
      setAuthTokens(data)
      setIsLoggedIn(true)
      setOccupierObj(jwt_decode(data.access))
      AsyncStorage.setItem('authTokens',JSON.stringify(data))
    } else {
      console.log(error)
    }
  }

  const globalContext = {
    domain,
    isLoggedIn,
    setIsLoggedIn,
    setToken,
    occupierObj,
    setOccupierObj,
    authTokens,
    setAuthTokens,
    handleLogin
  }

  return <Context.Provider value={globalContext}>{children}</Context.Provider>
}

export {Context, Provider}