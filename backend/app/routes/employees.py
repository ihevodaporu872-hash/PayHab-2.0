from fastapi import APIRouter, Depends, HTTPException, status
from app.auth import get_current_user
from app.models import IEmployee
from app.supabase_client import get_supabase

router = APIRouter(prefix="/api/v1/employees", tags=["employees"])


@router.get("")
def get_employees(user: dict = Depends(get_current_user)):
    sb = get_supabase()
    result = sb.table("employees").select("*, departments(name), positions(name)").execute()
    return result.data


@router.get("/{employee_id}")
def get_employee(employee_id: str, user: dict = Depends(get_current_user)):
    sb = get_supabase()
    result = sb.table("employees").select("*, departments(name), positions(name)").eq("id", employee_id).execute()
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Сотрудник не найден")
    return result.data[0]


@router.post("", status_code=status.HTTP_201_CREATED)
def create_employee(body: IEmployee, user: dict = Depends(get_current_user)):
    sb = get_supabase()
    data = body.model_dump(exclude={"id"}, exclude_none=True)
    result = sb.table("employees").insert(data).execute()
    return result.data[0]


@router.put("/{employee_id}")
def update_employee(employee_id: str, body: IEmployee, user: dict = Depends(get_current_user)):
    sb = get_supabase()
    data = body.model_dump(exclude={"id"}, exclude_none=True)
    result = sb.table("employees").update(data).eq("id", employee_id).execute()
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Сотрудник не найден")
    return result.data[0]


@router.delete("/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employee(employee_id: str, user: dict = Depends(get_current_user)):
    sb = get_supabase()
    sb.table("employees").delete().eq("id", employee_id).execute()
