import InventoryManager from '@/components/InventoryManager';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Inventory · CopyShop' };

export default function InventoryPage() {
  return <InventoryManager />;
}
