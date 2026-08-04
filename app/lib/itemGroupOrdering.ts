export type ItemGroupSummary = {
  name: string;
  custom_priority: number;
};

const isRootItemGroupName = (value: string) => {
  const normalized = value.trim().toLowerCase();
  return (
    normalized === "all item" ||
    normalized === "all items" ||
    normalized === "all item group" ||
    normalized === "all item groups"
  );
};

const normalizePriority = (value: number | null | undefined) =>
  Number.isFinite(value ?? NaN) ? Number(value) : 9999;

export const buildItemGroupPriorityMap = (
  itemGroups?: ItemGroupSummary[]
) => {
  const priorityMap = new Map<string, number>();

  itemGroups?.forEach((group) => {
    const name = typeof group.name === "string" ? group.name.trim() : "";
    if (!name || isRootItemGroupName(name)) return;

    const priority = normalizePriority(group.custom_priority);
    const existing = priorityMap.get(name);

    if (existing === undefined || priority < existing) {
      priorityMap.set(name, priority);
    }
  });

  return priorityMap;
};

export const getOrderedItemGroupNames = (
  itemGroups?: ItemGroupSummary[]
) => {
  const priorityMap = buildItemGroupPriorityMap(itemGroups);

  return Array.from(priorityMap.entries())
    .sort((a, b) => {
      const priorityDiff = a[1] - b[1];
      if (priorityDiff !== 0) return priorityDiff;
      return a[0].localeCompare(b[0]);
    })
    .map(([name]) => name);
};

export const sortGroupNamesByItemGroupPriority = (
  groupNames: string[],
  itemGroups?: ItemGroupSummary[]
) => {
  const priorityMap = buildItemGroupPriorityMap(itemGroups);

  return Array.from(
    new Set(
      groupNames
        .map((name) => name.trim())
        .filter((name) => Boolean(name) && name !== "All" && !isRootItemGroupName(name))
    )
  ).sort((a, b) => {
    const priorityA = priorityMap.get(a) ?? 9999;
    const priorityB = priorityMap.get(b) ?? 9999;
    const priorityDiff = priorityA - priorityB;
    if (priorityDiff !== 0) return priorityDiff;
    return a.localeCompare(b);
  });
};