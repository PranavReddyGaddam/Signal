from fastapi import APIRouter
import ai.toggle as toggle_mod

router = APIRouter()


@router.get("/ai-toggle")
def get_toggle():
    return {"enabled": toggle_mod.is_enabled()}


@router.post("/ai-toggle")
def set_toggle(body: dict):
    enabled = bool(body.get("enabled", True))
    toggle_mod.set_enabled(enabled)
    return {"enabled": toggle_mod.is_enabled()}
