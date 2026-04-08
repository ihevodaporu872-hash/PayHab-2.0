from fastapi import APIRouter, HTTPException, status, Query
from app.models import IMaterialRequest, IMaterialRequestItem, IMaterialRequestComment, IApprovalStage
from app.supabase_client import get_supabase
from typing import Optional, List
from datetime import datetime, timezone

router = APIRouter(prefix="/api/v1/material-requests", tags=["material_requests"])


@router.get("")
def get_requests(
    status_filter: Optional[str] = Query(None, alias="status"),
    module: Optional[str] = Query(None),
):
    sb = get_supabase()
    q = sb.table("material_requests").select("*, projects(name), cost_types(name)")
    if module:
        q = q.eq("module", module)
    if status_filter:
        q = q.eq("status", status_filter)
    result = q.order("created_at", desc=True).execute()
    # Добавляем текущий этап согласования к каждой заявке
    requests = result.data
    if requests:
        request_ids = [r["id"] for r in requests]
        stages = sb.table("approval_stages").select("*").in_("request_id", request_ids).order("stage_order").execute()
        stages_by_request: dict = {}
        for s in stages.data:
            rid = s["request_id"]
            if rid not in stages_by_request:
                stages_by_request[rid] = []
            stages_by_request[rid].append(s)
        for r in requests:
            r_stages = stages_by_request.get(r["id"], [])
            current = None
            for s in r_stages:
                if s["status"] in ("pending", "in_progress"):
                    current = s
                    break
            if not current and r_stages:
                current = r_stages[-1]
            r["current_stage"] = current
    return requests


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


# --- Approval Stages ---

@router.get("/{request_id}/stages")
def get_stages(request_id: str):
    sb = get_supabase()
    result = sb.table("approval_stages").select("*").eq(
        "request_id", request_id
    ).order("stage_order").execute()
    return result.data


@router.post("/{request_id}/stages", status_code=status.HTTP_201_CREATED)
def save_stages(request_id: str, stages: List[IApprovalStage]):
    sb = get_supabase()
    sb.table("approval_stages").delete().eq("request_id", request_id).execute()
    rows = []
    for i, stage in enumerate(stages):
        row = stage.model_dump(exclude={"id"}, exclude_none=True)
        row["request_id"] = request_id
        row["stage_order"] = i
        rows.append(row)
    if rows:
        result = sb.table("approval_stages").insert(rows).execute()
        return result.data
    return []


@router.put("/{request_id}/stages/{stage_id}")
def update_stage(request_id: str, stage_id: str, body: IApprovalStage):
    sb = get_supabase()
    data = body.model_dump(exclude={"id", "request_id"}, exclude_none=True)
    if data.get("status") in ("approved", "rejected", "returned"):
        data["decided_at"] = datetime.now(timezone.utc).isoformat()
    result = sb.table("approval_stages").update(data).eq("id", stage_id).execute()
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Этап не найден")

    # Если все этапы согласованы — обновляем статус заявки
    all_stages = sb.table("approval_stages").select("status").eq("request_id", request_id).execute()
    statuses = [s["status"] for s in all_stages.data]
    if all(s == "approved" for s in statuses):
        sb.table("material_requests").update({
            "status": "approved",
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }).eq("id", request_id).execute()
    elif any(s == "rejected" for s in statuses):
        sb.table("material_requests").update({
            "status": "rejected",
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }).eq("id", request_id).execute()

    return result.data[0]
