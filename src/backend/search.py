import pandas as pd
from sklearn.feature_extraction import text
from sklearn.feature_extraction.text import TfidfVectorizer
import re
from sklearn.metrics.pairwise import cosine_similarity
from rapidfuzz import process, fuzz

file_path = 'ctg-studies.csv'
threshold = 80

# Preprocess - run once at startup
def load_and_preprocess_data(file_path: str):
    df = pd.read_csv(file_path)
    
    #Commbine columns with salient data
    df['combined_text'] = df.apply(lambda row: ' '.join(row[['Study Title', 'Brief Summary', 'Conditions', 'Primary Outcome Measures']].astype(str)), axis=1)
    
    # lowercasing, removing special characters - make search easier
    df['combined_text'] = df['combined_text'].apply(lambda x: re.sub(r'[^a-zA-Z0-9\s]', ' ', x).lower())
    
    return df
df = load_and_preprocess_data(file_path=file_path)

# Feature Extraction with TF-IDF for dataset - run once at startup
def vectorize_text(df: pd.DataFrame):
    vectorizer = TfidfVectorizer(max_features=5000)
    df_vectorized = vectorizer.fit_transform(df['combined_text'])
    return df_vectorized, vectorizer

df_vectorized , vectorizer = vectorize_text(df)

# Option 1: Fuzzy search on similarity-ranked trials
def fuzzy_search(df: pd.DataFrame, query: str, limit: int = 500):
    df['identifiers'] = df['Study Title'] + ' ' + df['Brief Summary']
    matched_indices = []
    for idx, row in df.iterrows():
        match_score = fuzz.partial_ratio(query.lower(), str(row['identifiers']).lower())
        if match_score >= threshold:
            matched_indices.append(idx)
        if(len(matched_indices) == limit):
            break
    return matched_indices

#include a check on the exact search functionality to see if the trial contains instances of the opposite of what you're looking for (e.g. actual topic is non small cell when you want small cell) - can lead to false positives otherwise
ANTI_WORD_PREFIXES = {
    "non": r'\bnon[-\s]?',
    "un": r'\bun[-\s]?',
    "anti": r'\banti[-\s]?',
    "de": r'\bde[-\s]?',
    #Can add more later
}

# Option 2: Exact search on similarity ranked trials
def exact_search(df: pd.DataFrame, query: str, limit: int = 500):
    df['identifiers'] = df['Study Title'] + ' ' + df['Brief Summary']
    query_arr = query.split(' ')
    reg_ex = r'[ -]?'.join(query_arr)
    
    antis = [] if any(query.startswith(pre) for pre in ANTI_WORD_PREFIXES.keys()) else [pattern + reg_ex for pattern in ANTI_WORD_PREFIXES.values()]
    
    matched_indices = []
    for idx, row in df.iterrows():
        if row['identifiers'] and re.search(reg_ex, str(row['identifiers']), re.IGNORECASE) and not any(re.search(pattern, str(row['identifiers']), re.IGNORECASE) for pattern in antis):
            matched_indices.append(idx)
        if(len(matched_indices) == limit):
            break
    return matched_indices

# Search method that returns top n trials to frontend
def search_clinical_trials(query: str, num_results: int, exact: bool):
    
    queries = query.split("AND")
    print(queries)
    # Preprocess queries
    queries = [re.sub(r'[^a-zA-Z0-9\s]', ' ', query).lower() for query in queries]
    
    results_sets = []
    
    for query in queries:
        query_vectorized = vectorizer.transform([query])
        
        # Calculate similarity scores
        similarity_scores = cosine_similarity(query_vectorized, df_vectorized)
        
        # Sort the trials by their relevance to the query (highest similarity score first)
        df['similarity_score'] = similarity_scores[0]
        sim_results = df.sort_values(by='similarity_score', ascending=False)
        
        # User has choice on UI to select or deselect exact search  - this will influence which secondary searching functionality is used 
        results = exact_search(df=sim_results, query=query) if exact else fuzzy_search(df=sim_results, query=query)
        
        results_sets.append(set(results))
        
    common_inds = set.intersection(*results_sets)
    if not common_inds:
        return pd.DataFrame(columns=['Study Title', 'Study Url'])
    
    common_results = df.loc[[ind for ind in common_inds]]
    
    return common_results[['Study Title', 'Study URL']].head(num_results)
