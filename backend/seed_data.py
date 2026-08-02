from sqlalchemy.orm import Session

from models import Student

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


def seed_if_empty(db: Session):
    if db.query(Student).count() == 0:
        for student_data in SEED_STUDENTS:
            db.add(Student(**student_data))
        db.commit()
