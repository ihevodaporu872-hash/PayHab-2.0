from fastapi import APIRouter, HTTPException, status, Query
from app.models import IMaterialRequest, IMaterialRequestItem, IMaterialRequestComment
from app.supabase_client import get_supabase
from typing import Optional, List
from datetime import datetime, timezone

router = APIRouter(prefix="/api/v1/material-requests", tags=["material_requests"])


@router.get("")
def get_requests(status_filter: Optional[str] = Query(None, alias="status")):
    sb = get_supabase()
    q = sb.table("material_requests").select("*, projects(name), cost_types(name)")
    if status_filter:
        q = q.eq("status", status_filter)
    result = q.order("created_at", desc=True).execute()
    return result.data


@router.get("/{request_id}")
def get_request(request_id: str):
    sb = get_supabase()
    result = sb.table("material_requests").select(
        "*, projects(name), cost_types(name), estimate_sections(name)"
    ).eq("id", request_id).execute()
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Заявка не найдена")
    return result.data[0]


@router.post("", status_code=status.HTTP_201_CREATED)
def create_request(body: IMaterialRequest):
    sb = get_supabase()
    data = body.model_dump(exclude={"id", "request_number"}, exclude_none=True)
    result = sb.table("material_requests").insert(data).execute()
    return result.data[0]


@router.put("/{request_id}")
def update_request(request_id: str, body: IMaterialRequest):
    sb = get_supabase()
    data = body.model_dump(exclude={"id", "request_number", "created_by"}, exclude_none=True)
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = sb.table("material_requests").update(data).eq("id", request_id).execute()
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Заявка не найдена")
    return result.data[0]


@router.post("/{request_id}/send")
def send_request(request_id: str):
    sb = get_supabase()
    req = sb.table("material_requests").select("*").eq("id", request_id).execute()
    if not req.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Заявка не найдена")
    request_data = req.data[0]
    if request_data["request_type"] == "over_estimate" and not request_data.get("justification"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Для заявки 'Превышение сметы' обязательно обоснование",
        )
    result = sb.table("material_requests").update({
        "status": "sent",
        "sent_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }).eq("id", request_id).execute()
    return result.data[0]


@router.delete("/{request_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_request(request_id: str):
    sb = get_supabase()
    sb.table("material_requests").delete().eq("id", request_id).execute()


# --- Items ---

@router.get("/{request_id}/items")
def get_items(request_id: str):
    sb = get_supabase()
    result = sb.table("material_request_items").select("*").eq(
        "request_id", request_id
    ).order("sort_order").execute()
    return result.data


@router.post("/{request_id}/items", status_code=status.HTTP_201_CREATED)
def save_items(request_id: str, items: List[IMaterialRequestItem]):
    sb = get_supabase()
    sb.table("material_request_items").delete().eq("request_id", request_id).execute()
    rows = []
    for i, item in enumerate(items):
        row = item.model_dump(exclude={"id"}, exclude_none=True)
        row["request_id"] = request_id
        row["sort_order"] = i
        rows.append(row)
    if rows:
        result = sb.table("material_request_items").insert(rows).execute()
        return result.data
    return []


# --- Comments ---

@router.get("/{request_id}/comments")
def get_comments(request_id: str):
    sb = get_supabase()
    result = sb.table("material_request_comments").select("*").eq(
        "request_id", request_id
    ).order("created_at").execute()
    return result.data


@router.post("/{request_id}/comments", status_code=status.HTTP_201_CREATED)
def add_comment(request_id: str, body: IMaterialRequestComment):
    sb = get_supabase()
    data = body.model_dump(exclude={"id"}, exclude_none=True)
    data["request_id"] = request_id
    result = sb.table("material_request_comments").insert(data).execute()
    return result.data[0]
