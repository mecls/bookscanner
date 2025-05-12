import { FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useBooksStore } from '../store/books';
import SummaryModal from './SummaryModal';

export default function ImagePickerE() {
    const [image, setImage] = useState<string | undefined>(undefined);
    const [summary, setSummary] = useState<string | null>(null);
    const [title, setTitle] = useState<string | undefined>(undefined);
    const [authors, setAuthors] = useState<string[] | undefined>(undefined);
    const [rating, setRating] = useState<number | undefined>(undefined);
    const [modalVisible, setModalVisible] = useState(false);
    const addBook = useBooksStore((state) => state.addBook);

    const uploadImage = async (imageUri: string) => {
        const formData = new FormData();
        formData.append("file", {
            uri: imageUri,
            name: "book.jpg",
            type: "image/jpeg",
        } as any);

        const res = await fetch("http://192.168.5.37:8000/extract_and_summarize", {
            method: "POST",
            body: formData,
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        if (!res.ok) {
            throw new Error("Failed to upload image");
        }

        const json = await res.json();
        return json;
    };

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images', 'videos'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
            uploadImage(result.assets[0].uri)
                .then((data) => {
                    setSummary(data.summary);
                    if (data.title) setTitle(data.title);
                    if (data.authors) setAuthors(data.authors);
                    if (data.image) setImage(data.image);
                    if (data.rating) setRating(data.rating);
                    setModalVisible(true);

                    // Add the book to the store
                    addBook({
                        id: Date.now().toString(),
                        title: data.title || 'Unknown Title',
                        image: data.image || '',
                        authors: data.authors || [],
                    });
                })
                .catch((error) => {
                    console.error("Error uploading image:", error);
                });
        }
    };
    return (
        <View style={styles.container}>
            <View style={{ backgroundColor: '#D9D9D9', width: 60, height: 60, alignItems: 'center', justifyContent: 'center', borderRadius: 30, opacity: 0.7 }}>
                <TouchableOpacity onPress={pickImage}>
                    <FontAwesome name="photo" size={24} color="black" />
                </TouchableOpacity>
            </View>

            <SummaryModal
                visible={modalVisible}
                summary={summary}
                title={title}
                authors={authors}
                image={image}
                rating={rating}
                onClose={() => {
                    setModalVisible(false);
                    setSummary(null);
                    setTitle(undefined);
                    setAuthors(undefined);
                    setImage(undefined);
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
    }
});

