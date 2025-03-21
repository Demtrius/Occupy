 import React, {useEffect,useState,useRef,createContext,useContext} from 'react'
 import * as SecureStore from 'expo-secure-store'
 import jwt_decode from "jwt-decode";
import AsyncStorage from '@react-native-async-storage/async-storage';

const Context = createContext()

const Provider = ( { children } ) => {
  const [domain,setDomain] = useState("http://127.0.0.1:8000")
  const [isLoggedIn,setIsLoggedIn] = useState(false)
  const [occupierObj,setOccupierObj] = useState( jwt_decode(AsyncStorage.getItem('authTokens')) )
  
  const [authTokens,setAuthTokens] = useState( AsyncStorage.getItem('authTokens') ? AsyncStorage.getItem('authTokens') : null )


  const setToken = async (token) => {
    await SecureStore.setItemAsync('token', token)
  }

const getItem = async() => {
  try{
    const value = await AsyncStorage.getItem('authTokens')
    if(value !== null){
      return JSON.parse(AsyncStorage.getItem('authTokens'))
    }
  }
  catch(error){
    console.log(error)
    return null;
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
  }

  return <Context.Provider value={globalContext}>{children}</Context.Provider>
}

export {Context, Provider}