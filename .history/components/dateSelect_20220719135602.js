import { StyleSheet, View, Pressable, Dimensions, Text } from "react-native";
import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { getFormattedDate } from "../utility/date";
import RNDateTimePicker from "@react-native-community/datetimepicker";
// import { GlobalStyles } from "../constants/GlobalStyles";

export default function DateSelect({ minDate, date, setDate }) {
    const [datePicker, setDatePicker] = useState(false);
    function showDatePicker() {
        setDatePicker(true);
    }

    function onDateSelected(e, value) {
        setDate(value);
        setDatePicker(false);
    }

    return (
        <View style={styles.buttonOuterContainer}>
            <Pressable
                onPress={showDatePicker}
                style={[
                    styles.buttonInnerContainer,
                    ({ pressed }) => pressed && styles.pressed,
                ]}
                android_ripple='#ccc'
            >
                <Text style={styles.dateText}>{getFormattedDate(date)}</Text>

                {datePicker && (
                    <RNDateTimePicker
                        minimumDate={minDate}
                        value={date}
                        mode={"date"}
                        display={"default"}
                        onChange={onDateSelected}
                    />
                )}

                <Ionicons
                    name='calendar'
                    size={24}
                    // color={GlobalStyles.colors.lightText}
                />
            </Pressable>
        </View>
    );
}
