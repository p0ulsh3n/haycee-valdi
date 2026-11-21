/** Temporary wallet fixtures for the account dashboard; replace with wallet API data. */
export const WALLET_OVERVIEW = {
  availableBalance: 186500,
  pendingAmount: 29950,
  monthlyOrders: 20,
  monthlySpend: 834000,
  deliveredOrders: 16,
  pendingOrders: 4,
  completedPayments: 113000,
  minimumWithdrawal: 5000,
  accountHolder: 'Compte de démonstration',
  bankName: 'Compte bancaire principal',
  maskedAccountNumber: '•••• 6540',
} as const;

export const WALLET_QUICK_WITHDRAW_AMOUNTS = [5000, 10000, 25000] as const;
