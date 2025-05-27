import NoteTaker from '@/src/components/NoteTaker';
import { ThemedText } from '@/src/components/ThemedText';
import { Colors } from '@/src/constants/Colors';
import { Book, ReadingProgress, useBooksStore } from '@/src/store/books';
import { FontAwesome, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useNavigation } from 'expo-router';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ColorModeContext } from './_layout';

const EMPTY_BOOK_IMAGE = require('@/assets/images/book.png');

const STATUS_OPTIONS = [
  { key: 'read', label: 'Read', icon: <Ionicons name="checkmark-done-circle" size={22} color="#3498db" /> },
  { key: 'to-read', label: 'To Read', icon: <Ionicons name="eye" size={22} color="#b59f3b" /> },
  { key: 'amazing', label: 'Amazing', icon: <MaterialCommunityIcons name="heart" size={22} color="#F44336" /> },
  { key: 'horrible', label: 'Horrible', icon: <MaterialCommunityIcons name="emoticon-poop" size={22} color="#795548" /> },
  { key: 'dnf', label: 'DNF', icon: <MaterialCommunityIcons name="book-off" size={22} color="#9E9E9E" /> },
];

export default function GalleryScreen() {
  const galleryBooks = useBooksStore((state) => state.galleryBooks);
  const addGalleryBook = useBooksStore((state) => state.addGalleryBook);
  const removeGalleryBook = useBooksStore((state) => state.removeGalleryBook);
  const setGalleryBooks = useBooksStore.setState;
  const navigation = useNavigation();
  const { colorMode } = useContext(ColorModeContext);
  const fabColor = colorMode === 'salmon' ? Colors.light.salmon : Colors.light.lightOrange;
  const [statusModal, setStatusModal] = useState<{ visible: boolean; bookId?: string }>({ visible: false });
  const [bookDetailModal, setBookDetailModal] = useState<{ visible: boolean; book?: Book }>({ visible: false });
  const [selectedStatus, setSelectedStatus] = useState<Book['status'] | null>(null);
  const [showNoteTaker, setShowNoteTaker] = useState(false);
  const [hasExistingNote, setHasExistingNote] = useState(false);
  const updateReadingProgress = useBooksStore((state) => state.updateReadingProgress);
  const [showProgressInput, setShowProgressInput] = useState(false);
  const [currentPage, setCurrentPage] = useState('');
  const [totalPages, setTotalPages] = useState('');
  const [readingTime, setReadingTime] = useState('');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isAddingBook, setIsAddingBook] = useState(false);

  // Add button in header
  useFocusEffect(
    useCallback(() => {
      navigation.setOptions({
        headerRight: () => (
          <TouchableOpacity
            onPress={handleAddBook}
            style={{ marginRight: 16 }}
            accessibilityLabel="Add book"
          >
            <Ionicons name="add-circle" size={32} color="#F08080" />
          </TouchableOpacity>
        ),
        title: 'Gallery',
      });
    }, [navigation])
  );

  useEffect(() => {
    if (selectedBook?.readingProgress) {
      setTotalPages(selectedBook.readingProgress.totalPages.toString());
    }
  }, [selectedBook]);

  function updateBookStatus(id: string, status: Book['status']) {
    const book = galleryBooks.find(b => b.id === id);
    if (!book) return;

    const currentYear = new Date().getFullYear();
    const readingStats = useBooksStore.getState().readingStats;
    const updateReadingStats = useBooksStore.getState().updateReadingStats;

    // Calculate changes in reading stats
    let booksReadChange = 0;
    let pagesReadChange = 0;

    if (status === 'read' && book.status !== 'read') {
      // Book is being marked as read
      booksReadChange = 1;
      if (book.readingProgress) {
        pagesReadChange = book.readingProgress.totalPages;
      }
    } else if (status !== 'read' && book.status === 'read') {
      // Book is being unmarked as read
      booksReadChange = -1;
      if (book.readingProgress) {
        pagesReadChange = -book.readingProgress.totalPages;
      }
    }

    // Update the book status
    useBooksStore.getState().updateBookStatus(id, status);

    // Update reading stats
    updateReadingStats({
      yearlyBooksRead: readingStats.yearlyBooksRead + booksReadChange,
      yearlyPagesRead: readingStats.yearlyPagesRead + pagesReadChange,
    });
  }

  async function handleAddBook() {
    setIsAddingBook(true);
    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    
    if (!result.canceled) {
      try {
        const formData = new FormData();
        formData.append('file', {
          uri: result.assets[0].uri,
          name: 'book.jpg',
          type: 'image/jpeg',
        } as any);
        
        const response = await fetch('http://192.168.5.37:8000/extract_and_summarize', {
          method: 'POST',
          body: formData,
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        
        if (!response.ok) throw new Error('Failed to fetch book data');
        const data = await response.json();
        addGalleryBook({
          id: Date.now().toString(),
          title: data.title || 'Unknown Title',
          image: data.image || '',
          authors: data.authors || [],
        });
      } catch (error) {
        Alert.alert('Error', 'Could not add book.');
      } finally {
        setIsAddingBook(false);
      }
    } else {
      setIsAddingBook(false);
    }
  }

  function handleRemoveBook(id: string) {
    Alert.alert('Remove Book', 'Are you sure you want to remove this book from your gallery?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeGalleryBook(id) },
    ]);
  }

  function renderStatusIcon(status: Book['status']) {
    switch (status) {
      case 'read':
        return <Ionicons name="checkmark-done-circle" size={25} color="#3498db" style={styles.statusIcon} />;
      case 'to-read':
        return <Ionicons name="eye" size={25} color="#b59f3b" style={styles.statusIcon} />;
      case 'amazing':
        return <MaterialCommunityIcons name="heart" size={25} color="#F44336" style={styles.statusIcon} />;
      case 'horrible':
        return <MaterialCommunityIcons name="emoticon-poop" size={22} color="#795548" style={styles.statusIcon} />;
      case 'dnf':
        return <MaterialCommunityIcons name="book-off" size={25} color="#9E9E9E" style={styles.statusIcon}/>;
      default:
        return null;
    }
  }

  async function checkForExistingNote(bookId: string) {
    const storageKey = `book-note-${bookId}`;
    const note = await AsyncStorage.getItem(storageKey);
    setHasExistingNote(!!note);
  }

  function renderBook({ item }: { item: Book }) {
    return (
      <TouchableOpacity
        style={styles.card}
        onLongPress={() => handleRemoveBook(item.id)}
        onPress={async () => {
          setShowNoteTaker(false);
          setSelectedBook(item);
          await checkForExistingNote(item.id);
        }}
        activeOpacity={0.8}
      >
        <View style={styles.statusIconContainer}>{renderStatusIcon(item.status || 'to-read')}</View>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.bookCover} resizeMode="cover" />
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: '#ECE59B' }]}/>
        )}
        <ThemedText style={styles.title} numberOfLines={1}>{item.title}</ThemedText>
        {item.authors && (
          <ThemedText style={styles.author} numberOfLines={1}>{item.authors.join(', ')}</ThemedText>
        )}
      </TouchableOpacity>
    );
  }

  function handleShareBook(book: Book) {
    let message = `Check out this book: "${book.title}"`;
    if (book.authors && book.authors.length > 0) message += ` by ${book.authors.join(', ')}`;
    if (book.image) message += `\n${book.image}`;
    Share.share({ message });
  }

  function handleUpdateProgress() {
    if (!currentPage || !totalPages) {
      Alert.alert('Error', 'Please fill in both current page and total pages');
      return;
    }

    const currentPageNum = parseInt(currentPage);
    const totalPagesNum = parseInt(totalPages);
    const readingTimeNum = parseInt(readingTime) || 0;

    if (currentPageNum > totalPagesNum) {
      Alert.alert('Error', 'Current page cannot be greater than total pages');
      return;
    }

    if (selectedBook) {
      const progress: ReadingProgress = {
        currentPage: currentPageNum,
        totalPages: totalPagesNum,
        percentage: Math.round((currentPageNum / totalPagesNum) * 100),
        lastUpdated: new Date().toISOString(),
        readingTime: readingTimeNum
      };
      updateReadingProgress(selectedBook.id, progress);
      setShowProgressInput(false);
      setCurrentPage('');
      setReadingTime('');
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: 'transparent', padding: 10 }}>
      {galleryBooks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Image source={EMPTY_BOOK_IMAGE} style={styles.emptyBookImage} resizeMode="contain" />
          <ThemedText style={styles.emptyText}>No books in your gallery yet!</ThemedText>
        </View>
      ) : (
        <View style={{ flex: 1, backgroundColor: 'transparent', marginTop: 60, marginLeft: 0 }}>
          <View style={styles.filterRow}>
            <TouchableOpacity
              style={[
                styles.filterButton, 
                !selectedStatus && { 
                  backgroundColor: colorMode === 'salmon' ? Colors.light.salmon : Colors.light.lightOrange 
                }
              ]}
              onPress={() => setSelectedStatus(null)}
            >
              <Ionicons name="apps" size={20} color={!selectedStatus ? "#fff" : "#888"} />
            </TouchableOpacity>
            {STATUS_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.key}
                style={[styles.filterButton, selectedStatus === opt.key && styles.filterButtonSelected]}
                onPress={() => setSelectedStatus(opt.key as Book['status'])}
              >
                {React.cloneElement(opt.icon, { size: 20, color: selectedStatus === opt.key ? "#fff" : "#888" })}
              </TouchableOpacity>
            ))}
          </View>
          <FlatList
            data={selectedStatus ? galleryBooks.filter(b => b.status === selectedStatus) : galleryBooks}
            renderItem={renderBook}
            keyExtractor={(item) => item.id}
            numColumns={3}
            contentContainerStyle={{ paddingBottom: 80, alignItems: 'center' }}
            columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 0 }}
          />
        </View>
      )}
      {/* Floating Add Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: fabColor }]}
        onPress={handleAddBook}
        accessibilityLabel="Add book"
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={36} color="#fff" />
      </TouchableOpacity>
      {/* Status Picker Modal */}
      <Modal
        visible={statusModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setStatusModal({ visible: false })}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.statusModal}>
            <Text style={styles.statusModalTitle}>Set Book Status</Text>
            {STATUS_OPTIONS.map(opt => (
              <Pressable
                key={opt.key}
                style={styles.statusOption}
                onPress={() => {
                  if (statusModal.bookId) updateBookStatus(statusModal.bookId, opt.key as Book['status']);
                  setStatusModal({ visible: false });
                }}
              >
                {opt.icon}
                <Text style={styles.statusOptionLabel}>{opt.label}</Text>
              </Pressable>
            ))}
            <Pressable style={styles.statusCancel} onPress={() => setStatusModal({ visible: false })}>
              <Text style={styles.statusCancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      <Modal
        visible={!!selectedBook}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedBook(null)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSelectedBook(null)}
              >
                <FontAwesome name="close" size={24} color="black" />
              </TouchableOpacity>

              {selectedBook && (
                <ScrollView 
                  style={styles.modalScroll}
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={{ paddingBottom: 100 }}
                >
                  <Image
                    source={{ uri: selectedBook.image }}
                    style={styles.modalImage}
                  />
                  <ThemedText style={styles.modalTitle}>
                    {selectedBook.title}
                  </ThemedText>
                  <ThemedText style={styles.modalAuthor}>
                    {selectedBook.authors?.join(', ') || 'Unknown Author'}
                  </ThemedText>

                  <FlatList
                    data={STATUS_OPTIONS}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.statusPickerRow}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        key={item.key}
                        style={[
                          styles.statusOption,
                          selectedBook.status === item.key && styles.statusOptionSelected
                        ]}
                        onPress={() => {
                          updateBookStatus(selectedBook.id, item.key as Book['status']);
                          setSelectedBook({ ...selectedBook, status: item.key as Book['status'] });
                        }}
                      >
                        {item.icon}
                        <Text style={styles.statusOptionLabel}>{item.label}</Text>
                      </TouchableOpacity>
                    )}
                    keyExtractor={item => item.key}
                  />

                  {!selectedBook.readingProgress && !showProgressInput && (
                    <TouchableOpacity 
                      style={[
                        styles.updateProgressButton,
                        { backgroundColor: colorMode === 'salmon' ? Colors.light.salmon : Colors.light.lightOrange }
                      ]}
                      onPress={() => setShowProgressInput(true)}
                    >
                      <ThemedText style={styles.updateProgressButtonText}>
                        Start Reading
                      </ThemedText>
                    </TouchableOpacity>
                  )}

                  {(selectedBook.readingProgress || showProgressInput) && (
                    <View style={styles.progressSection}>
                      {selectedBook.readingProgress && !showProgressInput && (
                        <View>
                          <View style={styles.progressBar}>
                            <View 
                              style={[
                                styles.progressFill,
                                { 
                                  width: `${selectedBook.readingProgress.percentage}%`,
                                  backgroundColor: colorMode === 'salmon' ? Colors.light.salmon : Colors.light.lightOrange
                                }
                              ]} 
                            />
                          </View>
                          <ThemedText style={styles.progressText}>
                            {selectedBook.readingProgress.currentPage}/{selectedBook.readingProgress.totalPages} pages ({selectedBook.readingProgress.percentage}%)
                          </ThemedText>
                          <ThemedText style={styles.progressText}>
                            Reading time: {selectedBook.readingProgress.readingTime} minutes
                          </ThemedText>
                          <TouchableOpacity 
                            style={[
                              styles.updateProgressButton,
                              { backgroundColor: colorMode === 'salmon' ? Colors.light.salmon : Colors.light.lightOrange }
                            ]}
                            onPress={() => setShowProgressInput(true)}
                          >
                            <ThemedText style={styles.updateProgressButtonText}>
                              Update Progress
                            </ThemedText>
                          </TouchableOpacity>
                        </View>
                      )}

                      {showProgressInput && (
                        <View style={styles.progressInputContainer}>
                          <TextInput
                            style={styles.progressInput}
                            placeholder="Current page"
                            value={currentPage}
                            onChangeText={setCurrentPage}
                            keyboardType="numeric"
                          />
                          <TextInput
                            style={styles.progressInput}
                            placeholder="Total pages"
                            value={totalPages}
                            onChangeText={setTotalPages}
                            keyboardType="numeric"
                          />
                          <TextInput
                            style={styles.progressInput}
                            placeholder="Reading time (minutes)"
                            value={readingTime}
                            onChangeText={setReadingTime}
                            keyboardType="numeric"
                          />
                          <View style={styles.progressInputButtons}>
                            <TouchableOpacity 
                              style={[styles.progressInputButton, styles.cancelButton]}
                              onPress={() => setShowProgressInput(false)}
                            >
                              <ThemedText style={styles.progressInputButtonText}>
                                Cancel
                              </ThemedText>
                            </TouchableOpacity>
                            <TouchableOpacity 
                              style={[
                                styles.progressInputButton, 
                                styles.saveButton,
                                { backgroundColor: colorMode === 'salmon' ? Colors.light.salmon : Colors.light.lightOrange }
                              ]}
                              onPress={handleUpdateProgress}
                            >
                              <ThemedText style={styles.progressInputButtonText}>
                                Save
                              </ThemedText>
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}
                    </View>
                  )}

                  <View style={styles.buttonRow}>
                    <TouchableOpacity 
                      style={[
                        styles.noteButton,
                        { backgroundColor: colorMode === 'salmon' ? Colors.light.salmon : Colors.light.lightOrange }
                      ]}
                      onPress={() => setShowNoteTaker(!showNoteTaker)}
                    >
                      <FontAwesome name="sticky-note" size={16} color="#fff" />
                      <ThemedText style={styles.noteButtonText}>
                        {showNoteTaker ? 'Hide Note' : (hasExistingNote ? 'View Note' : 'Write Note')}
                      </ThemedText>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[
                        styles.shareButton,
                        { backgroundColor: colorMode === 'salmon' ? Colors.light.salmon : Colors.light.lightOrange }
                      ]}
                      onPress={() => handleShareBook(selectedBook)}
                    >
                      <FontAwesome name="share-alt" size={16} color="#fff" />
                      <ThemedText style={styles.shareButtonText}>
                        Share
                      </ThemedText>
                    </TouchableOpacity>
                  </View>

                  {showNoteTaker && (
                    <NoteTaker 
                      bookKey={selectedBook.id} 
                      onNoteStatusChange={setHasExistingNote}
                    />
                  )}
                </ScrollView>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      {/* Add loading overlay */}
      {isAddingBook && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color={colorMode === 'salmon' ? Colors.light.salmon : Colors.light.lightOrange} />
            <ThemedText style={styles.loadingText}>Processing your book...</ThemedText>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'transparent',
    borderRadius: 20,
    width: 110,
    marginBottom: 18,
    alignItems: 'center',
    padding: 10,
    position: 'relative',
  },
  statusIconContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 2,
  },
  bookCover: {
    width: 80,
    height: 120,
    borderRadius: 10,
    marginBottom: 10,
  },
  imagePlaceholder: {
    width: 80,
    height: 120,
    borderRadius: 10,
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontWeight: '600',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 4,
    width: '100%',
    color: 'black',
  },
  author: {
    fontSize: 10,
    marginTop: -10,
    color: 'black',
    textAlign: 'center',
    width: '100%',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 20,
  },
  emptyBookImage: {
    width: 100,
    height: 120,
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    marginBottom: 100,
    marginRight: 10,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: 260,
    alignItems: 'center',
  },
  statusModalTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 16,
    color: '#222',
  },
  statusCancel: {
    marginTop: 10,
    padding: 8,
  },
  statusCancelText: {
    color: '#888',
    fontSize: 15,
  },
  statusIcon: {
    marginRight: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  closeButton: {
    position: 'absolute',
    right: 10,
    top: 10,
    padding: 10,
    zIndex: 1,
  },
  modalScroll: {
    width: '100%',
  },
  modalImage: {
    width: 80,
    height: 120,
    borderRadius: 10,
    marginBottom: 15,
    alignSelf: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color:'black',
    marginBottom: 0,
    textAlign: 'center',
  },
  modalAuthor: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  progressSection: {
    marginVertical: 15,
    padding: 10,
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#eee',
    borderRadius: 2,
    marginTop: 5,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#F08080',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  updateProgressButton: {
    backgroundColor: '#F08080',
    padding: 10,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 10,
  },
  updateProgressButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  progressInputContainer: {
    marginTop: 10,
  },
  progressInput: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  progressInputButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  progressInputButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#ddd',
  },
  saveButton: {
    backgroundColor: '#F08080',
  },
  progressInputButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    gap: 4,
  },
  filterButton: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#eee',
    marginHorizontal: 1,
  },
  filterButtonSelected: {
    backgroundColor: '#F08080',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginVertical: 8,
  },
  noteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F08080',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F08080',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  noteButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  shareButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  statusPickerRow: {
    paddingHorizontal: 10,
    gap: 8,
    marginBottom: 15,
  },
  statusOption: {
    flexDirection: 'column',
    alignItems: 'center',
    padding: 8,
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  statusOptionSelected: {
    backgroundColor: '#E0E0E0',
  },
  statusOptionLabel: {
    fontSize: 10,
    color: '#222',
    marginTop: 2,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingContent: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 10,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
});
