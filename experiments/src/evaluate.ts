// Offline evaluation of the recommendations on a simulation run.
//
// Ground truth: the held-out songs (not heard by the user) the user's persona
// would enjoy (affinity >= RELEVANT_AFFINITY). Every variant ranks the songs
// for each user; hit rate@k, precision@k and recall@k are averaged over users.
//
//   npm run evaluate            (RUN=<run id>, default: the latest run)
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { faker } from '@faker-js/faker';
import type { RecommendationsResponse } from '@platform/contracts';
import { config } from './config.ts';
import { average, listMetrics, type ListMetrics } from './metrics.ts';
import { affinity, PERSONAS, RELEVANT_AFFINITY } from './personas.ts';
import type { SimulationRun } from './simulate.ts';

const KS = [5, 10];
/** weights: content, collaborative, popularity */
const VARIANTS: Record<string, string | null> = {
  'hybrid (0.6 / 0.3 / 0.1)': '0.6,0.3,0.1',
  'content only': '1,0,0',
  'collaborative only': '0,1,0',
  'popularity (baseline)': '0,0,1',
  'random (baseline)': null,
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const log = (...args: unknown[]) => console.log(new Date().toISOString().slice(11, 19), ...args);
const pct = (value: number) => `${(value * 100).toFixed(1)}%`;

const loadRun = async (): Promise<SimulationRun> => {
  const dir = new URL('../data/', import.meta.url);
  const name = process.env.RUN
    ? `run-${process.env.RUN}.json`
    : (await readdir(dir)).filter((file) => file.startsWith('run-')).sort().at(-1);
  if (!name) throw new Error('no simulation run: npm run simulate first');
  return JSON.parse(await readFile(new URL(name, dir), 'utf8'));
};

/** Profiles are recomputed in batches: wait until every user's is fresh. */
const waitForProfiles = async (run: SimulationRun) => {
  const deadline = Date.now() + 10 * 60_000;
  for (;;) {
    const pending = [];
    for (const user of run.users) {
      const response = await fetch(`${config.analyticsUrl}/profiles/${user.id}`);
      if (!response.ok) throw new Error(`analytics debug view: ${response.status} (ANALYTICS_DEBUG_ENDPOINTS=true?)`);
      const profile = (await response.json()) as { pending: boolean; computed_at: string | null };
      if (profile.pending || !profile.computed_at) pending.push(user.id);
    }
    if (pending.length === 0) return;
    if (Date.now() > deadline) throw new Error(`profiles still pending: ${pending.join(', ')}`);
    log(`${pending.length} profile(s) pending, waiting...`);
    await sleep(10_000);
  }
};

const recommend = async (userId: number, weights: string): Promise<number[]> => {
  const response = await fetch(
    `${config.recommendationsUrl}/recommendations/users/${userId}?limit=50&weights=${weights}`,
  );
  if (!response.ok) throw new Error(`recommendations: ${response.status}`);
  const body = (await response.json()) as RecommendationsResponse;
  return body.items.map((item) => item.song_id);
};

const main = async () => {
  const run = await loadRun();
  log(`run ${run.run}: ${run.catalog.length} songs, ${run.users.length} users`);
  await waitForProfiles(run);
  // profile.updated / scores.updated reach Recommendations through RabbitMQ
  await sleep(5000);

  const catalogIds = new Set(run.catalog.map((song) => song.id));
  const tagsOf = new Map(run.catalog.map((song) => [song.id, song.tags]));
  faker.seed(run.seed);

  const results: Record<string, Record<number, ListMetrics[]>> = {};
  const byPersona: Record<string, Record<string, ListMetrics[]>> = {};
  let evaluated = 0;
  let relevantTotal = 0;
  let heldOutTotal = 0;

  for (const user of run.users) {
    const persona = PERSONAS.find((p) => p.name === user.persona)!;
    const exposed = new Set(user.exposed);
    const heldOut = run.catalog.map((song) => song.id).filter((id) => !exposed.has(id));
    const relevant = new Set(heldOut.filter((id) => affinity(persona, tagsOf.get(id)!) >= RELEVANT_AFFINITY));
    if (relevant.size === 0) continue;
    evaluated += 1;
    relevantTotal += relevant.size;
    heldOutTotal += heldOut.length;

    for (const [variant, weights] of Object.entries(VARIANTS)) {
      // only this run's held-out songs: other songs in the database and the
      // songs the user already heard are not part of the experiment
      const ranked = weights
        ? (await recommend(user.id, weights)).filter((id) => catalogIds.has(id) && !exposed.has(id))
        : faker.helpers.shuffle(heldOut);

      for (const k of KS) {
        ((results[variant] ??= {})[k] ??= []).push(listMetrics(ranked, relevant, k));
      }
      ((byPersona[variant] ??= {})[user.persona] ??= []).push(listMetrics(ranked, relevant, 10));
    }
  }

  const header = `| Variant | ${KS.map((k) => `HR@${k} | P@${k} | R@${k}`).join(' | ')} |`;
  const divider = `|---|${KS.map(() => '---|---|---').join('|')}|`;
  const rows = Object.keys(VARIANTS).map((variant) => {
    const cells = KS.map((k) => {
      const m = average(results[variant][k]);
      return `${pct(m.hit)} | ${pct(m.precision)} | ${pct(m.recall)}`;
    });
    return `| ${variant} | ${cells.join(' | ')} |`;
  });

  const personaHeader = `| Persona | ${Object.keys(VARIANTS).join(' | ')} |`;
  const personaDivider = `|---|${Object.keys(VARIANTS).map(() => '---').join('|')}|`;
  const personaRows = PERSONAS.map(
    (p) => `| ${p.name} | ${Object.keys(VARIANTS).map((v) => pct(average(byPersona[v]?.[p.name] ?? []).precision)).join(' | ')} |`,
  );

  const report = [
    `# Offline evaluation — run ${run.run}`,
    '',
    `- Catalogue: ${run.catalog.length} songs; users: ${run.users.length} (${PERSONAS.length} personas), evaluated: ${evaluated}; seed ${run.seed}`,
    `- Behaviour: ${JSON.stringify(run.behaviour)}`,
    `- Each user heard 50% of the catalogue; ground truth: held-out songs with persona affinity >= ${RELEVANT_AFFINITY} (on average ${(relevantTotal / evaluated).toFixed(1)} relevant of ${(heldOutTotal / evaluated).toFixed(1)} held-out songs, random precision ≈ ${pct(relevantTotal / heldOutTotal)})`,
    '- HR = hit rate (at least one relevant song in the top k), P = precision, R = recall',
    '',
    header,
    divider,
    ...rows,
    '',
    '## Precision@10 by persona',
    '',
    personaHeader,
    personaDivider,
    ...personaRows,
    '',
  ].join('\n');

  console.log(`\n${report}`);
  await mkdir(new URL('../results/', import.meta.url), { recursive: true });
  const file = new URL(`../results/offline-${run.run}.md`, import.meta.url);
  await writeFile(file, report);
  log(`saved ${file.pathname}`);
};

await main();
