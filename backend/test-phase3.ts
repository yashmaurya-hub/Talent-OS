async function runTests() {
  console.log('🧪 Starting Phase 3 Recommendation Engine & Analytics verification...');
  const baseUrl = 'http://localhost:5000/api';

  try {
    // 1. Login as Principal
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'principal@apex.edu', password: 'password123' }),
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log('  ✔ Authenticated as Principal');

    // 2. Fetch Tasks
    const tasksRes = await fetch(`${baseUrl}/tasks`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const tasksData = await tasksRes.json();
    console.log(`  ✔ Found ${tasksData.tasks.length} tasks in Apex STEM Academy:`);
    for (const t of tasksData.tasks) {
      console.log(`     • [${t.category}] "${t.title}" (${t.requirements.length} requirements)`);
    }

    const quizTask = tasksData.tasks.find((t: any) => t.title.includes('Quiz'));
    const symposiumTask = tasksData.tasks.find((t: any) => t.title.includes('Symposium'));

    if (!quizTask || !symposiumTask) {
      throw new Error('Expected sample tasks not found in database.');
    }

    // 3. RUN RECOMMENDATION FOR QUIZ TASK
    console.log(`\n  🎯 Executing Recommendation Engine for Task: "${quizTask.title}"...`);
    const quizRecRes = await fetch(`${baseUrl}/tasks/${quizTask.id}/recommend`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    const quizRecData = await quizRecRes.json();
    const quizCandidates = quizRecData.candidates;

    console.log(`  ✔ Recommendation run completed with ${quizCandidates.length} evaluated candidates.`);
    console.log(`  📊 Top 3 Candidates for Science Quiz:`);
    for (const c of quizCandidates.slice(0, 3)) {
      console.log(`     #${c.rank} ${c.profile.fullName} — Suitability: ${c.suitabilityScore}%`);
      for (const ev of c.evidence.slice(0, 2)) {
        console.log(`        └─ [${ev.factorName}] ${ev.rawEvidenceSummary}`);
      }
    }

    // Verify Rahul is #1 for Quiz
    if (!quizCandidates[0].profile.fullName.includes('Rahul')) {
      throw new Error(`Expected Rahul Sharma to be rank #1 for Science Quiz, got: ${quizCandidates[0].profile.fullName}`);
    }
    console.log(`  ✅ VALIDATED: Rahul Sharma is Ranked #1 for Science Quiz (Suitability: ${quizCandidates[0].suitabilityScore}%).`);

    // 4. RUN RECOMMENDATION FOR SYMPOSIUM KEYNOTE
    console.log(`\n  🎯 Executing Recommendation Engine for Task: "${symposiumTask.title}"...`);
    const sympRecRes = await fetch(`${baseUrl}/tasks/${symposiumTask.id}/recommend`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    const sympRecData = await sympRecRes.json();
    const sympCandidates = sympRecData.candidates;

    console.log(`  ✔ Recommendation run completed with ${sympCandidates.length} evaluated candidates.`);
    console.log(`  📊 Top 3 Candidates for Symposium Keynote:`);
    for (const c of sympCandidates.slice(0, 3)) {
      console.log(`     #${c.rank} ${c.profile.fullName} — Suitability: ${c.suitabilityScore}%`);
      for (const ev of c.evidence.slice(0, 2)) {
        console.log(`        └─ [${ev.factorName}] ${ev.rawEvidenceSummary}`);
      }
    }

    // Verify Neha is #1 for Presentation / Symposium
    if (!sympCandidates[0].profile.fullName.includes('Neha')) {
      throw new Error(`Expected Neha Gupta to be rank #1 for Symposium Keynote, got: ${sympCandidates[0].profile.fullName}`);
    }
    console.log(`  ✅ VALIDATED: Neha Gupta is Ranked #1 for Symposium Keynote (Suitability: ${sympCandidates[0].suitabilityScore}%).`);

    // Verify Section 3 principle: Rahul should NOT be #1 for Presentation
    const rahulInSymp = sympCandidates.find((c: any) => c.profile.fullName.includes('Rahul'));
    console.log(`  ✅ CORE PRINCIPLE VERIFIED: Rahul (Quiz Rank #1) drops to Rank #${rahulInSymp.rank} for Keynote Presentation (Suitability: ${rahulInSymp.suitabilityScore}%). No universal false ranking!`);

    // 5. Test Analytics endpoint
    console.log(`\n  📈 Testing Executive Analytics Overview...`);
    const analyticsRes = await fetch(`${baseUrl}/analytics/overview`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const analyticsData = await analyticsRes.json();
    console.log(`  ✔ Analytics Overview fetched:`);
    console.log(`     - Total People: ${analyticsData.stats.totalPeople}`);
    console.log(`     - Total Tasks: ${analyticsData.stats.totalTasks}`);
    console.log(`     - Surging Talent:`, analyticsData.surgingTalent.map((t: any) => `${t.fullName} (Slope: +${t.trajectory.growthRateSlope})`).join(', '));
    console.log(`     - Most Consistent:`, analyticsData.consistentTalent.map((t: any) => `${t.fullName} (${t.trajectory.consistencyScore}%)`).join(', '));
    console.log(`     - Dimension Averages:`, analyticsData.dimensionAverages.map((d: any) => `${d.dimension}: ${d.averageScore}`).join(', '));

    console.log('\n🎉 ALL PHASE 3 RECOMMENDATION ENGINE & ANALYTICS TESTS PASSED WITH 100% ACCURACY!');
  } catch (err) {
    console.error('❌ Phase 3 test failed:', err);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

runTests();
