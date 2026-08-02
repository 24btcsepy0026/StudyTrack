import math
import re
import os

VOCABULARY = [
    "sort", "search", "binary", "insertion", "sql", "join",
    "fastapi", "pydantic", "prompt", "llm", "database", "validate",
]

NOTES = [
    {"id": 1, "text": "Binary search requires a sorted array and repeatedly halves the search range using a midpoint comparison."},
    {"id": 2, "text": "Insertion sort builds a sorted list one element at a time by shifting larger elements to the right."},
    {"id": 3, "text": "FastAPI uses Pydantic models to validate request bodies and automatically generates Swagger documentation."},
    {"id": 4, "text": "SQL joins combine rows from two tables using a matching column, such as inner join, left join, and full join."},
    {"id": 5, "text": "Prompt engineering structures a task, context, constraints, and desired output format to guide an LLM's response."},
]

# Difficulty thresholds: < 40 words = easy, 40-100 = medium, > 100 = hard
EASY_THRESHOLD = 40
HARD_THRESHOLD = 100


def _count_words(text: str) -> int:
    return len(text.split())


def _derive_topic(text: str) -> str:
    """Use the first line as the topic (longest word-run / title-like first line)."""
    first_line = text.strip().split("\n")[0].strip()
    if first_line:
        return first_line
    return "untitled"


def _extract_key_points(text: str) -> list[str]:
    sentences = re.split(r"[.!?]+", text)
    key_points = []
    for sentence in sentences:
        stripped = sentence.strip()
        if stripped and len(key_points) < 3:
            key_points.append(stripped)
    return key_points


def _derive_difficulty(text: str) -> str:
    word_count = _count_words(text)
    if word_count < EASY_THRESHOLD:
        return "easy"
    elif word_count <= HARD_THRESHOLD:
        return "medium"
    else:
        return "hard"


def summarize_notes(raw_text: str) -> dict:
    """Summarize study notes into a fixed-shape JSON object."""
    if not raw_text or not raw_text.strip():
        return {
            "topic": "untitled",
            "key_points": [],
            "difficulty": "easy",
        }

    return {
        "topic": _derive_topic(raw_text),
        "key_points": _extract_key_points(raw_text),
        "difficulty": _derive_difficulty(raw_text),
    }


def mock_embed(text: str) -> list[float]:
    """Deterministic word-count vector over the fixed 12-word vocabulary."""
    tokens = re.split(r"[^a-zA-Z0-9]+", text.lower())
    tokens = [t for t in tokens if t]

    vector = []
    for word in VOCABULARY:
        count = tokens.count(word)
        vector.append(float(count))

    return vector


def cosine_similarity(vec_a: list[float], vec_b: list[float]) -> float:
    """Compute cosine similarity from first principles."""
    dot_product = sum(a * b for a, b in zip(vec_a, vec_b))

    magnitude_a = math.sqrt(sum(a * a for a in vec_a))
    magnitude_b = math.sqrt(sum(b * b for b in vec_b))

    if magnitude_a == 0.0 or magnitude_b == 0.0:
        return 0.0

    return dot_product / (magnitude_a * magnitude_b)


def search_notes(query: str) -> list[dict]:
    """Rank notes by cosine similarity to the query."""
    query_vec = mock_embed(query)
    query_is_zero = all(v == 0.0 for v in query_vec)

    results = []
    for note in NOTES:
        note_vec = mock_embed(note["text"])
        score = cosine_similarity(query_vec, note_vec)
        results.append({
            "id": note["id"],
            "text": note["text"],
            "score": round(score, 6),
        })

    if query_is_zero:
        results.sort(key=lambda x: x["id"])
    else:
        results.sort(key=lambda x: x["score"], reverse=True)

    return results
