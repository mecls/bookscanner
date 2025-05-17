// src/store/books.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface Book {
    id: string;
    title: string;
    image: string;
    authors?: string[];
    status?: 'read' | 'to-read' | 'amazing' | 'horrible';
}

interface BooksStore {
    scannedBooks: Book[];
    addBook: (book: Book) => void;
    galleryBooks: Book[];
    addGalleryBook: (book: Book) => void;
    removeGalleryBook: (id: string) => void;
    updateBookStatus: (id: string, status: Book['status']) => void;
}

export const useBooksStore = create<BooksStore>()(
    persist(
        (set) => ({
            scannedBooks: [],
            addBook: (book) => set((state) => ({
                scannedBooks: [book, ...state.scannedBooks]
            })),
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
        }),
        {
            name: 'books-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);