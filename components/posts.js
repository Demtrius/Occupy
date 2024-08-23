import React,{useState,useEffect,useContext} from 'react';
import {View,Text,StyleSheet,FlatList,ActivityIndicator} from 'react-native'
import axios from 'axios';


const posts =  ['http://127.0.0.1:8000/api/post-list']

export default posts;