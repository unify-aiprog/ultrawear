import { UltraVisualEngine } from '@/components/ultra-visual-engine';
import '../visual-engine.css';

export const metadata = { title: 'Experience' };

export default function ExperiencePage() {
  return <>
    <h1 className="visually-hidden">UltraWear FC visual experience</h1>
    <UltraVisualEngine />
  </>;
}
