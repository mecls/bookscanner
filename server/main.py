import io
import pytesseract
import requests
from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from PIL import Image
import re
import cv2
import numpy as np
from typing import List, Dict, Optional, Tuple
import os
from google.cloud import vision
import hashlib
import json
from pathlib import Path
import time
from dotenv import load_dotenv
from fuzzywuzzy import fuzz
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

load_dotenv()  # Load environment variables from .env file
app = FastAPI()

# Initialize Google Cloud Vision client
GOOGLE_APPLICATION_CREDENTIALS = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
google_vision_client = vision.ImageAnnotatorClient() if GOOGLE_APPLICATION_CREDENTIALS else None

# Cache configuration
CACHE_DIR = Path("cache")
CACHE_DIR.mkdir(exist_ok=True)
CACHE_EXPIRY_DAYS = 30  # Cache results for 30 days

def get_cache_key(image_data: bytes) -> str:
    """Generate a unique cache key for an image."""
    return hashlib.md5(image_data).hexdigest()

def get_cached_result(cache_key: str) -> Optional[Dict]:
    """Retrieve cached result if it exists and is not expired."""
    cache_file = CACHE_DIR / f"{cache_key}.json"
    if cache_file.exists():
        with open(cache_file, 'r') as f:
            cached_data = json.load(f)
            # Check if cache is expired
            if (time.time() - cached_data['timestamp']) < (CACHE_EXPIRY_DAYS * 24 * 60 * 60):
                return cached_data['result']
    return None

def save_to_cache(cache_key: str, result: Dict):
    """Save result to cache."""
    cache_file = CACHE_DIR / f"{cache_key}.json"
    with open(cache_file, 'w') as f:
        json.dump({
            'timestamp': time.time(),
            'result': result
        }, f)

def enhanced_preprocess_image(image: Image.Image) -> List[Image.Image]:
    """Enhanced image preprocessing that returns multiple processed versions for better OCR results."""
    img = np.array(image)
    processed_images = []
    
    # Original image
    processed_images.append(image)
    
    # Convert to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    processed_images.append(Image.fromarray(gray))
    
    # Apply bilateral filter to remove noise while preserving edges
    denoised = cv2.bilateralFilter(gray, 9, 75, 75)
    
    # Increase contrast using CLAHE
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
    enhanced = clahe.apply(denoised)
    processed_images.append(Image.fromarray(enhanced))
    
    # Adaptive thresholding with different parameters
    thresh1 = cv2.adaptiveThreshold(
        enhanced, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
        cv2.THRESH_BINARY, 11, 2
    )
    processed_images.append(Image.fromarray(thresh1))
    
    thresh2 = cv2.adaptiveThreshold(
        enhanced, 255, cv2.ADAPTIVE_THRESH_MEAN_C,
        cv2.THRESH_BINARY, 11, 2
    )
    processed_images.append(Image.fromarray(thresh2))
    
    # Deskewing with improved angle detection
    coords = np.column_stack(np.where(thresh1 > 0))
    if len(coords) > 0:
        angle = cv2.minAreaRect(coords)[-1]
        if angle < -45:
            angle = 90 + angle
        (h, w) = thresh1.shape[:2]
        center = (w // 2, h // 2)
        M = cv2.getRotationMatrix2D(center, angle, 1.0)
        rotated = cv2.warpAffine(
            thresh1, M, (w, h),
            flags=cv2.INTER_CUBIC,
            borderMode=cv2.BORDER_REPLICATE
        )
        processed_images.append(Image.fromarray(rotated))
    
    # Otsu's thresholding
    _, otsu = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    processed_images.append(Image.fromarray(otsu))
    
    # Morphological operations to enhance text
    kernel = np.ones((1, 1), np.uint8)
    dilated = cv2.dilate(gray, kernel, iterations=1)
    eroded = cv2.erode(dilated, kernel, iterations=1)
    processed_images.append(Image.fromarray(eroded))
    
    # Add sharpening filter
    kernel_sharpen = np.array([[-1,-1,-1], [-1,9,-1], [-1,-1,-1]])
    sharpened = cv2.filter2D(gray, -1, kernel_sharpen)
    processed_images.append(Image.fromarray(sharpened))
    
    # Add noise reduction
    denoised_gaussian = cv2.GaussianBlur(gray, (3,3), 0)
    processed_images.append(Image.fromarray(denoised_gaussian))
    
    return processed_images

def extract_text_google_vision(image: Image.Image) -> Dict[str, str]:
    """Extract text using Google Cloud Vision API with detailed annotations."""
    if not google_vision_client:
        return {"full_text": "", "title_candidates": [], "author_candidates": []}
    
    img_byte_arr = io.BytesIO()
    image.save(img_byte_arr, format='PNG')
    img_byte_arr = img_byte_arr.getvalue()
    
    try:
        # Get text detection with multiple features
        features = [
            vision.Feature(type_=vision.Feature.Type.TEXT_DETECTION),
            vision.Feature(type_=vision.Feature.Type.DOCUMENT_TEXT_DETECTION),
            vision.Feature(type_=vision.Feature.Type.OBJECT_LOCALIZATION)
        ]
        
        image = vision.Image(content=img_byte_arr)
        response = google_vision_client.annotate_image({'image': image, 'features': features})
        
        # Extract text from both text detection and document text detection
        texts = response.text_annotations
        full_text = texts[0].description if texts else ""
        
        # Get document text detection for more structured analysis
        doc_response = google_vision_client.document_text_detection(image=vision.Image(content=img_byte_arr))
        
        # Extract potential title and author candidates based on text size and position
        title_candidates = []
        author_candidates = []
        
        if doc_response.full_text_annotation:
            # Sort blocks by y-coordinate (top to bottom)
            blocks = sorted(
                doc_response.full_text_annotation.pages[0].blocks, 
                key=lambda b: b.bounding_box.vertices[0].y
            )
            
            # First few blocks are likely to contain title and author
            for i, block in enumerate(blocks[:min(5, len(blocks))]):
                block_text = ""
                confidence_sum = 0
                symbol_count = 0
                
                for paragraph in block.paragraphs:
                    for word in paragraph.words:
                        word_text = ''.join([symbol.text for symbol in word.symbols])
                        block_text += word_text + " "
                        
                        # Calculate average confidence for the block
                        for symbol in word.symbols:
                            confidence_sum += symbol.confidence
                            symbol_count += 1
                
                block_text = block_text.strip()
                if block_text:
                    avg_confidence = confidence_sum / symbol_count if symbol_count > 0 else 0
                    
                    # Only consider blocks with good confidence
                    if avg_confidence > 0.7:
                        if i == 0:  # First block is likely the title
                            title_candidates.append(block_text)
                        elif i == 1:  # Second block might be author
                            author_candidates.append(block_text)
                        elif "by" in block_text.lower() or "author" in block_text.lower():
                            author_candidates.append(block_text)
                        elif len(block_text.split()) <= 5:  # Short blocks might be title/author
                            if i < 2:
                                title_candidates.append(block_text)
                            else:
                                author_candidates.append(block_text)
        
        # Also try to extract from regular text detection
        if texts:
            for text in texts[1:]:  # Skip the first one as it's the full text
                text_content = text.description.strip()
                if text_content:
                    # Check if it looks like a title (short, all caps, or starts with capital)
                    if (len(text_content.split()) <= 5 and 
                        (text_content.isupper() or text_content[0].isupper())):
                        title_candidates.append(text_content)
                    # Check if it looks like an author (contains "by" or "author")
                    elif "by" in text_content.lower() or "author" in text_content.lower():
                        author_candidates.append(text_content)
        
        # Remove duplicates while preserving order
        title_candidates = list(dict.fromkeys(title_candidates))
        author_candidates = list(dict.fromkeys(author_candidates))
        
        return {
            "full_text": full_text,
            "title_candidates": title_candidates,
            "author_candidates": author_candidates
        }
    except Exception as e:
        logger.error(f"Google Vision API error: {e}")
        return {"full_text": "", "title_candidates": [], "author_candidates": []}

def extract_text_tesseract(image: Image.Image) -> str:
    """Extract text using Tesseract OCR as a fallback."""
    try:
        return pytesseract.image_to_string(image)
    except Exception as e:
        logger.error(f"Tesseract OCR error: {e}")
        return ""

def clean_text(text: str) -> str:
    """Clean and normalize extracted text."""
    # Remove non-alphanumeric characters except basic punctuation
    text = re.sub(r'[^\w\s.,!?;:\'\"-]', ' ', text)
    # Normalize whitespace
    text = ' '.join(text.split())
    # Remove common OCR errors
    text = re.sub(r'[|]', 'I', text)  # Vertical bar often misrecognized as 'I'
    text = re.sub(r'0', 'O', text)    # 0 often misrecognized as 'O'
    return text

def extract_book_info(text_data: Dict[str, str]) -> Dict[str, Optional[str]]:
    """Extract book information from text with improved patterns and candidate analysis."""
    full_text = text_data["full_text"]
    title_candidates = text_data["title_candidates"]
    author_candidates = text_data["author_candidates"]
    
    # Common patterns for book information
    patterns = {
        'title': [
            r'(?:title|book):\s*([^\n]+)',
            r'^([^\n]+)(?:\n|$)',
            r'([A-Z][^\n]+)(?:\n|$)',
            r'(?:Title|Book):\s*([^\n]+)',
            r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)(?:\n|$)'
        ],
        'author': [
            r'(?:author|by|written by):\s*([^\n]+)',
            r'by\s+([^\n]+)(?:\n|$)',
            r'(?:Author|By):\s*([^\n]+)',
            r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)(?:\n|$)'
        ],
        'isbn': [
            r'ISBN[:\s-]*([0-9X-]{10,17})',
            r'(?<!\d)(\d{9}[\dX])(?!\d)',  # ISBN-10
            r'(?<!\d)(\d{13})(?!\d)',      # ISBN-13
            r'ISBN-13:\s*([0-9-]+)',
            r'ISBN-10:\s*([0-9X-]+)'
        ]
    }
    
    info = {}
    
    # First try to extract from title candidates
    if title_candidates:
        info['title'] = title_candidates[0]
    
    # Then try to extract from author candidates
    if author_candidates:
        # Look for "by" pattern in author candidates
        for candidate in author_candidates:
            if re.search(r'\bby\b', candidate, re.IGNORECASE):
                author_match = re.search(r'\bby\b\s+(.+)', candidate, re.IGNORECASE)
                if author_match:
                    info['author'] = author_match.group(1).strip()
                    break
            else:
                # If no "by" pattern, use the candidate as is
                info['author'] = candidate
                break
    
    # Fall back to pattern matching on full text
    for key, pattern_list in patterns.items():
        if key not in info:  # Only if not already found
            for pattern in pattern_list:
                match = re.search(pattern, full_text, re.IGNORECASE)
                if match:
                    value = match.group(1).strip()
                    # Additional cleaning for titles and authors
                    if key in ['title', 'author']:
                        value = re.sub(r'[^\w\s.,!?;:\'\"-]', '', value)
                        value = ' '.join(value.split())
                    info[key] = value
                    break
    
    # Extract ISBN specifically - it's critical for accurate matching
    for pattern in patterns['isbn']:
        isbn_match = re.search(pattern, full_text, re.IGNORECASE)
        if isbn_match:
            isbn = isbn_match.group(1).strip().replace('-', '')
            # Validate ISBN format
            if re.match(r'^(\d{9}[\dX]|\d{13})$', isbn):
                info['isbn'] = isbn
                break
    
    return info

def find_best_match(items: List[Dict], book_info: Dict[str, Optional[str]]) -> Tuple[Optional[Dict], float]:
    """Find the best matching book from the search results with improved scoring."""
    best_score = 0
    best_match = None
    
    for item in items:
        score = 0
        volume_info = item['volumeInfo']
        
        # Check ISBN match (highest priority)
        if book_info.get('isbn') and volume_info.get('industryIdentifiers'):
            for identifier in volume_info['industryIdentifiers']:
                clean_isbn1 = book_info['isbn'].replace('-', '')
                clean_isbn2 = identifier.get('identifier', '').replace('-', '')
                if clean_isbn1 == clean_isbn2:
                    score += 20  # Increased weight for ISBN match
                    break
        
        # Check title match using fuzzy matching with improved scoring
        if book_info.get('title') and volume_info.get('title'):
            # Try exact match first
            if book_info['title'].lower() == volume_info['title'].lower():
                score += 15
            else:
                # Use multiple fuzzy matching algorithms
                title_similarity = max(
                    fuzz.token_sort_ratio(book_info['title'].lower(), volume_info['title'].lower()),
                    fuzz.partial_ratio(book_info['title'].lower(), volume_info['title'].lower()),
                    fuzz.token_set_ratio(book_info['title'].lower(), volume_info['title'].lower())
                ) / 100.0
                
                # Higher weight for longer titles (more specific)
                title_length_factor = min(1.0, len(book_info['title']) / 20.0)
                score += title_similarity * 10 * (0.5 + title_length_factor)
        
        # Check author match with improved scoring
        if book_info.get('author') and volume_info.get('authors'):
            author_scores = []
            for author in volume_info['authors']:
                # Try exact match first
                if book_info['author'].lower() == author.lower():
                    author_scores.append(1.0)
                else:
                    # Use multiple fuzzy matching algorithms
                    author_similarity = max(
                        fuzz.token_sort_ratio(book_info['author'].lower(), author.lower()),
                        fuzz.partial_ratio(book_info['author'].lower(), author.lower()),
                        fuzz.token_set_ratio(book_info['author'].lower(), author.lower())
                    ) / 100.0
                    author_scores.append(author_similarity)
            
            if author_scores:
                score += max(author_scores) * 8
        
        # Check subtitle match if available
        if book_info.get('title') and volume_info.get('subtitle'):
            subtitle_similarity = max(
                fuzz.token_sort_ratio(book_info['title'].lower(), volume_info['subtitle'].lower()),
                fuzz.partial_ratio(book_info['title'].lower(), volume_info['subtitle'].lower())
            ) / 100.0
            score += subtitle_similarity * 5
        
        # Check publication date (prefer newer books)
        if volume_info.get('publishedDate'):
            try:
                year = int(volume_info['publishedDate'][:4])
                if year > 1900:
                    recency_factor = min(1.0, (year - 1900) / 120.0)
                    score += recency_factor * 2
            except (ValueError, IndexError):
                pass
        
        # Bonus for having an image
        if volume_info.get('imageLinks', {}).get('thumbnail'):
            score += 1
        
        # Additional validation checks
        if score > 0:
            # Check if the book has a description (indicates better quality data)
            if volume_info.get('description'):
                score += 2
            
            # Check if the book has page count (indicates better quality data)
            if volume_info.get('pageCount'):
                score += 1
            
            # Check if the book has categories (helps validate genre match)
            if volume_info.get('categories'):
                score += 1
        
        if score > best_score:
            best_score = score
            best_match = item
    
    # Only return a match if the score is high enough
    # Increased threshold for better accuracy
    return (best_match, best_score) if best_score >= 15 else (None, 0)

def search_open_library(book_info: Dict[str, Optional[str]]) -> Optional[Dict]:
    """Search for books using Open Library API as a fallback."""
    search_attempts = []
    
    # Try ISBN first (most accurate)
    if book_info.get('isbn'):
        isbn = book_info['isbn'].replace('-', '')
        search_attempts.append(('isbn', f'isbn:{isbn}'))
    
    # Try title and author combination
    if book_info.get('title') and book_info.get('author'):
        search_attempts.append(('title+author', f'title:{book_info["title"]}&author:{book_info["author"]}'))
    
    # Try title only
    if book_info.get('title'):
        search_attempts.append(('title', f'title:{book_info["title"]}'))
    
    # Try author only
    if book_info.get('author'):
        search_attempts.append(('author', f'author:{book_info["author"]}'))
    
    for search_type, query in search_attempts:
        try:
            url = f"https://openlibrary.org/search.json?q={query}"
            response = requests.get(url)
            if response.status_code == 200:
                data = response.json()
                if data.get('docs') and len(data['docs']) > 0:
                    # Get the best match from the results
                    best_match = None
                    best_score = 0
                    
                    for doc in data['docs']:
                        score = 0
                        
                        # Check ISBN match
                        if book_info.get('isbn') and doc.get('isbn'):
                            if book_info['isbn'] in doc['isbn']:
                                score += 20
                        
                        # Check title match
                        if book_info.get('title') and doc.get('title'):
                            title_similarity = fuzz.token_sort_ratio(
                                book_info['title'].lower(),
                                doc['title'].lower()
                            ) / 100.0
                            score += title_similarity * 10
                        
                        # Check author match
                        if book_info.get('author') and doc.get('author_name'):
                            author_similarity = max([
                                fuzz.token_sort_ratio(
                                    book_info['author'].lower(),
                                    author.lower()
                                ) / 100.0
                                for author in doc['author_name']
                            ])
                            score += author_similarity * 8
                        
                        if score > best_score:
                            best_score = score
                            best_match = doc
                    
                    if best_match and best_score >= 15:
                        # Get cover image if available
                        cover_id = best_match.get('cover_i')
                        cover_url = f"https://covers.openlibrary.org/b/id/{cover_id}-L.jpg" if cover_id else None
                        
                        return {
                            'title': best_match.get('title', ''),
                            'authors': best_match.get('author_name', []),
                            'description': best_match.get('first_sentence', [''])[0] if best_match.get('first_sentence') else '',
                            'image': cover_url,
                            'match_score': best_score,
                            'source': 'open_library',
                            'rating': None  # Open Library does not provide ratings
                        }
        except Exception as e:
            logger.error(f"Open Library API error: {e}")
            continue
    
    return None

def search_google_books(text: str, book_info: Dict[str, Optional[str]]) -> Optional[Dict]:
    """Enhanced Google Books API search with better matching and logging."""
    search_attempts = []
    
    # Try ISBN first (most accurate)
    if book_info.get('isbn'):
        isbn = book_info['isbn'].replace('-', '')
        search_attempts.append(('isbn', f'isbn:{isbn}'))
    
    # Try exact title and author match
    if book_info.get('title') and book_info.get('author'):
        search_attempts.append(('title+author', f'intitle:"{book_info["title"]}" inauthor:"{book_info["author"]}"'))
    
    # Try title with partial author match
    if book_info.get('title') and book_info.get('author'):
        author_parts = book_info['author'].split()
        if len(author_parts) > 1:
            search_attempts.append(('title+partial_author', f'intitle:"{book_info["title"]}" inauthor:"{author_parts[0]}"'))
    
    # Try title only with quotes for exact match
    if book_info.get('title'):
        search_attempts.append(('exact_title', f'intitle:"{book_info["title"]}"'))
        # Also try without quotes for partial match
        search_attempts.append(('partial_title', f'intitle:{book_info["title"]}'))
    
    # Try author only with quotes for exact match
    if book_info.get('author'):
        search_attempts.append(('exact_author', f'inauthor:"{book_info["author"]}"'))
        # Also try without quotes for partial match
        search_attempts.append(('partial_author', f'inauthor:{book_info["author"]}'))
    
    # Try text search as last resort
    search_attempts.append(('text', text))
    
    logger.info(f"Book info extracted: {book_info}")
    
    best_result = None
    best_score = 0
    
    for search_type, query in search_attempts:
        logger.info(f"Trying search with {search_type}: {query}")
        url = f"https://www.googleapis.com/books/v1/volumes?q={query}&maxResults=5"
        response = requests.get(url)
        if response.status_code == 200:
            data = response.json()
            if data.get('items'):
                # Get the best match from the results
                best_match, match_score = find_best_match(data['items'], book_info)
                logger.info(f"Best match score: {match_score} for search type: {search_type}")
                
                if best_match and match_score > best_score:
                    best_score = match_score
                    book = best_match['volumeInfo']
                    best_result = {
                    'title': book.get('title', ''),
                    'authors': book.get('authors', []),
                    'description': book.get('description', ''),
                    'image': book.get('imageLinks', {}).get('thumbnail', ''),
                    'rating': book.get('averageRating', None),  # <-- add this line
                    'match_score': match_score,
                    'source': 'google_books'
                    }
                        
    # If Google Books search fails or returns low confidence results, try Open Library
    if not best_result or best_score < 15:
        logger.info("Google Books search failed or returned low confidence, trying Open Library")
        open_library_result = search_open_library(book_info)
        if open_library_result:
            return open_library_result
    
    return best_result

def calculate_similarity(str1: str, str2: str) -> float:
    """Calculate similarity between two strings using fuzzy matching."""
    return fuzz.token_sort_ratio(str1, str2) / 100.0

@app.post("/extract_and_summarize")
async def extract_and_summarize(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        
        # Check cache first
        cache_key = get_cache_key(contents)
        cached_result = get_cached_result(cache_key)
        if cached_result:
            logger.info(f"Cache hit for {cache_key}")
            return JSONResponse(content=cached_result)
        
        image = Image.open(io.BytesIO(contents))
        processed_images = enhanced_preprocess_image(image)
        
        # Try multiple processing methods and combine results
        all_text_data = {"full_text": "", "title_candidates": [], "author_candidates": []}
        
        # First try Google Vision on original image (usually best results)
        vision_text_data = extract_text_google_vision(image)
        if vision_text_data["full_text"]:
            all_text_data = vision_text_data
            logger.info("Successfully extracted text with Google Vision")
        
        # If Google Vision failed or returned little text, try other processing methods
        if len(all_text_data["full_text"]) < 20:
            logger.info("Google Vision returned limited text, trying alternative processing")
            for processed_image in processed_images[1:]:  # Skip original image
                additional_text_data = extract_text_google_vision(processed_image)
                if len(additional_text_data["full_text"]) > len(all_text_data["full_text"]):
                    all_text_data = additional_text_data
                    logger.info("Found better text with alternative processing")
        
        # Fall back to Tesseract if Google Vision failed completely
        if not all_text_data["full_text"]:
            logger.info("Falling back to Tesseract OCR")
            for processed_image in processed_images:
                tesseract_text = extract_text_tesseract(processed_image)
                if len(tesseract_text) > len(all_text_data["full_text"]):
                    all_text_data["full_text"] = tesseract_text
        
        cleaned_text = clean_text(all_text_data["full_text"])
        logger.info(f"Extracted text: {cleaned_text[:100]}...")
        
        # Extract book information
        book_info = extract_book_info(all_text_data)
        logger.info(f"Extracted book info: {book_info}")
        
        # Search for the book
        book_data = search_google_books(cleaned_text, book_info)
        
        # Always use LLM for summary, even if book_data is found
        logger.info(f"Generating summary with LLM for book: {book_data['title'] if book_data else 'Unknown'}")
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "gemma2",
                "prompt": f'''Extract the most important, actionable key points from the following book. 
Summarize in 4-7 short bullet points (one per line). 
Each point should be concise, direct, and help a reader instantly understand what makes this book unique or useful. 
Do NOT write a paragraph. Do NOT include an introduction or conclusion. 
Just the key points, like a cheat sheet.

Extracted Text: {cleaned_text}

Book Information:
Title: {book_data['title'] if book_data else book_info.get('title', 'Unknown')}
Author: {', '.join(book_data['authors']) if book_data and book_data.get('authors') else book_info.get('author', 'Unknown')}
ISBN: {book_info.get('isbn', 'Unknown')}

Key Points:
''',
                "stream": False,
            },
        )
        summary = response.json()["response"]
        result = {
            "summary": summary,
            "title": book_data['title'] if book_data else book_info.get('title', 'Unknown'),
            "authors": book_data['authors'] if book_data and book_data.get('authors') else [],
            "image": book_data['image'] if book_data and book_data.get('image') else None,
            "rating": book_data['rating'] if book_data and book_data.get('rating') is not None else None
        }
        # Cache the result
        save_to_cache(cache_key, result)
        return JSONResponse(content=result)

    except Exception as e:
        logger.error(f"Error processing request: {str(e)}", exc_info=True)
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.get("/search_by_isbn")
async def search_by_isbn(isbn: str):
    try:
        # Clean the ISBN
        clean_isbn = isbn.replace('-', '')
        
        # Try Google Books first
        url = f"https://www.googleapis.com/books/v1/volumes?q=isbn:{clean_isbn}"
        response = requests.get(url)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('items'):
                book = data['items'][0]['volumeInfo']
                return {
                    "title": book.get('title', ''),
                    "authors": book.get('authors', []),
                    "description": book.get('description', ''),
                    "image": book.get('imageLinks', {}).get('thumbnail', ''),
                }
        
        # If Google Books fails, try Open Library
        url = f"https://openlibrary.org/isbn/{clean_isbn}.json"
        response = requests.get(url)
        
        if response.status_code == 200:
            data = response.json()
            # Get the cover image
            cover_url = f"https://covers.openlibrary.org/b/isbn/{clean_isbn}-L.jpg"
            
            # Get author information
            author_url = f"https://openlibrary.org{data.get('authors', [{}])[0].get('key', '')}.json"
            author_response = requests.get(author_url)
            author_data = author_response.json() if author_response.status_code == 200 else {}
            
            return {
                "title": data.get('title', ''),
                "authors": [author_data.get('name', '')] if author_data else [],
                "description": data.get('description', ''),
                "image": cover_url,
            }
        
        return JSONResponse(
            content={"error": "Book not found"},
            status_code=404
        )
        
    except Exception as e:
        logger.error(f"Error searching by ISBN: {str(e)}", exc_info=True)
        return JSONResponse(
            content={"error": str(e)},
            status_code=500
        )
