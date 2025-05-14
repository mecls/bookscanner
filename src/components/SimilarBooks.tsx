import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';

interface SimilarBook {
    title: string;
    authors: string[];
    image: string;
    rating?: number;
    categories?: string[];
    match_type?: 'same_category' | 'related_category';
}

interface SimilarBooksProps {
    books: SimilarBook[];
}

export default function SimilarBooks({ books }: SimilarBooksProps) {
    if (!books || books.length === 0) {
        return null;
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Books You Might Like</Text>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.scrollView}
            >
                {books.map((book, index) => (
                    <View key={index} style={styles.card}>
                        {book.image ? (
                            <Image 
                                source={{ uri: book.image }} 
                                style={styles.bookCover}
                                resizeMode="cover"
                            />
                        ) : (
                            <View style={[styles.imagePlaceholder, { backgroundColor: '#ECE59B' }]} />
                        )}
                        <Text style={styles.bookTitle} numberOfLines={2}>{book.title}</Text>
                        {book.authors && (
                            <Text style={styles.author} numberOfLines={1}>
                                By {book.authors.join(', ')}
                            </Text>
                        )}
                        {book.categories && book.categories.length > 0 && (
                            <View style={styles.categoryContainer}>
                                <Text style={styles.category} numberOfLines={1}>
                                    {book.categories[0]}
                                </Text>
                                {book.match_type && (
                                    <View style={[
                                        styles.matchTypeBadge,
                                        { backgroundColor: book.match_type === 'same_category' ? '#ECE59B' : '#B8E0D2' }
                                    ]}>
                                        <Text style={styles.matchTypeText}>
                                            {book.match_type === 'same_category' ? 'Same Category' : 'Related Category'}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        )}
                        {typeof book.rating === 'number' && (
                            <View style={styles.ratingContainer}>
                                <Text style={styles.ratingText}>{book.rating.toFixed(1)} ★</Text>
                            </View>
                        )}
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: 50,
        width: '100%',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        color: 'black',
    },
    scrollView: {
        paddingHorizontal: 10,
    },
    card: {
        backgroundColor: '#f2f2f2',
        borderRadius: 20,
        width: 120,
        marginRight: 15,
        alignItems: 'flex-start',
        padding: 10,
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
    bookTitle: {
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
        marginBottom: 2,
        width: '100%',
    },
    categoryContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 4,
        marginBottom: 2,
    },
    category: {
        fontSize: 9,
        color: '#888',
        textAlign: 'left',
        fontStyle: 'italic',
        width: '100%',
    },
    matchTypeBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
        marginTop: 2,
    },
    matchTypeText: {
        fontSize: 8,
        color: '#333',
        fontWeight: '600',
    },
    ratingContainer: {
        backgroundColor: '#ECE59B',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
        marginTop: 4,
    },
    ratingText: {
        fontSize: 10,
        color: '#333',
        fontWeight: '600',
    }
}); 