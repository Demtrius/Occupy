import React,{useContext} from 'react';
import {View,Text,StyleSheet} from 'react-native';
import { ScreenContainer } from 'react-native-screens';
import {Context} from '../components/globalContext/globalContext'
import { SearchBar } from 'react-native-elements';
function Search(props){
  
    return (
      <View   style={styles.container}>
        <Text>Search Screen</Text>
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