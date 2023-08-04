import React, { useState } from 'react'
import { Button,View } from 'react-native'
import DatePicker from 'react-native-date-picker'

const DOB = () => {
    const [date,setDate] = useState(new Date())
    const [open, setOpen] = useState(false)

    return (
        <View>
            return <DatePicker />
        </View>
    )
}

export default DOB;