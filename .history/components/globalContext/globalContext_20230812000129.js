 import React, {useEffect,useState,useRef,createContext,useContext} from 'react'
 import * as SecureStore from 'expo-secure-store'

const Context = createContext()

const Provider = ( { children } ) => {
  
  const [domain,setDomain] = useState("http://127.0.0.1:8000")
  const [isLoggedIn,setIsLoggedIn] = useState(false)
  const [occupierObj,setOccupierObj] = useState()
  const [authTokens,setAuthTokens] = useState()
  const [profile,setProfile] = useState({})
 

  const setToken = async (token) => {
    await SecureStore.setItemAsync('token', token)
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