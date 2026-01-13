import React from 'react';
import { Text, StyleSheet, View } from 'react-native';

export default function Chip({
  text,
  bg,
  color,
}: {
  text: string;
  bg: string;
  color: string;
}) {
  return (
    <View style={[styles.chip, { backgroundColor: bg }]}>
      <Text style={[styles.txt, { color }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  txt: { fontSize: 12, fontFamily: 'Poppins-Medium' },
});
