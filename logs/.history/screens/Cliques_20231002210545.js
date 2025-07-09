import React,{useState,useEffect,useContext} from 'react';
import {View,Text,StyleSheet,FlatList,ActivityIndicator,TouchableOpacity} from 'react-native'
import axios from 'axios';
import CliqueUI from './CliqueUI';


function Cliques({route,props,navigation}){
    const [cliques, setCliques] = useState([])
    const [loading,setLoading] = useState(true)

    const getCliques = () => {
        axios.get('http://127.0.0.1:8000/api/cliques-list')
        .then((response) => {
            console.log(response)
            const myCliques = response.data;
            setCliques(myCliques)
        })
        .catch((error) => console.error(error))
        .finally(() => {
            setLoading(false)
        })  
    
    }
    useEffect(() => getCliques(), [])


    const renderClique = ({props,navigation,item}) => {
        return (
            <View style={styles.container}>
            <TouchableOpacity onPress={() => this.props.navigation.navigate('CliqueUI')}>
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
        renderItem={renderClique}
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
    },
    txt: {
        borderWidth: 2,
        fontWeight: 'bold',
        fontSize: 20,
        letterSpacing: 2,
        
    }
})

export default Cliques;