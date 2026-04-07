from fastapi import APIRouter, HTTPException, status
from app.models import ILoginRequest, ITokenResponse
from app.auth import authenticate_user, create_access_token

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=ITokenResponse)
def login(body: ILoginRequest):
    user = authenticate_user(body.username, body.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный логин или пароль",
        )
    token = create_access_token({"sub": user["username"]})
    return ITokenResponse(access_token=token)
