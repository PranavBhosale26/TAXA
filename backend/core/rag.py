import re
import math
from typing import List, Dict, Tuple
from langchain_text_splitters import RecursiveCharacterTextSplitter

def chunk_document(text: str, chunk_size: int = 1500, chunk_overlap: int = 200) -> List[str]:
    """
    Split document text into smaller overlapping chunks.
    """
    if not text.strip():
        return []
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", " ", ""]
    )
    return splitter.split_text(text)

def tokenize(text: str) -> List[str]:
    """
    Convert text to lowercase tokens, filtering punctuation and short terms.
    """
    return re.findall(r'\b[a-z0-9]{2,}\b', text.lower())

class BasicTFIDFRetriever:
    """
    A lightweight, high-performance TF-IDF semantic vector search engine
    implemented in pure Python for perfect stability and deployment compatibility.
    """
    def __init__(self, documents: List[str]):
        self.documents = documents
        self.doc_tokens = [tokenize(doc) for doc in documents]
        self.vocab = set(token for doc in self.doc_tokens for token in doc)
        
        # Calculate Document Frequencies (DF)
        self.df: Dict[str, int] = {}
        for tokens in self.doc_tokens:
            unique_tokens = set(tokens)
            for token in unique_tokens:
                self.df[token] = self.df.get(token, 0) + 1
                
        self.num_docs = len(documents)
        
        # Precompute document vectors (TF-IDF)
        self.doc_vectors: List[Dict[str, float]] = []
        self.doc_magnitudes: List[float] = []
        
        for tokens in self.doc_tokens:
            tf: Dict[str, int] = {}
            for t in tokens:
                tf[t] = tf.get(t, 0) + 1
                
            vector: Dict[str, float] = {}
            squared_sum = 0.0
            for token, count in tf.items():
                # tf-idf calculation
                idf = math.log((self.num_docs + 1) / (self.df.get(token, 0) + 0.5))
                tfidf_val = count * idf
                vector[token] = tfidf_val
                squared_sum += tfidf_val ** 2
                
            self.doc_vectors.append(vector)
            self.doc_magnitudes.append(math.sqrt(squared_sum))

    def retrieve(self, query: str, top_n: int = 8) -> List[Tuple[str, float]]:
        """
        Compute cosine similarity between query and precomputed document chunks.
        Returns top_n matches as (chunk_text, score) tuples.
        """
        query_tokens = tokenize(query)
        if not query_tokens or not self.documents:
            return [(doc, 0.0) for doc in self.documents[:top_n]]
            
        # Compute Query TF-IDF Vector
        query_tf: Dict[str, int] = {}
        for t in query_tokens:
            query_tf[t] = query_tf.get(t, 0) + 1
            
        query_vector: Dict[str, float] = {}
        query_squared_sum = 0.0
        for token, count in query_tf.items():
            if token in self.vocab:
                idf = math.log((self.num_docs + 1) / (self.df.get(token, 0) + 0.5))
                tfidf_val = count * idf
                query_vector[token] = tfidf_val
                query_squared_sum += tfidf_val ** 2
                
        query_magnitude = math.sqrt(query_squared_sum)
        if query_magnitude == 0.0:
            return [(doc, 0.0) for doc in self.documents[:top_n]]
            
        # Compute Cosine Similarities
        scores: List[Tuple[int, float]] = []
        for idx, doc_vector in enumerate(self.doc_vectors):
            doc_mag = self.doc_magnitudes[idx]
            if doc_mag == 0.0:
                scores.append((idx, 0.0))
                continue
                
            # Dot Product
            dot_product = 0.0
            for token, q_val in query_vector.items():
                if token in doc_vector:
                    dot_product += q_val * doc_vector[token]
                    
            similarity = dot_product / (query_magnitude * doc_mag)
            scores.append((idx, similarity))
            
        # Sort and select top N
        scores.sort(key=lambda x: x[1], reverse=True)
        top_matches = scores[:top_n]
        
        return [(self.documents[idx], score) for idx, score in top_matches]

def perform_rag(query: str, document_text: str, top_n: int = 6) -> str:
    """
    Splits text into chunks, indexes via TF-IDF, and returns the top matching context block.
    If the document is extremely short (< 5000 characters), returns the whole document.
    """
    if len(document_text) < 5000:
        return document_text
        
    chunks = chunk_document(document_text)
    if not chunks:
        return ""
        
    retriever = BasicTFIDFRetriever(chunks)
    relevant_matches = retriever.retrieve(query, top_n=top_n)
    
    # Filter out empty or zero-score chunks if there are better ones
    relevant_chunks = [match[0] for match in relevant_matches if match[1] > 0.0]
    if not relevant_chunks:
        # Fallback to top matches directly
        relevant_chunks = [match[0] for match in relevant_matches]
        
    return "\n\n---\n\n".join(relevant_chunks)
