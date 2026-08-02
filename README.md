# StudyTrack — Unified Full-Stack Study Management Platform

StudyTrack is a full-stack application for Myntra's Trainee Enablement team. It provides student/course roster management (CRUD), hand-rolled sorting and search algorithms, and an offline AI assistant for note summarization and semantic search — all from a single running application.

## Run Mode

This project uses **single-process mode**: the FastAPI backend mounts the `frontend/` directory as static files, so opening `http://localhost:8000/` serves the dashboard and all API calls use relative paths (e.g. `fetch("/students/")`).

## Setup

### Prerequisites

- Python 3.10 or newer
- pip

### Installation

```bash
cd studytrack/backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

### Running the App

From the `backend/` directory:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Open **http://localhost:8000/** in your browser. The seeded roster loads automatically on first startup.

Swagger UI is available at **http://localhost:8000/docs**.

To reset the database, delete `backend/studytrack.db` and restart the server.

---

## API Endpoints

### Students

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/students/` | Create a student. Body: `{"name": str, "email": str, "age": int}`. Returns 201. |
| `GET` | `/students/` | List all students. Optional query: `?min_age=20` filters age >= 20. |
| `GET` | `/students/{student_id}` | Get one student. Returns 404 if not found. |
| `PATCH` | `/students/{student_id}` | Partial update. Body: any subset of `name`, `email`, `age`. |
| `DELETE` | `/students/{student_id}` | Delete a student. Returns 204. |
| `GET` | `/students/{student_id}/course-count` | Returns `{"student_id": int, "course_count": int}`. Uses `func.count(Course.id)` SQLAlchemy aggregate. |

### Courses

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/courses/` | Create enrollment. Body: `{"course_name": str, "credits": int (1-6), "student_id": int}`. Returns 201. |
| `GET` | `/courses/` | List all courses. |
| `GET` | `/courses/{course_id}` | Get one course. Returns 404 if not found. |
| `PATCH` | `/courses/{course_id}` | Partial update. |
| `DELETE` | `/courses/{course_id}` | Delete a course. Returns 204. |

### Algorithms (Part 2)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/students/sorted?by=age` | Students sorted ascending by age (default) or `by=name`. Uses hand-rolled Insertion Sort. |
| `GET` | `/students/search?name=<exact name>` | Binary search on name-sorted roster. Returns 404 if not found. |
| `GET` | `/students/report?min_age=21` | Returns `{"report": "<multiline string>", "count_meeting_min_age": int}`. |

### AI Assistant (Part 3)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/assistant/summarize` | Body: `{"text": "<raw notes>"}`. Returns `{"topic", "key_points", "difficulty"}`. |
| `GET` | `/assistant/search?query=<text>` | Returns notes ranked by cosine similarity score descending. |

---

## Using the Dashboard

### Viewing the Roster

On page load, the dashboard fetches `GET /students/` and renders one card per student showing name, email, and age.

### Editing a Student's Age

1. Change the age in the number input on a student card.
2. Click **Save Age** — sends `PATCH /students/{id}` with `{"age": newAge}`.
3. The displayed age updates on success.

Example response:
```json
{"id": 1, "name": "Aditi Rao", "email": "aditi.rao@example.com", "age": 23}
```

### Adding a Student

1. Fill in name, email, and age in the form.
2. Click **Add Student** — sends `POST /students/` with the form data.
3. A new card appears immediately without page reload.

### Deleting a Student

Click **Delete** on a card — sends `DELETE /students/{id}` and removes the card from the DOM.

### AI Helper — Summarize

1. Paste notes into the textarea.
2. Click **Summarize** — sends `POST /assistant/summarize`.
3. Topic, difficulty, and key points render below.

Example request/response:
```
POST /assistant/summarize
{"text": "Binary search basics. It needs a sorted array. Compare midpoint each step."}

Response:
{
  "topic": "Binary search basics",
  "key_points": ["Binary search basics", "It needs a sorted array", "Compare midpoint each step"],
  "difficulty": "easy"
}
```

### AI Helper — Search Notes

1. Enter a query (e.g. `binary search algorithm`).
2. Click **Search Notes** — sends `GET /assistant/search?query=...`.
3. Ranked results with similarity scores appear below.

Example:
```
GET /assistant/search?query=binary%20search%20algorithm

Response (note id 1 ranked first):
[
  {"id": 1, "text": "Binary search requires a sorted array...", "score": 0.816497},
  ...
]
```

### Course Count Demo

Enroll a student in 2+ courses, then call:
```
GET /students/1/course-count
```
Returns the count computed via `db.query(func.count(Course.id)).filter(Course.student_id == student_id).scalar()` — a SQLAlchemy aggregate, not Python `len()`.

---

## Part 2 — Algorithm Examples

### Sorted by Age
```
GET /students/sorted?by=age
```
Returns: Farhan Sheikh (18), Rohan Mehta (19), Meera Joshi (20), Priya Iyer (21), Aditi Rao (22), Devansh Gupta (23), Sameer Khan (24), Kavya Nair (25).

### Search by Name
```
GET /students/search?name=Priya%20Iyer
```
Returns Priya Iyer's record (index 5 in alphabetical order).

### Roster Report
```
GET /students/report?min_age=21
```
Returns `count_meeting_min_age: 5` (Aditi Rao, Kavya Nair, Priya Iyer, Devansh Gupta, Sameer Khan).

### Complexity Analysis

Insertion Sort has a worst-case time complexity of O(n²) because when the input is in reverse order, each of the n−1 elements must be shifted through all previously placed elements in the inner while loop, giving roughly n²/2 comparisons and shifts. Its best case is O(n) when the data is already sorted: the inner while loop never executes (each element is already in place), so only n−1 comparisons occur with no shifts. Binary Search requires the list to be sorted by the field being searched because it eliminates half the remaining range based on whether the midpoint value is less than or greater than the target; if the list is unsorted, the midpoint comparison gives no reliable information about which half contains the target, and the algorithm would miss the answer.

---

## Part 3 — AI Assistant Details

### Mode

**Mock mode** (default) is used for grading demonstration. No API key or network access is required. Set `AI_MODE=mock` in `.env` or leave unset.

### Summarize Rules

- **Topic**: First non-empty line of the input text.
- **Key points**: Up to 3 sentences split on `.`, `!`, or `?`.
- **Difficulty**: `< 40` words → `"easy"`, `40–100` words → `"medium"`, `> 100` words → `"hard"`.
- **Empty input**: topic = `"untitled"`, key_points = `[]`, difficulty = `"easy"`.

### Real LLM Prompt (if AI_MODE=real)

```
You are a study-notes summarizer. Given raw study notes, extract structured information.

Task: Analyze the provided study notes and return a JSON summary.

Context: The notes are from a computer science trainee's study session.

Constraints:
- Return ONLY valid JSON with exactly three keys: "topic", "key_points", "difficulty"
- topic: a short title derived from the first line or main theme
- key_points: an array of up to 3 key sentences from the notes
- difficulty: one of "easy", "medium", or "hard" based on word count (< 40 = easy, 40-100 = medium, > 100 = hard)

Output format:
{"topic": "...", "key_points": ["...", "..."], "difficulty": "easy|medium|hard"}

Notes:
{text}
```

### Embedding

`mock_embed` uses a fixed 12-word vocabulary: sort, search, binary, insertion, sql, join, fastapi, pydantic, prompt, llm, database, validate. Tokenization lowercases input and splits on non-alphanumeric characters. Exact whole-token matches only.

### Cosine Similarity

Implemented from first principles: dot product divided by product of L2 magnitudes. Returns 0.0 if either vector has zero magnitude (no division by zero).

---

## CORS

CORSMiddleware allows `http://localhost:5500` explicitly (never uses wildcard `*`).

---

## Git Workflow

This repository includes a feature branch (`feature/algorithms-ai`) that was created, committed to at least twice, and merged back into `main`. View history with:

```bash
git log --graph --all
```
