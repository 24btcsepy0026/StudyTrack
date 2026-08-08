from sqlalchemy.orm import Session

from models import Student, Course

SEED_STUDENTS = [
    {"name": "Aditi Rao", "email": "aditi.rao@example.com", "age": 22},
    {"name": "Rohan Mehta", "email": "rohan.mehta@example.com", "age": 19},
    {"name": "Kavya Nair", "email": "kavya.nair@example.com", "age": 25},
    {"name": "Farhan Sheikh", "email": "farhan.sheikh@example.com", "age": 18},
    {"name": "Priya Iyer", "email": "priya.iyer@example.com", "age": 21},
    {"name": "Devansh Gupta", "email": "devansh.gupta@example.com", "age": 23},
    {"name": "Meera Joshi", "email": "meera.joshi@example.com", "age": 20},
    {"name": "Sameer Khan", "email": "sameer.khan@example.com", "age": 24},
]

SEED_COURSES = [
    {"course_name": "Data Structures & Algorithms", "credits": 4, "student_id": 1},
    {"course_name": "FastAPI & Modern Web APIs", "credits": 3, "student_id": 1},
    {"course_name": "Relational Databases & SQL", "credits": 4, "student_id": 2},
    {"course_name": "Frontend Engineering with JS", "credits": 3, "student_id": 3},
    {"course_name": "Applied Machine Learning", "credits": 5, "student_id": 3},
    {"course_name": "Cloud Computing & DevOps", "credits": 3, "student_id": 4},
    {"course_name": "System Design Principles", "credits": 4, "student_id": 5},
    {"course_name": "Artificial Intelligence Basics", "credits": 4, "student_id": 6},
]


def seed_if_empty(db: Session):
    if db.query(Student).count() == 0:
        for student_data in SEED_STUDENTS:
            db.add(Student(**student_data))
        db.commit()

    if db.query(Course).count() == 0:
        for course_data in SEED_COURSES:
            db.add(Course(**course_data))
        db.commit()
