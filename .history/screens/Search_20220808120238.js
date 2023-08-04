import React,{useContext,useState,useEffect} from 'react';
import {View,Text,StyleSheet,TextInput,FlatList,SafeAreaView} from 'react-native';
import { ScreenContainer } from 'react-native-screens';
import {Context} from '../components/globalContext/globalContext'
import { SearchBar } from 'react-native-elements';
import { Searchbar } from 'react-native-paper';


function Search(props){
  const [search,setSearch] = useState('')
  const [filteredDataSource, setFilteredDataSource] = useState([]);
  const [masterDataSource, setMasterDataSource] = useState([]);


  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/search')
      .then((response) => response.json())
      .then((responseJson) => {
        setFilteredDataSource(responseJson);
        setMasterDataSource(responseJson);
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);
    return (
      <View   style={styles.container}>
        <Text> Search screen</Text>
      </View>
    )
}

const styles = StyleSheet.create({
    container:{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    }
})
export default Search;