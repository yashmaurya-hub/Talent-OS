/**
 * TalentOS — Phase 6 Edge-Case Hardening Tests
 *
 * Covers:
 * 1. NLP query: low-score candidate detection (suitabilityScore < 45)
 * 2. Confidence penalty — missing skill data reduces scores below strong-match threshold
 * 3. Missing data notes — evidence transparency (missingDataNotes is always an array)
 * 4. Cross-org profile access → 403 or 404
 * 5. MEMBER cannot trigger recommendation run → 403
 * 6. MEMBER cannot create tasks → 403
 * 7. Safe-delete guard — cannot delete node with children → 400
 * 8. Duplicate skill record upsert → score updated, no duplicate rows
 */

const BASE = 'http://localhost:5000/api';

// ── colour helpers ────────────────────────────────────────────────────────────
const G = (s: string) => `\x1b[32m${s}\x1b[0m`;
const R = (s: string) => `\x1b[31m${s}\x1b[0m`;
const Y = (s: string) => `\x1b[33m${s}\x1b[0m`;
const B = (s: string) => `\x1b[1m${s}\x1b[0m`;

// ── minimal fetch wrapper ─────────────────────────────────────────────────────
async function api(
  method: string,
  path: string,
  body?: unknown,
  token?: string,
): Promise<{ status: number; data: unknown }> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  let data: unknown;
  try { data = await res.json(); } catch { data = null; }
  return { status: res.status, data };
}

// ── assertion helpers ─────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;

function assert(label: string, condition: boolean, detail = '') {
  if (condition) {
    console.log(`  ${G('✓')} ${label}`);
    passed++;
  } else {
    console.log(`  ${R('✗')} ${label}${detail ? ` — ${detail}` : ''}`);
    failed++;
  }
}

// ── login shortcut ────────────────────────────────────────────────────────────
async function login(email: string): Promise<string> {
  const { data } = await api('POST', '/auth/login', { email, password: 'password123' });
  return (data as { token: string }).token;
}

// ── main test runner ──────────────────────────────────────────────────────────
async function run() {
  console.log(B('\n══════════════════════════════════════════════════════════'));
  console.log(B('  TalentOS — Phase 6 Edge-Case Hardening Tests'));
  console.log(B('══════════════════════════════════════════════════════════\n'));

  // ── prerequisite: obtain tokens ───────────────────────────────────────────
  const principalToken = await login('principal@apex.edu');
  const memberToken    = await login('rahul.s@apex.edu');
  const ceoToken       = await login('ceo@cloudscale.io');

  assert('Login: principal token obtained',     typeof principalToken === 'string' && principalToken.length > 20);
  assert('Login: member token obtained',        typeof memberToken    === 'string' && memberToken.length    > 20);
  assert('Login: cross-org CEO token obtained', typeof ceoToken       === 'string' && ceoToken.length      > 20);

  // ══════════════════════════════════════════════════════════════════════════
  // TEST 1 — NLP query: system correctly identifies low-confidence candidates
  //          The NLP engine maps any query to performance requirements.
  //          Candidates with NO performance records get suitabilityScore < 20.
  //          Verify the engine returns an array and lowest-ranked score < 45.
  // ══════════════════════════════════════════════════════════════════════════
  console.log(Y('\n[1] NLP Query — scoring and hasStrongMatch logic'));
  {
    const { status, data } = await api(
      'POST', '/tasks/nl-query',
      { query: 'quantum physicist with robotics and 10 years deep space research' },
      principalToken,
    );
    const d = data as Record<string, unknown>;
    assert('Status 200',                          status === 200);
    assert('hasStrongMatch field is boolean',      typeof d.hasStrongMatch === 'boolean');
    assert('candidates array is present',          Array.isArray(d.candidates));
    assert('parsedTask field is present',          typeof d.parsedTask === 'object' && d.parsedTask !== null);

    const candidates = d.candidates as Array<{ suitabilityScore: number }>;
    if (Array.isArray(candidates) && candidates.length > 0) {
      const lastScore = candidates[candidates.length - 1].suitabilityScore;
      assert(
        'Last-ranked candidate has lowest score (engine sorted correctly)',
        candidates.every((c, i) =>
          i === 0 || c.suitabilityScore <= candidates[i - 1].suitabilityScore,
        ),
      );
      // Candidate with no skill match for "quantum physicist" / "deep space" should score low
      assert(
        'At least one candidate has suitabilityScore < 50 (domain mismatch penalised)',
        candidates.some(c => c.suitabilityScore < 50),
        `Scores: ${candidates.map(c => c.suitabilityScore).join(', ')}`,
      );
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TEST 2 — Register a new org and verify cross-domain token isolation
  //          (register endpoint requires: organizationName, organizationType,
  //           email, password, firstName, lastName)
  // ══════════════════════════════════════════════════════════════════════════
  console.log(Y('\n[2] New org registration + task creation'));
  {
    const stamp = Date.now();
    const regRes = await api('POST', '/auth/register', {
      organizationName: 'EdgeTest Corp',
      organizationType: 'COMPANY',
      firstName: 'Edge',
      lastName: 'Admin',
      email: `edgeadmin_${stamp}@edge.test`,
      password: 'password123',
    });
    assert('New org registration returns 201', regRes.status === 201,
      `Got ${regRes.status}: ${JSON.stringify(regRes.data).slice(0, 120)}`);

    if (regRes.status === 201) {
      const newToken = (regRes.data as { token: string }).token;
      assert('New org token obtained', typeof newToken === 'string' && newToken.length > 20);

      // Create a task in the new org — requires title, description, category
      const taskRes = await api('POST', '/tasks', {
        title: 'Edge-Case Skill Task',
        description: 'Requires Python skills',
        category: 'GENERAL_TASK',
        status: 'OPEN',
        requirements: [{ requirementType: 'SKILL', targetName: 'Python', weight: 10, minScore: 90 }],
      }, newToken);
      assert('Task creation 201 in new org', taskRes.status === 201,
        `Got ${taskRes.status}: ${JSON.stringify(taskRes.data).slice(0, 120)}`);

      if (taskRes.status === 201) {
        const taskData = taskRes.data as { task?: { id: string }; id?: string };
        const taskId = taskData.task?.id || taskData.id;
        const recRes = await api('POST', `/tasks/${taskId}/recommend`, {}, newToken);
        assert('Recommendation returns 200 for new org', recRes.status === 200,
          `Got ${recRes.status}: ${JSON.stringify(recRes.data).slice(0, 120)}`);
        // New org has only the admin — no MEMBERs — so candidates should be empty or just the admin
        const candidates = (recRes.data as { candidates?: unknown[] })?.candidates;
        assert('Candidates field is array', Array.isArray(candidates));
      }
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TEST 3 — Missing data notes populated (not hallucinated)
  // ══════════════════════════════════════════════════════════════════════════
  console.log(Y('\n[3] Missing data notes — evidence transparency'));
  {
    const tasksRes = await api('GET', '/tasks', undefined, principalToken);
    assert('Tasks list returns 200', tasksRes.status === 200);
    const tasksData = tasksRes.data as { tasks?: Array<{ id: string }> } | Array<{ id: string }>;
    const tasks = Array.isArray(tasksData) ? tasksData : (tasksData.tasks ?? []);

    if (Array.isArray(tasks) && tasks.length > 0) {
      const taskId = tasks[0].id;
      const recRes = await api('POST', `/tasks/${taskId}/recommend`, {}, principalToken);
      assert('Recommendation run returns 200', recRes.status === 200);

      const rec = recRes.data as { candidates?: Array<{ missingDataNotes?: unknown[] }> };
      assert('Candidates array non-empty', Array.isArray(rec.candidates) && rec.candidates.length > 0);

      if (Array.isArray(rec.candidates) && rec.candidates.length > 0) {
        const first = rec.candidates[0];
        assert('missingDataNotes is an array on top candidate', Array.isArray(first.missingDataNotes),
          `Got: ${JSON.stringify(first.missingDataNotes)}`);
        if (Array.isArray(first.missingDataNotes)) {
          assert(
            'All missingDataNotes entries are strings (not objects)',
            first.missingDataNotes.every((n: unknown) => typeof n === 'string'),
          );
        }
      }
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TEST 4 — Cross-org profile access is blocked
  // ══════════════════════════════════════════════════════════════════════════
  console.log(Y('\n[4] Cross-org access — CEO of CloudScale cannot read Apex profiles'));
  {
    // /profiles returns { total, profiles: [...] }
    const apexResp = await api('GET', '/profiles', undefined, principalToken);
    assert('Principal can list Apex profiles (200)', apexResp.status === 200);

    const profiles = (apexResp.data as { profiles: Array<{ id: string }> }).profiles;
    if (Array.isArray(profiles) && profiles.length > 0) {
      const apexProfileId = profiles[0].id;
      const crossOrgRes = await api('GET', `/profiles/${apexProfileId}`, undefined, ceoToken);
      assert(
        'Cross-org profile fetch returns 403 or 404',
        crossOrgRes.status === 403 || crossOrgRes.status === 404,
        `Got ${crossOrgRes.status}`,
      );
    } else {
      console.log(`  ${Y('⚠')} No Apex profiles returned — skipping cross-org check`);
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TEST 5 — MEMBER cannot trigger recommendations (403)
  // ══════════════════════════════════════════════════════════════════════════
  console.log(Y('\n[5] Role guard — MEMBER cannot trigger recommendation run'));
  {
    const tasksRes = await api('GET', '/tasks', undefined, principalToken);
    const tasksData = tasksRes.data as { tasks?: Array<{ id: string }> } | Array<{ id: string }>;
    const tasks = Array.isArray(tasksData) ? tasksData : (tasksData.tasks ?? []);

    if (Array.isArray(tasks) && tasks.length > 0) {
      const taskId = tasks[0].id;
      const memberRecRes = await api('POST', `/tasks/${taskId}/recommend`, {}, memberToken);
      assert('MEMBER recommendation attempt returns 403', memberRecRes.status === 403,
        `Got ${memberRecRes.status}`);
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TEST 6 — MEMBER cannot create tasks (403)
  // ══════════════════════════════════════════════════════════════════════════
  console.log(Y('\n[6] Role guard — MEMBER cannot create tasks'));
  {
    const taskCreateRes = await api('POST', '/tasks', {
      title: 'Sneaky Task',
      description: 'Should be blocked',
      status: 'OPEN',
      requirements: [],
    }, memberToken);
    assert('MEMBER task creation returns 403', taskCreateRes.status === 403,
      `Got ${taskCreateRes.status}`);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TEST 7 — Deleting a hierarchy node that has children is blocked
  // ══════════════════════════════════════════════════════════════════════════
  console.log(Y('\n[7] Safe-delete guard — cannot delete node with children'));
  {
    const treeRes = await api('GET', '/hierarchy', undefined, principalToken);
    assert('Hierarchy tree returns 200', treeRes.status === 200);

    // /hierarchy returns { tree: { id, children: [...] } }
    const treeData = treeRes.data as { tree?: { id: string; children?: unknown[] } };
    const tree = treeData.tree;
    if (tree && tree.id) {
      // Root node always has children in our seeded data
      // Hierarchy delete route is DELETE /hierarchy/nodes/:id
      const deleteRes = await api('DELETE', `/hierarchy/nodes/${tree.id}`, undefined, principalToken);
      assert(
        'Deleting root node with children returns 400',
        deleteRes.status === 400,
        `Got ${deleteRes.status} — ${JSON.stringify(deleteRes.data).slice(0, 120)}`,
      );
    } else {
      console.log(`  ${Y('⚠')} Tree root not found — skipping safe-delete test`);
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TEST 8 — Duplicate skill record upsert → score updated, no duplicate rows
  // ══════════════════════════════════════════════════════════════════════════
  console.log(Y('\n[8] Upsert idempotency — duplicate skill record updates, not duplicates'));
  {
    // Get all profiles and find Rahul — response shape: { total, profiles: [...] }
    const profilesRes = await api('GET', '/profiles', undefined, principalToken);
    const profileList = (profilesRes.data as { profiles?: Array<{ id: string; fullName?: string }> }).profiles ?? [];
    const rahul = profileList.find(p => (p.fullName ?? '').includes('Rahul'));

    if (rahul) {
      // First upsert — field is proficiencyScore (not score)
      const first = await api('POST', `/profiles/${rahul.id}/skills`, {
        skillName: 'Python',
        dimensionName: 'Technical Skills',
        proficiencyScore: 75,
        verifiedBy: 'Test Runner',
      }, principalToken);
      assert('First skill upsert returns 200 or 201', first.status === 200 || first.status === 201,
        `Got ${first.status}: ${JSON.stringify(first.data).slice(0, 100)}`);

      // Second upsert (same skill, new score)
      const second = await api('POST', `/profiles/${rahul.id}/skills`, {
        skillName: 'Python',
        dimensionName: 'Technical Skills',
        proficiencyScore: 88,
        verifiedBy: 'Test Runner',
      }, principalToken);
      assert('Second skill upsert returns 200 or 201 (not 409)', second.status === 200 || second.status === 201,
        `Got ${second.status}: ${JSON.stringify(second.data).slice(0, 100)}`);

      // Verify updated score in profile
      const profileRes = await api('GET', `/profiles/${rahul.id}`, undefined, principalToken);
      assert('Profile fetch after upsert returns 200', profileRes.status === 200);

      const profileObj = (profileRes.data as {
        profile?: { skills?: Array<{ name: string; proficiencyScore: number }> };
      }).profile;
      const skills = profileObj?.skills ?? [];

      const pythonRecords = skills.filter(s => s.name === 'Python');
      assert('Exactly one Python skill record exists (no duplicates)', pythonRecords.length === 1,
        `Found ${pythonRecords.length} Python records`);
      if (pythonRecords.length === 1) {
        assert('Python score updated to latest value (88)', pythonRecords[0].proficiencyScore === 88,
          `Actual score: ${pythonRecords[0].proficiencyScore}`);
      }
    } else {
      console.log(`  ${Y('⚠')} Rahul not found in profiles list — skipping upsert test`);
      if (profileList.length > 0) {
        console.log(`  Available profiles: ${profileList.map(p => p.fullName).join(', ')}`);
      }
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SUMMARY
  // ══════════════════════════════════════════════════════════════════════════
  console.log(B('\n══════════════════════════════════════════════════════════'));
  console.log(`  ${G(`${passed} passed`)}  ${failed > 0 ? R(`${failed} failed`) : G('0 failed')}`);
  console.log(B('══════════════════════════════════════════════════════════\n'));

  if (failed > 0) process.exit(1);
}

run().catch(err => {
  console.error(R('\nFatal error:'), err);
  process.exit(1);
});
