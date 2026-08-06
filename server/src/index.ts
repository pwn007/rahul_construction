import { createApp } from './app.js';
import { config } from './config/index.js';
import { RESOURCES } from './repositories/registry.js';

const app = createApp();

app.listen(config.port, () => {
  console.log(`\n  Neetu Archstone API`);
  console.log(`  ────────────────────────────────────────`);
  console.log(`  Mode      ${config.env}`);
  console.log(`  URL       http://localhost:${config.port}/api`);
  console.log(`  Health    http://localhost:${config.port}/api/health`);
  console.log(`  Resources ${RESOURCES.length} (${RESOURCES.slice(0, 5).join(', ')}…)`);
  console.log(`  Storage   JSON files (Prisma-ready — see repositories/registry.ts)\n`);
});
