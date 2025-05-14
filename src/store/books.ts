// src/store/books.ts
import { create } from 'zustand';

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
}

export const useBooksStore = create<BooksStore>((set) => ({
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
}));