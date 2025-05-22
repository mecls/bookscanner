import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withSpring } from 'react-native-reanimated';
import { useBooksStore } from '../store/books';
import { ThemedText } from './ThemedText';

const EMPTY_BOOK_IMAGE = require('@/assets/images/book.png');

export default function ScansComp() {
    const scannedBooks = useBooksStore((state) => state.scannedBooks);
    const clearScannedBooks = useBooksStore((state) => state.clearScannedBooks);
    const bounce = useSharedValue(0);

    React.useEffect(() => {
        if (scannedBooks.length === 0) {
            bounce.value = withRepeat(
                withSequence(
                    withSpring(-10, { damping: 2 }),
                    withSpring(0, { damping: 2 })
                ),
                -1,
                true
            );
        } else {
            bounce.value = 0;
        }
    }, [scannedBooks.length]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: bounce.value }],
    }));

    if (scannedBooks.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Animated.View style={[styles.emptyImageContainer, animatedStyle]}>
                    <Image 
                        source={EMPTY_BOOK_IMAGE} 
                        style={styles.emptyBookImage} 
                        resizeMode="contain" 
                    />
                </Animated.View>
                <ThemedText style={styles.emptyText}>No books scanned yet!</ThemedText>
            </View>
        );
    }

    return (
        <View>
            <TouchableOpacity onPress={clearScannedBooks} style={{ alignSelf: 'flex-end', marginBottom: 8, backgroundColor: '#F08080', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16 }}>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>Clear Scans</Text>
            </TouchableOpacity>
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
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        flex:1,
        backgroundColor: 'transparent',
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
    },
    emptyContainer: {
        flex: 1/2,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        marginTop: 20,
    },
    emptyImageContainer: {
        marginBottom: 15,
    },
    emptyBookImage: {
        width: 100,
        height: 120,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    stepContainer: {
        padding: 10,
        marginBottom: 10,
    },
});