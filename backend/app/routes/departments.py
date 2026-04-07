from fastapi import APIRouter, Depends, HTTPException, status
from app.auth import get_current_user
from app.models import IDepartment
from app.supabase_client import get_supabase

router = APIRouter(prefix="/api/v1/departments", tags=["departments"])


@router.get("")
def get_departments(user: dict = Depends(get_current_user)):
    sb = get_supabase()
    result = sb.table("departments").select("*").execute()
    return result.data


@router.post("", status_code=status.HTTP_201_CREATED)
def create_department(body: IDepartment, user: dict = Depends(get_current_user)):
    sb = get_supabase()
    data = body.model_dump(exclude={"id"}, exclude_none=True)
    result = sb.table("departments").insert(data).execute()
    return result.data[0]


@router.put("/{department_id}")
def update_department(department_id: str, body: IDepartment, user: dict = Depends(get_current_user)):
    sb = get_supabase()
    data = body.model_dump(exclude={"id"}, exclude_none=True)
    result = sb.table("departments").update(data).eq("id", department_id).execute()
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Отдел не найден")
    return result.data[0]


@router.delete("/{department_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_department(department_id: str, user: dict = Depends(get_current_user)):
    sb = get_supabase()
    sb.table("departments").delete().eq("id", department_id).execute()
