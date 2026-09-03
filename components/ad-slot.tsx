type AdSlotProps = { label?: string; minHeight?: number };

export function AdSlot({ label = 'Advertisement', minHeight = 90 }: AdSlotProps) {
  return (
    <div className="ad-slot" style={{ minHeight }} aria-label={label}>
      <span>{label}</span>
    </div>
  );
}
