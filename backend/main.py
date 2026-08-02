import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import Response
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from database import engine, SessionLocal, Base
from seed_data import seed_if_empty
import crud
import schemas
from algorithms import (
    insertion_sort_by_field,
    binary_search_by_name,
    format_roster_report,
    count_students_meeting_min_age,
)
from ai_service import summarize_notes, search_notes

Base.metadata.create_all(bind=engine)

FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"


@asynccontextmanager
async def lifespan(app: FastAPI):
    db = SessionLocal()
    try:
        seed_if_empty(db)
    finally:
        db.close()
    yield


app = FastAPI(title="StudyTrack", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5500"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def student_to_dict(student) -> dict:
    return {
        "id": student.id,
        "name": student.name,
        "email": student.email,
        "age": student.age,
    }


# --- Student CRUD ---

@app.post("/students/", response_model=schemas.StudentRead, status_code=201)
def create_student(student: schemas.StudentCreate, db: Session = Depends(get_db)):
    try:
        return crud.create_student(db, student)
    except IntegrityError:
        raise HTTPException(status_code=409, detail="Email already registered")


@app.get("/students/", response_model=list[schemas.StudentRead])
def list_students(
    min_age: int | None = None, db: Session = Depends(get_db)
):
    return crud.get_students(db, min_age=min_age)


@app.get("/students/sorted")
def get_students_sorted(
    by: str = Query(default="age", pattern="^(age|name)$"),
    db: Session = Depends(get_db),
):
    students = crud.get_students(db)
    student_dicts = [student_to_dict(s) for s in students]
    insertion_sort_by_field(student_dicts, by)
    return student_dicts


@app.get("/students/search", response_model=schemas.StudentRead)
def search_student_by_name(
    name: str = Query(...), db: Session = Depends(get_db)
):
    students = crud.get_students(db)
    student_dicts = [student_to_dict(s) for s in students]
    sorted_list = sorted(student_dicts, key=lambda s: s["name"])
    result = binary_search_by_name(sorted_list, name)
    if result == -1:
        raise HTTPException(status_code=404, detail="Student not found")
    return result


@app.get("/students/report")
def get_roster_report(
    min_age: int = Query(default=21), db: Session = Depends(get_db)
):
    students = crud.get_students(db)
    student_dicts = [student_to_dict(s) for s in students]
    report = format_roster_report(student_dicts)
    count = count_students_meeting_min_age(student_dicts, min_age)
    return {"report": report, "count_meeting_min_age": count}


@app.get("/students/{student_id}", response_model=schemas.StudentRead)
def get_student(student_id: int, db: Session = Depends(get_db)):
    student = crud.get_student(db, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student


@app.get("/students/{student_id}/course-count")
def get_student_course_count(student_id: int, db: Session = Depends(get_db)):
    student = crud.get_student(db, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    count = crud.get_student_course_count(db, student_id)
    return {"student_id": student_id, "course_count": count}


@app.patch("/students/{student_id}", response_model=schemas.StudentRead)
def update_student(
    student_id: int,
    student: schemas.StudentUpdate,
    db: Session = Depends(get_db),
):
    try:
        updated = crud.update_student(db, student_id, student)
    except IntegrityError:
        raise HTTPException(status_code=409, detail="Email already registered")
    if not updated:
        raise HTTPException(status_code=404, detail="Student not found")
    return updated


@app.delete("/students/{student_id}", status_code=204)
def delete_student(student_id: int, db: Session = Depends(get_db)):
    if not crud.delete_student(db, student_id):
        raise HTTPException(status_code=404, detail="Student not found")
    return Response(status_code=204)


# --- Course CRUD ---

@app.post("/courses/", response_model=schemas.CourseRead, status_code=201)
def create_course(course: schemas.CourseCreate, db: Session = Depends(get_db)):
    student = crud.get_student(db, course.student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return crud.create_course(db, course)


@app.get("/courses/", response_model=list[schemas.CourseRead])
def list_courses(db: Session = Depends(get_db)):
    return crud.get_courses(db)


@app.get("/courses/{course_id}", response_model=schemas.CourseRead)
def get_course(course_id: int, db: Session = Depends(get_db)):
    course = crud.get_course(db, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course


@app.patch("/courses/{course_id}", response_model=schemas.CourseRead)
def update_course(
    course_id: int,
    course: schemas.CourseUpdate,
    db: Session = Depends(get_db),
):
    updated = crud.update_course(db, course_id, course)
    if not updated:
        raise HTTPException(status_code=404, detail="Course not found")
    return updated


@app.delete("/courses/{course_id}", status_code=204)
def delete_course(course_id: int, db: Session = Depends(get_db)):
    if not crud.delete_course(db, course_id):
        raise HTTPException(status_code=404, detail="Course not found")
    return Response(status_code=204)


# --- AI Assistant ---

@app.post("/assistant/summarize")
def summarize_endpoint(request: schemas.SummarizeRequest):
    return summarize_notes(request.text)


@app.get("/assistant/search")
def search_endpoint(query: str = Query(default="")):
    return search_notes(query)


# --- Static files (single-process mode) ---

app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="static")
