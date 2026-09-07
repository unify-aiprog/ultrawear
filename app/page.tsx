import { PremiumHome } from '@/components/premium-home';
import { LiveExperience } from '@/components/live-experience';
import { SportsIdentity } from '@/components/sports-identity';
import { CommunityHub } from '@/components/community-hub';
import './premium-home.css';
import './live-world.css';
import './community.css';

export const revalidate = 0;

export default function HomePage() {
  return <>
    <PremiumHome />
    <LiveExperience />
    <SportsIdentity />
    <CommunityHub />
  </>;
}
