import { getWeekendActionEvents } from '@/components/weekend-action';
import { WeekendGallery } from '@/components/weekend-gallery';

// The gallery is a discovery moment on the home surface. It stays honest: only real
// catalogue events (which resolve to a live Match Centre) are shown, and the empty
// state is used whenever the catalogue has nothing for the weekend.
export async function WeekendGallerySection() {
  const events = await getWeekendActionEvents();
  return (
    <div className="weekend-gallery-surface" data-source={events.length ? 'catalogue' : 'empty'}>
      <WeekendGallery events={events} />
    </div>
  );
}
