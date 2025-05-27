import { ColorModeContext } from '@/src/app/(tabs)/_layout';
import { Colors } from '@/src/constants/Colors';
import { useBooksStore } from '@/src/store/books';
import { Ionicons } from '@expo/vector-icons';
import React, { useContext, useState } from 'react';
import { Alert, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { ThemedText } from './ThemedText';

export default function ReadingGoals() {
  const { colorMode } = useContext(ColorModeContext);
  const [isEditing, setIsEditing] = useState(false);
  const [booksGoal, setBooksGoal] = useState('');
  const [pagesGoal, setPagesGoal] = useState('');
  const { readingStats, updateReadingStats } = useBooksStore();

  const handleSaveGoals = () => {
    const booksNum = parseInt(booksGoal);
    const pagesNum = parseInt(pagesGoal);

    if (isNaN(booksNum) || isNaN(pagesNum)) {
      Alert.alert('Error', 'Please enter valid numbers');
      return;
    }

    updateReadingStats({
      yearlyBooksGoal: booksNum,
      yearlyPagesGoal: pagesNum
    });
    setIsEditing(false);
  };

  const progressColor = colorMode === 'salmon' ? Colors.light.salmon : Colors.light.lightOrange;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="subtitle" style={{ color: 'black' }}>Reading Goals</ThemedText>
        <TouchableOpacity 
          onPress={() => setIsEditing(!isEditing)}
          style={styles.editButton}
        >
          <Ionicons 
            name={isEditing ? "checkmark" : "pencil"} 
            size={24} 
            color={progressColor}
          />
        </TouchableOpacity>
      </View>

      {isEditing ? (
        <View style={styles.editContainer}>
          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Books Goal:</ThemedText>
            <TextInput
              style={styles.input}
              value={booksGoal}
              onChangeText={setBooksGoal}
              keyboardType="numeric"
              placeholder="Number of books"
            />
          </View>
          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Pages Goal:</ThemedText>
            <TextInput
              style={styles.input}
              value={pagesGoal}
              onChangeText={setPagesGoal}
              keyboardType="numeric"
              placeholder="Number of pages"
            />
          </View>
          <TouchableOpacity 
            style={[styles.saveButton, { backgroundColor: progressColor }]}
            onPress={handleSaveGoals}
          >
            <ThemedText style={styles.saveButtonText}>Save Goals</ThemedText>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.goalsContainer}>
          <View style={styles.goalItem}>
            <ThemedText style={styles.goalLabel}>Books Goal</ThemedText>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${Math.min((readingStats.yearlyBooksRead / readingStats.yearlyBooksGoal) * 100, 100)}%`,
                    backgroundColor: progressColor
                  }
                ]} 
              />
            </View>
            <ThemedText style={styles.goalText}>
              {readingStats.yearlyBooksRead} / {readingStats.yearlyBooksGoal} books
            </ThemedText>
          </View>

          <View style={styles.goalItem}>
            <ThemedText style={styles.goalLabel}>Pages Goal</ThemedText>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${Math.min((readingStats.yearlyPagesRead / readingStats.yearlyPagesGoal) * 100, 100)}%`,
                    backgroundColor: progressColor
                  }
                ]} 
              />
            </View>
            <ThemedText style={styles.goalText}>
              {readingStats.yearlyPagesRead} / {readingStats.yearlyPagesGoal} pages
            </ThemedText>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  editButton: {
    padding: 4,
  },
  editContainer: {
    gap: 12,
  },
  inputContainer: {
    gap: 4,
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  input: {
    backgroundColor: '#f8f8f8',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  saveButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  goalsContainer: {
    gap: 16,
  },
  goalItem: {
    gap: 8,
  },
  goalLabel: {
    fontSize: 14,
    color: '#666',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  goalText: {
    fontSize: 12,
    color: '#666',
  },
}); 