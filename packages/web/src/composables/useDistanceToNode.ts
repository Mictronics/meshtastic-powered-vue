import { useNodeDBStore } from "@/composables/stores/nodeDB/useNodeDBStore";

type CacheEntry = { myLat: number; myLon: number; targetLat: number; targetLon: number; distance: number };

export const useDistanceToNode = () => {
    const nodeDB = useNodeDBStore();

    // Keyed by nodeNum, but validated against both endpoints' coordinates so a moved target
    // (not just a moved "my node") invalidates its own entry.
    const distanceCache = new Map<number, CacheEntry>();

    const toRadians = (coord: number) => (coord / 1e7) * Math.PI / 180;

    const calculateGreatCircleDistance = (nodeNum: number): number | undefined => {
        const myNode = nodeDB.nodeDatabase.value?.getMyNode();
        const targetNode = nodeDB.nodeDatabase.value?.getNode(nodeNum);

        if (
            myNode?.position?.latitudeI == null ||
            myNode?.position?.longitudeI == null ||
            targetNode?.position?.latitudeI == null ||
            targetNode?.position?.longitudeI == null
        ) {
            return undefined;
        }

        const myLat = myNode.position.latitudeI;
        const myLon = myNode.position.longitudeI;
        const targetLat = targetNode.position.latitudeI;
        const targetLon = targetNode.position.longitudeI;

        const cached = distanceCache.get(nodeNum);
        if (
            cached &&
            cached.myLat === myLat &&
            cached.myLon === myLon &&
            cached.targetLat === targetLat &&
            cached.targetLon === targetLon
        ) {
            return cached.distance;
        }

        const lat1 = toRadians(myLat);
        const lon1 = toRadians(myLon);
        const lat2 = toRadians(targetLat);
        const lon2 = toRadians(targetLon);

        const dLat = lat2 - lat1;
        const dLon = lon2 - lon1;

        const sinDLat = Math.sin(dLat / 2);
        const sinDLon = Math.sin(dLon / 2);

        const a =
            sinDLat * sinDLat +
            Math.cos(lat1) * Math.cos(lat2) *
            sinDLon * sinDLon;

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = 6371 * c;

        distanceCache.set(nodeNum, { myLat, myLon, targetLat, targetLon, distance });
        return distance;
    };

    return {
        calculateGreatCircleDistance
    };
};