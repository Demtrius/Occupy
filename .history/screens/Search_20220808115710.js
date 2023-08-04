import React,{useContext,useState,useEffect} from 'react';
import {View,Text,StyleSheet,TextInput,FlatList,SafeAreaView} from 'react-native';
import { ScreenContainer } from 'react-native-screens';
import {Context} from '../components/globalContext/globalContext'
import { SearchBar } from 'react-native-elements';
import { Searchbar } from 'react-native-paper';


function Search(props){
  const [search,setSearch] = useState('')
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