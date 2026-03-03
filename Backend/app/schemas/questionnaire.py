"""Questionnaire schemas."""
from datetime import datetime
from pydantic import BaseModel


class QuestionnaireBase(BaseModel):
    displayName: str
    drivingLevel: str
    goal: str
    drivingStyle: str


class QuestionnaireSubmitRequest(QuestionnaireBase):
    """Driver submits questionnaire / profile calibration."""


class QuestionnaireStatusLatest(QuestionnaireBase):
    createdAt: datetime


class QuestionnaireStatusResponse(BaseModel):
    hasCompleted: bool
    latest: QuestionnaireStatusLatest | None = None

