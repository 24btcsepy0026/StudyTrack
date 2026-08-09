# StudyTrack — Unified Full-Stack Student Management Platform

StudyTrack is a complete, full-stack application built for the Myntra Trainee Enablement team. It provides a unified dashboard to manage student rosters, assign courses, run custom algorithms for sorting and searching, and use an integrated AI assistant to summarize study notes and find related materials.

The frontend is served directly by the FastAPI backend, making it a "single running application" that seamlessly connects the UI to the database and algorithms engine.

## Setup Instructions

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

### 3. Environment Variables
Copy the `.env.example` file to `.env`:
```bash
cp .env.example .env
```
By default, `AI_MODE` is set to `mock`, which allows the AI features to work immediately without requiring an OpenAI API key.

## Running the Application

This project runs in **Single-Process Run Mode**. The FastAPI backend automatically serves the frontend static files.

Run the application using Uvicorn:
```bash
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```
Then, open your web browser and navigate to: **http://127.0.0.1:8000/**

## How to Use Every Feature

### Roster CRUD & Course Relations (Part 1)
- **Add Student:** Use the form at the top to add a new student. They will instantly appear in the Roster.
- **Assign Course:** In the Course Catalog section, select a student and assign them a course (like DSA or DBMS). The student's Total Credits will update on their roster card.
- **Filter Students:** Use the minimum age filter above the roster list to dynamically filter the displayed students.
- **Delete Student/Course:** Click the red "Delete" button on a student card or a course card to remove them from the database.

### Integrated Algorithms Engine (Part 2)
- **Sort Algorithm (Insertion Sort):** In the Algorithms section, select a field (Age or Name) and click "Run Insertion Sort". This uses a custom backend algorithm to sort the roster and displays it in a table.
- **Search Algorithm (Binary Search):** Enter an exact student name and click "Binary Search". The backend runs O(log n) binary search on a pre-sorted list to find the student in milliseconds.
- **Roster Summary Report:** Enter a minimum age and click "Generate Report". It uses an explicit loop accumulator to count students meeting the threshold and generates a formatted multi-line summary.

### AI Assistant (Part 3)
- **Summarize Notes:** Paste any study notes into the text area and click "Summarize". The backend AI module will process the text and return a concise summary and topic tags.
- **Find Related Material:** Enter a topic (e.g., "Machine Learning") to receive a generated list of helpful links and study resources.

## Part 2 Complexity Write-up

### Insertion Sort (`insertion_sort_by_field`)
- **Time Complexity:** 
  - **Best Case:** O(n) when the list is already sorted.
  - **Average/Worst Case:** O(n^2) when the list is in reverse order, as each element must be compared and shifted across the entire sorted portion.
- **Space Complexity:** O(1) as the sorting is performed in-place by swapping elements, requiring no additional memory proportional to the input size.

### Binary Search (`binary_search_by_name`)
- **Time Complexity:** O(log n) because the search space is divided in half during each iteration, significantly outperforming linear search for large datasets.
- **Space Complexity:** O(1) as the algorithm operates iteratively using a few pointers (`low`, `high`, `mid`), avoiding recursion stack overhead.
- **Constraint:** Requires the input list to be pre-sorted alphabetically by name to function correctly.
