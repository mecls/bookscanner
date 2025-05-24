import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Dimensions, Modal, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Book, ReadingProgress, useBooksStore } from '../store/books';
import ReadingStats from './ReadingStats';
import { ThemedText } from './ThemedText';

const screenWidth = Dimensions.get('window').width;

export default function ReadingStreak() {
    const [showStats, setShowStats] = useState(false);
    const [showProgressModal, setShowProgressModal] = useState(false);
    const [showBookProgress, setShowBookProgress] = useState(true);
    const [selectedBook, setSelectedBook] = useState<Book | null>(null);
    const [currentPage, setCurrentPage] = useState('');
    const [totalPages, setTotalPages] = useState('');
    const [readingTime, setReadingTime] = useState('');
    const galleryBooks = useBooksStore((state) => state.galleryBooks);
    const readingStats = useBooksStore((state) => state.readingStats);
    const updateReadingStats = useBooksStore((state) => state.updateReadingStats);
    const updateReadingProgress = useBooksStore((state) => state.updateReadingProgress);

    // Memoize reading data calculations
    const { weekDays, currentStreak, longestStreak } = useMemo(() => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const today = new Date();
        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 6);
        
        const readingData = galleryBooks
            .filter(book => book.readingProgress)
            .map(book => book.readingProgress)
            .filter(progress => {
                const updateDate = new Date(progress!.lastUpdated);
                return updateDate >= lastWeek;
            });

        const readingTimeByDay = new Map();
        readingData.forEach(progress => {
            const date = new Date(progress!.lastUpdated);
            const dayKey = date.toISOString().split('T')[0];
            const currentTime = readingTimeByDay.get(dayKey) || 0;
            readingTimeByDay.set(dayKey, currentTime + progress!.readingTime);
        });

        let currentStreak = 0;
        let longestStreak = readingStats.longestStreak;
        let currentDate = new Date();

        // Calculate current streak
        while (true) {
            const dateKey = currentDate.toISOString().split('T')[0];
            if (readingTimeByDay.has(dateKey)) {
                currentStreak++;
                currentDate.setDate(currentDate.getDate() - 1);
            } else {
                break;
            }
        }

        // Generate week data
        const weekDays = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - (6 - i));
            const dateKey = date.toISOString().split('T')[0];
            const dayIndex = date.getDay();
            
            weekDays.push({
                day: days[dayIndex],
                date: date,
                read: readingTimeByDay.has(dateKey),
                readingTime: readingTimeByDay.get(dateKey) || 0
            });
        }

        return { weekDays, currentStreak, longestStreak };
    }, [galleryBooks, readingStats.longestStreak]);

    // Update streaks in useEffect
    useEffect(() => {
        if (currentStreak > longestStreak) {
            updateReadingStats({ longestStreak: currentStreak });
        }
        updateReadingStats({ currentStreak });
    }, [currentStreak, longestStreak]);

    // Calculate books read stats
    const { booksReadThisYear, totalBooksRead } = useMemo(() => {
        const currentYear = new Date().getFullYear();
        const booksReadThisYear = galleryBooks.filter(book => 
            book.status === 'read' && book.yearRead === currentYear
        ).length;

        const totalBooksRead = galleryBooks.filter(book => 
            book.status === 'read'
        ).length;

        return { booksReadThisYear, totalBooksRead };
    }, [galleryBooks]);

    // Update books read stats in useEffect
    useEffect(() => {
        updateReadingStats({ 
            yearlyBooksRead: booksReadThisYear,
            totalBooksRead: totalBooksRead
        });
    }, [booksReadThisYear, totalBooksRead]);

    const currentlyReading = useMemo(() => 
        galleryBooks.filter(book => 
            book.readingProgress && book.readingProgress.currentPage > 0
        ),
        [galleryBooks]
    );

    function handleUpdateProgress() {
        if (!selectedBook || !currentPage || !totalPages) return;

        const currentPageNum = parseInt(currentPage);
        const totalPagesNum = parseInt(totalPages);
        const readingTimeNum = parseInt(readingTime) || 0;

        if (currentPageNum > totalPagesNum) {
            Alert.alert('Error', 'Current page cannot be greater than total pages');
            return;
        }

        const progress: ReadingProgress = {
            currentPage: currentPageNum,
            totalPages: totalPagesNum,
            percentage: Math.round((currentPageNum / totalPagesNum) * 100),
            lastUpdated: new Date().toISOString(),
            readingTime: readingTimeNum
        };

        updateReadingProgress(selectedBook.id, progress);
        setShowProgressModal(false);
        setCurrentPage('');
        setReadingTime('');
        setSelectedBook(null);
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <ThemedText type="subtitle" style={{ color: 'black', marginLeft:-20 }}>Reading Streak</ThemedText>
                <View style={styles.headerButtons}>
                    {currentlyReading.length > 0 && (
                        <TouchableOpacity 
                            onPress={() => setShowBookProgress(!showBookProgress)}
                            style={styles.toggleButton}
                        >
                            <Ionicons 
                                name={showBookProgress ? "eye-off" : "eye"} 
                                size={24} 
                                color="#F08080" 
                            />
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={() => setShowStats(true)}>
                        <Ionicons name="stats-chart" size={24} color="#F08080" />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.weekContainer}>
                {weekDays.map((day, index) => (
                    <View key={index} style={styles.dayContainer}>
                        <ThemedText style={styles.dayText}>{day.day}</ThemedText>
                        <View style={[
                            styles.dayIndicator,
                            day.read && styles.dayRead
                        ]} />
                    </View>
                ))}
            </View>

            {showBookProgress && currentlyReading.length > 0 && (
                <View style={styles.currentBookContainer}>
                    <ThemedText style={styles.currentBookTitle}>Currently Reading</ThemedText>
                    {currentlyReading.map(book => (
                        <TouchableOpacity 
                            key={book.id} 
                            style={styles.bookProgress}
                            onPress={() => {
                                setSelectedBook(book);
                                setCurrentPage(book.readingProgress?.currentPage.toString() || '');
                                setTotalPages(book.readingProgress?.totalPages.toString() || '');
                                setReadingTime(book.readingProgress?.readingTime.toString() || '');
                                setShowProgressModal(true);
                            }}
                        >
                            <ThemedText style={styles.bookTitle} numberOfLines={1}>
                                {book.title}
                            </ThemedText>
                            <View style={styles.progressBar}>
                                <View 
                                    style={[
                                        styles.progressFill,
                                        { width: `${book.readingProgress?.percentage || 0}%` }
                                    ]} 
                                />
                            </View>
                            <ThemedText style={styles.progressText}>
                                {book.readingProgress?.currentPage || 0}/{book.readingProgress?.totalPages || 0} pages
                            </ThemedText>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* Progress Update Modal */}
            <Modal
                visible={showProgressModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowProgressModal(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <ThemedText type="subtitle" style={{color:'black'}}>Update Progress</ThemedText>
                            <TouchableOpacity onPress={() => setShowProgressModal(false)}>
                                <Ionicons name="close" size={24} color="#000" />
                            </TouchableOpacity>
                        </View>

                        {selectedBook && (
                            <View style={styles.progressForm}>
                                <ThemedText style={styles.bookTitle}>{selectedBook.title}</ThemedText>
                                
                                <TextInput
                                    style={styles.progressInput}
                                    placeholder="Current page"
                                    value={currentPage}
                                    onChangeText={setCurrentPage}
                                    keyboardType="numeric"
                                />
                                <TextInput
                                    style={styles.progressInput}
                                    placeholder="Total pages"
                                    value={totalPages}
                                    onChangeText={setTotalPages}
                                    keyboardType="numeric"
                                />
                                <TextInput
                                    style={styles.progressInput}
                                    placeholder="Reading time (minutes)"
                                    value={readingTime}
                                    onChangeText={setReadingTime}
                                    keyboardType="numeric"
                                />
                                
                                <View style={styles.progressButtons}>
                                    <TouchableOpacity 
                                        style={[styles.progressButton, styles.cancelButton]}
                                        onPress={() => setShowProgressModal(false)}
                                    >
                                        <ThemedText style={styles.buttonText}>Cancel</ThemedText>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        style={[styles.progressButton, styles.saveButton]}
                                        onPress={handleUpdateProgress}
                                    >
                                        <ThemedText style={styles.buttonText}>Save</ThemedText>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>

            <Modal
                visible={showStats}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowStats(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <ThemedText type="subtitle" style={{color:'black'}}>Reading Statistics</ThemedText>
                            <TouchableOpacity onPress={() => setShowStats(false)}>
                                <Ionicons name="close" size={24} color="#000" />
                            </TouchableOpacity>
                        </View>
                        <ReadingStats />

                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'transparent',
        padding: 15,
        borderRadius: 12,
        marginVertical: 30,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        paddingLeft: 10,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'black',
    },
    weekContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    dayContainer: {
        alignItems: 'center',
    },
    dayText: {
        fontSize: 12,
        color: '#666',
        marginBottom: 5,
    },
    dayIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#ddd',
    },
    dayRead: {
        backgroundColor: '#F08080',
    },
    currentBookContainer: {
        marginTop: 10,
    },
    currentBookTitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 10,
    },
    bookProgress: {
        marginBottom: 10,
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#f8f8f8',
    },
    progressBar: {
        height: 6,
        backgroundColor: '#eee',
        borderRadius: 3,
        marginBottom: 5,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#F08080',
        borderRadius: 3,
    },
    progressText: {
        fontSize: 12,
        color: '#666',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        width: '90%',
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    statsContainer: {
        flex: 1,
    },
    statItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    statLabel: {
        fontSize: 16,
        color: '#666',
    },
    statValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000',
    },
    chartContainer: {
        marginTop: 20,
    },
    chartTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#000',
    },
    chart: {
        marginVertical: 8,
        borderRadius: 16,
    },
    bookTitle: {
        fontSize: 16,
        color: '#333',
        marginBottom: 4,
        fontWeight: '500',
    },
    progressForm: {
        padding: 15,
    },
    progressInput: {
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    progressButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
        marginTop: 10,
    },
    progressButton: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#ddd',
    },
    saveButton: {
        backgroundColor: '#F08080',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    headerButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    toggleButton: {
        padding: 4,
    },
}); 