from sqlalchemy.orm import Session
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError

from models import Student, Course
import schemas


def get_students(db: Session, min_age: int | None = None):
    query = db.query(Student)
    if min_age is not None:
        query = query.filter(Student.age >= min_age)
    return query.all()


def get_student(db: Session, student_id: int):
    return db.query(Student).filter(Student.id == student_id).first()


def create_student(db: Session, student: schemas.StudentCreate):
    db_student = Student(
        name=student.name, email=student.email, age=student.age
    )
    db.add(db_student)
    try:
        db.commit()
        db.refresh(db_student)
    except IntegrityError:
        db.rollback()
        raise
    return db_student


def update_student(db: Session, student_id: int, student: schemas.StudentUpdate):
    db_student = get_student(db, student_id)
    if not db_student:
        return None
    update_data = student.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_student, field, value)
    try:
        db.commit()
        db.refresh(db_student)
    except IntegrityError:
        db.rollback()
        raise
    return db_student


def delete_student(db: Session, student_id: int):
    db_student = get_student(db, student_id)
    if not db_student:
        return False
    db.delete(db_student)
    db.commit()
    return True


def get_student_course_count(db: Session, student_id: int):
    return (
        db.query(func.count(Course.id))
        .filter(Course.student_id == student_id)
        .scalar()
    )


def get_courses(db: Session):
    return db.query(Course).all()


def get_course(db: Session, course_id: int):
    return db.query(Course).filter(Course.id == course_id).first()


def create_course(db: Session, course: schemas.CourseCreate):
    db_course = Course(
        course_name=course.course_name,
        credits=course.credits,
        student_id=course.student_id,
    )
    db.add(db_course)
    db.commit()
    db.refresh(db_course)
    return db_course


def update_course(db: Session, course_id: int, course: schemas.CourseUpdate):
    db_course = get_course(db, course_id)
    if not db_course:
        return None
    update_data = course.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_course, field, value)
    db.commit()
    db.refresh(db_course)
    return db_course


def delete_course(db: Session, course_id: int):
    db_course = get_course(db, course_id)
    if not db_course:
        return False
    db.delete(db_course)
    db.commit()
    return True
