from fastapi import APIRouter, HTTPException, status, Query
from app.models import IEstimateSection
from app.supabase_client import get_supabase
from typing import Optional

router = APIRouter(prefix="/api/v1/estimate-sections", tags=["estimate_sections"])


@router.get("")
def get_estimate_sections(project_id: Optional[str] = Query(None)):
    sb = get_supabase()
    q = sb.table("estimate_sections").select("*")
    if project_id:
        q = q.eq("project_id", project_id)
    result = q.order("created_at").execute()
    return result.data


@router.post("", status_code=status.HTTP_201_CREATED)
def create_estimate_section(body: IEstimateSection):
    sb = get_supabase()
    data = body.model_dump(exclude={"id"}, exclude_none=True)
    result = sb.table("estimate_sections").insert(data).execute()
    return result.data[0]


@router.put("/{section_id}")
def update_estimate_section(section_id: str, body: IEstimateSection):
    sb = get_supabase()
    data = body.model_dump(exclude={"id"}, exclude_none=True)
    result = sb.table("estimate_sections").update(data).eq("id", section_id).execute()
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Раздел сметы не найден")
    return result.data[0]


@router.delete("/{section_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_estimate_section(section_id: str):
    sb = get_supabase()
    sb.table("estimate_sections").delete().eq("id", section_id).execute()
