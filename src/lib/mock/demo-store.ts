"use client";

import { useSyncExternalStore } from "react";
import {
  getAllLeaves,
  getLeafById,
  CURRICULUM,
  type Leaf,
} from "@/lib/curriculum/curriculum";

export type Role = "admin" | "teacher" | "parent";

export type DemoUser = {
  id: string;
  role: Role;
  name: string;
  email: string;
  initial: string;
};

// Admin comment about how to best handle a particular child.
// Visible to teachers ONLY — never surfaced in any parent-facing view.
export type AdminCommentKind = "guidance" | "move-recommendation";

export type DemoAdminComment = {
  id: string;
  studentId: string;
  adminId: string;
  kind: AdminCommentKind;
  body: string;
  // For move recommendations, the destination the admin suggests (free text,
  // e.g. "Children's House — 3-6 years group A").
  suggestedMove?: string;
  createdAt: string;
};

// Attendance recorded by a teacher for a single student on a single date.
export type AttendanceStatus = "present" | "late" | "absent" | "excused";

export type DemoAttendance = {
  id: string;
  studentId: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  recordedBy: string; // teacherId
  notes?: string;
  createdAt: string;
};

export type DemoStudent = {
  id: string;
  name: string;
  classroom: string;
  parentId: string | string[]; // one or many parents
  teacherId: string;
  // general profile
  dateOfBirth: string;
  ageGroup: "0-2 years" | "3-6 years" | "7-9 years";
  enrollmentDate: string;
  allergies: string[];
  medicalNotes: string;
  interests: string[];
  avatarColor: string; // tailwind bg class
  emergencyContact: { name: string; phone: string; relationship: string };
  parentName: string;
  medications: DemoMedication[];
  frequentLatePickup?: boolean; // flag for after-school recommendation
};

export type DemoActivityPost = {
  id: string;
  studentId: string;
  teacherId: string;
  caption: string;
  imageUrl: string;
  leafId: string;
  likes: number;
  likedByParent: boolean;
  createdAt: string;
};

export type ActivityPostWithLeaf = DemoActivityPost & { leaf: Leaf };

export type DemoDailyActivityType =
  | "meals"
  | "nap"
  | "hygiene"
  | "temperature";

export type DemoDailyActivityLog = {
  id: string;
  studentId: string;
  teacherId: string;
  date: string;
  time: string;
  activityType: DemoDailyActivityType;
  value: string;
  notes: string;
  createdAt: string;
};

export type DemoNotice = {
  id: string;
  title: string;
  content: string;
  audience: "all-parents";
  createdAt: string;
  createdBy: string;
  readBy: string[]; // parentIds who have opened this notice
};

export type DemoMedication = {
  id: string;
  name: string;
  dosage: string;
  time: string; // e.g. "08:30 AM"
  notes: string;
};

export type DemoAfterSchoolEnrollment = {
  studentId: string;
  enrolledAt: string;
  enrolledBy: string; // parentId
};

export type DemoCalendarEventType =
  | "academic"
  | "activity"
  | "holiday"
  | "staff";

export type DemoCalendarEvent = {
  id: string;
  title: string;
  startsAt: string;
  endsAt?: string;
  location: string;
  description: string;
  type: DemoCalendarEventType;
  audience: "public" | "staff";
  allDay?: boolean;
};

export type DemoObservation = {
  id: string;
  studentId: string;
  teacherId: string;
  content: string;
  leafId: string;
  createdAt: string;
};

export type ObservationWithLeaf = DemoObservation & { leaf: Leaf };

export type DemoInvoice = {
  id: string;
  studentId: string;
  parentId: string;
  description: string;
  amountCents: number;
  issuedAt: string;
  dueDate: string;
  status: "unpaid" | "paid";
};

export type DemoDailyReportStatus = "pending" | "generated" | "sent";

export type DemoDailyMood = "Happy" | "Neutral" | "Sad";

export type DemoDailyCareEntry = {
  label: string;
  value: string;
  time?: string;
};

export type DemoWorkEntry = {
  area: string;
  activity: string;
  level: "Introduced" | "Developing" | "Proficient";
};

export type DemoSubjectEntry = {
  subject: string;
  activity: string;
  note: string;
};

export type DemoDailyReport = {
  id: string;
  studentId: string;
  ageGroup: "0-2 years" | "3-6 years" | "7-9 years";
  date: string;
  weekLabel: string;
  status: DemoDailyReportStatus;
  generalMood: DemoDailyMood;
  // shared health
  temperatureCelsius?: number;
  temperatureTakenAt?: string;
  // 0-2 specific
  careEntries?: DemoDailyCareEntry[];
  funLearning?: string;
  followUpAtHome?: string;
  // 3-6 specific
  workCycle?: DemoWorkEntry[];
  concentrationLevel?: string;
  independenceSkills?: string;
  socialDevelopment?: string;
  mealNotes?: string;
  // 7-9 specific
  subjectProgress?: DemoSubjectEntry[];
  projectWork?: string;
  behaviorNotes?: string;
  // shared
  teacherComments: string;
  parentComments: string;
  teacherSignature: string;
  parentSignature: string;
  updatedAt: string;
};

export type DemoProgressArea = {
  id: string;
  name: string;
  description: string;
  score: number;
  level: "beginner" | "developing" | "proficient" | "advanced";
  trend: "up" | "down" | "stable";
  recentActivities: string[];
};

export type DemoProgress = {
  studentId: string;
  term: string;
  academicYear: string;
  areas: DemoProgressArea[];
  strengths: string[];
  areasForGrowth: string[];
  teacherComments: string;
  teacherName: string;
  recommendations: Array<{ title: string; description: string }>;
};

const calendarEvents: DemoCalendarEvent[] = [
  {
    id: "evt-parent-conference",
    title: "Parent-Teacher Conferences",
    startsAt: "2026-05-15T09:00:00.000Z",
    endsAt: "2026-05-15T12:00:00.000Z",
    location: "Main Hall",
    description:
      "Family conference slots with classroom guides to review spring progress and next-step goals.",
    type: "academic",
    audience: "public",
  },
  {
    id: "evt-field-trip",
    title: "Nurture Buds Field Trip",
    startsAt: "2026-05-18T10:30:00.000Z",
    endsAt: "2026-05-18T13:00:00.000Z",
    location: "University of Ilorin Zoological Garden",
    description:
      "Outdoor discovery walk focused on birds, leaves, animal observation, and practical life exploration.",
    type: "activity",
    audience: "public",
  },
  {
    id: "evt-community-picnic",
    title: "Community Picnic",
    startsAt: "2026-05-24T11:00:00.000Z",
    endsAt: "2026-05-24T14:00:00.000Z",
    location: "School Garden",
    description:
      "Families are invited for music, shared lunch, and classroom showcases from each age band.",
    type: "activity",
    audience: "public",
  },
  {
    id: "evt-break-begins",
    title: "Mid-Term Break Begins",
    startsAt: "2026-05-29T00:00:00.000Z",
    location: "Campus-wide",
    description:
      "Classes pause for mid-term break. Normal classroom routines resume on Monday, 2 June.",
    type: "holiday",
    audience: "public",
    allDay: true,
  },
  {
    id: "evt-staff-dev",
    title: "Staff Development Workshop",
    startsAt: "2026-06-03T14:00:00.000Z",
    endsAt: "2026-06-03T16:30:00.000Z",
    location: "Room 102",
    description:
      "Internal professional development session for classroom guides and support staff.",
    type: "staff",
    audience: "staff",
  },
];

export type CurriculumStatus =
  | "not-started"
  | "introduced"
  | "developing"
  | "proficient";

export type DemoCurriculumProgress = {
  studentId: string;
  leafId: string;
  // Unlimited chronological list of practice dates (ISO strings).
  // A child may practice many times before the teacher promotes the status.
  practices: string[];
  // Teacher-controlled status. Independent of practice count — only the
  // teacher's satisfaction promotes Developing to Proficient.
  status: CurriculumStatus;
  updatedAt: string;
};

type DemoState = {
  users: Record<Role, DemoUser>;
  students: DemoStudent[];
  notices: DemoNotice[];
  observations: DemoObservation[];
  adminComments: DemoAdminComment[];
  attendance: DemoAttendance[];
  // teacherAssignments maps teacherId → list of classroom names that teacher manages.
  teacherAssignments: Record<string, string[]>;
  invoices: DemoInvoice[];
  dailyReports: DemoDailyReport[];
  activityPosts: DemoActivityPost[];
  dailyActivityLogs: DemoDailyActivityLog[];
  progressData: Record<string, DemoProgress>;
  afterSchoolEnrollments: DemoAfterSchoolEnrollment[];
  curriculumProgress: DemoCurriculumProgress[];
};

const progressDataMap: Record<string, DemoProgress> = {
  zoe: {
    studentId: "zoe",
    term: "Second Term",
    academicYear: "2025-2026",
    areas: [
      {
        id: "practical-life",
        name: "Practical Life",
        description: "Self-care, environmental care, and grace & courtesy",
        score: 85,
        level: "proficient",
        trend: "up",
        recentActivities: [
          "Water transfer work (15 min focus)",
          "Mat rolling independently",
          "Pouring with improved control",
        ],
      },
      {
        id: "sensorial",
        name: "Sensorial",
        description: "Exploration through senses and discrimination",
        score: 78,
        level: "developing",
        trend: "up",
        recentActivities: [
          "Pink Tower mastery",
          "Color discrimination (8 shades)",
          "Sound sorting activities",
        ],
      },
      {
        id: "language",
        name: "Language Development",
        description: "Vocabulary, listening, and early phonetic skills",
        score: 72,
        level: "developing",
        trend: "up",
        recentActivities: [
          "Animal naming games",
          "Book corner engagement",
          "Vocabulary: ~10 animal names",
        ],
      },
    ],
    strengths: [
      "Strong concentration during preferred activities",
      "Excellent gross motor control improving daily",
      "Positive engagement with peers and guides",
      "Eager to repeat and master work cycles",
    ],
    areasForGrowth: [
      "Expanding vocabulary beyond familiar categories",
      "Transitioning between activities (working on this)",
      "Group participation beyond comfort zone",
    ],
    teacherComments:
      "Zoe is thriving in practical life activities. She shows genuine joy in mastery moments and is building confidence in group settings. Her fine motor control is improving noticeably week by week.",
    teacherName: "Ms. Sarah Reed",
    recommendations: [
      {
        title: "Home Practice",
        description:
          "Encourage water and sand play at home to build confidence with pouring and transferring activities.",
      },
      {
        title: "Language Enrichment",
        description:
          "Name household items during daily routines and read short picture books together each evening.",
      },
    ],
  },
  emma: {
    studentId: "emma",
    term: "Second Term",
    academicYear: "2025-2026",
    areas: [
      {
        id: "practical-life",
        name: "Practical Life",
        description: "Care of self, environment, and grace & courtesy",
        score: 90,
        level: "proficient",
        trend: "up",
        recentActivities: [
          "Pouring water between jugs (proficient)",
          "Dressing frames — independent zipping",
          "Rolled and stored her work mat without prompting",
          "Served herself at snack and cleared her place",
        ],
      },
      {
        id: "mathematics",
        name: "Mathematics",
        description: "Quantity, number, and early arithmetic concepts",
        score: 88,
        level: "proficient",
        trend: "up",
        recentActivities: [
          "Number rods 1-10 mastered",
          "Self-correcting without intervention",
          "Bead chain introduction",
          "Combining rods to make 10",
        ],
      },
      {
        id: "sensorial",
        name: "Sensorial",
        description: "Visual discrimination and gradation",
        score: 82,
        level: "proficient",
        trend: "stable",
        recentActivities: [
          "Color tablet matching",
          "Gradient organization (spontaneous)",
          "Texture exploration",
        ],
      },
      {
        id: "language",
        name: "Language Arts",
        description: "Sound awareness and early writing readiness",
        score: 75,
        level: "developing",
        trend: "up",
        recentActivities: [
          "Sound sorting games",
          "Pre-writing exercises",
          "Story comprehension",
        ],
      },
      {
        id: "art",
        name: "Art & Creativity",
        description: "Creative expression and fine motor skill development",
        score: 85,
        level: "proficient",
        trend: "up",
        recentActivities: [
          "Natural materials collage (titled: 'The Forest Floor')",
          "Watercolor exploration",
          "Purposeful composition",
        ],
      },
    ],
    strengths: [
      "Advanced mathematical reasoning for age group",
      "Self-directed learning and problem-solving",
      "Artistic creativity and aesthetic sensitivity",
      "Independent extension of activities",
      "Strong visual discrimination skills",
    ],
    areasForGrowth: [
      "Phonetic sound recognition (in progress)",
      "Fine motor control for pre-writing (progressing well)",
      "Verbal articulation of observations",
    ],
    teacherComments:
      "Emma is an exemplary learner in the Children's House environment. She demonstrates intellectual curiosity, independence, and the ability to extend her own work into deeper explorations. Her mathematics progression is particularly strong — she self-corrects and seeks new challenges naturally.",
    teacherName: "Ms. Sarah Reed",
    recommendations: [
      {
        title: "Mathematical Enrichment",
        description:
          "At home, encourage counting during daily activities and exploration of patterns in nature.",
      },
      {
        title: "Language Development",
        description:
          "Begin introducing phonetic sounds in isolation (Montessori method) and encourage drawing activities for pre-writing development.",
      },
    ],
  },
  leo: {
    studentId: "leo",
    term: "Second Term",
    academicYear: "2025-2026",
    areas: [
      {
        id: "practical-life",
        name: "Practical Life",
        description: "Care of self and environment",
        score: 70,
        level: "developing",
        trend: "up",
        recentActivities: [
          "Spoon transfer (improving accuracy)",
          "Attempting potty routine with support",
          "Participation in cleanup activities",
        ],
      },
      {
        id: "sensorial",
        name: "Sensorial",
        description: "Exploration and sensory discrimination",
        score: 65,
        level: "developing",
        trend: "stable",
        recentActivities: [
          "Shape sorting exploration",
          "Water and sand play",
          "Sound exploration",
        ],
      },
      {
        id: "music",
        name: "Music & Movement",
        description: "Rhythm, coordination, and creative expression",
        score: 75,
        level: "developing",
        trend: "up",
        recentActivities: [
          "Chime bar exploration",
          "Repeated musical experimentation",
          "Movement with music",
        ],
      },
    ],
    strengths: [
      "Growing concentration span (8 minutes, up from 4)",
      "Joy in musical exploration and experimentation",
      "Improving hand-eye coordination",
      "Positive response to guidance",
      "Enthusiasm for learning through play",
    ],
    areasForGrowth: [
      "Sustained attention during group transitions",
      "Toilet independence (age-appropriate progress)",
      "Fine motor precision (improving steadily)",
    ],
    teacherComments:
      "Leo is developing nicely in both practical and explorative areas. His concentration span has visibly grown, and he shows genuine delight in music and movement activities. He responds well to repetition and is building confidence with structured routines.",
    teacherName: "Ms. Sarah Reed",
    recommendations: [
      {
        title: "Home Routine Practice",
        description:
          "Establish consistent routines with consistent language to support toilet learning and self-care development.",
      },
      {
        title: "Music & Movement",
        description:
          "Provide simple instruments at home (pots, wooden spoons, bells) for continued exploration and fine motor development.",
      },
    ],
  },
  aisha: {
    studentId: "aisha",
    term: "Second Term",
    academicYear: "2025-2026",
    areas: [
      {
        id: "practical-life",
        name: "Practical Life",
        description: "Care of self, environment, and grace & courtesy",
        score: 88,
        level: "proficient",
        trend: "stable",
        recentActivities: [
          "Manages personal belongings and workspace independently",
          "Models grace & courtesy for younger peers",
          "Leads tidying routines at end of work cycle",
        ],
      },
      {
        id: "language-arts",
        name: "Language Arts",
        description: "Writing, composition, and research skills",
        score: 92,
        level: "advanced",
        trend: "up",
        recentActivities: [
          "Animal adaptation research (multi-section)",
          "Structured composition with topic sentences",
          "Fact verification using references",
          "Independent research project organization",
        ],
      },
      {
        id: "geography",
        name: "Geography",
        description: "Geography understanding and cultural knowledge",
        score: 87,
        level: "proficient",
        trend: "up",
        recentActivities: [
          "African country identification (12 countries)",
          "Capital learning (5 verified)",
          "Puzzle map mastery",
          "Self-set learning goals",
        ],
      },
      {
        id: "music",
        name: "Music & Ensemble",
        description: "Rhythm, group participation, and musical expression",
        score: 80,
        level: "proficient",
        trend: "stable",
        recentActivities: [
          "Drum circle steady rhythm maintenance",
          "Rhythm variation experimentation",
          "Peer support during ensemble",
        ],
      },
      {
        id: "academic-thinking",
        name: "Academic Thinking",
        description: "Critical thinking and intellectual curiosity",
        score: 89,
        level: "advanced",
        trend: "up",
        recentActivities: [
          "Independent research organization",
          "Fact verification practices",
          "Goal-setting for learning",
          "Spontaneous extension of projects",
        ],
      },
    ],
    strengths: [
      "Exceptional writing and research skills for her age",
      "Natural curiosity and intellectual rigor",
      "Self-directed learning and ambitious goal-setting",
      "Strong leadership in group settings",
      "Ability to teach and support peers",
      "Mastery of geographical and cultural knowledge",
    ],
    areasForGrowth: [
      "Fine-tuning public speaking confidence",
      "Balancing multiple projects (managing well already)",
    ],
    teacherComments:
      "Aisha is an advanced learner who demonstrates exceptional intellectual capabilities. Her research projects show remarkable organization and rigor. She sets ambitious goals for herself and pursues them with dedication. Her leadership qualities are evident both in academic work and peer collaboration. She represents the Montessori ideal of the motivated, independent learner.",
    teacherName: "Ms. Sarah Reed",
    recommendations: [
      {
        title: "Advanced Research",
        description:
          "Support her passion for research by introducing library resources and age-appropriate reference materials for independent exploration.",
      },
      {
        title: "Presentation Skills",
        description:
          "Encourage presentation of research findings to small groups to further develop public speaking confidence.",
      },
    ],
  },
  noah: {
    studentId: "noah",
    term: "Second Term",
    academicYear: "2025-2026",
    areas: [
      {
        id: "practical-life",
        name: "Practical Life",
        description: "Care of self, environment, and grace & courtesy",
        score: 82,
        level: "proficient",
        trend: "up",
        recentActivities: [
          "Independent shoe-tying and dressing routines",
          "Carrying and setting up his own work tray",
          "Polishing wood with full sequence",
          "Helps younger peers with self-care",
        ],
      },
      {
        id: "sensorial",
        name: "Sensorial",
        description: "Discrimination, gradation, and spatial reasoning",
        score: 84,
        level: "proficient",
        trend: "up",
        recentActivities: [
          "Pink Tower completion and extensions",
          "Pink Tower + Brown Stair comparison",
          "Spontaneous geometric observation",
          "Material relationship discovery",
        ],
      },
      {
        id: "mathematics",
        name: "Mathematics",
        description: "Quantity, patterning, and mathematical thinking",
        score: 79,
        level: "developing",
        trend: "up",
        recentActivities: [
          "Bead material exploration",
          "Pattern recognition activities",
          "Counting applications",
        ],
      },
      {
        id: "social-development",
        name: "Social Development & Leadership",
        description:
          "Peer relationships, collaboration, and conflict resolution",
        score: 85,
        level: "proficient",
        trend: "up",
        recentActivities: [
          "Organized construction game leadership",
          "Peer role assignment",
          "Conflict resolution (block trading solution)",
          "Natural peer mentoring",
        ],
      },
    ],
    strengths: [
      "Exceptional spatial and analytical reasoning",
      "Natural leadership and peer organization skills",
      "Emerging conflict resolution abilities",
      "Creative problem-solving",
      "Strong gross motor confidence",
      "Genuine enjoyment of peer collaboration",
    ],
    areasForGrowth: [
      "Formal mathematics introduction (ready now)",
      "Fine motor activities (can be encouraged)",
    ],
    teacherComments:
      "Noah's analytical mind is evident in his careful exploration of materials and spontaneous mathematical observations. Beyond academics, his leadership qualities shine — he naturally organizes peers and facilitates group activities with fairness and creativity. He is a role model peer and shows strong emotional intelligence.",
    teacherName: "Ms. Sarah Reed",
    recommendations: [
      {
        title: "Mathematical Advancement",
        description:
          "Noah is ready for formal mathematics instruction including number rods and early arithmetic concepts.",
      },
      {
        title: "Leadership Development",
        description:
          "Encourage him to continue peer mentoring and consider small leadership roles in classroom activities.",
      },
    ],
  },
  james: {
    studentId: "james",
    term: "Second Term",
    academicYear: "2025-2026",
    areas: [
      {
        id: "practical-life",
        name: "Practical Life",
        description: "Care of self, environment, and grace & courtesy",
        score: 84,
        level: "proficient",
        trend: "stable",
        recentActivities: [
          "Manages his desk, journal, and research folders independently",
          "Sweeps and resets shared work spaces unprompted",
          "Models calm transitions between work cycles",
        ],
      },
      {
        id: "research",
        name: "Research & Academic Inquiry",
        description: "Project-based learning and research skills",
        score: 86,
        level: "proficient",
        trend: "up",
        recentActivities: [
          "Biography project: Marie Curie",
          "Multi-source research coordination",
          "Thoughtful questioning behavior",
          "Extended engagement beyond scheduled time",
        ],
      },
      {
        id: "art",
        name: "Art & Creative Technique",
        description: "Artistic technique and creative exploration",
        score: 81,
        level: "proficient",
        trend: "up",
        recentActivities: [
          "Wet-on-wet watercolor discovery",
          "Gradient creation (accidental mastery)",
          "Intrinsic motivation for technique repetition",
          "Color experimentation",
        ],
      },
      {
        id: "language",
        name: "Language & Expression",
        description: "Written and verbal communication",
        score: 78,
        level: "developing",
        trend: "up",
        recentActivities: [
          "Biography research documentation",
          "Thoughtful question articulation",
          "Narrative writing practice",
        ],
      },
      {
        id: "science",
        name: "Scientific Thinking",
        description: "Curiosity, observation, and question formation",
        score: 83,
        level: "proficient",
        trend: "stable",
        recentActivities: [
          "Questions about radioactivity",
          "Connection-making between topics",
          "Observation and documentation",
        ],
      },
    ],
    strengths: [
      "Deep curiosity and love of research",
      "Exceptional capacity for sustained focus",
      "Creative and experimental approach to art",
      "Intrinsic motivation for learning",
      "Ability to ask sophisticated questions",
      "Emerging scientific thinking skills",
    ],
    areasForGrowth: [
      "Formal academic writing instruction",
      "Peer collaboration in group projects (he works well independently)",
    ],
    teacherComments:
      "James demonstrates the Montessori spirit of inquiry beautifully. His research projects show genuine intellectual curiosity, and his willingness to extend learning beyond scheduled times indicates intrinsic motivation. His artistic discoveries show both technical growth and joy in the learning process. He asks thoughtful, sophisticated questions that reflect higher-order thinking.",
    teacherName: "Ms. Sarah Reed",
    recommendations: [
      {
        title: "Research Projects",
        description:
          "Continue supporting his biography and science projects with access to diverse reference materials and encouragement to share findings.",
      },
      {
        title: "Writing Development",
        description:
          "Introduce formal academic writing structures (outline, thesis, conclusion) to channel his research enthusiasm into structured composition.",
      },
    ],
  },
};

let state: DemoState = {
  users: {
    admin: {
      id: "user-admin",
      role: "admin",
      name: "Admin User",
      email: "admin@nurturehouse.edu",
      initial: "A",
    },
    teacher: {
      id: "user-teacher",
      role: "teacher",
      name: "Ms. Sarah Reed",
      email: "sarah.reed@nurturehouse.edu",
      initial: "S",
    },
    parent: {
      id: "user-parent",
      role: "parent",
      name: "Amanda Wong",
      email: "amanda@example.com",
      initial: "W",
    },
  },
  students: [
    {
      id: "zoe",
      name: "Zoe Wong",
      classroom: "Toddler B",
      parentId: "user-parent", // Amanda Wong — also parent of Emma
      teacherId: "user-teacher",
      dateOfBirth: "2024-03-14",
      ageGroup: "0-2 years",
      enrollmentDate: "2025-09-01",
      allergies: ["Peanuts"],
      medicalNotes: "Mild nut allergy — carry EpiPen in red pouch in office.",
      interests: ["Stacking blocks", "Animal sounds", "Water play"],
      avatarColor: "bg-pink-400",
      emergencyContact: {
        name: "David Wong",
        phone: "+1 555-0101",
        relationship: "Father",
      },
      parentName: "Amanda Wong",
      medications: [
        {
          id: "med-zoe-1",
          name: "Cetirizine (antihistamine)",
          dosage: "2.5 ml",
          time: "08:00 AM",
          notes: "Give with morning snack if allergy symptoms appear.",
        },
      ],
      frequentLatePickup: false,
    },
    {
      id: "leo",
      name: "Leo Martinez",
      classroom: "Toddler A",
      parentId: "user-parent-leo",
      teacherId: "user-teacher",
      dateOfBirth: "2024-06-22",
      ageGroup: "0-2 years",
      enrollmentDate: "2025-09-01",
      allergies: [],
      medicalNotes: "",
      interests: ["Spoon transfer", "Ball rolling", "Music"],
      avatarColor: "bg-sky-400",
      emergencyContact: {
        name: "Rosa Martinez",
        phone: "+1 555-0202",
        relationship: "Mother",
      },
      parentName: "Carlos Martinez",
      medications: [],
      frequentLatePickup: true,
    },
    {
      id: "sarah",
      name: "Sarah Jenkins",
      classroom: "Toddler C",
      parentId: "user-parent-sarah",
      teacherId: "user-teacher",
      dateOfBirth: "2024-01-08",
      ageGroup: "0-2 years",
      enrollmentDate: "2025-09-01",
      allergies: ["Dairy"],
      medicalNotes: "Lactose intolerant — dairy-free meals only.",
      interests: ["Finger painting", "Book corner", "Outdoor play"],
      avatarColor: "bg-violet-400",
      emergencyContact: {
        name: "Mark Jenkins",
        phone: "+1 555-0303",
        relationship: "Father",
      },
      parentName: "Claire Jenkins",
      medications: [],
      frequentLatePickup: false,
    },
    {
      id: "emma",
      name: "Emma Clarke",
      classroom: "Primary A",
      parentId: "user-parent", // Amanda Wong — second child
      teacherId: "user-teacher",
      dateOfBirth: "2021-11-02",
      ageGroup: "3-6 years",
      enrollmentDate: "2024-09-01",
      allergies: [],
      medicalNotes: "",
      interests: ["Colour tablets", "Puzzles", "Art collage"],
      avatarColor: "bg-emerald-400",
      emergencyContact: {
        name: "David Clarke",
        phone: "+1 555-0404",
        relationship: "Father",
      },
      parentName: "Amanda Wong",
      medications: [],
      frequentLatePickup: false,
    },
    {
      id: "noah",
      name: "Noah Osei",
      classroom: "Primary B",
      parentId: "user-parent-noah",
      teacherId: "user-teacher",
      dateOfBirth: "2020-07-19",
      ageGroup: "3-6 years",
      enrollmentDate: "2024-09-01",
      allergies: ["Tree nuts"],
      medicalNotes: "Tree nut allergy — refer to allergy action plan in file.",
      interests: ["Pink Tower", "Button frames", "Outdoor climbing"],
      avatarColor: "bg-amber-400",
      emergencyContact: {
        name: "Akua Osei",
        phone: "+1 555-0505",
        relationship: "Mother",
      },
      parentName: "Kwame Osei",
      medications: [],
      frequentLatePickup: false,
    },
    {
      id: "aisha",
      name: "Aisha Patel",
      classroom: "Lower Elementary A",
      parentId: "user-parent-aisha",
      teacherId: "user-teacher",
      dateOfBirth: "2017-04-30",
      ageGroup: "7-9 years",
      enrollmentDate: "2022-09-01",
      allergies: [],
      medicalNotes: "",
      interests: ["Research projects", "Geography puzzles", "Drum circle"],
      avatarColor: "bg-rose-400",
      emergencyContact: {
        name: "Raj Patel",
        phone: "+1 555-0606",
        relationship: "Father",
      },
      parentName: "Priya Patel",
      medications: [],
      frequentLatePickup: false,
    },
    {
      id: "james",
      name: "James Okonkwo",
      classroom: "Lower Elementary B",
      parentId: "user-parent-james",
      teacherId: "user-teacher",
      dateOfBirth: "2018-09-15",
      ageGroup: "7-9 years",
      enrollmentDate: "2023-09-01",
      allergies: ["Shellfish"],
      medicalNotes: "Shellfish allergy — mild; antihistamine in office bag.",
      interests: ["Biography projects", "Watercolour painting", "Science"],
      avatarColor: "bg-cyan-400",
      emergencyContact: {
        name: "Ngozi Okonkwo",
        phone: "+1 555-0707",
        relationship: "Mother",
      },
      parentName: "Chidi Okonkwo",
      medications: [],
      frequentLatePickup: false,
    },
  ],
  notices: [
    {
      id: "notice-1",
      title: "School Fees for May 2026",
      content:
        "Kindly ensure all outstanding fees for the May term are settled by 12th May 2026. Payments can be made via bank transfer or at the school bursar. Contact admin@nurturehouse.edu for any queries.",
      audience: "all-parents",
      createdAt: "2026-05-03T09:00:00.000Z",
      createdBy: "user-admin",
      readBy: ["user-parent"],
    },
    {
      id: "notice-2",
      title: "End-of-Term Concert — 30 May 2026",
      content:
        "We are pleased to invite all families to the Nurture House end-of-term concert on Friday 30th May at 3:00 PM. Children in Toddler Community (Nurture Buds) and Children's House (Nurture Explorers) will perform. Dress code is school uniform. Seats are limited — please confirm attendance by 20th May.",
      audience: "all-parents",
      createdAt: "2026-05-01T09:15:00.000Z",
      createdBy: "user-admin",
      readBy: ["user-parent"],
    },
    {
      id: "notice-3",
      title: "Allergy Awareness Reminder",
      content:
        "As part of our health and safety commitment, please ensure that packed lunchboxes do not contain nuts, shellfish, or dairy products. We have children in our community with severe allergies. Thank you for keeping every child safe.",
      audience: "all-parents",
      createdAt: "2026-04-28T10:30:00.000Z",
      createdBy: "user-admin",
      readBy: [],
    },
    {
      id: "notice-4",
      title: "Parents Resource Library Updated",
      content:
        "New materials have been added to the resource library this month including a guide on Montessori-friendly home environments, age-appropriate chores, and the mathematics progression for Children's House learners.",
      audience: "all-parents",
      createdAt: "2026-04-25T08:00:00.000Z",
      createdBy: "user-admin",
      readBy: [],
    },
  ],
  observations: [
    {
      id: "obs-1",
      studentId: "zoe",
      teacherId: "user-teacher",
      leafId: "sens-pt-build",
      content:
        "Zoe worked with the Pink Tower for 15 minutes and corrected two cube placements independently. She showed clear satisfaction when the tower was complete.",
      createdAt: "2026-05-05T10:20:00.000Z",
    },
    {
      id: "obs-2",
      studentId: "zoe",
      teacherId: "user-teacher",
      leafId: "pl-pouring-water",
      content:
        "Zoe chose water pouring three times this week. Her hand steadiness has noticeably improved — she now pours with both hands and rarely spills. She wiped the tray and replaced the work to the shelf without prompting.",
      createdAt: "2026-05-06T09:45:00.000Z",
    },
    {
      id: "obs-3",
      studentId: "zoe",
      teacherId: "user-teacher",
      leafId: "lang-ve-cards-matching",
      content:
        "During picture-book time, Zoe pointed to the duck and said its name unprompted. She is building a vocabulary of about 8 animal names and responds well to naming games.",
      createdAt: "2026-05-04T11:00:00.000Z",
    },
    {
      id: "obs-4",
      studentId: "leo",
      teacherId: "user-teacher",
      leafId: "pl-spooning",
      content:
        "Leo completed the spoon-transfer exercise with dry lentils today — minimal spill. Concentration span was about 8 minutes, up from 4 minutes last month. He replaced the work to the shelf independently.",
      createdAt: "2026-05-06T09:55:00.000Z",
    },
    {
      id: "obs-5",
      studentId: "leo",
      teacherId: "user-teacher",
      leafId: "sens-sc-6",
      content:
        "Leo matched all six sound cylinders by pairs in one work cycle today. He noticed the softest pair before the loudest — interesting auditory discrimination. He repeated the work twice for the joy of it.",
      createdAt: "2026-05-02T11:20:00.000Z",
    },
    {
      id: "obs-6",
      studentId: "sarah",
      teacherId: "user-teacher",
      leafId: "cult-painting-watercolors",
      content:
        "Sarah mixed red and yellow at the easel and announced 'I made orange!'. This was the first intentional colour-mixing moment observed. She then named all three primary colours when asked.",
      createdAt: "2026-05-06T13:15:00.000Z",
    },
    {
      id: "obs-7",
      studentId: "sarah",
      teacherId: "user-teacher",
      leafId: "pl-dressing-zipping",
      content:
        "Sarah zipped the dressing frame independently for the first time and then helped a younger child line up the zipper teeth. She is developing fine motor control and a quiet pride in helping others.",
      createdAt: "2026-05-04T14:30:00.000Z",
    },
    {
      id: "obs-8",
      studentId: "emma",
      teacherId: "user-teacher",
      leafId: "math-nr-find",
      content:
        "Emma mastered the number rods 1–10 and self-corrected twice without teacher intervention. She then combined rods to make ten — an uninstructed extension activity. Ready for introduction to the short bead chain.",
      createdAt: "2026-05-06T10:30:00.000Z",
    },
    {
      id: "obs-9",
      studentId: "emma",
      teacherId: "user-teacher",
      leafId: "sens-c2-all",
      content:
        "Emma returned to the colour tablet box twice in one work cycle. On her second attempt, she arranged all eleven pairs into a full gradient from lightest to darkest — a spontaneous extension that shows deep understanding of the material.",
      createdAt: "2026-05-05T11:15:00.000Z",
    },
    {
      id: "obs-10",
      studentId: "noah",
      teacherId: "user-teacher",
      leafId: "sens-bs-build",
      content:
        "Noah completed the Brown Stair build perfectly and then placed it alongside the Pink Tower, observing that the thinnest prism matches the smallest cube. He verbalised this connection unprompted — a strong analytical observation.",
      createdAt: "2026-05-06T10:40:00.000Z",
    },
    {
      id: "obs-11",
      studentId: "noah",
      teacherId: "user-teacher",
      leafId: "lang-sp-s",
      content:
        "Noah traced the sandpaper 'S' three times today, then turned to a younger peer and said 'sssss' while pointing to the snake in the picture book. Spontaneous teaching — leadership qualities emerging through the work.",
      createdAt: "2026-05-04T14:30:00.000Z",
    },
    {
      id: "obs-12",
      studentId: "aisha",
      teacherId: "user-teacher",
      leafId: "lang-ma-write",
      content:
        "Aisha composed three sentences about desert animals with the movable alphabet — topic word, two supporting words, and a closing word. She referred to her picture card to verify a spelling before placing the letters. Intellectual rigour beyond her age group average.",
      createdAt: "2026-05-06T11:50:00.000Z",
    },
    {
      id: "obs-13",
      studentId: "aisha",
      teacherId: "user-teacher",
      leafId: "cult-cm-label",
      content:
        "Aisha named all seven continents on the puzzle map and pointed out the two she'd like to visit. She set herself the goal of learning one country from each continent by end of term.",
      createdAt: "2026-05-03T10:00:00.000Z",
    },
    {
      id: "obs-14",
      studentId: "james",
      teacherId: "user-teacher",
      leafId: "math-hundred-board",
      content:
        "James sequenced the Hundred Board from 1 to 100 in a single work cycle today. He noticed the diagonal pattern of repeating digits and asked why nine is followed by ten — a thoughtful question that led to a brief discussion of place value.",
      createdAt: "2026-05-06T10:00:00.000Z",
    },
    {
      id: "obs-15",
      studentId: "james",
      teacherId: "user-teacher",
      leafId: "cult-painting-watercolors",
      content:
        "James discovered the wet-on-wet watercolour technique at the easel and created a sunset gradient by accident. His response — 'I want to do that again' — is the quintessential Montessori moment of intrinsic motivation.",
      createdAt: "2026-05-01T13:45:00.000Z",
    },
  ],
  invoices: [
    {
      id: "INV-ZOE-0526",
      studentId: "zoe",
      parentId: "user-parent",
      description: "May 2026 Tuition — Toddler Community (Nurture Buds)",
      amountCents: 14500000,
      issuedAt: "2026-05-03T09:00:00.000Z",
      dueDate: "2026-05-12",
      status: "unpaid",
    },
    {
      id: "INV-ZOE-0426",
      studentId: "zoe",
      parentId: "user-parent",
      description: "April 2026 Tuition — Toddler Community (Nurture Buds)",
      amountCents: 14500000,
      issuedAt: "2026-04-02T09:00:00.000Z",
      dueDate: "2026-04-10",
      status: "paid",
    },
    {
      id: "INV-EMMA-0526",
      studentId: "emma",
      parentId: "user-parent",
      description: "May 2026 Tuition — Children's House (Nurture Explorers)",
      amountCents: 17500000,
      issuedAt: "2026-05-03T09:00:00.000Z",
      dueDate: "2026-05-12",
      status: "unpaid",
    },
    {
      id: "INV-EMMA-0426",
      studentId: "emma",
      parentId: "user-parent",
      description: "April 2026 Tuition — Children's House (Nurture Explorers)",
      amountCents: 17500000,
      issuedAt: "2026-04-02T09:00:00.000Z",
      dueDate: "2026-04-10",
      status: "paid",
    },
    {
      id: "INV-LEO-0526",
      studentId: "leo",
      parentId: "user-parent-leo",
      description: "May 2026 Tuition — Toddler Community (Nurture Buds)",
      amountCents: 14500000,
      issuedAt: "2026-05-03T09:00:00.000Z",
      dueDate: "2026-05-12",
      status: "paid",
    },
    {
      id: "INV-AISHA-0526",
      studentId: "aisha",
      parentId: "user-parent-aisha",
      description: "May 2026 Tuition — Infant Community (Nurture Bloomers)",
      amountCents: 19500000,
      issuedAt: "2026-05-03T09:00:00.000Z",
      dueDate: "2026-05-12",
      status: "unpaid",
    },
  ],
  dailyReports: [
    {
      id: "report-zoe-2026-05-06",
      studentId: "zoe",
      ageGroup: "0-2 years",
      date: "2026-05-06",
      weekLabel: "Week 2",
      status: "generated",
      generalMood: "Happy",
      temperatureCelsius: 36.8,
      temperatureTakenAt: "08:30",
      careEntries: [
        {
          label: "Breakfast",
          value: "Oat porridge and banana",
          time: "08:15 AM",
        },
        { label: "How much (Breakfast)", value: "All" },
        {
          label: "Morning Snack",
          value: "Crackers and water",
          time: "10:00 AM",
        },
        { label: "Bowel Movement", value: "Normal, once", time: "10:30 AM" },
        { label: "Lunch", value: "Rice and vegetables", time: "12:10 PM" },
        { label: "How much (Lunch)", value: "Most" },
        { label: "Nap", value: "1 hour 20 minutes", time: "1:00 PM – 2:20 PM" },
        {
          label: "Diaper / Toilet",
          value: "Changed twice",
          time: "10:40 AM / 1:25 PM",
        },
        {
          label: "Mood of the Day",
          value:
            "Happy and calm. Smiled often, engaged with peers during circle time.",
        },
      ],
      funLearning:
        "Zoe enjoyed stacking soft blocks, matching animal cards, and singing action songs during circle time.",
      followUpAtHome:
        "Encourage simple naming games with animals and body parts, and keep offering short tidy-up routines after play.",
      teacherComments:
        "She settled quickly, smiled often, and responded well to one-step instructions during transitions.",
      parentComments:
        "Parent noted she slept well and arrived cheerful this morning.",
      teacherSignature: "Ms. Sarah Reed",
      parentSignature: "Amanda Wong",
      updatedAt: "2026-05-06T14:35:00.000Z",
    },
    {
      id: "report-leo-2026-05-06",
      studentId: "leo",
      ageGroup: "0-2 years",
      date: "2026-05-06",
      weekLabel: "Week 2",
      status: "pending",
      generalMood: "Neutral",
      temperatureCelsius: 37.6,
      temperatureTakenAt: "10:15",
      careEntries: [
        { label: "Breakfast", value: "Porridge and fruit", time: "08:20 AM" },
        { label: "How much (Breakfast)", value: "Some" },
        { label: "Bowel Movement", value: "Soft, once", time: "09:50 AM" },
        { label: "Lunch", value: "Porridge and fruit", time: "11:55 AM" },
        { label: "How much (Lunch)", value: "Some" },
        { label: "Nap", value: "45 minutes", time: "12:50 PM – 1:35 PM" },
        {
          label: "Diaper / Toilet",
          value: "Potty attempt with support",
          time: "10:15 AM",
        },
        {
          label: "Mood of the Day",
          value:
            "Settled but needed brief reassurance at transitions. Generally calm.",
        },
      ],
      funLearning:
        "Leo explored spoon transfer work, water play, and shape sorting with close guidance from the guide.",
      followUpAtHome:
        "Practice spooning dry items at home and continue toilet routine language using the same phrases each day.",
      teacherComments:
        "He needed a little help during transitions but rejoined activities calmly after brief reassurance.",
      parentComments: "",
      teacherSignature: "Ms. Sarah Reed",
      parentSignature: "",
      updatedAt: "2026-05-06T12:15:00.000Z",
    },
    {
      id: "report-sarah-2026-05-06",
      studentId: "sarah",
      ageGroup: "0-2 years",
      date: "2026-05-06",
      weekLabel: "Week 2",
      status: "sent",
      generalMood: "Happy",
      temperatureCelsius: 36.6,
      temperatureTakenAt: "08:45",
      careEntries: [
        {
          label: "Breakfast",
          value: "Banana and dairy-free toast",
          time: "08:10 AM",
        },
        { label: "How much (Breakfast)", value: "All" },
        { label: "Bowel Movement", value: "Normal, once", time: "10:00 AM" },
        {
          label: "Lunch",
          value: "Beans, plantain, and water",
          time: "12:05 PM",
        },
        { label: "How much (Lunch)", value: "All" },
        { label: "Nap", value: "1 hour", time: "1:10 PM – 2:10 PM" },
        {
          label: "Diaper / Toilet",
          value: "Independent toilet visit with reminder",
          time: "11:20 AM",
        },
        {
          label: "Mood of the Day",
          value:
            "Playful, cooperative, and proud. Showed great enthusiasm during finger painting.",
        },
      ],
      funLearning:
        "Sarah had fun with finger painting, rolling balls during outdoor play, and naming colors in the book corner.",
      followUpAtHome:
        "Offer more color-naming and hand-strength activities like tearing paper or squeezing sponges.",
      teacherComments:
        "She was playful, cooperative, and proud to show her finished painting before rest time.",
      parentComments: "Thank you. She talked about painting on the way home.",
      teacherSignature: "Ms. Sarah Reed",
      parentSignature: "Mrs. Jenkins",
      updatedAt: "2026-05-06T15:10:00.000Z",
    },
    // 3-6 years reports
    {
      id: "report-emma-2026-05-06",
      studentId: "emma",
      ageGroup: "3-6 years",
      date: "2026-05-06",
      weekLabel: "Week 2",
      status: "generated",
      generalMood: "Happy",
      workCycle: [
        {
          area: "Practical Life",
          activity: "Pouring water between jugs",
          level: "Developing",
        },
        {
          area: "Sensorial",
          activity: "Colour tablets – second box",
          level: "Introduced",
        },
        {
          area: "Language",
          activity: "Sandpaper letters (a, m, s)",
          level: "Developing",
        },
        {
          area: "Mathematics",
          activity: "Number rods 1–10",
          level: "Proficient",
        },
        {
          area: "Cultural",
          activity: "Continent puzzle map",
          level: "Introduced",
        },
        {
          area: "Art",
          activity: "Collage with natural materials",
          level: "Developing",
        },
      ],
      concentrationLevel:
        "High — Emma returned to the colour tablet work twice without prompting.",
      independenceSkills:
        "Rolled and stored her mat independently; served herself at snack time.",
      socialDevelopment:
        "Played cooperatively with two peers at the art table; shared scissors gracefully.",
      mealNotes:
        "Ate a full lunch; tried the cucumber slices for the first time.",
      teacherComments:
        "Emma demonstrated excellent focus during the Practical Life sequence. She is ready for the bead cabinet introduction next week.",
      parentComments: "",
      teacherSignature: "Ms. Sarah Reed",
      parentSignature: "",
      updatedAt: "2026-05-06T14:00:00.000Z",
    },
    {
      id: "report-noah-2026-05-06",
      studentId: "noah",
      ageGroup: "3-6 years",
      date: "2026-05-06",
      weekLabel: "Week 2",
      status: "pending",
      generalMood: "Neutral",
      workCycle: [
        {
          area: "Practical Life",
          activity: "Button frame",
          level: "Developing",
        },
        { area: "Sensorial", activity: "Pink tower", level: "Proficient" },
        {
          area: "Language",
          activity: "Object-picture matching",
          level: "Developing",
        },
        { area: "Mathematics", activity: "Spindle boxes", level: "Introduced" },
      ],
      concentrationLevel:
        "Moderate — needed brief re-direction once during work time.",
      independenceSkills:
        "Hanging his coat on arrival independently; still needs support with mat rolling.",
      socialDevelopment:
        "Enjoyed parallel play at the sensorial shelf; beginning to observe peers' choices.",
      mealNotes: "Light eater today — had half his portion; drank water well.",
      teacherComments: "",
      parentComments: "",
      teacherSignature: "Ms. Sarah Reed",
      parentSignature: "",
      updatedAt: "2026-05-06T11:30:00.000Z",
    },
    // 7-9 years reports
    {
      id: "report-aisha-2026-05-06",
      studentId: "aisha",
      ageGroup: "7-9 years",
      date: "2026-05-06",
      weekLabel: "Week 2",
      status: "sent",
      generalMood: "Happy",
      subjectProgress: [
        {
          subject: "Language Arts",
          activity: "Research paragraph on rainforests",
          note: "Strong topic sentence; working on supporting details.",
        },
        {
          subject: "Mathematics",
          activity: "Long multiplication with bead frame",
          note: "Completed 4 problems independently.",
        },
        {
          subject: "Science",
          activity: "Parts of a plant labelling",
          note: "Identified all 8 parts correctly.",
        },
        {
          subject: "Geography",
          activity: "Africa puzzle map",
          note: "Named 12 countries with confidence.",
        },
        {
          subject: "Art / Music",
          activity: "Rhythm patterns on drum circle",
          note: "Kept steady beat; enthusiastic participant.",
        },
      ],
      projectWork:
        "Aisha continued her animal adaptation project — drafted her second section on desert animals.",
      behaviorNotes:
        "Focused throughout the morning work cycle. Helped a younger child return a material to the shelf.",
      teacherComments:
        "Aisha is progressing steadily across all areas. Her research writing is her current stretch goal and she is rising to it.",
      parentComments:
        "She showed us her project notes at dinner. Very proud of her!",
      teacherSignature: "Ms. Sarah Reed",
      parentSignature: "Mr. Patel",
      updatedAt: "2026-05-06T15:45:00.000Z",
    },
    {
      id: "report-james-2026-05-06",
      studentId: "james",
      ageGroup: "7-9 years",
      date: "2026-05-06",
      weekLabel: "Week 2",
      status: "pending",
      generalMood: "Neutral",
      subjectProgress: [
        {
          subject: "Language Arts",
          activity: "Punctuation grammar boxes",
          note: "Reviewed commas in lists; needs more practice.",
        },
        {
          subject: "Mathematics",
          activity: "Fraction skittles – equivalence",
          note: "Grasped halves and quarters; thirds still emerging.",
        },
        {
          subject: "History",
          activity: "Timeline of life — vertebrates",
          note: "Placed cards accurately after second attempt.",
        },
        {
          subject: "Art / Music",
          activity: "Watercolour wash technique",
          note: "Experimenting with colour blending.",
        },
      ],
      projectWork:
        "Started his biography project on a scientist of his choice — selected Marie Curie.",
      behaviorNotes:
        "Needed short movement break mid-morning; returned settled and completed his work cycle.",
      teacherComments: "",
      parentComments: "",
      teacherSignature: "Ms. Sarah Reed",
      parentSignature: "",
      updatedAt: "2026-05-06T12:00:00.000Z",
    },
  ],
  activityPosts: [
    {
      id: "act-zoe-1",
      studentId: "zoe",
      teacherId: "user-teacher",
      caption:
        "Zoe spent nearly 20 minutes at the water-transfer tray today — completely absorbed, pouring from the small jug with steady focus. She corrected herself when water spilled, then looked up and smiled proudly. 💧",
      imageUrl: "https://picsum.photos/seed/zoewater/600/400",
      leafId: "pl-pouring-water",
      likes: 4,
      likedByParent: true,
      createdAt: "2026-05-06T10:20:00.000Z",
    },
    {
      id: "act-zoe-2",
      studentId: "zoe",
      teacherId: "user-teacher",
      caption:
        "Circle time was full of giggles today! Zoe led the animal sound game and had the whole group mooing and clucking along. Her confidence during group activities has really blossomed. 🐮",
      imageUrl: "https://picsum.photos/seed/zoecircle/600/400",
      leafId: "lang-sg-beg",
      likes: 7,
      likedByParent: true,
      createdAt: "2026-05-05T09:45:00.000Z",
    },
    {
      id: "act-zoe-3",
      studentId: "zoe",
      teacherId: "user-teacher",
      caption:
        "Outdoor play — Zoe discovered that pouring sand through the funnel makes a satisfying stream. She repeated it at least 12 times, experimenting with speed and height. Pure toddler science! ☀️",
      imageUrl: "https://picsum.photos/seed/zoeoutdoor/600/400",
      leafId: "pl-pouring-different",
      likes: 5,
      likedByParent: false,
      createdAt: "2026-05-04T14:10:00.000Z",
    },
    {
      id: "act-emma-1",
      studentId: "emma",
      teacherId: "user-teacher",
      caption:
        "Emma revisited the colour tablet box for the second time this week. She matched all pairs quietly and even organised them into a gradient without any prompting — such a beautiful moment to witness. 🎨",
      imageUrl: "https://picsum.photos/seed/emmacolour/600/400",
      leafId: "sens-c2-all",
      likes: 6,
      likedByParent: false,
      createdAt: "2026-05-06T11:00:00.000Z",
    },
    {
      id: "act-emma-2",
      studentId: "emma",
      teacherId: "user-teacher",
      caption:
        "Emma finished her natural-materials collage today — leaves, dried petals, and small sticks, all arranged with real intention. She named her piece 'the forest floor'. We've displayed it on the art wall! 🍂",
      imageUrl: "https://picsum.photos/seed/emmaart/600/400",
      leafId: "cult-join-wet-glue",
      likes: 9,
      likedByParent: true,
      createdAt: "2026-05-05T13:30:00.000Z",
    },
    {
      id: "act-emma-3",
      studentId: "emma",
      teacherId: "user-teacher",
      caption:
        "Number rods day! Emma lined up rods 1–10 in sequence, then counted each one aloud. She then challenged herself to combine rods to make ten — absolutely thriving in Mathematics this week. 🔢",
      imageUrl: "https://picsum.photos/seed/emmamath/600/400",
      leafId: "math-rc-add-10",
      likes: 3,
      likedByParent: false,
      createdAt: "2026-05-03T10:50:00.000Z",
    },
    {
      id: "act-leo-1",
      studentId: "leo",
      teacherId: "user-teacher",
      caption:
        "Leo had his best spoon-transfer session yet — dry lentils from bowl to bowl, barely a spill! He has been practising this daily and his concentration span is visibly growing week by week. 🥄",
      imageUrl: "https://picsum.photos/seed/leospoon/600/400",
      leafId: "pl-spooning",
      likes: 5,
      likedByParent: false,
      createdAt: "2026-05-06T09:55:00.000Z",
    },
    {
      id: "act-leo-2",
      studentId: "leo",
      teacherId: "user-teacher",
      caption:
        "Music corner was Leo's world today. He discovered that tapping the hanging chimes with different speeds makes different sounds. He repeated his 'song' five times — pure joy on his face! 🎵",
      imageUrl: "https://picsum.photos/seed/leomusic/600/400",
      leafId: "sens-bells-carry",
      likes: 8,
      likedByParent: false,
      createdAt: "2026-05-02T11:20:00.000Z",
    },
    {
      id: "act-sarah-1",
      studentId: "sarah",
      teacherId: "user-teacher",
      caption:
        "Sarah's finger painting today was an explosion of colour! She mixed red and yellow herself and announced that she made orange — her first intentional colour mix. The painting is drying and will come home Friday. 🖌️",
      imageUrl: "https://picsum.photos/seed/sarahpaint/600/400",
      leafId: "cult-painting-watercolors",
      likes: 11,
      likedByParent: false,
      createdAt: "2026-05-06T13:15:00.000Z",
    },
    {
      id: "act-noah-1",
      studentId: "noah",
      teacherId: "user-teacher",
      caption:
        "Noah spent the entire work cycle on the Pink Tower this morning — built it, knocked it down, built it again. He then built it beside the brown stair and spotted that the smallest cube matches the thinnest prism. Brilliant observation! 🏗️",
      imageUrl: "https://picsum.photos/seed/noahpink/600/400",
      leafId: "sens-pt-build",
      likes: 6,
      likedByParent: false,
      createdAt: "2026-05-06T10:40:00.000Z",
    },
    {
      id: "act-noah-2",
      studentId: "noah",
      teacherId: "user-teacher",
      caption:
        "Outdoor morning — Noah organised a small 'construction site' with his friends, assigning roles and materials. His leadership skills are quietly blossoming. We love watching this! 🌿",
      imageUrl: "https://picsum.photos/seed/noahoutdoor/600/400",
      leafId: "lang-ld-double",
      likes: 4,
      likedByParent: false,
      createdAt: "2026-05-04T14:30:00.000Z",
    },
    {
      id: "act-aisha-1",
      studentId: "aisha",
      teacherId: "user-teacher",
      caption:
        "Aisha completed the second section of her animal adaptation research project today — desert animals. Her writing shows great structure: topic sentence, two supporting details, and a closing thought. Really impressive for her level! 📝",
      imageUrl: "https://picsum.photos/seed/aishawrite/600/400",
      leafId: "lang-ma-write",
      likes: 7,
      likedByParent: false,
      createdAt: "2026-05-06T11:50:00.000Z",
    },
    {
      id: "act-aisha-2",
      studentId: "aisha",
      teacherId: "user-teacher",
      caption:
        "Drum circle Friday! Aisha held a steady rhythm the entire session and even tried a variation on the second round. She also helped a younger student count the beats — leadership in action. 🥁",
      imageUrl: "https://picsum.photos/seed/aishadrum/600/400",
      leafId: "cult-make-percussion",
      likes: 10,
      likedByParent: false,
      createdAt: "2026-05-02T14:00:00.000Z",
    },
    {
      id: "act-james-1",
      studentId: "james",
      teacherId: "user-teacher",
      caption:
        "James chose Marie Curie for his biography project! He spent the morning reading three reference cards and filling in his research organiser. He was so engaged he asked to continue after lunch. 🔬",
      imageUrl: "https://picsum.photos/seed/jamesbio/600/400",
      leafId: "lang-rc-cards",
      likes: 5,
      likedByParent: false,
      createdAt: "2026-05-06T10:00:00.000Z",
    },
    {
      id: "act-james-2",
      studentId: "james",
      teacherId: "user-teacher",
      caption:
        "Watercolour wash technique — James experimented with wet-on-wet today and created a soft sunset gradient completely by accident. He immediately said 'I want to do that again' — we call that the Montessori moment! 🌅",
      imageUrl: "https://picsum.photos/seed/jamesart/600/400",
      leafId: "cult-painting-watercolors",
      likes: 8,
      likedByParent: false,
      createdAt: "2026-05-01T13:45:00.000Z",
    },
  ],
  dailyActivityLogs: [
    {
      id: "dlog-zoe-2026-05-07-1",
      studentId: "zoe",
      teacherId: "user-teacher",
      date: "2026-05-07",
      time: "12:20",
      activityType: "meals",
      value: "Lunch (Most)",
      notes: "Ate vegetables first and needed one reminder for water.",
      createdAt: "2026-05-07T12:20:00.000Z",
    },
    {
      id: "dlog-leo-2026-05-07-1",
      studentId: "leo",
      teacherId: "user-teacher",
      date: "2026-05-07",
      time: "13:05",
      activityType: "nap",
      value: "45 mins",
      notes: "Settled after gentle back patting.",
      createdAt: "2026-05-07T13:05:00.000Z",
    },
    {
      id: "dlog-emma-2026-05-07-1",
      studentId: "emma",
      teacherId: "user-teacher",
      date: "2026-05-07",
      time: "10:10",
      activityType: "hygiene",
      value: "Hand Wash",
      notes: "Completed independently before snack.",
      createdAt: "2026-05-07T10:10:00.000Z",
    },
  ],
  progressData: {
    zoe: progressDataMap.zoe,
    emma: progressDataMap.emma,
    leo: progressDataMap.leo,
    aisha: progressDataMap.aisha,
    noah: progressDataMap.noah,
    james: progressDataMap.james,
  },
  afterSchoolEnrollments: [],
  curriculumProgress: seedCurriculumProgress(),
  adminComments: [
    {
      id: "admin-comment-1",
      studentId: "noah",
      adminId: "user-admin",
      kind: "guidance",
      body: "Noah is showing strong analytical reasoning and leadership in sensorial work. Continue gentle one-to-one introductions to the early math materials — he is ready for the number rods sequence. Please share notes on his social mentoring so we can recognise it formally at the end-of-term assembly.",
      createdAt: "2026-05-04T09:30:00.000Z",
    },
    {
      id: "admin-comment-2",
      studentId: "emma",
      adminId: "user-admin",
      kind: "move-recommendation",
      body: "Emma has consistently been working at a level beyond her current group. Several mastered presentations across Math, Sensorial, and Art. I'd like to propose moving her up to the older Children's House group at the start of next term — please observe her readiness during transitions over the next two weeks.",
      suggestedMove: "Children's House — Lower Elementary (6-9 group)",
      createdAt: "2026-05-05T11:15:00.000Z",
    },
  ],
  attendance: seedAttendance(),
  teacherAssignments: {
    "user-teacher": ["Bloomers Nest", "Buds Garden", "Explorers Corner"],
  },
};

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

function nextId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

export function subscribeDemoStore(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getDemoSnapshot() {
  return state;
}

export function useDemoStore() {
  return useSyncExternalStore(
    subscribeDemoStore,
    getDemoSnapshot,
    getDemoSnapshot,
  );
}

export function formatCurrency(amountCents: number) {
  return `₦${(amountCents / 100).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function getRoleUser(role: Role) {
  return state.users[role];
}

export function getStudentById(studentId: string) {
  return state.students.find((student) => student.id === studentId);
}

export function getPrimaryStudentForParent(parentId: string) {
  return state.students.find((student) => {
    const pid = student.parentId;
    return Array.isArray(pid) ? pid.includes(parentId) : pid === parentId;
  });
}

export function getStudentsForParent(parentId: string) {
  return state.students.filter((student) => {
    const pid = student.parentId;
    return Array.isArray(pid) ? pid.includes(parentId) : pid === parentId;
  });
}

export function getStudentInvoices(studentId: string) {
  return state.invoices
    .filter((invoice) => invoice.studentId === studentId)
    .sort((a, b) => (a.issuedAt < b.issuedAt ? 1 : -1));
}

function withLeaf(obs: DemoObservation): ObservationWithLeaf | null {
  const leaf = getLeafById(obs.leafId);
  if (!leaf) return null;
  return { ...obs, leaf };
}

export function getStudentObservations(studentId: string): ObservationWithLeaf[] {
  return state.observations
    .filter((observation) => observation.studentId === studentId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .map(withLeaf)
    .filter((o): o is ObservationWithLeaf => o !== null);
}

export function getTeacherStudents(teacherId: string) {
  const assignedClassrooms = state.teacherAssignments[teacherId];
  if (assignedClassrooms && assignedClassrooms.length > 0) {
    // Union: directly-assigned students plus any student whose classroom is
    // in this teacher's class assignment list.
    const set = new Set(assignedClassrooms);
    return state.students.filter(
      (s) => s.teacherId === teacherId || set.has(s.classroom),
    );
  }
  return state.students.filter((s) => s.teacherId === teacherId);
}

export function getAllObservations(): ObservationWithLeaf[] {
  return [...state.observations]
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .map(withLeaf)
    .filter((o): o is ObservationWithLeaf => o !== null);
}

export function getDailyReports(status?: DemoDailyReportStatus) {
  const reports = status
    ? state.dailyReports.filter((report) => report.status === status)
    : [...state.dailyReports];

  return reports.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export function getDailyReportById(reportId: string) {
  return state.dailyReports.find((report) => report.id === reportId);
}

export function getStudentDailyReports(studentId: string) {
  return state.dailyReports
    .filter((report) => report.studentId === studentId)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getTeacherDailyActivityLogs(
  date: string,
  teacherId = state.users.teacher.id,
) {
  return [...state.dailyActivityLogs]
    .filter((log) => log.date === date && log.teacherId === teacherId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function addDailyActivityLogs(input: {
  studentIds: string[];
  date: string;
  time: string;
  activityType: DemoDailyActivityType;
  value: string;
  notes?: string;
}) {
  if (input.studentIds.length === 0) return;

  const createdAt = new Date().toISOString();
  const logs = input.studentIds.map((studentId) => ({
    id: nextId("dlog"),
    studentId,
    teacherId: state.users.teacher.id,
    date: input.date,
    time: input.time,
    activityType: input.activityType,
    value: input.value,
    notes: input.notes?.trim() ?? "",
    createdAt,
  }));

  state = {
    ...state,
    dailyActivityLogs: [...logs, ...state.dailyActivityLogs],
  };
  emit();
}

export function getParentDailyReports(parentId: string) {
  const students = getStudentsForParent(parentId);
  const studentIds = new Set(students.map((s) => s.id));
  return state.dailyReports
    .filter((report) => studentIds.has(report.studentId))
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getParentNotices() {
  return [...state.notices].sort((a, b) =>
    a.createdAt < b.createdAt ? 1 : -1,
  );
}

export function getCalendarEvents() {
  return [...calendarEvents].sort((a, b) => (a.startsAt > b.startsAt ? 1 : -1));
}

export function getParentCalendarEvents() {
  return getCalendarEvents().filter((event) => event.audience === "public");
}

export function getUpcomingParentCalendarEvents(limit?: number) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const upcomingEvents = getParentCalendarEvents().filter(
    (event) => new Date(event.startsAt) >= startOfToday,
  );

  return typeof limit === "number"
    ? upcomingEvents.slice(0, limit)
    : upcomingEvents;
}

export function createNotice(input: { title: string; content: string }) {
  const admin = state.users.admin;
  state = {
    ...state,
    notices: [
      {
        id: nextId("notice"),
        title: input.title,
        content: input.content,
        audience: "all-parents",
        createdAt: new Date().toISOString(),
        createdBy: admin.id,
        readBy: [],
      },
      ...state.notices,
    ],
  };
  emit();
}

export function createObservation(input: {
  studentId: string;
  leafId: string;
  content: string;
}) {
  const teacher = state.users.teacher;
  state = {
    ...state,
    observations: [
      {
        id: nextId("obs"),
        studentId: input.studentId,
        teacherId: teacher.id,
        leafId: input.leafId,
        content: input.content,
        createdAt: new Date().toISOString(),
      },
      ...state.observations,
    ],
  };
  emit();
}

export function updateDailyReportStatus(
  reportId: string,
  status: DemoDailyReportStatus,
) {
  state = {
    ...state,
    dailyReports: state.dailyReports.map((report) =>
      report.id === reportId
        ? {
            ...report,
            status,
            updatedAt: new Date().toISOString(),
          }
        : report,
    ),
  };
  emit();
}

export function createInvoice(input: {
  studentId: string;
  description: string;
  amountCents: number;
  dueDate: string;
}) {
  const student = getStudentById(input.studentId);
  if (!student) return;

  state = {
    ...state,
    invoices: [
      {
        id: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        studentId: input.studentId,
        parentId: Array.isArray(student.parentId)
          ? student.parentId[0]
          : student.parentId,
        description: input.description,
        amountCents: input.amountCents,
        issuedAt: new Date().toISOString(),
        dueDate: input.dueDate,
        status: "unpaid",
      },
      ...state.invoices,
    ],
  };
  emit();
}

export function markInvoicePaid(invoiceId: string) {
  state = {
    ...state,
    invoices: state.invoices.map((invoice) =>
      invoice.id === invoiceId ? { ...invoice, status: "paid" } : invoice,
    ),
  };
  emit();
}

export function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

function postWithLeaf(post: DemoActivityPost): ActivityPostWithLeaf | null {
  const leaf = getLeafById(post.leafId);
  if (!leaf) return null;
  return { ...post, leaf };
}

export function getActivityPostsForStudent(
  studentId: string,
): ActivityPostWithLeaf[] {
  return [...state.activityPosts]
    .filter((p) => p.studentId === studentId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .map(postWithLeaf)
    .filter((p): p is ActivityPostWithLeaf => p !== null);
}

export function getActivityFeedForParent(
  parentId: string,
): ActivityPostWithLeaf[] {
  const students = getStudentsForParent(parentId);
  const studentIds = new Set(students.map((s) => s.id));
  return [...state.activityPosts]
    .filter((p) => studentIds.has(p.studentId))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .map(postWithLeaf)
    .filter((p): p is ActivityPostWithLeaf => p !== null);
}

export function toggleActivityLike(postId: string) {
  state = {
    ...state,
    activityPosts: state.activityPosts.map((p) =>
      p.id === postId
        ? {
            ...p,
            likedByParent: !p.likedByParent,
            likes: p.likedByParent ? p.likes - 1 : p.likes + 1,
          }
        : p,
    ),
  };
  emit();
}

export function addActivityPost(input: {
  studentId: string;
  caption: string;
  imageUrl: string;
  leafId: string;
}) {
  state = {
    ...state,
    activityPosts: [
      {
        id: nextId("act"),
        studentId: input.studentId,
        teacherId: state.users.teacher.id,
        caption: input.caption,
        imageUrl: input.imageUrl,
        leafId: input.leafId,
        likes: 0,
        likedByParent: false,
        createdAt: new Date().toISOString(),
      },
      ...state.activityPosts,
    ],
  };
  emit();
}

export function getStudentProgress(studentId: string): DemoProgress | null {
  return state.progressData[studentId] || null;
}

export function markNoticeRead(noticeId: string, parentId: string) {
  state = {
    ...state,
    notices: state.notices.map((n) =>
      n.id === noticeId && !n.readBy.includes(parentId)
        ? { ...n, readBy: [...n.readBy, parentId] }
        : n,
    ),
  };
  emit();
}

export function getNoticeReadCount(noticeId: string) {
  const notice = state.notices.find((n) => n.id === noticeId);
  return notice ? notice.readBy.length : 0;
}

export function getTotalParentCount() {
  return new Set(
    state.students.map((s) =>
      Array.isArray(s.parentId) ? s.parentId[0] : s.parentId,
    ),
  ).size;
}

export function enrollAfterSchool(studentId: string, parentId: string) {
  const already = state.afterSchoolEnrollments.some(
    (e) => e.studentId === studentId,
  );
  if (already) return;
  state = {
    ...state,
    afterSchoolEnrollments: [
      ...state.afterSchoolEnrollments,
      { studentId, enrolledAt: new Date().toISOString(), enrolledBy: parentId },
    ],
  };
  emit();
}

export function unenrollAfterSchool(studentId: string) {
  state = {
    ...state,
    afterSchoolEnrollments: state.afterSchoolEnrollments.filter(
      (e) => e.studentId !== studentId,
    ),
  };
  emit();
}

export function isAfterSchoolEnrolled(studentId: string) {
  return state.afterSchoolEnrollments.some((e) => e.studentId === studentId);
}

// ---------------------------------------------------------------------------
// Admin comments (teacher-only visibility)
// ---------------------------------------------------------------------------

export function getAdminCommentsForStudent(studentId: string) {
  return state.adminComments
    .filter((c) => c.studentId === studentId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function getAllAdminComments() {
  return [...state.adminComments].sort((a, b) =>
    a.createdAt < b.createdAt ? 1 : -1,
  );
}

export function addAdminComment(input: {
  studentId: string;
  kind: AdminCommentKind;
  body: string;
  suggestedMove?: string;
}) {
  const admin = state.users.admin;
  state = {
    ...state,
    adminComments: [
      {
        id: nextId("admincomment"),
        studentId: input.studentId,
        adminId: admin.id,
        kind: input.kind,
        body: input.body,
        suggestedMove: input.suggestedMove,
        createdAt: new Date().toISOString(),
      },
      ...state.adminComments,
    ],
  };
  emit();
}

export function deleteAdminComment(commentId: string) {
  state = {
    ...state,
    adminComments: state.adminComments.filter((c) => c.id !== commentId),
  };
  emit();
}

// ---------------------------------------------------------------------------
// Attendance
// ---------------------------------------------------------------------------

function seedAttendance(): DemoAttendance[] {
  // Seed a week of attendance per student so admin and parent views have data.
  const students = ["zoe", "leo", "emma", "noah", "aisha", "james", "sarah"];
  const today = new Date();
  const records: DemoAttendance[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dow = d.getDay();
    if (dow === 0 || dow === 6) continue; // skip weekends
    const date = d.toISOString().slice(0, 10);
    students.forEach((studentId, idx) => {
      // Deterministic but varied pattern
      const roll = (idx * 31 + i * 7) % 13;
      let status: AttendanceStatus = "present";
      if (roll === 0) status = "absent";
      else if (roll === 3) status = "late";
      else if (roll === 7) status = "excused";
      records.push({
        id: `att-${studentId}-${date}`,
        studentId,
        date,
        status,
        recordedBy: "user-teacher",
        notes: status === "excused" ? "Family event" : undefined,
        createdAt: `${date}T08:30:00.000Z`,
      });
    });
  }
  return records;
}

export function recordAttendance(input: {
  studentId: string;
  date: string;
  status: AttendanceStatus;
  notes?: string;
  teacherId?: string;
}) {
  const teacherId = input.teacherId ?? state.users.teacher.id;
  // Upsert: replace any existing record for this (studentId, date) pair.
  const existing = state.attendance.findIndex(
    (a) => a.studentId === input.studentId && a.date === input.date,
  );
  const record: DemoAttendance = {
    id:
      existing >= 0
        ? state.attendance[existing].id
        : nextId("att"),
    studentId: input.studentId,
    date: input.date,
    status: input.status,
    notes: input.notes,
    recordedBy: teacherId,
    createdAt: new Date().toISOString(),
  };
  const next = [...state.attendance];
  if (existing >= 0) next[existing] = record;
  else next.unshift(record);
  state = { ...state, attendance: next };
  emit();
}

export function getAttendanceForStudent(studentId: string) {
  return state.attendance
    .filter((a) => a.studentId === studentId)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getAttendanceForDate(date: string) {
  return state.attendance
    .filter((a) => a.date === date)
    .sort((a, b) => (a.studentId < b.studentId ? -1 : 1));
}

export function getAllAttendance() {
  return [...state.attendance].sort((a, b) =>
    a.date < b.date ? 1 : -1,
  );
}

// ---------------------------------------------------------------------------
// Teacher class assignments
// ---------------------------------------------------------------------------

export function getTeacherClassrooms(teacherId: string): string[] {
  return state.teacherAssignments[teacherId] ?? [];
}

export function getAllTeacherAssignments() {
  return { ...state.teacherAssignments };
}

export function setTeacherClassrooms(teacherId: string, classrooms: string[]) {
  state = {
    ...state,
    teacherAssignments: {
      ...state.teacherAssignments,
      [teacherId]: [...new Set(classrooms)],
    },
  };
  emit();
}

export function addTeacherClassroom(teacherId: string, classroom: string) {
  const current = state.teacherAssignments[teacherId] ?? [];
  if (current.includes(classroom)) return;
  setTeacherClassrooms(teacherId, [...current, classroom]);
}

export function removeTeacherClassroom(teacherId: string, classroom: string) {
  const current = state.teacherAssignments[teacherId] ?? [];
  setTeacherClassrooms(
    teacherId,
    current.filter((c) => c !== classroom),
  );
}

// Distinct classroom names that appear on any student record. Useful for the
// admin assignment picker.
export function getAllClassroomNames(): string[] {
  const set = new Set<string>();
  for (const s of state.students) set.add(s.classroom);
  return [...set].sort();
}

export function getAfterSchoolEnrollments() {
  return [...state.afterSchoolEnrollments];
}

export function getFrequentLatePickupStudents() {
  return state.students.filter((s) => s.frequentLatePickup);
}

export function addMedication(
  studentId: string,
  input: { name: string; dosage: string; time: string; notes: string },
) {
  state = {
    ...state,
    students: state.students.map((s) =>
      s.id === studentId
        ? {
            ...s,
            medications: [...s.medications, { id: nextId("med"), ...input }],
          }
        : s,
    ),
  };
  emit();
}

export function removeMedication(studentId: string, medicationId: string) {
  state = {
    ...state,
    students: state.students.map((s) =>
      s.id === studentId
        ? {
            ...s,
            medications: s.medications.filter((m) => m.id !== medicationId),
          }
        : s,
    ),
  };
  emit();
}

export function getTeacherName(teacherId: string) {
  if (teacherId === state.users.teacher.id) return state.users.teacher.name;
  return "Guide";
}

// ---------------------------------------------------------------------------
// Curriculum progress
// ---------------------------------------------------------------------------

// CurriculumStatus is declared earlier in this file alongside DemoCurriculumProgress.

export type CurriculumAreaStats = {
  total: number;
  introduced: number;
  developing: number;
  proficient: number;
  notStarted: number;
};

export type CurriculumStats = {
  overall: CurriculumAreaStats;
  byArea: Record<string, CurriculumAreaStats>;
};

function isoDaysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function seedCurriculumProgress(): DemoCurriculumProgress[] {
  // Seed shape: list of practice dates + an explicit teacher-set status.
  // Status is decoupled from practice count — a child may practice many
  // times before the teacher promotes them to "proficient".
  const recipes: Array<{
    studentId: string;
    entries: Array<{
      leafId: string;
      daysAgo: number[];
      status: CurriculumStatus;
    }>;
  }> = [
    {
      studentId: "zoe",
      entries: [
        { leafId: "pl-pouring-rice", daysAgo: [120, 90, 60, 30], status: "proficient" },
        { leafId: "pl-pouring-water", daysAgo: [60, 40, 15], status: "developing" },
        { leafId: "pl-spooning", daysAgo: [80, 60, 40, 20, 10], status: "proficient" },
        { leafId: "pl-handwashing-complete", daysAgo: [100, 75, 50, 25, 5], status: "proficient" },
        { leafId: "pl-rolling-rug", daysAgo: [25], status: "introduced" },
        { leafId: "sens-pt-build", daysAgo: [70, 50, 35], status: "developing" },
        { leafId: "sens-pt-measure", daysAgo: [20], status: "introduced" },
        { leafId: "math-nr-align", daysAgo: [12], status: "introduced" },
      ],
    },
    {
      studentId: "emma",
      entries: [
        { leafId: "sens-pt-build", daysAgo: [180, 150, 130, 100, 60], status: "proficient" },
        { leafId: "sens-pt-measure", daysAgo: [150, 120, 95, 70, 40], status: "proficient" },
        { leafId: "sens-pt-blindfold", daysAgo: [70, 50, 30], status: "developing" },
        { leafId: "sens-bs-build", daysAgo: [140, 110, 90, 60, 35], status: "proficient" },
        { leafId: "sens-rr-align", daysAgo: [120, 95, 70, 45, 25], status: "proficient" },
        { leafId: "sens-cb-one", daysAgo: [110, 80, 55, 35, 18], status: "proficient" },
        { leafId: "lang-sp-a", daysAgo: [100, 80, 60, 40, 20], status: "proficient" },
        { leafId: "lang-sp-m", daysAgo: [90, 70, 50, 30, 15], status: "proficient" },
        { leafId: "lang-sp-s", daysAgo: [85, 60, 42], status: "developing" },
        { leafId: "lang-sp-t", daysAgo: [30], status: "introduced" },
        { leafId: "lang-sg-beg", daysAgo: [95, 70, 45, 25, 12], status: "proficient" },
        { leafId: "math-nr-align", daysAgo: [90, 70, 50, 30, 18], status: "proficient" },
        { leafId: "math-nr-names", daysAgo: [70, 50, 30], status: "developing" },
        { leafId: "math-sp-14", daysAgo: [60, 40, 25], status: "developing" },
        { leafId: "math-spindle-counting", daysAgo: [22], status: "introduced" },
        { leafId: "cult-cm-color", daysAgo: [50, 30, 18], status: "developing" },
        { leafId: "cult-cutting-paper", daysAgo: [110, 85, 60, 40, 25], status: "proficient" },
        { leafId: "cult-painting-watercolors", daysAgo: [80], status: "introduced" },
        { leafId: "pl-pouring-water", daysAgo: [200, 170, 140, 110, 80, 40], status: "proficient" },
        { leafId: "pl-handwashing-complete", daysAgo: [195, 160, 125, 90, 55, 25], status: "proficient" },
        { leafId: "pl-dressing-zipping", daysAgo: [120, 90, 65, 40, 20], status: "developing" },
      ],
    },
    {
      studentId: "leo",
      entries: [
        { leafId: "pl-pouring-rice", daysAgo: [60, 45, 30], status: "developing" },
        { leafId: "pl-spooning", daysAgo: [45, 30, 18, 10, 4], status: "proficient" },
        { leafId: "pl-handwashing-complete", daysAgo: [70, 50, 35, 20, 10], status: "proficient" },
        { leafId: "sens-touch-boards", daysAgo: [30], status: "introduced" },
      ],
    },
    {
      studentId: "noah",
      entries: [
        { leafId: "sens-pt-build", daysAgo: [150, 120, 100, 70, 45], status: "proficient" },
        { leafId: "sens-pt-measure", daysAgo: [120, 95, 70, 50, 28], status: "proficient" },
        { leafId: "sens-bs-build", daysAgo: [130, 105, 80, 55, 30], status: "proficient" },
        { leafId: "sens-rr-align", daysAgo: [100, 75, 55, 35, 20], status: "proficient" },
        { leafId: "sens-rr-measure", daysAgo: [42, 28, 15], status: "developing" },
        { leafId: "sens-c2-3pairs", daysAgo: [88, 65, 40, 25, 14], status: "proficient" },
        { leafId: "sens-c2-6pairs", daysAgo: [22], status: "introduced" },
        { leafId: "lang-sg-beg", daysAgo: [95, 70, 50, 30, 18], status: "proficient" },
        { leafId: "lang-sg-end", daysAgo: [40, 25, 12], status: "developing" },
        { leafId: "lang-sp-a", daysAgo: [90, 65, 45, 28, 15], status: "proficient" },
        { leafId: "math-nr-align", daysAgo: [85, 60, 40, 25, 12], status: "proficient" },
        { leafId: "math-spindle-counting", daysAgo: [55, 35, 20], status: "developing" },
        { leafId: "math-cards-counters", daysAgo: [28], status: "introduced" },
        { leafId: "cult-painting-watercolors", daysAgo: [70, 50, 30], status: "developing" },
        { leafId: "pl-pouring-rice", daysAgo: [200, 170, 140, 110, 80, 50, 25], status: "proficient" },
        { leafId: "pl-spooning", daysAgo: [180, 145, 110, 80, 50, 20], status: "proficient" },
      ],
    },
    {
      studentId: "aisha",
      entries: [
        { leafId: "lang-sp-a", daysAgo: [110, 90, 65, 40, 22], status: "proficient" },
        { leafId: "lang-sp-m", daysAgo: [100, 80, 55, 35, 18], status: "proficient" },
        { leafId: "lang-sp-s", daysAgo: [88, 65, 42, 25, 14], status: "proficient" },
        { leafId: "lang-sp-t", daysAgo: [70, 50, 30], status: "developing" },
        { leafId: "lang-sp-p", daysAgo: [40, 25, 12], status: "developing" },
        { leafId: "lang-ma-box", daysAgo: [50, 30, 20], status: "developing" },
        { leafId: "lang-mi-outline", daysAgo: [60, 40, 25], status: "developing" },
        { leafId: "math-nr-align", daysAgo: [100, 80, 55, 35, 18], status: "proficient" },
        { leafId: "math-nr-names", daysAgo: [85, 60, 38, 22, 12], status: "proficient" },
        { leafId: "math-sp-14", daysAgo: [70, 50, 28], status: "developing" },
        { leafId: "math-sp-59", daysAgo: [22], status: "introduced" },
        { leafId: "math-teen-board", daysAgo: [35, 20, 8], status: "developing" },
        { leafId: "cult-cm-color", daysAgo: [60, 40, 22], status: "developing" },
        { leafId: "cult-na-color", daysAgo: [25], status: "introduced" },
        { leafId: "pl-pouring-water", daysAgo: [220, 185, 150, 115, 80, 45], status: "proficient" },
        { leafId: "pl-handwashing-complete", daysAgo: [215, 175, 135, 95, 55, 20], status: "proficient" },
      ],
    },
    {
      studentId: "james",
      entries: [
        { leafId: "lang-puzzle-words", daysAgo: [120, 95, 70, 45, 25], status: "proficient" },
        { leafId: "lang-pb-3part", daysAgo: [100, 75, 50, 30, 18], status: "proficient" },
        { leafId: "math-teen-board", daysAgo: [110, 85, 60, 40, 22], status: "proficient" },
        { leafId: "math-hundred-board", daysAgo: [80, 60, 40, 25, 12], status: "proficient" },
        { leafId: "math-gb-names", daysAgo: [70, 50, 35, 20, 10], status: "proficient" },
        { leafId: "math-gb-bank", daysAgo: [55, 38, 22], status: "developing" },
        { leafId: "cult-na-color", daysAgo: [90, 70, 45, 30, 15], status: "proficient" },
        { leafId: "cult-lw-forms", daysAgo: [60, 40, 25], status: "developing" },
        { leafId: "cult-lw-cards", daysAgo: [30], status: "introduced" },
        { leafId: "pl-pouring-cup", daysAgo: [180, 145, 110, 75, 40], status: "proficient" },
        { leafId: "pl-handwashing-complete", daysAgo: [200, 165, 130, 95, 60, 25], status: "proficient" },
      ],
    },
  ];

  const records: DemoCurriculumProgress[] = [];
  for (const recipe of recipes) {
    for (const e of recipe.entries) {
      // Convert daysAgo offsets to ISO date strings in chronological order
      // (earliest first), so practice[0] is the first session.
      const practices = [...e.daysAgo]
        .sort((a, b) => b - a)
        .map((d) => isoDaysAgo(d));
      records.push({
        studentId: recipe.studentId,
        leafId: e.leafId,
        practices,
        status: e.status,
        updatedAt: new Date().toISOString(),
      });
    }
  }
  return records;
}

export function getStudentCurriculumProgress(
  studentId: string,
): Record<string, DemoCurriculumProgress> {
  const map: Record<string, DemoCurriculumProgress> = {};
  for (const p of state.curriculumProgress) {
    if (p.studentId === studentId) map[p.leafId] = p;
  }
  return map;
}

export function getProgressForLeaf(
  studentId: string,
  leafId: string,
): DemoCurriculumProgress | undefined {
  return state.curriculumProgress.find(
    (p) => p.studentId === studentId && p.leafId === leafId,
  );
}

function upsertProgress(
  studentId: string,
  leafId: string,
  updater: (existing: DemoCurriculumProgress) => DemoCurriculumProgress,
) {
  const idx = state.curriculumProgress.findIndex(
    (p) => p.studentId === studentId && p.leafId === leafId,
  );
  const blank: DemoCurriculumProgress = {
    studentId,
    leafId,
    practices: [],
    status: "not-started",
    updatedAt: new Date().toISOString(),
  };
  const existing = idx >= 0 ? state.curriculumProgress[idx] : blank;
  const next = updater({
    ...existing,
    practices: [...existing.practices],
  });
  if (idx >= 0) {
    state.curriculumProgress[idx] = next;
  } else {
    state.curriculumProgress.push(next);
  }
  emit();
}

export function addPractice(
  studentId: string,
  leafId: string,
  date?: string,
) {
  const iso = date ?? new Date().toISOString().slice(0, 10);
  upsertProgress(studentId, leafId, (existing) => {
    const practices = [...existing.practices, iso].sort();
    return {
      ...existing,
      practices,
      // First practice promotes from not-started to introduced.
      status: existing.status === "not-started" ? "introduced" : existing.status,
      updatedAt: new Date().toISOString(),
    };
  });
}

export function removePractice(
  studentId: string,
  leafId: string,
  date: string,
) {
  upsertProgress(studentId, leafId, (existing) => {
    const idx = existing.practices.indexOf(date);
    const practices = [...existing.practices];
    if (idx >= 0) practices.splice(idx, 1);
    return {
      ...existing,
      practices,
      // If we removed the last practice, drop back to not-started.
      status: practices.length === 0 ? "not-started" : existing.status,
      updatedAt: new Date().toISOString(),
    };
  });
}

export function setCurriculumStatus(
  studentId: string,
  leafId: string,
  status: CurriculumStatus,
) {
  upsertProgress(studentId, leafId, (existing) => ({
    ...existing,
    status,
    updatedAt: new Date().toISOString(),
  }));
}

function emptyStats(): CurriculumAreaStats {
  return {
    total: 0,
    introduced: 0,
    developing: 0,
    proficient: 0,
    notStarted: 0,
  };
}

function tallyStatus(stats: CurriculumAreaStats, status: CurriculumStatus) {
  stats.total += 1;
  if (status === "introduced") stats.introduced += 1;
  else if (status === "developing") stats.developing += 1;
  else if (status === "proficient") stats.proficient += 1;
  else stats.notStarted += 1;
}

export function getCurriculumStats(studentId: string): CurriculumStats {
  const progress = getStudentCurriculumProgress(studentId);
  const overall = emptyStats();
  const byArea: Record<string, CurriculumAreaStats> = {};
  for (const area of CURRICULUM) {
    byArea[area.id] = emptyStats();
  }
  for (const leaf of getAllLeaves()) {
    const p = progress[leaf.leafId];
    const status: CurriculumStatus = p ? p.status : "not-started";
    tallyStatus(overall, status);
    tallyStatus(byArea[leaf.areaId], status);
  }
  return { overall, byArea };
}

export type RecentPresentation = {
  studentId: string;
  leafId: string;
  date: string;
  sessionIndex: number; // 0-indexed within this leaf's practice history
  leaf: Leaf;
};

export function getRecentPresentations(
  studentId: string,
  limit = 8,
): RecentPresentation[] {
  const out: RecentPresentation[] = [];
  for (const p of state.curriculumProgress) {
    if (p.studentId !== studentId) continue;
    const leaf = getLeafById(p.leafId);
    if (!leaf) continue;
    // practices are stored chronologically; sessionIndex 0 = first ever session.
    p.practices.forEach((date, i) => {
      out.push({
        studentId: p.studentId,
        leafId: p.leafId,
        date,
        sessionIndex: i,
        leaf,
      });
    });
  }
  return out.sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, limit);
}

export function getMasteredLeaves(studentId: string): Leaf[] {
  return getLeavesByStatus(studentId, "proficient");
}

export function getLeavesByStatus(
  studentId: string,
  status: CurriculumStatus,
): Leaf[] {
  const progress = getStudentCurriculumProgress(studentId);
  const out: Leaf[] = [];
  for (const leaf of getAllLeaves()) {
    const p = progress[leaf.leafId];
    const current: CurriculumStatus = p ? p.status : "not-started";
    if (current === status) out.push(leaf);
  }
  return out;
}
