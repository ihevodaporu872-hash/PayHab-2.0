from fastapi import APIRouter
from app.supabase_client import get_supabase

router = APIRouter(prefix="/api/v1/users", tags=["users"])


@router.get("")
def get_users():
    sb = get_supabase()
    result = sb.table("users").select("id, username, full_name").order("username").execute()
    return result.data
