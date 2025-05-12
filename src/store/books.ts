// src/store/books.ts
import { create } from 'zustand';

interface Book {
    id: string;
    title: string;
    image: string;
    authors?: string[];
}

interface BooksStore {
    scannedBooks: Book[];
    addBook: (book: Book) => void;
}

export const useBooksStore = create<BooksStore>((set) => ({
    scannedBooks: [],
    addBook: (book) => set((state) => ({
        scannedBooks: [book, ...state.scannedBooks]
    })),
}));