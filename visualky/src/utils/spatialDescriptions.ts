
export const getSpatialDescription = (box: { originX: number, originY: number, width: number, height: number }): string => {
    const centerX = box.originX + box.width / 2;
    // const centerY = box.originY + box.height / 2; // Unused for now

    let horizontal = "";
    if (centerX < 0.33) horizontal = "on your left";
    else if (centerX > 0.66) horizontal = "on your right";
    else horizontal = "in front of you";

    return horizontal;
};

export const groupDetections = (detections: any[]): string => {
    if (!detections || detections.length === 0) return "";

    // Count objects: { "cup": 2, "laptop": 1 }
    const counts: Record<string, number> = {};
    const locations: Record<string, string[]> = {};

    detections.forEach(det => {
        const label = det.categories[0].categoryName;
        counts[label] = (counts[label] || 0) + 1;

        const loc = getSpatialDescription(det.boundingBox);
        if (!locations[label]) locations[label] = [];
        locations[label].push(loc);
    });

    // Form sentences
    const parts = Object.keys(counts).map(label => {
        const count = counts[label];
        const locs = locations[label];
        // e.g. "2 cups on your left" or "a laptop in front of you"
        const distinctLocs = Array.from(new Set(locs)).join(' and ');
        return `${count} ${label}${count > 1 ? 's' : ''} ${distinctLocs}`;
    });

    if (parts.length === 0) return "";
    if (parts.length === 1) return `I see ${parts[0]}.`;
    return `I see ${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}.`;
};
