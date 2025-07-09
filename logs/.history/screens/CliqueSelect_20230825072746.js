import React,{useState,useEffect,useContext} from 'react';
import {View,Text,StyleSheet,FlatList,ActivityIndicator} from 'react-native'
import axios from 'axios';
import SelectPicker from 'react-native-form-select-picker'; 

const cliques = `http://127.0.0.1:8000/api/cliques-list`


function CliqueSelect() {}

