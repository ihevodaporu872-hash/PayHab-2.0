from fastapi import APIRouter, Depends, HTTPException, status
from app.auth import get_current_user
from app.models import IPosition
from app.supabase_client import get_supabase

router = APIRouter(prefix="/api/v1/positions", tags=["positions"])


@router.get("")
def get_positions(user: dict = Depends(get_current_user)):
    sb = get_supabase()
    result = sb.table("positions").select("*").execute()
    return result.data


@router.post("", status_code=status.HTTP_201_CREATED)
def create_position(body: IPosition, user: dict = Depends(get_current_user)):
    sb = get_supabase()
    data = body.model_dump(exclude={"id"}, exclude_none=True)
    result = sb.table("positions").insert(data).execute()
    return result.data[0]


@router.put("/{position_id}")
def update_position(position_id: str, body: IPosition, user: dict = Depends(get_current_user)):
    sb = get_supabase()
    data = body.model_dump(exclude={"id"}, exclude_none=True)
    result = sb.table("positions").update(data).eq("id", position_id).execute()
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Должность не найдена")
    return result.data[0]


@router.delete("/{position_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_position(position_id: str, user: dict = Depends(get_current_user)):
    sb = get_supabase()
    sb.table("positions").delete().eq("id", position_id).execute()
