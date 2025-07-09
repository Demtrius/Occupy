
import React,{useState,useEffect,useContext} from 'react';
import {View,Text,StyleSheet,FlatList,ActivityIndicator} from 'react-native'
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
return (
    <View style={styles.container}>
    <Text style={styles.name}>{item.name}</Text>
    <Text style={styles.description}>{item.description}</Text>
    <Text style={styles.level}>{item.level}</Text>
    <Text style={styles.occupation}>{item.occupation}</Text>
    <Text style={styles.posts}>{item.posts}</Text>
</View>
)
}

return (
    <View>
        {
            loading ? <ActivityIndicator/> : (
                <FlatList 
                data={cliqueUi}
                keyExtractor={(item, index) => index.toString()}
                renderItem={renderCliqueUi}
                />
            )
        }
    </View>
)
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height : 300,
        borderBottomEndRadius :78,
        borderBottomColor: 'black',
        borderColor: 'black',
    },
    name: {
        alignItems: 'center',
        justifyContent: 'center',
        textAlign : 'center',
        fontSize : 29,
        fontWeight: 'bold',
    },
    description : {
        textAlign : 'left',
        fontSize: 10,
        fontWeight: 'bold',
    },
    level : {
        textAlign : 'left',
        fontSize: 10,
        left: 140,
        fontWeight: 'bold',
    },
    occupation: {
        textAlign : 'left',
        fontSize: 19,
        left: 140,
    },
    posts : {
        alignItems: 'center',
        justifyContent: 'center',
        textAlign : 'center',
        padding: 10,
        marginTop: 25.5,
        borderWidth: 0.25,
        marginBottom: 25.5,
    }
})



export default CliqueUi;