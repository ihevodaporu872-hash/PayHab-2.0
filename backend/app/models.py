from pydantic import BaseModel
from typing import Optional


# --- Auth ---

class ILoginRequest(BaseModel):
    username: str
    password: str


class ITokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# --- Department ---

class IDepartment(BaseModel):
    id: Optional[str] = None
    name: str
    parent_id: Optional[str] = None


# --- Position ---

class IPosition(BaseModel):
    id: Optional[str] = None
    name: str


# --- Employee ---

class IEmployee(BaseModel):
    id: Optional[str] = None
    last_name: str
    first_name: str
    middle_name: Optional[str] = None
    department_id: Optional[str] = None
    position_id: Optional[str] = None
    tab_number: Optional[str] = None
    is_active: bool = True


# --- Card ---

class ICard(BaseModel):
    id: Optional[str] = None
    employee_id: str
    card_number: str
    is_active: bool = True


# --- Project ---

class IProject(BaseModel):
    id: Optional[str] = None
    code: Optional[str] = None
    name: str
    related_names: Optional[str] = None
    description: Optional[str] = None
    status: str = "active"


# --- Estimate Section ---

class IEstimateSection(BaseModel):
    id: Optional[str] = None
    project_id: str
    name: str


# --- Cost Type ---

class ICostType(BaseModel):
    id: Optional[str] = None
    name: str
    status: str = "active"


# --- Material Request ---

class IMaterialRequest(BaseModel):
    id: Optional[str] = None
    request_number: Optional[int] = None
    project_id: Optional[str] = None
    request_type: str
    estimate_section_id: Optional[str] = None
    manual_estimate_section: Optional[str] = None
    cost_type_id: Optional[str] = None
    justification: Optional[str] = None
    status: str = "draft"
    created_by: Optional[str] = None


class IMaterialRequestItem(BaseModel):
    id: Optional[str] = None
    request_id: Optional[str] = None
    sort_order: int = 0
    material: Optional[str] = None
    unit: Optional[str] = None
    volume: Optional[float] = None
    consumption_rate: Optional[float] = None
    total_consumption: Optional[float] = None
    price: Optional[float] = None
    cost: Optional[float] = None
    new_volume: Optional[float] = None
    new_consumption_rate: Optional[float] = None
    new_total_consumption: Optional[float] = None
    new_price: Optional[float] = None
    new_cost: Optional[float] = None


class IMaterialRequestComment(BaseModel):
    id: Optional[str] = None
    request_id: str
    user_id: Optional[str] = None
    username: Optional[str] = None
    text: str
