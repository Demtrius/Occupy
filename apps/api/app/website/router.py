from pathlib import Path

from fastapi import APIRouter, Form, Request, Depends
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.ext.asyncio import AsyncSession

from ..api.deps import get_db
from app.schemas.feedback import FeedbackCreate
from app.models.feedback import Feedback
from app.models.enums import FeedbackType

router = APIRouter()
templates = Jinja2Templates(directory=Path(__file__).parent.joinpath("templates"))


@router.get("/", response_class=HTMLResponse, name="home")
async def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@router.get("/feedback", response_class=HTMLResponse, name="feedback")
async def feedback(request: Request):
    return templates.TemplateResponse("feedback.html", {"request": request})


@router.post("/feedback")
async def submit_feedback(
    db: AsyncSession = Depends(get_db),
    name: str = Form(...),
    email: str = Form(...),
    message: str = Form(...),
    feedback_type: str = Form(...),
):
    feedback = FeedbackCreate(
        name=name,
        email=email,
        message=message,
        feedback_type=feedback_type,
    )
    db_feedback = Feedback(**feedback.model_dump())
    db.add(db_feedback)
    await db.commit()
    return RedirectResponse(url="/success", status_code=303)


@router.get("/beta", response_class=HTMLResponse, name="beta_application")
async def beta_application(request: Request):
    return templates.TemplateResponse("beta_application.html", {"request": request})


@router.post("/beta")
async def submit_beta_application(
    db: AsyncSession = Depends(get_db),
    name: str = Form(...),
    email: str = Form(...),
):
    feedback = FeedbackCreate(
        name=name,
        email=email,
        message="",
        feedback_type=FeedbackType.BETA_APPLICATION,
    )
    db_feedback = Feedback(**feedback.model_dump())
    db.add(db_feedback)
    await db.commit()
    return RedirectResponse(url="/beta-success", status_code=303)


@router.get("/success", response_class=HTMLResponse, name="success")
async def success(request: Request):
    return templates.TemplateResponse("success.html", {"request": request})


@router.get(
    "/beta-success", response_class=HTMLResponse, name="beta_application_success"
)
async def beta_success(request: Request):
    return templates.TemplateResponse(
        "beta_application_success.html", {"request": request}
    )
