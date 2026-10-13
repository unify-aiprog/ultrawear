import { PremiumHome } from '@/components/premium-home';
import { LiveExperience } from '@/components/live-experience';
import { WeekendGallerySection } from '@/components/weekend-gallery-section';
import { SportsIdentity } from '@/components/sports-identity';
import { QuestBoard } from '@/components/quest-board';
import { DiscoveryRadar } from '@/components/discovery-radar';
import { CommunityHub } from '@/components/community-hub';
import './premium-home.css';
import './live-world.css';
import './weekend-gallery.css';
import './community.css';
import './participation.css';
import './radar.css';

export const revalidate = 0;

export default function HomePage() {
  return <>
    <PremiumHome />
    <LiveExperience />
    <WeekendGallerySection />
    <SportsIdentity />
    <QuestBoard />
    <DiscoveryRadar />
    <CommunityHub />
  </>;
}
