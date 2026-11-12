/** Compact social/stat count formatting shared by feed overlays and badges. */
export const formatCompactCount = (count: number): string => {
  if (!Number.isFinite(count) || count <= 0) return '0';
  if (count < 1000) return `${Math.floor(count)}`;

  const units: Array<{ threshold: number; suffix: string }> = [
    { threshold: 1_000_000_000, suffix: 'B' },
    { threshold: 1_000_000, suffix: 'M' },
    { threshold: 1_000, suffix: 'K' },
  ];
  const unit = units.find(candidate => count >= candidate.threshold);
  if (!unit) return `${Math.floor(count)}`;

  const value = count / unit.threshold;
  const rounded = Math.round(value * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1)}${unit.suffix}`;
};
