import React,{useContext,useState,useEffect} from 'react';
import {View,Text,StyleSheet,TextInput,FlatList,SafeAreaView} from 'react-native';
import { ScreenContainer } from 'react-native-screens';
import {Context} from '../components/globalContext/globalContext'
import { SearchBar } from 'react-native-elements';
import { Searchbar } from 'react-native-paper';


function Search(props){

const [searchQuery, setSearchQuery] = useState("")

const onChangeSearch = query => setSearchQuery(query);

    return (
      <View   style={styles.container}>
     <Searchbar
     style={styles.textInputStyle}
      placeholder="Search"
      onChangeText={onChangeSearch}
      value={searchQuery}
    />
      </View>
    )
}

const styles = StyleSheet.create({
    container:{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
        
    },
    textInputStyle: {
      flex: 1,
      height: 40,
      borderWidth: 1,
      paddingLeft: 20,
      margin: 5,
      borderColor: '#009688',
      backgroundColor: '#FFFFFF',
    },
})
export default Search;