import DepositsManager from '@/components/DepositsManager';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Deposits · CopyShop' };

export default function DepositsPage() {
  return <DepositsManager />;
}
