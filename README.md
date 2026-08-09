# StudyTrack — Unified Full-Stack Student Management Platform

StudyTrack is a complete, single-process, full-stack application built for the Myntra Trainee Enablement team. It provides a unified dashboard to manage student rosters, assign courses, run custom algorithms for sorting and searching, and use an integrated AI assistant.

## Run Mode
This project uses **Single-Process Run Mode**. The FastAPI backend automatically mounts and serves the `frontend/` directory as static files at `/`. All API calls from the frontend use relative paths.

## Setup & Running Instructions

### 1. Prerequisites
- Python 3.10+
- `pip` (Python package installer)

### 2. Environment Setup
Create a virtual environment and install dependencies:
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

Copy the `.env.example` file to `.env`:
```bash
cp .env.example .env
```

### 3. Run the Application & Seeding
To run the application, use Uvicorn:
```bash
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```
**Seeding:** The application uses a FastAPI `lifespan` handler to automatically call `seed_if_empty(db)`. If the `Student` table is empty upon startup, it inserts the exact seeded roster from `seed_data.py`. 

Open your browser and navigate to: **http://127.0.0.1:8000/**

## API Endpoints Documentation

| Method | Path | Request Body Shape | Response Shape |
|--------|------|--------------------|----------------|
| GET | `/students/` | None (Optional `?min_age=N`) | `[ {id, name, email, age} ]` |
| GET | `/students/{id}` | None | `{id, name, email, age}` |
| POST | `/students/` | `{"name": str, "email": str, "age": int}` | `{id, name, email, age}` |
| PATCH | `/students/{id}` | `{"name": str, "email": str, "age": int}` (Optional fields) | `{id, name, email, age}` |
| DELETE | `/students/{id}` | None | 204 No Content |
| GET | `/students/{id}/course-count` | None | `{"count": int}` |
| GET | `/courses/` | None (Optional `?student_id=N`) | `[ {id, course_name, credits, student_id} ]` |
| GET | `/courses/{id}` | None | `{id, course_name, credits, student_id}` |
| POST | `/courses/` | `{"course_name": str, "credits": int, "student_id": int}` | `{id, course_name, credits, student_id}` |
| PATCH | `/courses/{id}` | `{"course_name": str, "credits": int}` (Optional fields) | `{id, course_name, credits, student_id}` |
| DELETE | `/courses/{id}` | None | 204 No Content |
| GET | `/students/sorted?by=age` | None | `[ {id, name, email, age} ]` |
| GET | `/students/search?name=exact`| None | `{id, name, email, age}` |
| GET | `/students/report?min_age=N` | None | `{"report": str, "count_meeting_min_age": int}` |
| POST | `/assistant/summarize` | `{"text": str}` | `{"topic": str, "key_points": list, "difficulty": str}` |
| GET | `/assistant/search?query=str`| None | `[ {"id": int, "text": str, "score": float} ]` |

*Note: The `/students/{student_id}/course-count` endpoint uses a SQLAlchemy `db.query(func.count(models.Course.id)).filter(...)` aggregate call to count the courses at the database level.*

## End-to-End Walkthrough

1. **Opening the Dashboard:** Open `http://127.0.0.1:8000/`. You will see the seeded roster load automatically.
   - *Backend Log:* `INFO: 127.0.0.1:52132 - "GET /students/ HTTP/1.1" 200 OK`
2. **Editing a Student's Age:** On the first card, change the age input to 25 and click "Save Age".
   - *Backend Log:* `INFO: 127.0.0.1:52132 - "PATCH /students/1 HTTP/1.1" 200 OK`
   - *Response:* `{"name":"Aditi Rao","email":"aditi.rao@example.com","age":25,"id":1}`
3. **Adding a Student:** Use the form to submit Name: "Rahul", Email: "rahul@example.com", Age: 22. Click "Add Student".
   - *Backend Log:* `INFO: 127.0.0.1:52132 - "POST /students/ HTTP/1.1" 201 Created`
   - *Response:* `{"name":"Rahul","email":"rahul@example.com","age":22,"id":9}`
4. **Deleting a Student:** Click the red "Delete" button on Rahul's card. The card immediately disappears.
   - *Backend Log:* `INFO: 127.0.0.1:52132 - "DELETE /students/9 HTTP/1.1" 204 No Content`
5. **Using Algorithms:**
   - **Sort/Search:** Click "Run Insertion Sort" to see the roster sorted. Enter a name in Binary Search and see the exact match pop up.
   - **AI Helper:** Paste study notes into the Summarizer box and click "Summarize" to see the extracted JSON properties rendered on-screen.

## Part 2: Complexity Write-up

### Insertion Sort (`insertion_sort_by_field`)
- **Time Complexity:** 
  - **Best Case:** O(n) when the list is already sorted, because the inner `while` loop condition fails immediately and no elements need shifting.
  - **Worst Case:** O(n^2) when the list is in reverse order, as each element must be compared and shifted across the entire previously sorted portion.
- **Space Complexity:** O(1) as the sorting is performed in-place by swapping/shifting elements, requiring no additional memory proportional to the input size.

### Binary Search (`binary_search_by_name`)
- **Time Complexity:** O(log n) because the search space is divided in half during each iteration.
- **Space Complexity:** O(1) as the algorithm operates iteratively.
- **Why it requires a sorted list:** Binary search relies on the property that comparing the target to the midpoint allows the algorithm to eliminate half of the remaining elements. If the list is unsorted, there is no mathematical guarantee that elements smaller than the midpoint are to its left and larger elements are to its right, making the elimination logic fail.

## Part 3: Integrated AI Assistant

**Grading Mode Declaration:** The `mock` mode was exclusively used for grading demonstration. It operates completely offline, is deterministic, and no API key is committed anywhere in this repository.

**LLM Prompt Design:**
If `AI_MODE=real` were used with a genuine LLM (e.g., OpenAI gpt-3.5-turbo), the exact system prompt sent to get the structured JSON shape would be:

```text
You are an expert study assistant. Your task is to summarize the user's raw study notes.
Context: We need to categorize study materials for a Trainee Enablement dashboard.
Constraints: 
1. Your response MUST be exactly a valid JSON object with no extra markdown or conversational text.
2. The JSON must contain exactly these three keys: "topic", "key_points", "difficulty".
Format Instructions:
- "topic": (string) A concise 2-4 word title for the notes.
- "key_points": (list of strings) Up to 3 important sentences summarizing the core concepts.
- "difficulty": (string) Choose either "easy", "medium", or "hard" based on how dense the notes are.
```
