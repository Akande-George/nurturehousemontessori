"use client";

import { useSyncExternalStore } from "react";

export type Role = "admin" | "teacher" | "parent";

export type DemoUser = {
  id: string;
  role: Role;
  name: string;
  email: string;
  initial: string;
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
};

export type DemoActivityPost = {
  id: string;
  studentId: string;
  teacherId: string;
  caption: string;
  imageUrl: string;
  category: string;
  likes: number;
  likedByParent: boolean;
  createdAt: string;
};

export type DemoDailyActivityType = "meals" | "nap" | "hygiene";

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
  tag: string;
  createdAt: string;
};

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
  level: "Introduced" | "Practicing" | "Mastered";
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

type DemoState = {
  users: Record<Role, DemoUser>;
  students: DemoStudent[];
  notices: DemoNotice[];
  observations: DemoObservation[];
  invoices: DemoInvoice[];
  dailyReports: DemoDailyReport[];
  activityPosts: DemoActivityPost[];
  dailyActivityLogs: DemoDailyActivityLog[];
  progressData: Record<string, DemoProgress>;
};

const progressDataMap: Record<string, DemoProgress> = {
  zoe: {
    studentId: "zoe",
    term: "Spring 2",
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
    term: "Spring 2",
    academicYear: "2025-2026",
    areas: [
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
    term: "Spring 2",
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
    term: "Spring 2",
    academicYear: "2025-2026",
    areas: [
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
    term: "Spring 2",
    academicYear: "2025-2026",
    areas: [
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
    term: "Spring 2",
    academicYear: "2025-2026",
    areas: [
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
    },
    {
      id: "notice-2",
      title: "End-of-Term Concert — 30 May 2026",
      content:
        "We are pleased to invite all families to the Nurture House end-of-term concert on Friday 30th May at 3:00 PM. Children in Toddler Community (Nurture Buds) and Children's House (Nurture Explorers) will perform. Dress code is school uniform. Seats are limited — please confirm attendance by 20th May.",
      audience: "all-parents",
      createdAt: "2026-05-01T09:15:00.000Z",
      createdBy: "user-admin",
    },
    {
      id: "notice-3",
      title: "Allergy Awareness Reminder",
      content:
        "As part of our health and safety commitment, please ensure that packed lunchboxes do not contain nuts, shellfish, or dairy products. We have children in our community with severe allergies. Thank you for keeping every child safe.",
      audience: "all-parents",
      createdAt: "2026-04-28T10:30:00.000Z",
      createdBy: "user-admin",
    },
    {
      id: "notice-4",
      title: "Parents Resource Library Updated",
      content:
        "New materials have been added to the resource library this month including a guide on Montessori-friendly home environments, age-appropriate chores, and the mathematics progression for Children's House learners.",
      audience: "all-parents",
      createdAt: "2026-04-25T08:00:00.000Z",
      createdBy: "user-admin",
    },
  ],
  observations: [
    {
      id: "obs-1",
      studentId: "zoe",
      teacherId: "user-teacher",
      tag: "Sensorial",
      content:
        "Zoe worked with the Pink Tower for 15 minutes and corrected two cube placements independently. She showed clear satisfaction when the tower was complete.",
      createdAt: "2026-05-05T10:20:00.000Z",
    },
    {
      id: "obs-2",
      studentId: "zoe",
      teacherId: "user-teacher",
      tag: "Practical Life",
      content:
        "Zoe chose the water transfer work three times this week. Her hand steadiness has noticeably improved — she now pours with both hands and rarely spills. She rolled up her mat without prompting at the end.",
      createdAt: "2026-05-06T09:45:00.000Z",
    },
    {
      id: "obs-3",
      studentId: "zoe",
      teacherId: "user-teacher",
      tag: "Language",
      content:
        "During picture-book time, Zoe pointed to the duck and said its name unprompted. She is building a vocabulary of about 8 animal names and responds well to naming games.",
      createdAt: "2026-05-04T11:00:00.000Z",
    },
    {
      id: "obs-4",
      studentId: "leo",
      teacherId: "user-teacher",
      tag: "Practical Life",
      content:
        "Leo completed the spoon-transfer exercise with dry lentils today — minimal spill. Concentration span was about 8 minutes, up from 4 minutes last month. He replaced the work to the shelf independently.",
      createdAt: "2026-05-06T09:55:00.000Z",
    },
    {
      id: "obs-5",
      studentId: "leo",
      teacherId: "user-teacher",
      tag: "Music",
      content:
        "Leo discovered the chime bars today and experimented with speed and force. He appeared to understand that hitting harder made a louder sound. Repeated his self-made 'song' five times.",
      createdAt: "2026-05-02T11:20:00.000Z",
    },
    {
      id: "obs-6",
      studentId: "sarah",
      teacherId: "user-teacher",
      tag: "Art",
      content:
        "Sarah mixed red and yellow finger paints and announced 'I made orange!'. This was the first intentional colour-mixing moment observed. She then named all three primary colours when asked.",
      createdAt: "2026-05-06T13:15:00.000Z",
    },
    {
      id: "obs-7",
      studentId: "sarah",
      teacherId: "user-teacher",
      tag: "Outdoor",
      content:
        "Sarah navigated the climbing frame independently and helped a younger child by holding the rung steady. She is developing empathy and body confidence in outdoor environments.",
      createdAt: "2026-05-04T14:30:00.000Z",
    },
    {
      id: "obs-8",
      studentId: "emma",
      teacherId: "user-teacher",
      tag: "Mathematics",
      content:
        "Emma mastered number rods 1–10 and self-corrected twice without teacher intervention. She then combined rods to make ten — an uninstructed extension activity. Ready for introduction to the short bead chain.",
      createdAt: "2026-05-06T10:30:00.000Z",
    },
    {
      id: "obs-9",
      studentId: "emma",
      teacherId: "user-teacher",
      tag: "Sensorial",
      content:
        "Emma returned to the colour tablet box twice in one work cycle. On her second attempt, she arranged the matching pairs into a full gradient from lightest to darkest — a spontaneous extension that shows deep understanding of the material.",
      createdAt: "2026-05-05T11:15:00.000Z",
    },
    {
      id: "obs-10",
      studentId: "noah",
      teacherId: "user-teacher",
      tag: "Sensorial",
      content:
        "Noah completed the Pink Tower build perfectly and then placed it beside the Brown Stair, observing that the smallest cube matches the thinnest prism. He verbalised this connection unprompted — a strong analytical observation.",
      createdAt: "2026-05-06T10:40:00.000Z",
    },
    {
      id: "obs-11",
      studentId: "noah",
      teacherId: "user-teacher",
      tag: "Social",
      content:
        "During outdoor play, Noah organised a construction game and assigned roles to three peers. He showed conflict resolution when two children wanted the same block — he suggested they trade. Leadership qualities are emerging naturally.",
      createdAt: "2026-05-04T14:30:00.000Z",
    },
    {
      id: "obs-12",
      studentId: "aisha",
      teacherId: "user-teacher",
      tag: "Language Arts",
      content:
        "Aisha's desert animals research section is well structured — topic sentence, two supporting facts, and a closing thought. She used a reference card to verify a fact before writing it down. This shows intellectual rigour beyond her age group average.",
      createdAt: "2026-05-06T11:50:00.000Z",
    },
    {
      id: "obs-13",
      studentId: "aisha",
      teacherId: "user-teacher",
      tag: "Geography",
      content:
        "Aisha named 12 African countries on the puzzle map and recalled capitals for 5 of them without the reference card. She set herself the goal of learning all 54 capitals by end of term.",
      createdAt: "2026-05-03T10:00:00.000Z",
    },
    {
      id: "obs-14",
      studentId: "james",
      teacherId: "user-teacher",
      tag: "Research",
      content:
        "James selected Marie Curie for his biography project and filled his research organiser with three verified facts after reading two reference cards. He asked thoughtful questions about radioactivity that led to a brief spontaneous science discussion.",
      createdAt: "2026-05-06T10:00:00.000Z",
    },
    {
      id: "obs-15",
      studentId: "james",
      teacherId: "user-teacher",
      tag: "Art",
      content:
        "James discovered wet-on-wet watercolour technique and created a sunset gradient by accident. His response — 'I want to do that again' — is the quintessential Montessori moment of intrinsic motivation.",
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
      careEntries: [
        { label: "Food I ate", value: "Rice and vegetables", time: "12:10 PM" },
        { label: "How much", value: "Most of lunch" },
        {
          label: "Toilet use",
          value: "Diaper changed twice",
          time: "10:40 AM / 1:25 PM",
        },
        {
          label: "Nap time",
          value: "1 hour 20 minutes",
          time: "1:00 PM - 2:20 PM",
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
      careEntries: [
        { label: "Food I ate", value: "Porridge and fruit", time: "11:55 AM" },
        { label: "How much", value: "Some" },
        {
          label: "Toilet use",
          value: "Potty attempt with support",
          time: "10:15 AM",
        },
        { label: "Nap time", value: "45 minutes", time: "12:50 PM - 1:35 PM" },
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
      careEntries: [
        {
          label: "Food I ate",
          value: "Beans, plantain, and water",
          time: "12:05 PM",
        },
        { label: "How much", value: "All" },
        {
          label: "Toilet use",
          value: "Independent toilet visit with reminder",
          time: "11:20 AM",
        },
        { label: "Nap time", value: "1 hour", time: "1:10 PM - 2:10 PM" },
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
          level: "Practicing",
        },
        {
          area: "Sensorial",
          activity: "Colour tablets – second box",
          level: "Introduced",
        },
        {
          area: "Language",
          activity: "Sandpaper letters (a, m, s)",
          level: "Practicing",
        },
        {
          area: "Mathematics",
          activity: "Number rods 1–10",
          level: "Mastered",
        },
        {
          area: "Cultural",
          activity: "Continent puzzle map",
          level: "Introduced",
        },
        {
          area: "Art",
          activity: "Collage with natural materials",
          level: "Practicing",
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
          level: "Practicing",
        },
        { area: "Sensorial", activity: "Pink tower", level: "Mastered" },
        {
          area: "Language",
          activity: "Object-picture matching",
          level: "Practicing",
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
      category: "Practical Life",
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
      category: "Circle Time",
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
      category: "Outdoor",
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
      category: "Sensorial",
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
      category: "Art",
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
      category: "Mathematics",
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
      category: "Practical Life",
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
      category: "Music",
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
      category: "Art",
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
      category: "Sensorial",
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
      category: "Outdoor",
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
      category: "Language Arts",
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
      category: "Music",
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
      category: "Language Arts",
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
      category: "Art",
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

export function getStudentObservations(studentId: string) {
  return state.observations
    .filter((observation) => observation.studentId === studentId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function getTeacherStudents(teacherId: string) {
  return state.students.filter((s) => s.teacherId === teacherId);
}

export function getAllObservations() {
  return [...state.observations].sort((a, b) =>
    a.createdAt < b.createdAt ? 1 : -1,
  );
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
      },
      ...state.notices,
    ],
  };
  emit();
}

export function createObservation(input: {
  studentId: string;
  tag: string;
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
        tag: input.tag,
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

export function getActivityPostsForStudent(studentId: string) {
  return [...state.activityPosts]
    .filter((p) => p.studentId === studentId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function getActivityFeedForParent(parentId: string) {
  const students = getStudentsForParent(parentId);
  const studentIds = new Set(students.map((s) => s.id));
  return [...state.activityPosts]
    .filter((p) => studentIds.has(p.studentId))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
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
  category: string;
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
        category: input.category,
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
