from psycopg2.extras import RealDictCursor
from datetime import datetime, timedelta

class FinancialDataAccess:
    """
    This class is responsible for all direct database queries
    related to financial analysis for a given user.
    """
    def __init__(self, cursor, user_id: str):
        self.cursor = cursor
        self.user_id = user_id

    def get_unallocated_funds_balance(self) -> int:
        self.cursor.execute("""
            SELECT balance FROM "Wallet"
            WHERE "userId" = %s AND type = 'SOURCE'
        """, (self.user_id,))
        result = self.cursor.fetchone()
        return result['balance'] if result else 0

    def get_primary_savings_rule_percentage(self) -> float | None:
        self.cursor.execute("""
            SELECT r.value FROM "SplitRule" r
            JOIN "Wallet" w ON r."destinationWalletId" = w.id
            WHERE r."userId" = %s AND r.type = 'PERCENTAGE' AND w.type = 'SAVINGS'
            ORDER BY r.priority ASC LIMIT 1
        """, (self.user_id,))
        result = self.cursor.fetchone()
        return result['value'] if result else None

    def get_recent_debits(self, days: int = 30) -> list:
        start_date = datetime.now() - timedelta(days=days)
        self.cursor.execute("""
            SELECT lt.description, le.amount, le."createdAt"
            FROM "LedgerEntry" le
            JOIN "LedgerTransaction" lt ON le."ledgerTransactionId" = lt.id
            JOIN "Wallet" w ON le."walletId" = w.id
            WHERE w."userId" = %s
              AND le.type = 'DEBIT'
              AND w.type != 'SOURCE' -- Exclude internal splits
              AND le."createdAt" >= %s
            ORDER BY le."createdAt" DESC
        """, (self.user_id, start_date))
        return self.cursor.fetchall()

    def get_wallet_spending(self, wallet_name: str, days_into_month: int) -> dict | None:
        start_of_month = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        self.cursor.execute("""
            SELECT w.id, w.balance, COALESCE(SUM(le.amount), 0) as total_spent
            FROM "Wallet" w
            LEFT JOIN "LedgerEntry" le ON w.id = le."walletId" AND le.type = 'DEBIT' AND le."createdAt" >= %s
            WHERE w."userId" = %s AND w.name = %s
            GROUP BY w.id, w.balance
        """, (start_of_month, self.user_id, wallet_name))
        return self.cursor.fetchone()
    
    def get_active_rule_names(self) -> list[str]:
        """
        Fetches the names of all active split rules for the user.
        Used for deduplication of insights.
        """
        self.cursor.execute("""
            SELECT name FROM "SplitRule"
            WHERE "userId" = %s AND "isActive" = TRUE
        """, (self.user_id,))
        results = self.cursor.fetchall()
        return [row['name'] for row in results]