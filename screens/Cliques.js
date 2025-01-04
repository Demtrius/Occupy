import React,{useState,useEffect,useContext} from 'react';
import {View,Text,StyleSheet,FlatList,ActivityIndicator,TouchableOpacity} from 'react-native'
import axios from 'axios';
import Clique from './Clique';
import { Context } from '../components/globalContext/globalContext'
import navigator from '../navigation/navigator'

function Cliques({navigation,route,props}){
    const [cliques, setCliques] = useState([])
    const [loading,setLoading] = useState(true)

    const getCliques = () => {
        axios.get(process.env.EXPO_PUBLIC_BACKEND_URL + '/api/cliques-list')
        .then((response) => {
            const myCliques = response.data;
            setCliques(myCliques)
        })
        .catch((error) => console.error(error))
        .finally(() => {
            setLoading(false)
        })
    }
    useEffect(() => getCliques(), [])


    const renderCliques = ({item}) => {
        return (
            <View style={styles.container}>
            <TouchableOpacity onPress={() => navigation.navigate("Clique")}>
                <View>
                    <Text style={styles.txt}>{item.name}</Text>
                </View>
            </TouchableOpacity>
        </View>
        )
    }


    return (
      <View style={styles.clique}>
      {loading ? <ActivityIndicator/> : (
        <FlatList
        data={cliques}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderCliques}
        />
        )}
    </View>
    )


}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 5,
        margin : 10
    },
    txt: {
        borderWidth: 2,
        fontWeight: 'bold',
        fontSize: 20,
        letterSpacing: 2,
        
    }
})

export default Cliques;