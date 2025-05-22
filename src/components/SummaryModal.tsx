import { FontAwesome } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { useEffect, useState } from 'react';
import { Alert, Image, Modal, Platform, ScrollView, Share, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useBooksStore } from '../store/books';
import SimilarBooks from './SimilarBooks';
import { ThemedText } from './ThemedText';

interface SummaryModalProps {
    visible: boolean;
    summary: string | null;
    title?: string;
    authors?: string[];
    image?: string;
    onClose: () => void;
    rating?: number;
    pageCount?: number;
}

interface SimilarBook {
    title: string;
    authors: string[];
    image: string;
    rating?: number;
}

export default function SummaryModal({title, authors, image, visible, summary, onClose, rating, pageCount }: SummaryModalProps) {
    const [similarBooks, setSimilarBooks] = useState<SimilarBook[]>([]);
    const addGalleryBook = useBooksStore((state) => state.addGalleryBook);
    const galleryBooks = useBooksStore((state) => state.galleryBooks);
    const [added, setAdded] = useState(false);

    useEffect(() => {
        if (visible && title) {
            // Fetch similar books when modal opens
            const fetchSimilarBooks = async () => {
                try {
                    const authorsParam = authors ? authors.join(',') : '';
                    const response = await fetch(
                        `http://192.168.5.37:8000/similar_books?title=${encodeURIComponent(title)}&authors=${encodeURIComponent(authorsParam)}`
                    );
                    if (response.ok) {
                        const data = await response.json();
                        setSimilarBooks(data);
                    }
                } catch (error) {
                    console.error('Error fetching similar books:', error);
                }
            };
            fetchSimilarBooks();
        }
        // Check if book is already in gallery
        setAdded(!!galleryBooks.find(b => b.title === title && JSON.stringify(b.authors) === JSON.stringify(authors)));
    }, [visible, title, authors, galleryBooks]);

    function handleAddToGallery() {
        if (!added && title) {
            addGalleryBook({
                id: Date.now().toString(),
                title: title,
                image: image || '',
                authors: authors || [],
                yearRead: new Date().getFullYear(),
                readingProgress: pageCount ? {
                    currentPage: 0,
                    totalPages: pageCount,
                    percentage: 0,
                    lastUpdated: new Date().toISOString(),
                    readingTime: 0
                } : undefined
            });
            setAdded(true);
        }
    }

    async function handleShareBook(book: { title?: string; authors?: string[]; image?: string }) {
        try {
            if (book.image) {
                // Download the image to a local file
                const fileUri = FileSystem.cacheDirectory + 'book-share.jpg';
                const downloadResumable = FileSystem.createDownloadResumable(
                    book.image,
                    fileUri
                );
                const result = await downloadResumable.downloadAsync();
                if (!result) {
                    throw new Error('Image download failed');
                }
                const { uri } = result;

                // Use the native share sheet with the local file
                if (Platform.OS === 'ios' || Platform.OS === 'android') {
                    await Share.share({
                        url: uri,
                        message: `Check out this book: "${book.title}"${book.authors && book.authors.length > 0 ? ` by ${book.authors.join(', ')}` : ''}`,
                    });
                } else {
                    // Fallback for web or unsupported platforms
                    Alert.alert('Sharing not supported on this platform');
                }
            } else {
                // Fallback to text-only sharing if no image
                await Share.share({
                    message: `Check out this book: "${book.title}"${book.authors && book.authors.length > 0 ? ` by ${book.authors.join(', ')}` : ''}`,
                });
            }
        } catch (error) {
            Alert.alert('Error', 'Could not share the book.');
        }
    }

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.centeredView}>
                <View style={styles.modalView}>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <FontAwesome name="close" size={24} color="black" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.fabShare} onPress={() => handleShareBook({ title, authors, image })}>
                        <FontAwesome name="share-alt" size={24} color="#fff" />
                    </TouchableOpacity>
                    
                    <ScrollView 
                        style={styles.scrollView}
                        showsVerticalScrollIndicator={true}
                        contentContainerStyle={styles.scrollViewContent}
                    >
                        {image && (
                            <Image 
                                source={{ uri: image }} 
                                style={styles.bookImage}
                                resizeMode="contain"
                            />
                        )}
                        
                        {title && (
                            <ThemedText type="subtitle" style={styles.modalTitle}>
                                {title}
                            </ThemedText>
                        )}
                        
                        {authors && authors.length > 0 && (
                            <ThemedText style={styles.authors}>
                                By {authors.join(', ')}
                            </ThemedText>
                        )}
                        {typeof rating === 'number' ? (
                            <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 10 }}>
                                {[1,2,3,4,5].map((i) => (
                                    <FontAwesome
                                        key={i}
                                        name={i <= rating ? "star" : "star-o"}
                                        size={24}
                                        color="#ECE59B"
                                        style={{ marginHorizontal: 2 }}
                                    />
                                ))}
                            </View>
                        ) : (
                            <ThemedText style={{ color: '#888', fontStyle: 'italic', marginBottom: 10 }}>
                                No rating
                            </ThemedText>
                        )}
                             
                        <TouchableOpacity
                            style={[styles.addButton, added && styles.addedButton]}
                            onPress={handleAddToGallery}
                            disabled={added}
                        >
                            <FontAwesome name={added ? 'check' : 'plus'} size={18} color={added ? '#fff' : '#fff'} />
                            <ThemedText style={styles.addButtonText}>
                                {added ? 'Added to Gallery' : 'Add to Gallery'}
                            </ThemedText>
                        </TouchableOpacity>
                        <ThemedText style={styles.modalText}>
                            {summary}
                        </ThemedText>
                        <SimilarBooks books={similarBooks} />
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalView: {
        margin: 20,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 35,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        width: '90%',
        maxHeight: '80%',
    },
    scrollView: {
        width: '100%',
    },
    scrollViewContent: {
        alignItems: 'center',
        paddingBottom: 20,
    },
    closeButton: {
        position: 'absolute',
        right: 10,
        top: 10,
        padding: 10,
        zIndex: 1,
    },
    bookImage: {
        width: 120,
        height: 180,
        marginBottom: 20,
        borderRadius: 8,
    },
    modalTitle: {
        marginBottom: 10,
        textAlign: 'center',
        color: 'black',
        fontSize: 20,
        fontWeight: 'bold',
    },
    authors: {
        marginBottom: 15,
        textAlign: 'center',
        color: 'black',
        fontStyle: 'italic',
    },
    modalText: {
        marginTop: 10,
        textAlign: 'left',
        color: 'black',
        width: '100%',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F08080',
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 16,
        marginBottom: 16,
        marginTop: 10,
        alignSelf: 'center',
        gap: 8,
    },
    addedButton: {
        backgroundColor: '#7EC8E3',
    },
    addButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        marginLeft: 8,
    },
    fabShare: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        backgroundColor: '#F08080',
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
        zIndex: 2,
    },
});
