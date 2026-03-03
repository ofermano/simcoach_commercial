"""Admin endpoints: list/approve/deny whitelist applications. Super admin only."""
from datetime import datetime

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import sqlalchemy as sa
from pydantic import BaseModel

from app.database import get_db
from app.schemas.whitelist import WhitelistApplicationResponse
from app.services.whitelist_service import (
    get_pending_applications,
    approve_application,
    deny_application,
)
from app.api.dependencies import get_current_super_admin
from app.core.email import send_whitelist_approved_email
from app.models.super_admin import SuperAdmin
from app.models.user import User
from app.models.questionnaire import QuestionnaireResponse
from app.models.whitelist import WhitelistApplication, WhitelistStatus

router = APIRouter(prefix="/admin", tags=["admin"])


class ApproveDenyResponse(BaseModel):
    success: bool
    message: str


class AdminQuestionnaireUser(BaseModel):
    user_id: int
    email: str
    display_name: str | None
    drivingLevel: str
    goal: str
    drivingStyle: str
    latestAt: datetime


class AdminQuestionnaireItem(BaseModel):
    displayName: str
    drivingLevel: str
    goal: str
    drivingStyle: str
    createdAt: datetime


class AdminQuestionnaireDetail(BaseModel):
    user_id: int
    email: str
    display_name: str | None
    responses: list[AdminQuestionnaireItem]


class PaginatedWhitelistApplications(BaseModel):
    items: list[WhitelistApplicationResponse]
    total: int
    page: int
    page_size: int


class AdminQuestionnaireUsersPage(BaseModel):
    items: list[AdminQuestionnaireUser]
    total: int
    page: int
    page_size: int


@router.get("/whitelist/applications", response_model=PaginatedWhitelistApplications)
async def list_pending(
    db: AsyncSession = Depends(get_db),
    _: SuperAdmin = Depends(get_current_super_admin),
    page: int = 1,
    page_size: int = 25,
):
    """List pending whitelist applications with pagination."""
    if page < 1:
        page = 1
    if page_size < 1 or page_size > 100:
        page_size = 25

    base_query = select(WhitelistApplication).where(
        WhitelistApplication.status == WhitelistStatus.PENDING.value
    )
    total_result = await db.execute(
        select(sa.func.count()).select_from(base_query.subquery())
    )
    total = total_result.scalar() or 0

    result = await db.execute(
        base_query.order_by(WhitelistApplication.applied_at.asc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    apps = result.scalars().all()
    items = [
        WhitelistApplicationResponse(
            id=a.id,
            email=a.email,
            status=a.status,
            applied_at=a.applied_at,
        )
        for a in apps
    ]
    return PaginatedWhitelistApplications(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("/whitelist/applications/{application_id}/approve", response_model=ApproveDenyResponse)
async def approve(
    application_id: int,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    _: SuperAdmin = Depends(get_current_super_admin),
):
    """Approve a whitelist application. Sends signup email to the user."""
    success, message, email, signup_link = await approve_application(db, application_id)
    if not success:
        raise HTTPException(status_code=400, detail=message)
    if email and signup_link:
        background_tasks.add_task(send_whitelist_approved_email, email, signup_link)
    return ApproveDenyResponse(success=True, message=message)


@router.post("/whitelist/applications/{application_id}/deny", response_model=ApproveDenyResponse)
async def deny(
    application_id: int,
    db: AsyncSession = Depends(get_db),
    _: SuperAdmin = Depends(get_current_super_admin),
):
    """Deny a whitelist application."""
    success, message = await deny_application(db, application_id)
    if not success:
        raise HTTPException(status_code=400, detail=message)
    return ApproveDenyResponse(success=True, message=message)


@router.get("/questionnaires/users", response_model=AdminQuestionnaireUsersPage)
async def list_questionnaire_users(
    db: AsyncSession = Depends(get_db),
    _: SuperAdmin = Depends(get_current_super_admin),
    page: int = 1,
    page_size: int = 25,
):
    """
    List users who have at least one questionnaire response, including their latest answers.
    Keeps one entry per user with latest response.
    """
    if page < 1:
        page = 1
    if page_size < 1 or page_size > 100:
        page_size = 25

    # Total distinct users with questionnaire responses
    total_result = await db.execute(
        select(sa.func.count(sa.distinct(QuestionnaireResponse.user_id)))
    )
    total = total_result.scalar() or 0

    # Latest response per user, ordered by latest created_at
    subq = (
        select(
            QuestionnaireResponse.user_id.label("user_id"),
            sa.func.max(QuestionnaireResponse.created_at).label("latest_at"),
        )
        .group_by(QuestionnaireResponse.user_id)
        .subquery()
    )

    query = (
        select(QuestionnaireResponse, User, subq.c.latest_at)
        .join(
            subq,
            sa.and_(
                QuestionnaireResponse.user_id == subq.c.user_id,
                QuestionnaireResponse.created_at == subq.c.latest_at,
            ),
        )
        .join(User, User.id == QuestionnaireResponse.user_id)
        .order_by(subq.c.latest_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )

    result = await db.execute(query)
    rows = result.all()
    items: list[AdminQuestionnaireUser] = []
    for qr, user, latest_at in rows:
        items.append(
            AdminQuestionnaireUser(
                user_id=user.id,
                email=user.email,
                display_name=getattr(user, "display_name", None),
                drivingLevel=qr.driving_level,
                goal=qr.goal,
                drivingStyle=qr.driving_style,
                latestAt=latest_at,
            )
        )

    return AdminQuestionnaireUsersPage(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/questionnaires/{user_id}", response_model=AdminQuestionnaireDetail)
async def get_questionnaire_detail(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    _: SuperAdmin = Depends(get_current_super_admin),
):
    """Return full questionnaire history for a given user."""
    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    q_result = await db.execute(
        select(QuestionnaireResponse)
        .where(QuestionnaireResponse.user_id == user_id)
        .order_by(QuestionnaireResponse.created_at.desc())
    )
    responses = [
        AdminQuestionnaireItem(
            displayName=qr.display_name,
            drivingLevel=qr.driving_level,
            goal=qr.goal,
            drivingStyle=qr.driving_style,
            createdAt=qr.created_at,
        )
        for qr in q_result.scalars().all()
    ]
    return AdminQuestionnaireDetail(
        user_id=user.id,
        email=user.email,
        display_name=getattr(user, "display_name", None),
        responses=responses,
    )
