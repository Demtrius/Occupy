
import React,{useState,useEffect,useContext} from 'react';
import {View,Text,StyleSheet,FlatList,ActivityIndicator} from 'react-native'
import { ActivityIndicator } from 'react-native'
import axios from 'axios';

const CliqueUi = () => {
const [cliqueUi,setCliqueUi] = useState([])
const [loading, setLoading] = useState([true])

const getCliqueUi = () => {
    axios.get('http://127.0.0.1:8000/api/chefs/posts')
    .then(response => {
        console.log(response)
        const myCliqueUi = response.data
        setCliqueUi(myCliqueUi)
    })
    .catch( error => console.log(error))
    .finally(() => {
        setLoading(false)
    })
}
useEffect(() => getCliqueUi(), [])

const renderCliqueUi = ({item}) => {
<View style={styles.container}>
    <Text>{item.name}</Text>
    <Text>{item.description}</Text>
    <Text>{item.level}</Text>
    <Text>{item.occupation}</Text>
    <Text>{item.posts}</Text>
</View>
}
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height : 300
    },
    name: {
        alignItems: 'center',
        justifyContent: 'center',
        textAlign : 'left',
        fontSize : 10
    }
})



export default CliqueUi;