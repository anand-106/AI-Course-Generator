from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from core.security import get_current_user
from db import users_collection

router = APIRouter(prefix="/user", tags=["User"])

class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    bio: Optional[str] = None
    phone: Optional[str] = None
    learning_goal: Optional[str] = None
    skill_level: Optional[str] = None # Beginner / Intermediate / Advanced
    profile_pic: Optional[str] = None

@router.get("/profile")
async def get_profile(current_user: str = Depends(get_current_user)):
    if users_collection is None:
        raise HTTPException(status_code=503, detail="Database connection failed")
        
    user = users_collection.find_one({"email": current_user})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Clean up for response
    user.pop("password", None)
    if "_id" in user:
        user["_id"] = str(user["_id"])
    
    # Ensure all profile fields exist in response even if not set in DB
    return {
        "id": user.get("id"),
        "email": user.get("email"),
        "name": user.get("name", ""),
        "bio": user.get("bio", ""),
        "phone": user.get("phone", ""),
        "learning_goal": user.get("learning_goal", ""),
        "skill_level": user.get("skill_level", "Beginner"),
        "profile_pic": user.get("profile_pic", "")
    }

@router.put("/profile")
async def update_profile(profile_data: UserProfileUpdate, current_user: str = Depends(get_current_user)):
    if users_collection is None:
        raise HTTPException(status_code=503, detail="Database connection failed")

    update_dict = {k: v for k, v in profile_data.dict().items() if v is not None}
    
    if not update_dict:
        return {"msg": "No changes provided"}

    result = users_collection.update_one(
        {"email": current_user},
        {"$set": update_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
        
    return {"msg": "Profile updated successfully"}
