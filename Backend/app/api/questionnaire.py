"""Driver questionnaire: save and fetch calibration profile (with history)."""
from fastapi import APIRouter, Depends
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user
from app.database import get_db
from app.models.user import User
from app.models.questionnaire import QuestionnaireResponse
from app.schemas.questionnaire import (
    QuestionnaireSubmitRequest,
    QuestionnaireStatusResponse,
    QuestionnaireStatusLatest,
)

router = APIRouter(prefix="/questionnaire", tags=["questionnaire"])


@router.get("", response_model=QuestionnaireStatusResponse)
async def get_status(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return whether the current user has completed the questionnaire and their latest answers."""
    result = await db.execute(
        select(QuestionnaireResponse)
        .where(QuestionnaireResponse.user_id == current_user.id)
        .order_by(desc(QuestionnaireResponse.created_at))
        .limit(1)
    )
    latest = result.scalar_one_or_none()
    if not latest:
        return QuestionnaireStatusResponse(hasCompleted=False, latest=None)
    return QuestionnaireStatusResponse(
        hasCompleted=True,
        latest=QuestionnaireStatusLatest(
            displayName=latest.display_name,
            drivingLevel=latest.driving_level,
            goal=latest.goal,
            drivingStyle=latest.driving_style,
            createdAt=latest.created_at,
        ),
    )


@router.post("", response_model=dict)
async def submit_questionnaire(
    body: QuestionnaireSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Store a new questionnaire response for the current user and update their display name.
    Keeps full history by inserting a new row each time.
    """
    latest = QuestionnaireResponse(
        user_id=current_user.id,
        display_name=body.displayName.strip(),
        driving_level=body.drivingLevel,
        goal=body.goal,
        driving_style=body.drivingStyle,
    )
    db.add(latest)
    # Update user profile display name
    current_user_display = body.displayName.strip()
    if current_user_display:
        current_user.display_name = current_user_display
    await db.flush()
    return {"success": True}

