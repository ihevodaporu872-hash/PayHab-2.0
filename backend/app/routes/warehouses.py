from fastapi import APIRouter, HTTPException, status
from app.models import IWarehouse
from app.supabase_client import get_supabase

router = APIRouter(prefix="/api/v1/warehouses", tags=["warehouses"])


@router.get("")
def get_warehouses():
    sb = get_supabase()
    result = sb.table("warehouses").select("*").order("name").execute()
    return result.data


@router.post("", status_code=status.HTTP_201_CREATED)
def create_warehouse(body: IWarehouse):
    sb = get_supabase()
    data = body.model_dump(exclude={"id"}, exclude_none=True)
    result = sb.table("warehouses").insert(data).execute()
    return result.data[0]


@router.put("/{warehouse_id}")
def update_warehouse(warehouse_id: str, body: IWarehouse):
    sb = get_supabase()
    data = body.model_dump(exclude={"id"}, exclude_none=True)
    result = sb.table("warehouses").update(data).eq("id", warehouse_id).execute()
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Склад не найден")
    return result.data[0]


@router.delete("/{warehouse_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_warehouse(warehouse_id: str):
    sb = get_supabase()
    sb.table("warehouses").delete().eq("id", warehouse_id).execute()
