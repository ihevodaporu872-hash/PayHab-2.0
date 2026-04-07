from fastapi import APIRouter, Depends, HTTPException, status
from app.auth import get_current_user
from app.models import ICard
from app.supabase_client import get_supabase

router = APIRouter(prefix="/api/v1/cards", tags=["cards"])


@router.get("")
def get_cards(employee_id: str | None = None, user: dict = Depends(get_current_user)):
    sb = get_supabase()
    query = sb.table("cards").select("*, employees(last_name, first_name)")
    if employee_id:
        query = query.eq("employee_id", employee_id)
    result = query.execute()
    return result.data


@router.post("", status_code=status.HTTP_201_CREATED)
def create_card(body: ICard, user: dict = Depends(get_current_user)):
    sb = get_supabase()
    data = body.model_dump(exclude={"id"}, exclude_none=True)
    result = sb.table("cards").insert(data).execute()
    return result.data[0]


@router.put("/{card_id}")
def update_card(card_id: str, body: ICard, user: dict = Depends(get_current_user)):
    sb = get_supabase()
    data = body.model_dump(exclude={"id"}, exclude_none=True)
    result = sb.table("cards").update(data).eq("id", card_id).execute()
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Карта не найдена")
    return result.data[0]


@router.delete("/{card_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_card(card_id: str, user: dict = Depends(get_current_user)):
    sb = get_supabase()
    sb.table("cards").delete().eq("id", card_id).execute()
