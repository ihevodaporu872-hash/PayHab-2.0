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
