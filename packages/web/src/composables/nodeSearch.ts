import { numberToHexUnpadded } from '@noble/curves/utils.js';
import type { FormattedNode } from '@/composables/types';

/** Case-insensitive match of an already lower-cased query against a node's user-facing identifiers. */
export const matchesNodeSearch = (n: FormattedNode, q: string) =>
  [
    n.shortName,
    n.longName,
    '!' + numberToHexUnpadded(n.nodeNumber),
    String(n.nodeNumber),
    n.hwModel,
    n.role,
    n.macAddr,
  ].some((v) => v?.toLowerCase().includes(q));
