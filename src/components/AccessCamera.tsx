import { AntDesign } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useBooksStore } from '../store/books';
import SummaryModal from './SummaryModal';

interface AccessCameraProps {
    setLoading?: (loading: boolean) => void;
    buttonColor?: string;
}

export default function ImagePickerE({ setLoading, buttonColor = '#F08080' }: AccessCameraProps) {
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

        if (setLoading) setLoading(true);
        try {
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
        } finally {
            if (setLoading) setLoading(false);
        }
    };

    const pickImage = async () => {
        let result = await ImagePicker.launchCameraAsync({
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
                    if (data.rating) setRating(data.rating);
                    if (data.image) setImage(data.image);
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
            <TouchableOpacity
                style={[styles.buttonContainer, { backgroundColor: buttonColor }]}
                onPress={pickImage}
                activeOpacity={0.7}
            >
                <AntDesign name="camera" size={24} color="white" />
            </TouchableOpacity>

            <SummaryModal
                visible={modalVisible}
                summary={summary}
                title={title}
                authors={authors}
                rating={rating}
                image={image}
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
    },
    buttonContainer: {
        backgroundColor: '#F08080',
        width: 50,
        height: 50,
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