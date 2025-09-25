import React,{useState,useEffect,useContext} from 'react';
import {View,Text,StyleSheet,FlatList,ActivityIndicator} from 'react-native'
import axios from 'axios';


const posts =  [process.env.EXPO_PUBLIC_BACKEND_URL + '/api/post-list']

export default posts;