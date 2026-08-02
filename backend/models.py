from sqlalchemy import Column, Integer, String, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship

from database import Base


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    age = Column(Integer, nullable=False)

    courses = relationship("Course", back_populates="student")


class Course(Base):
    __tablename__ = "courses"
    __table_args__ = (
        CheckConstraint("credits >= 1 AND credits <= 6", name="credits_range"),
    )

    id = Column(Integer, primary_key=True, index=True)
    course_name = Column(String, nullable=False)
    credits = Column(Integer, nullable=False)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)

    student = relationship("Student", back_populates="courses")
