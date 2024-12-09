import React,{useContext,useState,useEffect} from 'react';
import {View,Text,StyleSheet,TextInput,FlatList,SafeAreaView} from 'react-native';
import { ScreenContainer } from 'react-native-screens';
import {Context} from '../components/globalContext/globalContext'
import { SearchBar } from 'react-native-elements';
import { Searchbar } from 'react-native-paper';


function Search(props){

const [search, setSearch] = useState('')
const [filteredDataSource, setFilteredDataSource] = useState([]);
const [masterDataSource, setMasterDataSource] = useState([]);


useEffect(() => {
  fetch(process.env.EXPO_PUBLIC_BACKEND_URL + '/api/search')
    .then((response) => response.json())
    .then((responseJson) => {
      setFilteredDataSource(responseJson);
      setMasterDataSource(responseJson);
    })
    .catch((error) => {
      console.error(error);
    });
}, []);

const searchFilterFunction = (text) => {
  // Check if searched text is not blank
  if (text) {
    // Inserted text is not blank
    // Filter the masterDataSource
    // Update FilteredDataSource
    const newData = masterDataSource.filter(
      function (item) {
        const itemData = item.name
          ? item.name.toUpperCase()
          : ''.toUpperCase();
        const textData = text.toUpperCase();
        return itemData.indexOf(textData) > -1;
    });
    setFilteredDataSource(newData);
    setSearch(text);
  } else {
    // Inserted text is blank
    // Update FilteredDataSource with masterDataSource
    setFilteredDataSource(masterDataSource);
    setSearch(text);
  }
};

const ItemView = ({item}) => {
  return (
    <View>
      <Text style={styles.txt}>{item.name}</Text>
    </View>
  )
}


    return (
      <View>
     <Searchbar
     style={styles.textInputStyle}
      placeholder="Search"
      value={search}
      onChangeText={(text) => searchFilterFunction(text)}
    />
     <FlatList
     data={filteredDataSource}
      keyExtractor={(item, index) => index.toString()}
      renderItem={ItemView}
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
      height: 40,
      borderWidth: 1,
      paddingLeft: 20,
      margin: 5,
      backgroundColor: '#FFFFFF',
    },
    txt: {
      margin: 8
    }
})
export default Search;