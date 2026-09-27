export type OrgType = 
  | 'SCHOOL' 
  | 'COLLEGE' 
  | 'COMPANY' 
  | 'STARTUP' 
  | 'SPORTS_ACADEMY' 
  | 'CLUB' 
  | 'CUSTOM';

export type UserRole = 
  | 'SUPER_ADMIN' 
  | 'HEAD' 
  | 'MANAGER' 
  | 'MEMBER';

export type PerformanceCategory = 
  | 'ACADEMIC' 
  | 'KPI' 
  | 'PROJECT' 
  | 'MATCH' 
  | 'TEST';

export type ActivityCategory = 
  | 'COMPETITION' 
  | 'HACKATHON' 
  | 'CULTURAL' 
  | 'SPORTS' 
  | 'VOLUNTEERING' 
  | 'CERTIFICATION' 
  | 'PRESENTATION' 
  | 'OTHER';

export type AchievementLevel = 
  | 'INTERNAL' 
  | 'REGIONAL' 
  | 'STATE' 
  | 'NATIONAL' 
  | 'INTERNATIONAL';

export type TaskStatus = 
  | 'DRAFT' 
  | 'OPEN' 
  | 'RECOMMENDED' 
  | 'ASSIGNED' 
  | 'COMPLETED';

export type RequirementImportance = 
  | 'REQUIRED' 
  | 'PREFERRED' 
  | 'BONUS';

export type RequirementType = 
  | 'SKILL' 
  | 'DIMENSION' 
  | 'MIN_PERFORMANCE' 
  | 'EXPERIENCE' 
  | 'ACTIVITY_CATEGORY';

export interface OrganizationDTO {
  id: string;
  name: string;
  type: OrgType;
  settings?: Record<string, any>;
  createdAt: string;
}

export interface HierarchyNodeDTO {
  id: string;
  organizationId: string;
  parentId: string | null;
  name: string;
  nodeType: string;
  depth: number;
  path: string;
  children?: HierarchyNodeDTO[];
  memberCount?: number;
}

export interface ProfileDTO {
  id: string;
  userId: string;
  hierarchyNodeId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  avatarUrl?: string | null;
  titleRole: string;
  department: string;
  joinedDate: string;
  contactEmail: string;
  bio?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  hierarchyNode?: HierarchyNodeDTO;
  userRole?: UserRole;
  skills?: SkillRecordDTO[];
  performanceRecords?: PerformanceRecordDTO[];
  activities?: ActivityDTO[];
  achievements?: AchievementDTO[];
  trajectory?: TrajectoryDTO;
}

export interface CapabilityDimensionDTO {
  id: string;
  organizationId: string;
  name: string;
  weight: number;
  description?: string | null;
  averageScore?: number;
}

export interface SkillDTO {
  id: string;
  dimensionId: string;
  name: string;
  category: string;
}

export interface SkillRecordDTO {
  id: string;
  profileId: string;
  skillId: string;
  skillName: string;
  dimensionName: string;
  proficiencyScore: number; // 0 - 100
  verifiedBy?: string | null;
  lastAssessedAt: string;
}

export interface PerformanceRecordDTO {
  id: string;
  profileId: string;
  category: PerformanceCategory;
  title: string;
  scoreValue: number; // 0 - 100
  gradeLetter?: string | null;
  recordedDate: string;
  notes?: string | null;
}

export interface ActivityDTO {
  id: string;
  profileId: string;
  name: string;
  category: ActivityCategory;
  role: string;
  result?: string | null;
  performanceRating?: number | null; // 0 - 100
  date: string;
  description?: string | null;
}

export interface AchievementDTO {
  id: string;
  profileId: string;
  title: string;
  category: string;
  level: AchievementLevel;
  date: string;
  description?: string | null;
  evidenceUrl?: string | null;
}

export interface TrajectoryDTO {
  growthRateSlope: number; // Positive = improving, Negative = declining
  consistencyScore: number; // 0 - 100
  trendDirection: 'SURGING' | 'STEADY_IMPROVEMENT' | 'CONSISTENT' | 'FLUCTUATING' | 'DECLINING';
  averageScore: number;
  sampleCount: number;
}

export interface TaskRequirementDTO {
  id?: string;
  requirementType: RequirementType;
  targetName: string;
  minScore: number;
  weight: number; // 1 - 10
  importance: RequirementImportance;
}

export interface TaskDTO {
  id: string;
  organizationId: string;
  createdById: string;
  title: string;
  description: string;
  category: string;
  targetDate?: string | null;
  status: TaskStatus;
  requirements: TaskRequirementDTO[];
  createdAt: string;
}

export interface EvidenceItemDTO {
  factor: string;
  score: number;
  weight: number;
  evidence: string;
  recordSource?: string;
}

export interface RecommendationCandidateDTO {
  candidateId: string;
  profile: ProfileDTO;
  rank: number;
  suitabilityScore: number; // 0 - 100
  matchPercentage: number;
  radarBreakdown: Record<string, number>;
  evidenceItems: EvidenceItemDTO[];
  missingDataNotes: string[];
  aiExplanation?: string;
  strengths: string[];
  developmentAreas: string[];
}

export interface RecommendationResultDTO {
  taskId: string;
  taskTitle: string;
  runAt: string;
  candidates: RecommendationCandidateDTO[];
  appliedRequirements: TaskRequirementDTO[];
  methodologyNotes: string;
}
