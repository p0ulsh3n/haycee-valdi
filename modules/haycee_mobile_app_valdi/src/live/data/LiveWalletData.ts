/** Local wallet fixtures for the Live prototype; replace with account/order API data later. */
export interface LiveWalletTransaction {
  id: string;
  title: string;
  subtitle: string;
  amount: number;
  direction: 'credit' | 'debit';
}

export interface LiveWalletOrder {
  id: string;
  storeName: string;
  date: string;
  items: LiveWalletOrderItem[];
  totalAmount: number;
  status: 'Livrée' | 'En préparation' | 'En livraison';
}

export interface LiveWalletOrderItem {
  id: string;
  title: string;
  quantity: number;
  unitPrice: number;
}

export const LIVE_WALLET_BALANCE = 186500;

export const LIVE_WALLET_TRANSACTIONS: LiveWalletTransaction[] = [
  { id: 'wallet-transaction-01', title: 'Vente finalisée', subtitle: 'Aujourd’hui · 14:32', amount: 24900, direction: 'credit' },
  { id: 'wallet-transaction-02', title: 'Commande en direct', subtitle: 'Hier · 18:06', amount: 32900, direction: 'debit' },
  { id: 'wallet-transaction-03', title: 'Vente finalisée', subtitle: '21 octobre · 11:48', amount: 41750, direction: 'credit' },
];

/** Complete order list for the local prototype's history tab. */
export const LIVE_WALLET_ORDERS: LiveWalletOrder[] = [
  { id: 'wallet-order-01', storeName: 'Boutique Haycee', date: 'Aujourd’hui · 14:32', items: [{ id: 'order-01-item-01', title: 'Sélection du moment', quantity: 1, unitPrice: 24900 }], totalAmount: 24900, status: 'En préparation' },
  { id: 'wallet-order-02', storeName: 'Atelier Nadia', date: 'Hier · 18:06', items: [{ id: 'order-02-item-01', title: 'La découverte du live', quantity: 1, unitPrice: 32900 }, { id: 'order-02-item-02', title: 'Accessoire du quotidien', quantity: 1, unitPrice: 18500 }], totalAmount: 51400, status: 'En livraison' },
  { id: 'wallet-order-03', storeName: 'Maison Awa', date: '21 octobre · 11:48', items: [{ id: 'order-03-item-01', title: 'Dernière nouveauté', quantity: 1, unitPrice: 41750 }, { id: 'order-03-item-02', title: 'Pièce en édition limitée', quantity: 2, unitPrice: 28000 }], totalAmount: 97750, status: 'Livrée' },
  { id: 'wallet-order-04', storeName: 'Boutique Haycee', date: '18 octobre · 09:15', items: [{ id: 'order-04-item-01', title: 'Accessoire du quotidien', quantity: 1, unitPrice: 18500 }], totalAmount: 18500, status: 'Livrée' },
  { id: 'wallet-order-05', storeName: 'Atelier Nadia', date: '14 octobre · 16:20', items: [{ id: 'order-05-item-01', title: 'Pièce en édition limitée', quantity: 1, unitPrice: 56000 }, { id: 'order-05-item-02', title: 'La découverte du live', quantity: 1, unitPrice: 32900 }, { id: 'order-05-item-03', title: 'Accessoire du quotidien', quantity: 2, unitPrice: 14500 }], totalAmount: 117900, status: 'Livrée' },
  { id: 'wallet-order-06', storeName: 'Maison Awa', date: '10 octobre · 12:04', items: [{ id: 'order-06-item-01', title: 'Sélection du moment', quantity: 1, unitPrice: 24900 }], totalAmount: 24900, status: 'Livrée' },
  { id: 'wallet-order-07', storeName: 'Boutique Haycee', date: '02 octobre · 19:37', items: [{ id: 'order-07-item-01', title: 'La découverte du live', quantity: 1, unitPrice: 32900 }, { id: 'order-07-item-02', title: 'Dernière nouveauté', quantity: 1, unitPrice: 41750 }], totalAmount: 74650, status: 'Livrée' },
  { id: 'wallet-order-08', storeName: 'Atelier Nadia', date: '26 septembre · 10:52', items: [{ id: 'order-08-item-01', title: 'Accessoire du quotidien', quantity: 1, unitPrice: 14500 }], totalAmount: 14500, status: 'Livrée' },
];
