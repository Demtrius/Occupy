import React,{useContext,useState,useEffect} from 'react'
import {View,StyleSheet,Text, Button,TouchableOpacity,FlatList, Pressable} from 'react-native'
import { Context } from '../components/globalContext/globalContext'
import Feed from './Feed'
import { ActivityIndicator } from 'react-native';
import axios from 'axios';
import { Link } from 'expo-router';
import Entypo from '@expo/vector-icons/Entypo';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import posts from '../components/posts'


const IconButton = () => {
    return (
    <View style={{flexDirection: 'row', alignItems:'center'}}>
    <FontAwesome name="comment-o" size={22} color="black" />
        {/* Number */}
        <Text style={{fontSize: 12}}> 9 </Text>
    </View>
    )
}


export default IconButton