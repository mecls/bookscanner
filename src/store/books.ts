// src/store/books.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface ReadingProgress {
    currentPage: number;
    totalPages: number;
    percentage: number;
    lastUpdated: string;
    readingTime: number; // in minutes
}

export interface Book {
    id: string;
    title: string;
    image: string;
    authors?: string[];
    status?: 'read' | 'to-read' | 'amazing' | 'horrible' | 'dnf';
    readingProgress?: ReadingProgress;
    yearRead?: number;
}

interface ReadingStats {
    currentStreak: number;
    longestStreak: number;
    totalBooksRead: number;
    yearlyBooksRead: number;
    dailyReadingTime: number; // in minutes
    lastReadDate: string;
}

interface BooksStore {
    scannedBooks: Book[];
    addBook: (book: Book) => void;
    clearScannedBooks: () => void;
    galleryBooks: Book[];
    addGalleryBook: (book: Book) => void;
    removeGalleryBook: (id: string) => void;
    updateBookStatus: (id: string, status: Book['status']) => void;
    updateReadingProgress: (id: string, progress: ReadingProgress) => void;
    readingStats: ReadingStats;
    updateReadingStats: (stats: Partial<ReadingStats>) => void;
}

export const useBooksStore = create<BooksStore>()(
    persist(
        (set) => ({
            scannedBooks: [],
            addBook: (book) => set((state) => ({
                scannedBooks: [book, ...state.scannedBooks]
            })),
            clearScannedBooks: () => set({ scannedBooks: [] }),
            galleryBooks: [],
            addGalleryBook: (book) => set((state) => ({
                galleryBooks: [
                    { ...book, status: book.status || 'to-read' },
                    ...state.galleryBooks
                ]
            })),
            removeGalleryBook: (id) => set((state) => ({
                galleryBooks: state.galleryBooks.filter((b) => b.id !== id)
            })),
            updateBookStatus: (id, status) => set((state) => ({
                galleryBooks: state.galleryBooks.map((b) => 
                    b.id === id ? { ...b, status } : b
                )
            })),
            updateReadingProgress: (id, progress) => set((state) => ({
                galleryBooks: state.galleryBooks.map((b) => 
                    b.id === id ? { ...b, readingProgress: progress } : b
                )
            })),
            readingStats: {
                currentStreak: 0,
                longestStreak: 0,
                totalBooksRead: 0,
                yearlyBooksRead: 0,
                dailyReadingTime: 0,
                lastReadDate: new Date().toISOString(),
            },
            updateReadingStats: (stats) => set((state) => ({
                readingStats: { ...state.readingStats, ...stats }
            })),
        }),
        {
            name: 'books-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);