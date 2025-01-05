import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { HeaderBackButton } from '@react-navigation/elements';
import axios from 'axios';
import Notifications from './Notifications';

function ViewUser({ route }) {
  const { id } = route.params;
  console.log(id)
  
  return (
    <View style={styles.container}>
        <Text>{id}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    paddingTop: 100,//temp
  },
});

export default ViewUser;
