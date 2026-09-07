import { NextResponse } from 'next/server';
import { liveExperiences } from '@/lib/sports/simulator';

export const dynamic = 'force-dynamic';

export async function GET() {
  const experiences = liveExperiences();
  return NextResponse.json({ generatedAt: new Date().toISOString(), experiences }, { headers: { 'Cache-Control': 'no-store' } });
}
