import React,{useContext,useState} from 'react'
import {View,StyleSheet,Text, Button,TouchableOpacity} from 'react-native'
import { Context } from '../components/globalContext/globalContext'
import Feed from './Feed'

function Home({navigation,route,props}){

    const globalContext = useContext(Context)
    const { isLoggedIn } = globalContext;
    const [posts,setPost] = useState([])
    const [loading,setLoading] = useState(true)
return (
    <View style={styles.home}>
        <Feed />
</View>
)
}


const styles = StyleSheet.create({
    home: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    }
})

export default Home;