 import React, {useEffect,useState,useRef,createContext,useContext} from 'react'
 import * as SecureStore from 'expo-secure-store'
 import jwt_decode from "jwt-decode";
import AsyncStorage from '@react-native-async-storage/async-storage';
const Context = createContext()

const Provider = ( { children } ) => {
  const [domain,setDomain] = useState("http://127.0.0.1:8000")
  const [isLoggedIn,setIsLoggedIn] = useState(false)
  const [occupierObj,setOccupierObj] = useState()
  const [authTokens,setAuthTokens] = useState(() => AsyncStorage.getItem('authTokens') ? JSON.parse(AsyncStorage.getItem('authTokens')) : null)


  const setToken = async (token) => {
    await SecureStore.setItemAsync('token', token)
  }

  // const getData = async () => {
  //   try {
  //     const jsonValue = await AsyncStorage.getItem('authTokens')
  //     return jsonValue != null ? JSON.parse(AsyncStorage.getItem('authTokens')) : null
  //   }catch(e){
  //     console.log(error)
  //   }
  // }

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