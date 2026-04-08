from fastapi import APIRouter, HTTPException, status, UploadFile, File
from fastapi.responses import Response
from app.supabase_client import get_supabase
from pydantic import BaseModel
from typing import Optional
import uuid

router = APIRouter(prefix="/api/v1", tags=["files"])

BUCKET = "material-request-files"


def ensure_bucket():
    sb = get_supabase()
    try:
        sb.storage.get_bucket(BUCKET)
    except Exception:
        sb.storage.create_bucket(BUCKET, options={"public": False})


@router.get("/material-requests/{request_id}/files")
def get_files(request_id: str):
    sb = get_supabase()
    result = sb.table("material_request_files").select("*").eq(
        "request_id", request_id
    ).order("created_at").execute()
    return result.data


@router.post("/material-requests/{request_id}/files", status_code=status.HTTP_201_CREATED)
async def upload_file(request_id: str, file: UploadFile = File(...)):
    ensure_bucket()
    sb = get_supabase()
    content = await file.read()
    file_id = str(uuid.uuid4())
    ext = file.filename.rsplit(".", 1)[-1] if "." in file.filename else ""
    storage_path = f"{request_id}/{file_id}.{ext}" if ext else f"{request_id}/{file_id}"

    sb.storage.from_(BUCKET).upload(
        path=storage_path,
        file=content,
        file_options={"content-type": file.content_type or "application/octet-stream"},
    )

    record = {
        "id": file_id,
        "request_id": request_id,
        "filename": file.filename,
        "storage_path": storage_path,
        "content_type": file.content_type,
        "size_bytes": len(content),
    }
    result = sb.table("material_request_files").insert(record).execute()
    return result.data[0]


@router.get("/files/{file_id}/download")
def download_file(file_id: str):
    sb = get_supabase()
    record = sb.table("material_request_files").select("*").eq("id", file_id).execute()
    if not record.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Файл не найден")
    meta = record.data[0]
    content = sb.storage.from_(BUCKET).download(meta["storage_path"])
    return Response(
        content=content,
        media_type=meta.get("content_type", "application/octet-stream"),
        headers={
            "Content-Disposition": f'attachment; filename="{meta["filename"]}"',
        },
    )


@router.get("/files/{file_id}/view")
def view_file(file_id: str):
    sb = get_supabase()
    record = sb.table("material_request_files").select("*").eq("id", file_id).execute()
    if not record.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Файл не найден")
    meta = record.data[0]
    content = sb.storage.from_(BUCKET).download(meta["storage_path"])
    return Response(
        content=content,
        media_type=meta.get("content_type", "application/octet-stream"),
    )


class IAnnotations(BaseModel):
    annotations: Optional[str] = None


@router.put("/files/{file_id}/annotations")
def save_annotations(file_id: str, body: IAnnotations):
    sb = get_supabase()
    result = sb.table("material_request_files").update(
        {"annotations": body.annotations}
    ).eq("id", file_id).execute()
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Файл не найден")
    return result.data[0]


@router.delete("/files/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_file(file_id: str):
    sb = get_supabase()
    record = sb.table("material_request_files").select("*").eq("id", file_id).execute()
    if record.data:
        meta = record.data[0]
        try:
            sb.storage.from_(BUCKET).remove([meta["storage_path"]])
        except Exception:
            pass
    sb.table("material_request_files").delete().eq("id", file_id).execute()
