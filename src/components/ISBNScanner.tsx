import { FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useBooksStore } from '../store/books';
import SummaryModal from './SummaryModal';

interface ISBNScannerProps {
    setLoading?: (loading: boolean) => void;
}

export default function ISBNScanner({ setLoading }: ISBNScannerProps) {
    const [summary, setSummary] = useState<string | null>(null);
    const [title, setTitle] = useState<string | undefined>(undefined);
    const [authors, setAuthors] = useState<string[] | undefined>(undefined);
    const [bookImage, setBookImage] = useState<string | undefined>(undefined);
    const [modalVisible, setModalVisible] = useState(false);
    const [rating, setRating] = useState<number | undefined>(undefined);
    const addBook = useBooksStore((state) => state.addBook);

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

    return (
        <View style={styles.container}>
            <View style={styles.scannerButton}>
                <TouchableOpacity 
                    onPress={pickImage}
                    style={styles.button}
                >
                    <FontAwesome name="barcode" size={24} color="black" />
                </TouchableOpacity>
            </View>

            <SummaryModal
                visible={modalVisible}
                summary={summary}
                rating={rating}
                title={title}
                authors={authors}
                image={bookImage}
                onClose={() => {
                    setModalVisible(false);
                    setSummary(null);
                    setTitle(undefined);
                    setAuthors(undefined);
                    setBookImage(undefined);
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
    scannerButton: {
        backgroundColor: '#D9D9D9',
        width: 60,
        height: 60,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 30,
        opacity: 0.7,
    },
    button: {
        padding: 10,
    }
}); 