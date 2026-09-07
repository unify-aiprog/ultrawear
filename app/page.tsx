import { PremiumHome } from '@/components/premium-home';
import { LiveExperience } from '@/components/live-experience';
import './premium-home.css';
import './live-world.css';

export const revalidate = 0;

export default function HomePage() {
  return <>
    <PremiumHome />
    <LiveExperience />
  </>;
}
