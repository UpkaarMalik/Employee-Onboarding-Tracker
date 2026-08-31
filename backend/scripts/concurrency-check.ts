import 'dotenv/config';

const BASE_URL = process.env.CONCURRENCY_CHECK_BASE_URL || 'http://localhost:3000';

/**
 * One-off verification script for Day 5 Step 5.8 — fires two concurrent
 * requests at the same task's SERIALIZABLE-protected transition endpoint
 * and asserts exactly one wins while the other is rejected with a 409.
 * Not part of the app; run manually with `npx ts-node scripts/concurrency-check.ts`.
 */
async function main() {
  const identifier = process.argv[2];
  const password = process.argv[3];
  const taskId = process.argv[4];

  if (!identifier || !password || !taskId) {
    console.error('Usage: ts-node concurrency-check.ts <identifier> <password> <taskId>');
    process.exit(1);
  }

  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password }),
  });
  const loginData = await loginRes.json();
  if (!loginRes.ok) {
    console.error('Login failed:', loginData);
    process.exit(1);
  }
  const headers = { Authorization: `Bearer ${loginData.accessToken}` };

  console.log(`Firing two concurrent PATCH /tasks/${taskId}/start requests...`);

  const results = await Promise.all(
    [1, 2].map((n) =>
      fetch(`${BASE_URL}/tasks/${taskId}/start`, { method: 'PATCH', headers }).then(async (res) => ({
        attempt: n,
        status: res.status,
        body: await res.json(),
      })),
    ),
  );

  results.forEach((r) => console.log(`  attempt ${r.attempt}: HTTP ${r.status}`, r.body));

  const succeeded = results.filter((r) => r.status === 200);
  const conflicted = results.filter((r) => r.status === 409);

  console.log(`\nSucceeded: ${succeeded.length}, Conflicted (409): ${conflicted.length}`);

  if (succeeded.length === 1 && conflicted.length === 1) {
    console.log('✔ PASS — exactly one request won the race, the other was correctly rejected with 409.');
  } else {
    console.log('✘ Did not match the expected 1-success/1-conflict outcome.');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Script failed:', err);
  process.exit(1);
});
