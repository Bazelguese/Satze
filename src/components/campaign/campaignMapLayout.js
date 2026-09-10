export const MAP_HEIGHT = 600;
export const stageX = index => 140 + index * 240;

/** Nodes and trails share pixel coordinates in the logical game canvas. */
export function campaignMapLayout(stages) {
  const points = [], links = [], columns = [];
  const link = (from, to, routeId = null, optional = false) => {
    const bend = (to.x - from.x) / 2;
    links.push({ from, to, routeId, optional, d: `M${from.x} ${from.y} C${from.x + bend} ${from.y},${to.x - bend} ${to.y},${to.x} ${to.y}` });
  };
  stages.forEach((stage, index) => {
    const x = stageX(index), branch = stage.alternatives.length > 1;
    const optional = !branch && stage.alternatives[0].optional;
    const nodes = stage.alternatives.map((mission, i) => ({
      id: mission.id, mission, index, x,
      y: branch ? 135 + i * 270 / (stage.alternatives.length - 1) : optional ? 405 : 270,
    }));
    points.push(...nodes);
    const entry = branch || optional ? { id: `in-${index}`, index, x:x-95, y:270 } : nodes[0];
    const exit = branch || optional ? { id: `out-${index}`, index, x:x+95, y:270 } : nodes[0];
    if (branch || optional) {
      nodes.forEach(p => { link(entry, p, p.id, optional); link(p, exit, p.id, optional); });
      if (optional) link(entry, exit, `skip-${nodes[0].id}`, true);
    }
    if (columns.length) link(columns.at(-1).exit, entry);
    columns.push({ entry, exit });
  });
  return { points, links, width:Math.max(960, stageX(stages.length - 1) + 140), height:MAP_HEIGHT };
}
