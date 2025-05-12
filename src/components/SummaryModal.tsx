import { FontAwesome } from '@expo/vector-icons';
import { Image, Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from './ThemedText';

interface SummaryModalProps {
    visible: boolean;
    summary: string | null;
    title?: string;
    authors?: string[];
    image?: string;
    onClose: () => void;
    rating?: number;
}

export default function SummaryModal({title, authors, image, visible, summary, onClose, rating }: SummaryModalProps) {
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
                        
                        <ThemedText style={styles.modalText}>
                            {summary}
                        </ThemedText>
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
        marginBottom: 15,
        textAlign: 'left',
        color: 'black',
        width: '100%',
    },
});
