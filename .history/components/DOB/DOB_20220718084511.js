import DatePicker from 'react-native-date-picker'
import React,{ useContext,useState } from 'react'
import {View,StyleSheet,Text,Button,TouchableOpacity,TextInput} from 'react-native'


export default () => {
  const [date, setDate] = useState(new Date())

  return <DatePicker date={date} onDateChange={setDate} />
}