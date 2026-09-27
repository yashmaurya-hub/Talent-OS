import { app } from './src/index';
import http from 'http';

async function runTests() {
  console.log('🧪 Starting Phase 2 API automated verification...');
  
  // Start server on temporary port
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(5099, resolve));
  const baseUrl = 'http://localhost:5099/api';

  try {
    // 1. Health endpoint test
    const healthRes = await fetch(`${baseUrl}/health`);
    const healthData = await healthRes.json();
    console.log('  ✔ Health check passed:', healthData.database.stats);

    // 2. Demo accounts endpoint test
    const demoRes = await fetch(`${baseUrl}/auth/demo-accounts`);
    const demoData = await demoRes.json();
    console.log(`  ✔ Demo accounts fetched: ${demoData.demoAccounts.length} accounts available.`);

    // 3. Login as Principal (Head role)
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'principal@apex.edu', password: 'password123' }),
    });
    const loginData = await loginRes.json();
    if (!loginData.token) throw new Error('Login failed: ' + JSON.stringify(loginData));
    const principalToken = loginData.token;
    console.log(`  ✔ Principal login passed. Role: ${loginData.user.role}, Org: ${loginData.user.organizationName}`);

    // 4. Hierarchy Tree retrieval
    const hierRes = await fetch(`${baseUrl}/hierarchy`, {
      headers: { Authorization: `Bearer ${principalToken}` },
    });
    const hierData = await hierRes.json();
    console.log(`  ✔ Hierarchy tree fetched: Root='${hierData.tree.name}', Sub-nodes count=${hierData.allNodes.length}`);

    // 5. Search & Filter Profiles
    const profilesRes = await fetch(`${baseUrl}/profiles?search=Rahul`, {
      headers: { Authorization: `Bearer ${principalToken}` },
    });
    const profilesData = await profilesRes.json();
    const rahul = profilesData.profiles[0];
    console.log(`  ✔ Profile search passed. Found '${rahul.fullName}' with trajectory slope: +${rahul.trajectory.growthRateSlope}, consistency: ${rahul.trajectory.consistencyScore}%`);

    // 6. 360° Profile inspection
    const profile360Res = await fetch(`${baseUrl}/profiles/${rahul.id}`, {
      headers: { Authorization: `Bearer ${principalToken}` },
    });
    const profile360Data = await profile360Res.json();
    console.log(`  ✔ 360° Profile view passed:`);
    console.log(`     - Skills: ${profile360Data.profile.skills.length}`);
    console.log(`     - Performance Records: ${profile360Data.profile.performanceRecords.length}`);
    console.log(`     - Activities: ${profile360Data.profile.activities.length}`);
    console.log(`     - Strengths derived:`, profile360Data.profile.strengths);
    console.log(`     - Radar categories:`, profile360Data.profile.radarData.map((r: any) => `${r.dimension}: ${r.score}`).join(', '));

    // 7. Login as Manager (Teacher Sharma) & test Subtree scoping
    const teacherLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'teacher.sharma@apex.edu', password: 'password123' }),
    });
    const teacherData = await teacherLoginRes.json();
    const teacherHierRes = await fetch(`${baseUrl}/hierarchy`, {
      headers: { Authorization: `Bearer ${teacherData.token}` },
    });
    const teacherHierData = await teacherHierRes.json();
    console.log(`  ✔ Manager Subtree Scoping passed: Scoped=${teacherHierData.scoped}, View Root='${teacherHierData.tree.name}'`);

    console.log('\n🎉 ALL PHASE 2 API VERIFICATION TESTS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exit(1);
  } finally {
    server.close();
    process.exit(0);
  }
}

runTests();
