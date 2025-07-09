import React,{useState,useEffect,useContext} from 'react'
import {View,Text,StyleSheet,ActivityIndicator,FlatList} from 'react-native'
import axios from 'axios'
import {Context} from '../components/globalContext/globalContext'



function Profile(navigation,route,props){
    const globalContext = useContext(Context)
    const { setIsLoggedIn,occupierObj,setOccupierObj,token,setToken,authTokens,setAuthTokens,setItem} = globalContext




return ( 
    <View style={styles.profile}>
    {/* <Text> Your Personal Profile Here !</Text> */}
    <Text style={styles.username}>{(occupierObj) &&  (occupierObj.username)}</Text>
    <Text >{(occupierObj.occupations)}</Text>
</View>
)
}

const styles = StyleSheet.create({
profile: {
    // flex: 1, 
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
    flexDirection: 'row',
    fontSize: 2O,
},
username: {
    // flex: 1,
    alignItems: 'center',
    justifyContent: 'center' ,
    fontSize : 20,
    flexDirection: 'row'
    
}
})


export default Profile