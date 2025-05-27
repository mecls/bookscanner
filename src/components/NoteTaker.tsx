import { ColorModeContext } from '@/src/app/(tabs)/_layout';
import { Colors } from '@/src/constants/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useContext, useEffect, useState } from 'react';
import { Keyboard, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface NoteTakerProps {
  bookKey: string;
  onNoteStatusChange?: (hasNote: boolean) => void;
}

export default function NoteTaker({ bookKey, onNoteStatusChange }: NoteTakerProps) {
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);
  const { colorMode } = useContext(ColorModeContext);
  const storageKey = `book-note-${bookKey}`;

  useEffect(() => {
    AsyncStorage.getItem(storageKey).then((val) => {
      if (val) {
        setNote(val);
        onNoteStatusChange?.(true);
      } else {
        onNoteStatusChange?.(false);
      }
    });
  }, [storageKey, onNoteStatusChange]);

  const saveNote = async () => {
    await AsyncStorage.setItem(storageKey, note);
    setSaved(true);
    onNoteStatusChange?.(note.length > 0);
    Keyboard.dismiss();
    setTimeout(() => setSaved(false), 1200);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Your Notes</Text>
      <TextInput
        style={styles.input}
        value={note}
        onChangeText={setNote}
        placeholder="Write your thoughts about this book..."
        multiline
        numberOfLines={3}
        textAlignVertical="top"
        returnKeyType="done"
        onSubmitEditing={() => Keyboard.dismiss()}
      />
      <View style={styles.row}>
        <TouchableOpacity 
          style={[
            styles.saveButton, 
            { backgroundColor: colorMode === 'salmon' ? Colors.light.salmon : Colors.light.lightOrange }
          ]} 
          onPress={saveNote} 
          activeOpacity={0.8}
        >
          <Text style={styles.saveButtonText}>{saved ? 'Saved!' : 'Save Note'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 12,
    padding: 10,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ECECEC',
  },
  label: {
    fontSize: 13,
    color: '#888',
    marginBottom: 4,
    fontWeight: '600',
  },
  input: {
    minHeight: 60,
    maxHeight: 120,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: 8,
    fontSize: 14,
    color: '#222',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#F08080',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
}); 