from fastapi import APIRouter, HTTPException, status
from app.models import IProject
from app.supabase_client import get_supabase

router = APIRouter(prefix="/api/v1/projects", tags=["projects"])


@router.get("")
def get_projects():
    sb = get_supabase()
    result = sb.table("projects").select("*").order("created_at", desc=True).execute()
    return result.data


@router.get("/{project_id}")
def get_project(project_id: str):
    sb = get_supabase()
    result = sb.table("projects").select("*").eq("id", project_id).execute()
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Проект не найден")
    return result.data[0]


@router.post("", status_code=status.HTTP_201_CREATED)
def create_project(body: IProject):
    sb = get_supabase()
    data = body.model_dump(exclude={"id"}, exclude_none=True)
    result = sb.table("projects").insert(data).execute()
    return result.data[0]


@router.put("/{project_id}")
def update_project(project_id: str, body: IProject):
    sb = get_supabase()
    data = body.model_dump(exclude={"id"}, exclude_none=True)
    result = sb.table("projects").update(data).eq("id", project_id).execute()
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Проект не найден")
    return result.data[0]


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: str):
    sb = get_supabase()
    sb.table("projects").delete().eq("id", project_id).execute()
