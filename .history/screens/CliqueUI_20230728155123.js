
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
<View style={styles.container}>
    <Text>{item.name}</Text>
    <Text>{item.description}</Text>
    <Text>{item.level}</Text>
    <Text>{item.occupation}</Text>
    <Text>{item.posts}</Text>
</View>
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
        height : 300
    },
    name: {
        alignItems: 'center',
        justifyContent: 'center',
        textAlign : 'center',
        fontSize : 10
    },
    description : {
        textAlign : 'left',
        fontSize: 10,
    },
    level : {
        textAlign : 'left',
        fontSize: 10,
    },
    occupation: {
        textAlign : 'left',
        fontSize: 10,
    },
    posts : {
        alignItems: 'center',
        justifyContent: 'center',
        textAlign : 'center',
    }
})



export default CliqueUi;