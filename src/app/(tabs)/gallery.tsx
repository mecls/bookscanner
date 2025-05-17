import { ThemedText } from '@/src/components/ThemedText';
import { Book, useBooksStore } from '@/src/store/books';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useNavigation } from 'expo-router';
import React, { useCallback, useContext, useState } from 'react';
import { Alert, FlatList, Image, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ColorModeContext } from './_layout';

const EMPTY_BOOK_IMAGE = require('@/assets/images/book.png');
const SALMON = '#F08080';
const LIGHT_BLUE = '#7EC8E3';

const STATUS_OPTIONS = [
  { key: 'read', label: 'Read', icon: <Ionicons name="checkmark-done-circle" size={22} color="#3498db" /> },
  { key: 'to-read', label: 'To Read', icon: <Ionicons name="eye" size={22} color="#b59f3b" /> },
  { key: 'amazing', label: 'Amazing', icon: <MaterialCommunityIcons name="star-circle" size={22} color="#4CAF50" /> },
  { key: 'horrible', label: 'Horrible', icon: <MaterialCommunityIcons name="alert-circle" size={22} color="#e74c3c" /> },
];

export default function GalleryScreen() {
  const galleryBooks = useBooksStore((state) => state.galleryBooks);
  const addGalleryBook = useBooksStore((state) => state.addGalleryBook);
  const removeGalleryBook = useBooksStore((state) => state.removeGalleryBook);
  const setGalleryBooks = useBooksStore.setState;
  const navigation = useNavigation();
  const { colorMode } = useContext(ColorModeContext);
  const fabColor = colorMode === 'salmon' ? SALMON : LIGHT_BLUE;
  const [statusModal, setStatusModal] = useState<{ visible: boolean; bookId?: string }>({ visible: false });

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

  function updateBookStatus(id: string, status: Book['status']) {
    useBooksStore.getState().updateBookStatus(id, status);
  }

  async function handleAddBook() {
    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.canceled) {
      try {
        // Call your backend to extract and summarize book info
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
      }
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
        return <Ionicons name="checkmark-done-circle" size={22} color="#3498db" style={styles.statusIcon} />;
      case 'to-read':
        return <Ionicons name="eye" size={22} color="#b59f3b" style={styles.statusIcon} />;
      case 'amazing':
        return <MaterialCommunityIcons name="star-circle" size={22} color="#4CAF50" style={styles.statusIcon} />;
      case 'horrible':
        return <MaterialCommunityIcons name="alert-circle" size={22} color="#e74c3c" style={styles.statusIcon} />;
      default:
        return null;
    }
  }

  function renderBook({ item }: { item: Book }) {
    return (
      <TouchableOpacity
        style={styles.card}
        onLongPress={() => handleRemoveBook(item.id)}
        onPress={() => setStatusModal({ visible: true, bookId: item.id })}
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

  return (
    <View style={{ flex: 1, backgroundColor: 'transparent', padding: 10 }}>
      {galleryBooks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Image source={EMPTY_BOOK_IMAGE} style={styles.emptyBookImage} resizeMode="contain" />
          <ThemedText style={styles.emptyText}>No books in your gallery yet!</ThemedText>
        </View>
      ) : (
        <View style={{ flex: 1, backgroundColor: 'transparent', marginTop: 60, marginLeft: 0 }}>
          <FlatList
            data={galleryBooks}
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
    color: '#666',
    textAlign: 'center',
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
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    width: '100%',
    borderRadius: 8,
    marginBottom: 4,
  },
  statusOptionLabel: {
    marginLeft: 12,
    fontSize: 16,
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
});
