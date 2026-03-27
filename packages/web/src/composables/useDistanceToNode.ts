import { useNodeDBStore } from "@/composables/stores/nodeDB/useNodeDBStore";

export const useDistanceToNode = () => {
    const nodeDB = useNodeDBStore();

    const distanceCache = new Map<number, number>();

    let lastLat: number | null = null;
    let lastLon: number | null = null;

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

        if (myLat !== lastLat || myLon !== lastLon) {
            distanceCache.clear();
            lastLat = myLat;
            lastLon = myLon;
        }

        const cached = distanceCache.get(nodeNum);
        if (cached !== undefined) {
            return cached;
        }

        const lat1 = toRadians(myLat);
        const lon1 = toRadians(myLon);
        const lat2 = toRadians(targetNode.position.latitudeI);
        const lon2 = toRadians(targetNode.position.longitudeI);

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

        distanceCache.set(nodeNum, distance);
        return distance;
    };

    return {
        calculateGreatCircleDistance
    };
};