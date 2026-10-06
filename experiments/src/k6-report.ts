// Builds results/load-<stamp>.md from the k6 summaries written by k6/run.sh.
//   node src/k6-report.ts <stamp>
import { readFile, writeFile } from 'node:fs/promises';

type Metric = Record<string, number>;
interface Summary {
  metrics: Record<string, Metric>;
}

const stamp = process.argv[2];
if (!stamp) throw new Error('usage: node src/k6-report.ts <stamp>');
const results = new URL('../results/', import.meta.url);

const load = async <T>(name: string): Promise<T> =>
  JSON.parse(await readFile(new URL(`k6-${stamp}-${name}.json`, results), 'utf8'));

const ms = (value: number | undefined) => (value === undefined ? '—' : `${value.toFixed(0)} ms`);

const row = (title: string, summary: Summary, endpoint: string) => {
  const duration = summary.metrics[`http_req_duration{name:${endpoint}}`] ?? summary.metrics.http_req_duration;
  const requests = summary.metrics.http_reqs;
  const failed = summary.metrics.http_req_failed;
  return `| ${title} | ${requests.count} | ${requests.rate.toFixed(1)} | ${ms(duration.med)} | ${ms(duration['p(95)'])} | ${ms(duration.max)} | ${((failed.value ?? 0) * 100).toFixed(2)}% |`;
};

const upload = await load<Summary>('post-song');
const events = await load<Summary>('events');
const feedUp = await load<Summary>('feed-up');
const feedDown = await load<Summary>('feed-down');
const drain = await load<{ analytics_drain_sec: number }>('drain');

const accepted = events.metrics.events_accepted;
const fallbackUp = feedUp.metrics.popular_fallback?.count ?? 0;
const fallbackDown = feedDown.metrics.popular_fallback?.count ?? 0;

const report = [
  `# Load tests — ${stamp}`,
  '',
  'k6 in Docker inside the compose network; fake AI providers (the architecture is measured, not the Groq rate limit). Request rate includes the setup requests.',
  '',
  '| Test | Requests | Req/s | Median | p95 | Max | Failed |',
  '|---|---|---|---|---|---|---|',
  row('POST /song (5 VUs, 30 s)', upload, 'POST /song'),
  row('POST /events (20 users, batches of 20, 60 s)', events, 'POST /events'),
  row('GET /song/recommended, Recommendations up (10 VUs, 20 s)', feedUp, 'GET /song/recommended'),
  row('GET /song/recommended, Recommendations paused (10 VUs, 20 s)', feedDown, 'GET /song/recommended'),
  '',
  `- Player events accepted: ${accepted?.count ?? 0} (${(accepted?.rate ?? 0).toFixed(1)} events/s); Analytics worked off its queue ${drain.analytics_drain_sec} s after the test ended.`,
  `- Popular fallback answers: ${fallbackUp} with Recommendations up, ${fallbackDown} with it paused.`,
  '',
].join('\n');

console.log(report);
await writeFile(new URL(`load-${stamp}.md`, results), report);
