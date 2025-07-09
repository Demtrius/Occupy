import React,{useContext,useState,useEffect} from 'react';
import {View,Text,StyleSheet} from 'react-native';
import { ScreenContainer } from 'react-native-screens';
import {Context} from '../components/globalContext/globalContext'
import { SearchBar } from 'react-native-elements';
import { Searchbar } from 'react-native-paper';
function Search(props){
  const [searchQuery, setSearchQuery] = useState('')

  const onChangeSearch = query => setSearchQuery(query)
    return (
      <View   style={styles.container}>
      <Searchbar
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
    }
})
export default Search;