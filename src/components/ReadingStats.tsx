import { FontAwesome } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useBooksStore } from '../store/books';
import { ThemedText } from './ThemedText';

export default function ReadingStats() {
  const galleryBooks = useBooksStore((state) => state.galleryBooks);

  const stats = useMemo(() => {
    const readBooks = galleryBooks.filter(book => book.status === 'read');
    const totalBooks = galleryBooks.length;
    const totalPages = readBooks.reduce((sum, book) => 
      sum + (book.readingProgress?.totalPages || 0), 0);
    const pagesRead = readBooks.reduce((sum, book) => 
      sum + (book.readingProgress?.currentPage || 0), 0);
    const totalReadingTime = readBooks.reduce((sum, book) => 
      sum + (book.readingProgress?.readingTime || 0), 0);
    
    // Calculate average reading speed (pages per hour)
    const avgReadingSpeed = totalReadingTime > 0 
      ? Math.round((pagesRead / totalReadingTime) * 60)
      : 0;

    // Calculate completion rate
    const completionRate = totalBooks > 0 
      ? Math.round((readBooks.length / totalBooks) * 100)
      : 0;

    // Calculate average book length
    const avgBookLength = readBooks.length > 0
      ? Math.round(totalPages / readBooks.length)
      : 0;

    return {
      totalBooks,
      readBooks: readBooks.length,
      totalPages,
      pagesRead,
      totalReadingTime,
      avgReadingSpeed,
      completionRate,
      avgBookLength
    };
  }, [galleryBooks]);

  return (
    <View style={styles.container}>      
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <FontAwesome name="book" size={24} color="#F08080" />
          <ThemedText style={styles.statValue}>{stats.totalBooks}</ThemedText>
          <ThemedText style={styles.statLabel}>Total Books</ThemedText>
        </View>

        <View style={styles.statCard}>
          <FontAwesome name="check-circle" size={24} color="#F08080" />
          <ThemedText style={styles.statValue}>{stats.readBooks}</ThemedText>
          <ThemedText style={styles.statLabel}>Books Read</ThemedText>
        </View>

        <View style={styles.statCard}>
          <FontAwesome name="file-text" size={24} color="#F08080" />
          <ThemedText style={styles.statValue}>{stats.pagesRead}</ThemedText>
          <ThemedText style={styles.statLabel}>Pages Read</ThemedText>
        </View>

        <View style={styles.statCard}>
          <FontAwesome name="clock-o" size={24} color="#F08080" />
          <ThemedText style={styles.statValue}>{Math.round(stats.totalReadingTime / 60)}h</ThemedText>
          <ThemedText style={styles.statLabel}>Reading Time</ThemedText>
        </View>

        <View style={styles.statCard}>
          <FontAwesome name="tachometer" size={24} color="#F08080" />
          <ThemedText style={styles.statValue}>{stats.avgReadingSpeed}</ThemedText>
          <ThemedText style={styles.statLabel}>Pages/Hour</ThemedText>
        </View>

        <View style={styles.statCard}>
          <FontAwesome name="percent" size={24} color="#F08080" />
          <ThemedText style={styles.statValue}>{stats.completionRate}%</ThemedText>
          <ThemedText style={styles.statLabel}>Completion</ThemedText>
        </View>
      </View>

      <View style={styles.summaryContainer}>
        <ThemedText style={styles.summaryText}>
          You've read {stats.readBooks} out of {stats.totalBooks} books, with an average length of {stats.avgBookLength} pages per book.
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: 'black',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    width: '30%',
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 4,
    color: 'black',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  summaryContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
  },
  summaryText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
}); 