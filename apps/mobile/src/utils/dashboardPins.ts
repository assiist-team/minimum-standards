import type { Standard } from '@minimum-standards/shared-model';

export type OrderedStandardsResult = {
  pinnedStandards: Standard[];
  orderedActiveStandards: Standard[];
};

function dedupe(ids: string[]): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];

  ids.forEach((id) => {
    if (id && !seen.has(id)) {
      seen.add(id);
      unique.push(id);
    }
  });

  return unique;
}

export function sanitizePinOrder(
  pinnedStandardIds: string[],
  standards: Standard[]
): string[] {
  if (pinnedStandardIds.length === 0) {
    return [];
  }

  if (standards.length === 0) {
    return dedupe(pinnedStandardIds);
  }

  const validStandardIds = new Set(standards.map((standard) => standard.id));
  const filtered = pinnedStandardIds.filter((id) => validStandardIds.has(id));
  return dedupe(filtered);
}

export function buildOrderedStandards(
  activeStandards: Standard[],
  pinnedStandardIds: string[]
): OrderedStandardsResult {
  if (activeStandards.length === 0) {
    return { pinnedStandards: [], orderedActiveStandards: [] };
  }

  const standardMap = new Map(activeStandards.map((standard) => [standard.id, standard]));
  const pinnedStandards = pinnedStandardIds
    .map((id) => standardMap.get(id))
    .filter((standard): standard is Standard => Boolean(standard));

  const pinnedSet = new Set(pinnedStandards.map((standard) => standard.id));
  const fallbackOrdered = [...activeStandards]
    .filter((standard) => !pinnedSet.has(standard.id))
    .sort((a, b) => b.updatedAtMs - a.updatedAtMs);

  return {
    pinnedStandards,
    orderedActiveStandards: [...pinnedStandards, ...fallbackOrdered],
  };
}

export function movePinToIndex(
  pinnedStandardIds: string[],
  standardId: string,
  targetIndex: number
): string[] {
  const currentIndex = pinnedStandardIds.indexOf(standardId);
  const next = [...pinnedStandardIds];

  if (currentIndex === -1) {
    next.splice(Math.max(0, Math.min(targetIndex, next.length)), 0, standardId);
    return dedupe(next);
  }

  next.splice(currentIndex, 1);
  next.splice(Math.max(0, Math.min(targetIndex, next.length)), 0, standardId);
  return dedupe(next);
}

export function togglePin(
  pinnedStandardIds: string[],
  standardId: string,
  shouldPin: boolean
): string[] {
  if (shouldPin) {
    return dedupe([standardId, ...pinnedStandardIds]);
  }

  return pinnedStandardIds.filter((id) => id !== standardId);
}
