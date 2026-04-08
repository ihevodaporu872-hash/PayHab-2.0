from fastapi import APIRouter, Depends, HTTPException, status
from app.auth import get_current_user
from app.models import ICostType
from app.supabase_client import get_supabase

router = APIRouter(prefix="/api/v1/cost-types", tags=["cost_types"])


@router.get("")
def get_cost_types(user: dict = Depends(get_current_user)):
    sb = get_supabase()
    result = sb.table("cost_types").select("*").order("created_at").execute()
    return result.data


@router.post("", status_code=status.HTTP_201_CREATED)
def create_cost_type(body: ICostType, user: dict = Depends(get_current_user)):
    sb = get_supabase()
    data = body.model_dump(exclude={"id"}, exclude_none=True)
    result = sb.table("cost_types").insert(data).execute()
    return result.data[0]


@router.put("/{cost_type_id}")
def update_cost_type(cost_type_id: str, body: ICostType, user: dict = Depends(get_current_user)):
    sb = get_supabase()
    data = body.model_dump(exclude={"id"}, exclude_none=True)
    result = sb.table("cost_types").update(data).eq("id", cost_type_id).execute()
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Вид затрат не найден")
    return result.data[0]


@router.delete("/{cost_type_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_cost_type(cost_type_id: str, user: dict = Depends(get_current_user)):
    sb = get_supabase()
    sb.table("cost_types").delete().eq("id", cost_type_id).execute()
