import React, { useState } from 'react'
import { Button,View } from 'react-native'
import DatePicker from 'react-native-date-picker'

const DOB = () => {
    const [date,setDate] = useState(new Date())
    const [open, setOpen] = useState(false)

    return (
        <View>
        <DatePicker
        modal
        open={open}
        date={date}
        onConfirm={(date) => {
          setOpen(false)
          setDate(date)
        }}
        onCancel={() => {
          setOpen(false)
        }}
      />
        </View>
    )
}

export default DOB;