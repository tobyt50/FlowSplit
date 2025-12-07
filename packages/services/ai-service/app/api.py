from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional

from .heuristics import generate_insight_for_user
from .auth import get_current_user, User

router = APIRouter()

# --- Updated Pydantic Models ---
class InsightPayload(BaseModel):
    # For UNALLOCATED_FUNDS
    amount: Optional[str] = None
    # For LOW_SAVINGS_RATE
    currentRate: Optional[float] = None
    # For NEW_SUBSCRIPTION_DETECTED
    name: Optional[str] = None
    # For HIGH_SPENDING_VELOCITY
    walletName: Optional[str] = None
    ruleId: Optional[str] = None
    walletId: Optional[str] = None

class AIInsight(BaseModel):
    insightCode: str
    title: str
    description: str
    actionText: Optional[str] = None
    payload: InsightPayload

# --- The Main API Endpoint (Unchanged, but now returns richer data) ---
@router.get("/insight", response_model=AIInsight)
def get_actionable_insight(current_user: User = Depends(get_current_user)):
    try:
        # Now this blocking call will run in a thread pool, keeping the server responsive
        insight = generate_insight_for_user(current_user.id)
        return insight
    except Exception as e:
        print(f"Error generating insight for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not generate financial insight."
        )