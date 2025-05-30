import { FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useBooksStore } from '../store/books';
import SummaryModal from './SummaryModal';

interface ISBNScannerProps {
    setLoading?: (loading: boolean) => void;
    buttonColor?: string;
}

export default function ISBNScanner({ setLoading, buttonColor = '#F08080' }: ISBNScannerProps) {
    const [summary, setSummary] = useState<string | null>(null);
    const [title, setTitle] = useState<string | undefined>(undefined);
    const [authors, setAuthors] = useState<string[] | undefined>(undefined);
    const [bookImage, setBookImage] = useState<string | undefined>(undefined);
    const [modalVisible, setModalVisible] = useState(false);
    const [rating, setRating] = useState<number | undefined>(undefined);
    const [pageCount, setPageCount] = useState<number | undefined>(undefined);
    const addBook = useBooksStore((state) => state.addBook);
    const [isScanning, setIsScanning] = useState(false);
    const [scannedCode, setScannedCode] = useState('');
    const [showSummary, setShowSummary] = useState(false);
    const [bookData, setBookData] = useState(null);

    const pickImage = async () => {
        let result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images', 'videos'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            try {
                if (setLoading) setLoading(true);
                // Here you would typically use a barcode scanning library
                // For now, we'll just use the image for book cover recognition
                const formData = new FormData();
                formData.append("file", {
                    uri: result.assets[0].uri,
                    name: "book.jpg",
                    type: "image/jpeg",
                } as any);

                const response = await fetch("http://192.168.5.37:8000/extract_and_summarize", {
                    method: "POST",
                    body: formData,
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch book data');
                }

                const data = await response.json();
                
                setSummary(data.summary);
                if (data.title) setTitle(data.title);
                if (data.authors) setAuthors(data.authors);
                if (data.rating) setRating(data.rating);
                if (data.image) setBookImage(data.image);
                if (data.pageCount) setPageCount(data.pageCount);
                setModalVisible(true);

                // Add the book to the store
                addBook({
                    id: Date.now().toString(),
                    title: data.title || 'Unknown Title',
                    image: data.image || '',
                    authors: data.authors || [],
                });
            } catch (error) {
                console.error('Error processing image:', error);
            } finally {
                if (setLoading) setLoading(false);
            }
        }
    };

    async function handleBarCodeScanned({ data }: { data: string }) {
        if (isScanning) {
            setIsScanning(false);
            setScannedCode(data);
            setShowSummary(true);

            try {
                const response = await fetch('http://192.168.5.37:8000/search_book', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        isbn: data
                    }),
                });

                if (response.ok) {
                    const data = await response.json();
                    setBookData(data);
                    if (data.pageCount) {
                        setPageCount(data.pageCount);
                    }
                } else {
                    console.error('Error searching book:', await response.text());
                }
            } catch (error) {
                console.error('Error searching book:', error);
            }
        }
    }

    return (
        <View style={styles.container}>
            <View style={styles.buttonRow}>
                <TouchableOpacity 
                    style={[styles.buttonContainer, { backgroundColor: buttonColor }]}
                    onPress={pickImage}
                    activeOpacity={0.7}
                >
                    <FontAwesome name="barcode" size={34} color="white" />
                </TouchableOpacity>
            </View>

            <SummaryModal
                visible={modalVisible}
                summary={summary}
                rating={rating}
                title={title}
                authors={authors}
                image={bookImage}
                pageCount={pageCount}
                onClose={() => {
                    setModalVisible(false);
                    setSummary(null);
                    setTitle(undefined);
                    setAuthors(undefined);
                    setBookImage(undefined);
                    setRating(undefined);
                    setPageCount(undefined);
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 0,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 10,
    },
    buttonContainer: {
        backgroundColor: '#F08080',
        width: 60,
        height: 60,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
    }
}); 