import authoredContent from "./authoredContent.json";
import type { ItemDefinition } from "../state/types";

export const itemDex = Object.fromEntries(
  authoredContent.items.map((item) => [item.id, item as ItemDefinition]),
) as Record<string, ItemDefinition>;
