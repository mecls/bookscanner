import { FontAwesome } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

const books = [
    { id: 1, title: 'A little story', color: '#ECE59B', rating: 2 },
    { id: 2, title: 'A little story2', color: '#C7F3AC', rating: 4 },
    { id: 3, title: 'A little story3', color: '#A6C8ED', rating: 1 },
];

export default function ScansComp() {
    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ paddingHorizontal: 10 }}
        >
            {books.map((book) => (
                <View key={book.id} style={styles.card}>
                    <View style={[styles.imagePlaceholder, { backgroundColor: book.color }]} />
                    <Text style={styles.title}>{book.title}</Text>
                    <View style={styles.stars}>
                        {[...Array(5)].map((_, i) => (
                            <FontAwesome
                                key={i}
                                name="star"
                                size={12}
                                color={i < book.rating ? '#D4C257' : '#ccc'}
                            />
                        ))}
                    </View>
                </View>
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#f2f2f2',
        borderRadius: 20,
        width: 120,
        marginRight: 15,
        alignItems: 'flex-start',
        padding: 10,
        marginTop: 10
    },
    imagePlaceholder: {
        width: 80,
        height: 100,
        borderRadius: 10,
        marginBottom: 10,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    overlayContent: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 5,
    },
    title: {
        fontWeight: '600',
        fontSize: 12,
        textAlign: 'center',
        marginBottom: 4,
    },
    stars: {
        flexDirection: 'row',
        gap: 2,
    },
});
