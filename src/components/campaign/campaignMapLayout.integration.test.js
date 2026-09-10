import {it,expect} from 'vitest';
import {campaignMapLayout} from './campaignMapLayout.js';
import {FIRST_ACT_STAGES,firstActNode} from '../../campaign/data/firstAct.js';
const stages=FIRST_ACT_STAGES.map(ids=>({alternatives:ids.map(firstActNode)}));
it('connects every stage via explicit forks and joins, including the optional rift bypass',()=>{
 const {points,links,width,height}=campaignMapLayout(stages);
 const walk=(id,seen=new Set())=>{if(seen.has(id))return seen;seen.add(id);links.filter(l=>l.from.id===id).forEach(l=>walk(l.to.id,seen));return seen;};
 const reachable=walk('I1');
 expect(points.every(p=>reachable.has(p.id))).toBe(true);
 for(const p of points){expect(p.x).toBeGreaterThan(0);expect(p.x).toBeLessThan(width);expect(p.y+120).toBeLessThan(height);}
 for(const l of links){expect(l.to.x).toBeGreaterThan(l.from.x);expect(l.d.startsWith(`M${l.from.x} ${l.from.y}`)).toBe(true);}
 const a=points.find(p=>p.id==='I9A'),b=points.find(p=>p.id==='I9B');
 expect(a.x).toBe(b.x);expect(a.y).not.toBe(b.y);
 expect(links.find(l=>l.from.id==='I9A').to.id).toBe(links.find(l=>l.from.id==='I9B').to.id);
 const bypass=links.find(l=>l.routeId==='skip-F2');expect(bypass).toBeTruthy();expect(bypass.from.y).toBe(bypass.to.y);
 expect(links.filter(l=>l.to.id==='F2')).toHaveLength(1);
 expect(links.filter(l=>l.from.id==='F2')).toHaveLength(1);
});
