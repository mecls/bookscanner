import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useBooksStore } from '../store/books';

export default function ScansComp() {
    const scannedBooks = useBooksStore((state) => state.scannedBooks);

    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ paddingHorizontal: 10 }}
        >
            {scannedBooks.map((book) => (
                <View key={book.id} style={styles.card}>
                    {book.image ? (
                        <Image 
                            source={{ uri: book.image }} 
                            style={styles.bookCover}
                            resizeMode="cover"
                        />
                    ) : (
                        <View style={[styles.imagePlaceholder, { backgroundColor: '#ECE59B' }]} />
                    )}
                    <Text style={styles.title} numberOfLines={2}>{book.title}</Text>
                    {book.authors && (
                        <Text style={styles.author} numberOfLines={1}>
                            {book.authors.join(', ')}
                        </Text>
                    )}
                </View>
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    card: {
        flex:1,
        backgroundColor: '#f2f2f2',
        borderRadius: 20,
        width: 120,
        marginRight: 15,
        alignItems: 'flex-start',
        padding: 10,
        marginTop: 10
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
        textAlign: 'left',
        marginBottom: 4,
        width: '100%',
    },
    author: {
        fontSize: 10,
        color: '#666',
        textAlign: 'left',
        width: '100%',
    }
});