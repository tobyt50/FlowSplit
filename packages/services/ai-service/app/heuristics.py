from datetime import datetime, timedelta
from collections import defaultdict
from .data_access import FinancialDataAccess
from thefuzz import fuzz
from psycopg2.extras import RealDictCursor
from .db import get_db_connection

# --- Heuristic 1: Unallocated Funds ---
def find_unallocated_funds(data: FinancialDataAccess):
    balance = data.get_unallocated_funds_balance()
    if balance > 5000: # Threshold: ₦50.00
        balance_naira = balance / 100
        return {
            "insightCode": "UNALLOCATED_FUNDS",
            "title": "Put Your Money to Work",
            "description": f"You have {balance_naira:,.2f} NGN sitting in your unallocated funds. Assign it to a savings goal to keep your plan on track.",
            "actionText": "Transfer to Savings",
            "payload": {"amount": str(balance)}
        }
    return None

# --- Heuristic 2: Low Savings Rate ---
def check_savings_rate(data: FinancialDataAccess):
    # We need to fetch the ID now too
    data.cursor.execute("""
        SELECT r.id, r.value FROM "SplitRule" r
        JOIN "Wallet" w ON r."destinationWalletId" = w.id
        WHERE r."userId" = %s AND r.type = 'PERCENTAGE' AND w.type = 'SAVINGS'
        ORDER BY r.priority ASC LIMIT 1
    """, (data.user_id,))
    result = data.cursor.fetchone()

    if result and result['value'] < 10:
        return {
            "insightCode": "LOW_SAVINGS_RATE",
            "title": "Boost Your Savings",
            "description": f"You're currently allocating only {result['value']}% to savings...",
            "actionText": "Review Savings Rule",
            "payload": {
                "currentRate": result['value'],
                "ruleId": result['id'] # <-- NEW: Return the ID
            }
        }
    return None

# --- Heuristic 3: New Recurring Subscription Detection (Full-Scale) ---
def detect_new_subscription(data: FinancialDataAccess):
    """
    Analyzes recent debits to find patterns of new, recurring payments that
    are not yet accounted for in a split rule.
    """
    recent_debits = data.get_recent_debits(days=60)
    
    # Group transactions by description and find recurring ones
    transactions_by_desc = defaultdict(list)
    for tx in recent_debits:
        # Normalize: "NETFLIX.COM" -> "netflix.com"
        desc = tx['description'].lower().strip() if tx['description'] else 'unknown'
        transactions_by_desc[desc].append(tx['amount'])

    existing_rules = data.get_active_rule_names()

    for desc, amounts in transactions_by_desc.items():
        # Criteria: At least 2 payments, consistent amount, known description
        if len(amounts) >= 2 and desc != 'unknown': 
            avg_amount = sum(amounts) / len(amounts)
            
            # Check if amounts are consistent (within a 10% tolerance)
            if all(abs(amount - avg_amount) / avg_amount < 0.1 for amount in amounts):
                
                # --- FUZZY MATCHING LOGIC (NO SIMPLIFICATION) ---
                # Check if any existing rule resembles this transaction description.
                # We use a threshold of 70 to catch variations like:
                # Transaction: "Spotify Nigeria" vs Rule: "Spotify"
                # Transaction: "DSTV Subscription" vs Rule: "DSTV"
                is_covered_by_rule = False
                for rule_name in existing_rules:
                    # token_set_ratio handles partial strings and out-of-order words best
                    similarity_score = fuzz.token_set_ratio(desc, rule_name.lower())
                    if similarity_score > 70: 
                        is_covered_by_rule = True
                        break
                
                if is_covered_by_rule:
                    continue # Skip this insight, the user already handles it.
                # ------------------------------------------------

                avg_naira = (avg_amount / 100)
                return {
                    "insightCode": "NEW_SUBSCRIPTION_DETECTED",
                    "title": "New Recurring Payment?",
                    "description": f"We've noticed a recurring payment for '{desc.title()}' around {avg_naira:,.2f} NGN. You don't have a specific rule for this yet. Consider automating it.",
                    "actionText": "Create Bill Rule",
                    "payload": {"name": desc.title(), "amount": str(int(avg_amount))}
                }
    return None

# --- Heuristic 4: Spending Velocity Check (Full-Scale) ---
def check_spending_velocity(data: FinancialDataAccess):
    """
    Checks if spending from a 'Food' or 'Transport' wallet is on track to
    be depleted before the end of the month.
    """
    today = datetime.now()
    day_of_month = today.day
    days_in_month = (today.replace(month=today.month % 12 + 1, day=1) - timedelta(days=1)).day
    
    percent_of_month_passed = day_of_month / days_in_month

    for category in ["Food", "Transport"]: # Categories to monitor
        wallet_data = data.get_wallet_spending(category, day_of_month)
        if not wallet_data:
            continue

        current_balance = float(wallet_data['balance'])
        total_spent = float(wallet_data['total_spent'])

        initial_balance = current_balance + total_spent
        if initial_balance == 0:
            continue

        percent_spent = total_spent / initial_balance
        
        # If we have spent significantly more than the percentage of the month that has passed
        if percent_spent > percent_of_month_passed and (percent_spent - percent_of_month_passed) > 0.2:
             return {
                "insightCode": "HIGH_SPENDING_VELOCITY",
                "title": "Pacing Alert",
                "description": f"You've already spent {int(percent_spent * 100)}% of your '{category}' budget...",
                "actionText": "View Wallet History",
                "payload": {
                    "walletName": category,
                    "walletId": wallet_data['id'] # <-- NEW: Return the ID
                }
            }
    return None

# The Main Runner - Now with the new heuristics in priority order
HEURISTICS_PIPELINE = [
    find_unallocated_funds,
    check_spending_velocity,
    detect_new_subscription,
    check_savings_rate,
]

def generate_insight_for_user(user_id: str):
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            data_access = FinancialDataAccess(cursor, user_id)
            for heuristic in HEURISTICS_PIPELINE:
                insight = heuristic(data_access)
                if insight:
                    return insight
    finally:
        conn.close()
    
    return {
        "insightCode": "DEFAULT_GREETING",
        "title": "All Systems Go",
        "description": "Your financial system is running smoothly. Keep up the great work!",
        "actionText": None,
        "payload": {}
    }