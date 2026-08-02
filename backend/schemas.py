from pydantic import BaseModel, Field, field_validator
from typing import Optional, List


class StudentCreate(BaseModel):
    name: str
    email: str
    age: int = Field(gt=0)

    @field_validator("email")
    @classmethod
    def email_must_contain_at(cls, v: str) -> str:
        if "@" not in v:
            raise ValueError("Email must contain an @ character")
        return v


class StudentUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    age: Optional[int] = Field(default=None, gt=0)

    @field_validator("email")
    @classmethod
    def email_must_contain_at(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and "@" not in v:
            raise ValueError("Email must contain an @ character")
        return v


class StudentRead(BaseModel):
    id: int
    name: str
    email: str
    age: int

    model_config = {"from_attributes": True}


class CourseCreate(BaseModel):
    course_name: str
    credits: int = Field(ge=1, le=6)
    student_id: int


class CourseUpdate(BaseModel):
    course_name: Optional[str] = None
    credits: Optional[int] = Field(default=None, ge=1, le=6)
    student_id: Optional[int] = None


class CourseRead(BaseModel):
    id: int
    course_name: str
    credits: int
    student_id: int

    model_config = {"from_attributes": True}


class SummarizeRequest(BaseModel):
    text: str
