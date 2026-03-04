import React from 'react';

export type CheckStatus = 'pending' | 'deposited' | 'paid' | 'cancelled';

export interface Check {
  id: string;
  number: string;
  dueDate: string;
  paymentDate?: string;
  beneficiary: string;
  bank?: string;
  cause?: string;
  amount: number;
  type: 'client' | 'supplier';
  status: CheckStatus;
}

export interface Client {
  id: string;
  name: string;
  phone?: string;
  email?: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone?: string;
  email?: string;
}

export interface NavItem {
  title: string;
  icon: React.ElementType;
  id: string;
}
