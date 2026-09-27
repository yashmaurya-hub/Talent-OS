import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting TalentOS database seed...');

  // Clean existing tables in reverse dependency order
  await prisma.recommendationEvidence.deleteMany({});
  await prisma.recommendationCandidate.deleteMany({});
  await prisma.recommendationRun.deleteMany({});
  await prisma.taskRequirement.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.achievement.deleteMany({});
  await prisma.activity.deleteMany({});
  await prisma.performanceRecord.deleteMany({});
  await prisma.skillRecord.deleteMany({});
  await prisma.skill.deleteMany({});
  await prisma.capabilityDimension.deleteMany({});
  await prisma.profile.deleteMany({});
  await prisma.hierarchyNode.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.organization.deleteMany({});

  const defaultPasswordHash = await bcrypt.hash('password123', 10);

  // =========================================================================
  // 1. ORGANIZATION: Apex STEM Academy (School Archetype)
  // =========================================================================
  console.log('🏫 Seeding Apex STEM Academy (School)...');
  const apexOrg = await prisma.organization.create({
    data: {
      name: 'Apex STEM Academy',
      type: 'SCHOOL',
      settings: JSON.stringify({
        primaryColor: '#2563EB',
        termSystem: 'SEMESTER',
        gradingSystem: 'PERCENTAGE_AND_LETTER',
      }),
    },
  });

  // Capability Dimensions for School
  const schoolDims = await Promise.all([
    prisma.capabilityDimension.create({
      data: { organizationId: apexOrg.id, name: 'Academic Mastery', weight: 1.0, description: 'Subject comprehension & analytical problem solving' },
    }),
    prisma.capabilityDimension.create({
      data: { organizationId: apexOrg.id, name: 'Communication & Oratory', weight: 0.9, description: 'Verbal articulation, presentation, and debate' },
    }),
    prisma.capabilityDimension.create({
      data: { organizationId: apexOrg.id, name: 'Leadership & Initiative', weight: 0.8, description: 'Team organization, club leadership, responsibility' },
    }),
    prisma.capabilityDimension.create({
      data: { organizationId: apexOrg.id, name: 'Creativity & Research', weight: 0.85, description: 'Original scientific research, innovation, out-of-box thinking' },
    }),
    prisma.capabilityDimension.create({
      data: { organizationId: apexOrg.id, name: 'Consistency & Discipline', weight: 0.9, description: 'Attendance, steady study habits, reliability over time' },
    }),
  ]);

  const [dimAcademic, dimComm, dimLead, dimCreative, dimConsistency] = schoolDims;

  // Skills for School
  const skillMath = await prisma.skill.create({ data: { organizationId: apexOrg.id, dimensionId: dimAcademic.id, name: 'Mathematics', category: 'CORE' } });
  const skillPhysics = await prisma.skill.create({ data: { organizationId: apexOrg.id, dimensionId: dimAcademic.id, name: 'Physics & Mechanics', category: 'CORE' } });
  const skillChemistry = await prisma.skill.create({ data: { organizationId: apexOrg.id, dimensionId: dimAcademic.id, name: 'Chemistry & Biology', category: 'CORE' } });
  const skillPublicSpeaking = await prisma.skill.create({ data: { organizationId: apexOrg.id, dimensionId: dimComm.id, name: 'Public Speaking', category: 'SOFT_SKILL' } });
  const skillDebate = await prisma.skill.create({ data: { organizationId: apexOrg.id, dimensionId: dimComm.id, name: 'Debate & Argumentation', category: 'SOFT_SKILL' } });
  const skillTeamLeadership = await prisma.skill.create({ data: { organizationId: apexOrg.id, dimensionId: dimLead.id, name: 'Team Leadership', category: 'SOFT_SKILL' } });
  const skillScientificInquiry = await prisma.skill.create({ data: { organizationId: apexOrg.id, dimensionId: dimCreative.id, name: 'Scientific Inquiry', category: 'DOMAIN' } });
  const skillQuizRapidRecall = await prisma.skill.create({ data: { organizationId: apexOrg.id, dimensionId: dimAcademic.id, name: 'Quiz Speed & Recall', category: 'SPECIALIZED' } });

  // Hierarchy Tree for Apex STEM Academy
  // Root: Office of the Principal
  const nodePrincipal = await prisma.hierarchyNode.create({
    data: {
      organizationId: apexOrg.id,
      name: 'Office of the Principal',
      nodeType: 'ADMINISTRATION',
      depth: 0,
      path: '/apex',
    },
  });

  // Level 1: Science & Math Department
  const nodeStemDept = await prisma.hierarchyNode.create({
    data: {
      organizationId: apexOrg.id,
      parentId: nodePrincipal.id,
      name: 'Department of STEM Sciences',
      nodeType: 'DEPARTMENT',
      depth: 1,
      path: `${nodePrincipal.path}/${nodePrincipal.id}`,
    },
  });

  // Level 2: Grade 11-A (Advanced Physics/Math) & Grade 11-B
  const nodeClass11A = await prisma.hierarchyNode.create({
    data: {
      organizationId: apexOrg.id,
      parentId: nodeStemDept.id,
      name: 'Grade 11-A (Advanced STEM)',
      nodeType: 'CLASS',
      depth: 2,
      path: `${nodeStemDept.path}/${nodeStemDept.id}`,
    },
  });

  const nodeClass11B = await prisma.hierarchyNode.create({
    data: {
      organizationId: apexOrg.id,
      parentId: nodeStemDept.id,
      name: 'Grade 11-B (General Science)',
      nodeType: 'CLASS',
      depth: 2,
      path: `${nodeStemDept.path}/${nodeStemDept.id}`,
    },
  });

  // Users & Profiles:
  // 1. Principal
  const userPrincipal = await prisma.user.create({
    data: {
      organizationId: apexOrg.id,
      email: 'principal@apex.edu',
      passwordHash: defaultPasswordHash,
      role: 'HEAD',
      profile: {
        create: {
          hierarchyNodeId: nodePrincipal.id,
          firstName: 'Dr. Evelyn',
          lastName: 'Harrison',
          titleRole: 'Principal & Academic Director',
          department: 'Academic Administration',
          contactEmail: 'principal@apex.edu',
          bio: 'Ph.D. in Educational Leadership with 22 years steering top STEM institutions.',
        },
      },
    },
  });

  // 2. STEM Department Lead (Teacher/Manager)
  const userTeacherSharma = await prisma.user.create({
    data: {
      organizationId: apexOrg.id,
      email: 'teacher.sharma@apex.edu',
      passwordHash: defaultPasswordHash,
      role: 'MANAGER',
      profile: {
        create: {
          hierarchyNodeId: nodeClass11A.id,
          firstName: 'Prof. Rajesh',
          lastName: 'Sharma',
          titleRole: 'Head of Physics & Class 11-A Lead',
          department: 'Department of STEM Sciences',
          contactEmail: 'r.sharma@apex.edu',
          bio: '14 years teaching Olympiad Physics, National Best Teacher Awardee.',
        },
      },
    },
  });

  // 3. Student 1: Rahul Sharma (Candidate A: Science Quiz Star)
  // Science: 88-92%, Quiz: 91%, Science Competitions: 3, Consistency: High
  const userRahul = await prisma.user.create({
    data: {
      organizationId: apexOrg.id,
      email: 'rahul.s@apex.edu',
      passwordHash: defaultPasswordHash,
      role: 'MEMBER',
      profile: {
        create: {
          hierarchyNodeId: nodeClass11A.id,
          firstName: 'Rahul',
          lastName: 'Sharma',
          titleRole: 'Student (Class 11-A)',
          department: 'Grade 11-A',
          contactEmail: 'rahul.s@apex.edu',
          bio: 'Passionate about theoretical physics, astrophysics, and rapid-fire quiz competitions.',
        },
      },
    },
    include: { profile: true },
  });

  const profileRahulId = userRahul.profile!.id;

  await prisma.skillRecord.createMany({
    data: [
      { profileId: profileRahulId, skillId: skillPhysics.id, proficiencyScore: 92, verifiedBy: 'Prof. Rajesh Sharma' },
      { profileId: profileRahulId, skillId: skillChemistry.id, proficiencyScore: 89, verifiedBy: 'Dr. Harrison' },
      { profileId: profileRahulId, skillId: skillMath.id, proficiencyScore: 86, verifiedBy: 'Prof. Rajesh Sharma' },
      { profileId: profileRahulId, skillId: skillQuizRapidRecall.id, proficiencyScore: 94, verifiedBy: 'Quiz Coach' },
      { profileId: profileRahulId, skillId: skillPublicSpeaking.id, proficiencyScore: 68, verifiedBy: 'English Dept' },
      { profileId: profileRahulId, skillId: skillTeamLeadership.id, proficiencyScore: 78, verifiedBy: 'Prof. Rajesh Sharma' },
    ],
  });

  await prisma.performanceRecord.createMany({
    data: [
      { profileId: profileRahulId, category: 'ACADEMIC', title: 'Term 1 Advanced Physics Exam', scoreValue: 90, gradeLetter: 'A+', recordedDate: new Date('2025-09-15'), notes: 'Exceptional grasp of Kinematics and Rotational Dynamics.' },
      { profileId: profileRahulId, category: 'ACADEMIC', title: 'Midterm Science Benchmark Assessment', scoreValue: 88, gradeLetter: 'A', recordedDate: new Date('2025-11-20'), notes: 'Top 3 percentile across all STEM classes.' },
      { profileId: profileRahulId, category: 'TEST', title: 'Inter-School Science Mock Quiz', scoreValue: 91, gradeLetter: 'A+', recordedDate: new Date('2026-01-12'), notes: 'Fastest reaction time in buzzer rounds.' },
      { profileId: profileRahulId, category: 'ACADEMIC', title: 'Term 2 Physics & Chemistry Composite', scoreValue: 93, gradeLetter: 'A+', recordedDate: new Date('2026-03-05'), notes: 'Flawless numerical accuracy.' },
    ],
  });

  await prisma.activity.createMany({
    data: [
      { profileId: profileRahulId, name: 'State Science Olympiad Prelims', category: 'COMPETITION', role: 'Individual Contestant', result: '1st Place Gold Medal', performanceRating: 95, date: new Date('2025-10-14'), description: 'Ranked #1 out of 420 participating students.' },
      { profileId: profileRahulId, name: 'Regional Inter-School Science Quiz', category: 'COMPETITION', role: 'Team Captain', result: 'Champion Trophy', performanceRating: 92, date: new Date('2025-12-05'), description: 'Led team to victory with buzzer round mastery.' },
      { profileId: profileRahulId, name: 'Apex Astronomy Club Presentation', category: 'PRESENTATION', role: 'Presenter', result: 'Commendation', performanceRating: 72, date: new Date('2026-02-18'), description: 'Technical depth was high, delivery pacing could be smoother.' },
    ],
  });

  await prisma.achievement.createMany({
    data: [
      { profileId: profileRahulId, title: 'State Science Talent Trophy 2025', category: 'ACADEMIC', level: 'STATE', date: new Date('2025-10-20'), description: 'Honored by State Department of Education for highest aggregate science score.' },
      { profileId: profileRahulId, title: 'Gold Certificate - National Physics Quest', category: 'COMPETITION', level: 'NATIONAL', date: new Date('2026-01-25'), description: '99.4th percentile national score.' },
    ],
  });

  // 4. Student 2: Priya Patel (Candidate B: Pure Mathematics Phenom)
  // Math: 97%, Physics: 84%, Communication: 55%, Consistency: Very High (96%)
  const userPriya = await prisma.user.create({
    data: {
      organizationId: apexOrg.id,
      email: 'priya.p@apex.edu',
      passwordHash: defaultPasswordHash,
      role: 'MEMBER',
      profile: {
        create: {
          hierarchyNodeId: nodeClass11A.id,
          firstName: 'Priya',
          lastName: 'Patel',
          titleRole: 'Student (Class 11-A)',
          department: 'Grade 11-A',
          contactEmail: 'priya.p@apex.edu',
          bio: 'Competitive math researcher, combinatorics and calculus enthusiast.',
        },
      },
    },
    include: { profile: true },
  });

  const profilePriyaId = userPriya.profile!.id;

  await prisma.skillRecord.createMany({
    data: [
      { profileId: profilePriyaId, skillId: skillMath.id, proficiencyScore: 98, verifiedBy: 'Prof. Rajesh Sharma' },
      { profileId: profilePriyaId, skillId: skillPhysics.id, proficiencyScore: 84, verifiedBy: 'Prof. Rajesh Sharma' },
      { profileId: profilePriyaId, skillId: skillChemistry.id, proficiencyScore: 78, verifiedBy: 'Chemistry Dept' },
      { profileId: profilePriyaId, skillId: skillPublicSpeaking.id, proficiencyScore: 54, verifiedBy: 'English Dept' },
      { profileId: profilePriyaId, skillId: skillScientificInquiry.id, proficiencyScore: 91, verifiedBy: 'Research Mentor' },
      { profileId: profilePriyaId, skillId: skillQuizRapidRecall.id, proficiencyScore: 79, verifiedBy: 'Quiz Coach' },
    ],
  });

  await prisma.performanceRecord.createMany({
    data: [
      { profileId: profilePriyaId, category: 'ACADEMIC', title: 'Calculus & Algebra Olympiad Qualifier', scoreValue: 98, gradeLetter: 'A+', recordedDate: new Date('2025-09-10'), notes: 'Perfect paper with zero penalties.' },
      { profileId: profilePriyaId, category: 'ACADEMIC', title: 'Midterm Mathematics Exam', scoreValue: 97, gradeLetter: 'A+', recordedDate: new Date('2025-11-18'), notes: 'Solved bonus proof in 12 minutes.' },
      { profileId: profilePriyaId, category: 'ACADEMIC', title: 'Term 2 Advanced Mathematics Exam', scoreValue: 99, gradeLetter: 'A+', recordedDate: new Date('2026-03-02'), notes: 'Highest mark in school history.' },
    ],
  });

  await prisma.activity.createMany({
    data: [
      { profileId: profilePriyaId, name: 'Regional Mathematical Olympiad (RMO)', category: 'COMPETITION', role: 'Contestant', result: 'Rank 1 State', performanceRating: 98, date: new Date('2025-11-28'), description: 'Selected for National Camp.' },
    ],
  });

  await prisma.achievement.createMany({
    data: [
      { profileId: profilePriyaId, title: 'Ramanujan Mathematical Excellence Fellowship', category: 'ACADEMIC', level: 'NATIONAL', date: new Date('2025-12-15'), description: 'Awarded to top 15 mathematicians under 18.' },
    ],
  });

  // 5. Student 3: Neha Gupta (Candidate C: Orator & Symposium Presenter)
  // Public Speaking: 96%, Debate: 94%, Science: 76%, Presentation: High
  const userNeha = await prisma.user.create({
    data: {
      organizationId: apexOrg.id,
      email: 'neha.g@apex.edu',
      passwordHash: defaultPasswordHash,
      role: 'MEMBER',
      profile: {
        create: {
          hierarchyNodeId: nodeClass11B.id,
          firstName: 'Neha',
          lastName: 'Gupta',
          titleRole: 'Student (Class 11-B)',
          department: 'Grade 11-B',
          contactEmail: 'neha.g@apex.edu',
          bio: 'Head of Apex Debate Union, model UN delegate, science communicator.',
        },
      },
    },
    include: { profile: true },
  });

  const profileNehaId = userNeha.profile!.id;

  await prisma.skillRecord.createMany({
    data: [
      { profileId: profileNehaId, skillId: skillPublicSpeaking.id, proficiencyScore: 96, verifiedBy: 'Debate Coach' },
      { profileId: profileNehaId, skillId: skillDebate.id, proficiencyScore: 94, verifiedBy: 'Debate Coach' },
      { profileId: profileNehaId, skillId: skillTeamLeadership.id, proficiencyScore: 90, verifiedBy: 'Dr. Harrison' },
      { profileId: profileNehaId, skillId: skillPhysics.id, proficiencyScore: 76, verifiedBy: 'Science Dept' },
      { profileId: profileNehaId, skillId: skillMath.id, proficiencyScore: 72, verifiedBy: 'Math Dept' },
    ],
  });

  await prisma.performanceRecord.createMany({
    data: [
      { profileId: profileNehaId, category: 'ACADEMIC', title: 'English & Oratory Term Assessment', scoreValue: 97, gradeLetter: 'A+', recordedDate: new Date('2025-10-10'), notes: 'Masterful rhetorical composition.' },
      { profileId: profileNehaId, category: 'ACADEMIC', title: 'Term 1 Science Composite Exam', scoreValue: 75, gradeLetter: 'B', recordedDate: new Date('2025-11-20'), notes: 'Good conceptual grasp; calculation pacing needs improvement.' },
      { profileId: profileNehaId, category: 'ACADEMIC', title: 'Term 2 Science Composite Exam', scoreValue: 79, gradeLetter: 'B+', recordedDate: new Date('2026-03-05'), notes: 'Solid improvement in structured explanation questions.' },
    ],
  });

  await prisma.activity.createMany({
    data: [
      { profileId: profileNehaId, name: 'National Inter-School Parliamentary Debate', category: 'COMPETITION', role: 'Prime Minister (Lead Speaker)', result: 'Best Speaker Award', performanceRating: 98, date: new Date('2025-11-15'), description: 'Chaired opening arguments to unanimous adjudication.' },
      { profileId: profileNehaId, name: 'Youth Climate Science Keynote', category: 'PRESENTATION', role: 'Keynote Speaker', result: 'Standing Ovation', performanceRating: 95, date: new Date('2026-01-18'), description: 'Addressed audience of 500+ educators and guests.' },
    ],
  });

  await prisma.achievement.createMany({
    data: [
      { profileId: profileNehaId, title: 'National Youth Orator of the Year', category: 'LEADERSHIP', level: 'NATIONAL', date: new Date('2025-12-20'), description: 'Winner of 2025 National Youth Oratory Championship.' },
    ],
  });

  // 6. Student 4: Aman Verma (Candidate D: Rapidly Rising Trajectory)
  // Jan: 62% -> Mar: 70% -> May: 81% -> Nov: 89% (Demonstrates Section 10 Trend Engine)
  const userAman = await prisma.user.create({
    data: {
      organizationId: apexOrg.id,
      email: 'aman.v@apex.edu',
      passwordHash: defaultPasswordHash,
      role: 'MEMBER',
      profile: {
        create: {
          hierarchyNodeId: nodeClass11B.id,
          firstName: 'Aman',
          lastName: 'Verma',
          titleRole: 'Student (Class 11-B)',
          department: 'Grade 11-B',
          contactEmail: 'aman.v@apex.edu',
          bio: 'Fastest growing academic in STEM; robotics club build leader.',
        },
      },
    },
    include: { profile: true },
  });

  const profileAmanId = userAman.profile!.id;

  await prisma.skillRecord.createMany({
    data: [
      { profileId: profileAmanId, skillId: skillPhysics.id, proficiencyScore: 84, verifiedBy: 'Prof. Rajesh Sharma' },
      { profileId: profileAmanId, skillId: skillMath.id, proficiencyScore: 82, verifiedBy: 'Prof. Rajesh Sharma' },
      { profileId: profileAmanId, skillId: skillScientificInquiry.id, proficiencyScore: 88, verifiedBy: 'Robotics Mentor' },
      { profileId: profileAmanId, skillId: skillTeamLeadership.id, proficiencyScore: 85, verifiedBy: 'Dr. Harrison' },
    ],
  });

  // Longitudinal trajectory: 62 -> 70 -> 81 -> 89
  await prisma.performanceRecord.createMany({
    data: [
      { profileId: profileAmanId, category: 'ACADEMIC', title: 'Diagnostics Physics Test', scoreValue: 62, gradeLetter: 'C', recordedDate: new Date('2025-05-10'), notes: 'Struggling with fundamentals; committed to remedial coaching.' },
      { profileId: profileAmanId, category: 'ACADEMIC', title: 'First Term Review Test', scoreValue: 70, gradeLetter: 'B-', recordedDate: new Date('2025-08-22'), notes: 'Noted effort; concept gaps narrowing.' },
      { profileId: profileAmanId, category: 'ACADEMIC', title: 'Midterm Science Exam', scoreValue: 81, gradeLetter: 'A-', recordedDate: new Date('2025-11-20'), notes: 'Remarkable leap in problem solving.' },
      { profileId: profileAmanId, category: 'ACADEMIC', title: 'Term 2 Physics & Math Assessment', scoreValue: 89, gradeLetter: 'A', recordedDate: new Date('2026-03-05'), notes: 'Steepest positive learning curve in the school cohort.' },
    ],
  });

  await prisma.activity.createMany({
    data: [
      { profileId: profileAmanId, name: 'Apex Autonomous Rover Challenge', category: 'HACKATHON', role: 'Hardware & Logic Lead', result: '1st Runner Up', performanceRating: 88, date: new Date('2026-02-10'), description: 'Engineered sensor fusion module in 24 hours.' },
    ],
  });

  // Tasks in Apex STEM Academy
  // Task 1: "State Science Quiz Championship"
  const taskQuiz = await prisma.task.create({
    data: {
      organizationId: apexOrg.id,
      createdById: userPrincipal.id,
      title: 'State Science Quiz Championship',
      description: 'Selecting our primary representative for the inter-district State Science Quiz. High science accuracy, rapid buzzer recall, and proven quiz composure under pressure are vital.',
      category: 'COMPETITION',
      targetDate: new Date('2026-04-15'),
      status: 'OPEN',
      requirements: {
        create: [
          { requirementType: 'SKILL', targetName: 'Physics & Mechanics', minScore: 85, weight: 9.0, importance: 'REQUIRED' },
          { requirementType: 'SKILL', targetName: 'Quiz Speed & Recall', minScore: 80, weight: 9.5, importance: 'REQUIRED' },
          { requirementType: 'SKILL', targetName: 'Chemistry & Biology', minScore: 75, weight: 7.0, importance: 'PREFERRED' },
          { requirementType: 'EXPERIENCE', targetName: 'COMPETITION', minScore: 75, weight: 8.0, importance: 'REQUIRED' },
        ],
      },
    },
  });

  // Task 2: "Inter-School Science Symposium Keynote"
  const taskSymposium = await prisma.task.create({
    data: {
      organizationId: apexOrg.id,
      createdById: userPrincipal.id,
      title: 'Inter-School Science Symposium Keynote',
      description: 'Deliver the school flagship opening address at the Annual STEM Symposium. Demands top-tier public speaking charisma, audience engagement, and solid scientific foundations.',
      category: 'PRESENTATION',
      targetDate: new Date('2026-04-28'),
      status: 'OPEN',
      requirements: {
        create: [
          { requirementType: 'SKILL', targetName: 'Public Speaking', minScore: 90, weight: 10.0, importance: 'REQUIRED' },
          { requirementType: 'SKILL', targetName: 'Debate & Argumentation', minScore: 85, weight: 8.5, importance: 'REQUIRED' },
          { requirementType: 'SKILL', targetName: 'Physics & Mechanics', minScore: 70, weight: 6.0, importance: 'PREFERRED' },
          { requirementType: 'EXPERIENCE', targetName: 'PRESENTATION', minScore: 80, weight: 8.0, importance: 'REQUIRED' },
        ],
      },
    },
  });

  // =========================================================================
  // 2. ORGANIZATION: CloudScale Technologies (Company Archetype)
  // =========================================================================
  console.log('🏢 Seeding CloudScale Technologies (Company)...');
  const cloudScaleOrg = await prisma.organization.create({
    data: {
      name: 'CloudScale Technologies',
      type: 'COMPANY',
      settings: JSON.stringify({
        primaryColor: '#059669',
        currency: 'USD',
        reviewCycle: 'QUARTERLY',
      }),
    },
  });

  const techDims = await Promise.all([
    prisma.capabilityDimension.create({ data: { organizationId: cloudScaleOrg.id, name: 'System Engineering', weight: 1.0, description: 'Architecture, distributed systems, code quality' } }),
    prisma.capabilityDimension.create({ data: { organizationId: cloudScaleOrg.id, name: 'Product & Delivery', weight: 0.9, description: 'Velocity, execution, KPI achievement' } }),
    prisma.capabilityDimension.create({ data: { organizationId: cloudScaleOrg.id, name: 'Communication & Influence', weight: 0.85, description: 'Executive presentations, stakeholder management' } }),
    prisma.capabilityDimension.create({ data: { organizationId: cloudScaleOrg.id, name: 'Engineering Leadership', weight: 0.9, description: 'Mentorship, code review leadership, cross-team alignment' } }),
  ]);

  const skillDistributed = await prisma.skill.create({ data: { organizationId: cloudScaleOrg.id, dimensionId: techDims[0].id, name: 'Distributed Systems', category: 'CORE' } });
  const skillCloudArch = await prisma.skill.create({ data: { organizationId: cloudScaleOrg.id, dimensionId: techDims[0].id, name: 'Cloud Architecture (AWS/GCP)', category: 'CORE' } });
  const skillClientPres = await prisma.skill.create({ data: { organizationId: cloudScaleOrg.id, dimensionId: techDims[2].id, name: 'Client & Executive Presentations', category: 'SOFT_SKILL' } });
  const skillMentorship = await prisma.skill.create({ data: { organizationId: cloudScaleOrg.id, dimensionId: techDims[3].id, name: 'Technical Mentorship', category: 'LEADERSHIP' } });

  const nodeCeo = await prisma.hierarchyNode.create({
    data: { organizationId: cloudScaleOrg.id, name: 'Executive Leadership (CEO Office)', nodeType: 'BOARD', depth: 0, path: '/cloudscale' },
  });

  const nodeEngLead = await prisma.hierarchyNode.create({
    data: { organizationId: cloudScaleOrg.id, parentId: nodeCeo.id, name: 'Platform Engineering Group', nodeType: 'DIVISION', depth: 1, path: `${nodeCeo.path}/${nodeCeo.id}` },
  });

  const userCeo = await prisma.user.create({
    data: {
      organizationId: cloudScaleOrg.id,
      email: 'ceo@cloudscale.io',
      passwordHash: defaultPasswordHash,
      role: 'HEAD',
      profile: {
        create: {
          hierarchyNodeId: nodeCeo.id,
          firstName: 'Elena',
          lastName: 'Rostova',
          titleRole: 'Chief Executive Officer',
          department: 'Executive Management',
          contactEmail: 'elena.rostova@cloudscale.io',
          bio: 'Former VP of Cloud Infrastructure at hyperscaler; founder of CloudScale Technologies.',
        },
      },
    },
  });

  const userEngLead = await prisma.user.create({
    data: {
      organizationId: cloudScaleOrg.id,
      email: 'lead.marcus@cloudscale.io',
      passwordHash: defaultPasswordHash,
      role: 'MANAGER',
      profile: {
        create: {
          hierarchyNodeId: nodeEngLead.id,
          firstName: 'Marcus',
          lastName: 'Sterling',
          titleRole: 'Staff Principal Engineer',
          department: 'Platform Engineering Group',
          contactEmail: 'm.sterling@cloudscale.io',
          bio: '12 years building distributed storage engines and real-time Kafka pipelines.',
        },
      },
    },
    include: { profile: true },
  });

  await prisma.skillRecord.createMany({
    data: [
      { profileId: userEngLead.profile!.id, skillId: skillDistributed.id, proficiencyScore: 96, verifiedBy: 'Elena Rostova' },
      { profileId: userEngLead.profile!.id, skillId: skillCloudArch.id, proficiencyScore: 94, verifiedBy: 'Elena Rostova' },
      { profileId: userEngLead.profile!.id, skillId: skillClientPres.id, proficiencyScore: 88, verifiedBy: 'Product Council' },
      { profileId: userEngLead.profile!.id, skillId: skillMentorship.id, proficiencyScore: 92, verifiedBy: 'Peer Review 2025' },
    ],
  });

  await prisma.performanceRecord.createMany({
    data: [
      { profileId: userEngLead.profile!.id, category: 'KPI', title: 'Q2 99.999% Service Availability SLA', scoreValue: 98, gradeLetter: 'Exceeded', recordedDate: new Date('2025-06-30'), notes: 'Zero P0 downtime across 4 regions.' },
      { profileId: userEngLead.profile!.id, category: 'PROJECT', title: 'Multi-Region Sharding Engine Rollout', scoreValue: 95, gradeLetter: 'Distinction', recordedDate: new Date('2025-11-15'), notes: 'Reduced P99 query latency by 44%.' },
    ],
  });

  await prisma.activity.createMany({
    data: [
      { profileId: userEngLead.profile!.id, name: 'AWS re:Invent Architecture Keynote', category: 'PRESENTATION', role: 'Keynote Speaker', result: 'Top Rated Session', performanceRating: 96, date: new Date('2025-12-01'), description: 'Presented zero-downtime database migrations to 1,800 architects.' },
    ],
  });

  const taskClientPres = await prisma.task.create({
    data: {
      organizationId: cloudScaleOrg.id,
      createdById: userCeo.id,
      title: 'Fortune 50 Enterprise Technical Architecture Presentation',
      description: 'Defend CloudScale distributed resilience and security architecture before the Global CIO & Enterprise Architecture Committee.',
      category: 'PRESENTATION',
      targetDate: new Date('2026-05-10'),
      status: 'OPEN',
      requirements: {
        create: [
          { requirementType: 'SKILL', targetName: 'Distributed Systems', minScore: 90, weight: 10.0, importance: 'REQUIRED' },
          { requirementType: 'SKILL', targetName: 'Client & Executive Presentations', minScore: 85, weight: 9.5, importance: 'REQUIRED' },
          { requirementType: 'EXPERIENCE', targetName: 'PRESENTATION', minScore: 80, weight: 8.0, importance: 'REQUIRED' },
        ],
      },
    },
  });

  console.log('✅ TalentOS Seed completed successfully!');
  console.log(`   - Organizations: ${apexOrg.name}, ${cloudScaleOrg.name}`);
  console.log(`   - Sample Tasks: "${taskQuiz.title}", "${taskSymposium.title}", "${taskClientPres.title}"`);
  console.log(`   - Demo logins available with password: "password123":`);
  console.log(`     • principal@apex.edu (Head/Principal)`);
  console.log(`     • teacher.sharma@apex.edu (Manager/Teacher)`);
  console.log(`     • rahul.s@apex.edu (Member/Student)`);
  console.log(`     • ceo@cloudscale.io (Head/CEO)`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
