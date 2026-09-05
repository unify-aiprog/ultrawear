import { PremiumHome } from '@/components/premium-home';
import './premium-home.css';

export const revalidate = 120;

export default function HomePage() {
  return <PremiumHome />;
}
