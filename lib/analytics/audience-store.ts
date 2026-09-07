import { getSupabaseServerClient } from '@/lib/supabase';
import type { AudienceEvent } from '@/lib/analytics/audience-events';

export type AudienceEventRecord = AudienceEvent & {
  receivedAt: string;
  schemaVersion: 1;
};

const memoryEvents: AudienceEventRecord[] = [];
const MAX_MEMORY_EVENTS = 5_000;

export async function appendAudienceEvent(event: AudienceEvent): Promise<{ persisted: boolean }> {
  const record: AudienceEventRecord = {
    ...event,
    receivedAt: new Date().toISOString(),
    schemaVersion: 1,
  };

  const supabase = getSupabaseServerClient();
  if (supabase) {
    const { error } = await supabase.from('audience_events').upsert(
      {
        id: record.id,
        name: record.name,
        occurred_at: record.occurredAt,
        received_at: record.receivedAt,
        anonymous_id: record.anonymousId,
        properties: record.properties,
        schema_version: record.schemaVersion,
      },
      { onConflict: 'id' },
    );
    if (!error) return { persisted: true };
  }

  const index = memoryEvents.findIndex((item) => item.id === record.id);
  if (index >= 0) return { persisted: false };
  memoryEvents.push(record);
  if (memoryEvents.length > MAX_MEMORY_EVENTS) memoryEvents.splice(0, memoryEvents.length - MAX_MEMORY_EVENTS);
  return { persisted: false };
}

export function readMemoryAudienceEvents(): AudienceEventRecord[] {
  return [...memoryEvents];
}
