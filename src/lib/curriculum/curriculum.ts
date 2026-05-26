export type Variation = {
  id: string;
  name: string;
};

export type Activity = {
  id: string;
  name: string;
  variations: Variation[];
  description?: string;
};

export type Subcategory = {
  id: string;
  name: string;
  activities: Activity[];
};

export type Area = {
  id: string;
  name: string;
  color: string;
  tone: {
    bg: string;
    text: string;
    border: string;
    soft: string;
    accent: string;
  };
  description: string;
  subcategories: Subcategory[];
};

export const CURRICULUM: Area[] = [
  {
    id: "practical-life",
    name: "Practical Life",
    color: "emerald",
    tone: {
      bg: "bg-emerald-100",
      text: "text-emerald-700",
      border: "border-emerald-200",
      soft: "bg-emerald-50",
      accent: "bg-emerald-500",
    },
    description:
      "Self-care, care of the environment, and grace & courtesy — the foundation of independence.",
    subcategories: [
      {
        id: "pl-preliminary",
        name: "Preliminary Exercises",
        activities: [
          {
            id: "pl-pouring",
            name: "Pouring",
            description: "Liquid and dry pouring with progressive challenge.",
            variations: [
              { id: "pl-pouring-rice", name: "Pouring: Rice" },
              { id: "pl-pouring-water", name: "Pouring: Water" },
              { id: "pl-pouring-cup", name: "Pouring: Cup & Saucer" },
            ],
          },
          {
            id: "pl-spooning",
            name: "Spooning",
            description: "Transfer with a spoon — develops grip and control.",
            variations: [],
          },
          {
            id: "pl-pitcher",
            name: "Using a Pitcher",
            description: "Two-handed lift and controlled pour.",
            variations: [],
          },
          {
            id: "pl-rolling-rug",
            name: "Rolling a Rug",
            description: "Foundation movement — order and care of workspace.",
            variations: [],
          },
        ],
      },
      {
        id: "pl-care-person",
        name: "Care of the Person",
        activities: [
          {
            id: "pl-handwashing",
            name: "Washing Hands",
            description: "Complete sequence at the sink.",
            variations: [],
          },
          {
            id: "pl-dressing",
            name: "Dressing Frames",
            description: "Develops fine motor control for self-dressing.",
            variations: [
              { id: "pl-dressing-button-large", name: "Large Buttoning" },
              { id: "pl-dressing-button-small", name: "Small Buttoning" },
              { id: "pl-dressing-zipping", name: "Zipping" },
              { id: "pl-dressing-bow", name: "Bow Tie" },
            ],
          },
        ],
      },
      {
        id: "pl-care-environ",
        name: "Care of the Environment",
        activities: [
          {
            id: "pl-sweeping",
            name: "Sweeping",
            description: "Floor sweeping with child-sized broom.",
            variations: [],
          },
          {
            id: "pl-folding",
            name: "Folding Cloths",
            description: "Precision folding along marked lines.",
            variations: [],
          },
          {
            id: "pl-dishwashing",
            name: "Dishwashing",
            description: "Full wash, rinse, dry sequence.",
            variations: [],
          },
        ],
      },
    ],
  },

  {
    id: "sensorial",
    name: "Sensorial",
    color: "violet",
    tone: {
      bg: "bg-violet-100",
      text: "text-violet-700",
      border: "border-violet-200",
      soft: "bg-violet-50",
      accent: "bg-violet-500",
    },
    description:
      "Refinement of the senses through isolated, graded materials — the key to abstraction.",
    subcategories: [
      {
        id: "sens-visual",
        name: "Visual",
        activities: [
          {
            id: "sens-pink-tower",
            name: "Pink Tower",
            description:
              "Visual discrimination of three dimensions — the cube progression.",
            variations: [
              { id: "sens-pt-build", name: "Build" },
              { id: "sens-pt-measure", name: "Measure" },
              { id: "sens-pt-blindfold", name: "Blindfold" },
              { id: "sens-pt-distance", name: "Grading at Distance" },
            ],
          },
          {
            id: "sens-brown-stair",
            name: "Brown Stair",
            description: "Two-dimensional grading — thickness.",
            variations: [
              { id: "sens-bs-build", name: "Build" },
              { id: "sens-bs-measure", name: "Measure" },
            ],
          },
          {
            id: "sens-red-rods",
            name: "Red Rods",
            description: "One-dimensional grading — length.",
            variations: [
              { id: "sens-rr-align", name: "Align" },
              { id: "sens-rr-measure", name: "Measure" },
            ],
          },
          {
            id: "sens-cylinder-blocks",
            name: "Cylinder Blocks",
            description: "Four blocks isolating diameter and height.",
            variations: [
              { id: "sens-cb-one", name: "1 Block" },
              { id: "sens-cb-two", name: "Two Blocks" },
              { id: "sens-cb-four", name: "Four Blocks" },
            ],
          },
          {
            id: "sens-colour-1",
            name: "Colour Box 1",
            description: "Primary colours — matching pairs.",
            variations: [],
          },
          {
            id: "sens-colour-2",
            name: "Colour Box 2",
            description: "Eleven colour pairs — matching and naming.",
            variations: [
              { id: "sens-c2-3pairs", name: "3 Pairs" },
              { id: "sens-c2-6pairs", name: "6 Pairs" },
              { id: "sens-c2-all", name: "All Pairs" },
            ],
          },
        ],
      },
      {
        id: "sens-touch",
        name: "Touch",
        activities: [
          {
            id: "sens-touch-boards",
            name: "Touch Boards",
            description: "Rough and smooth — tactile discrimination.",
            variations: [],
          },
          {
            id: "sens-touch-tablets",
            name: "Touch Tablets",
            description: "Grading of texture — five grades of roughness.",
            variations: [],
          },
        ],
      },
      {
        id: "sens-auditory",
        name: "Auditory",
        activities: [
          {
            id: "sens-sound-cyls",
            name: "Sound Cylinders",
            description: "Matching and grading sounds — auditory pairs.",
            variations: [],
          },
          {
            id: "sens-bells",
            name: "Bells",
            description: "Pitch matching — pre-musical preparation.",
            variations: [],
          },
        ],
      },
    ],
  },

  {
    id: "language",
    name: "Language",
    color: "sky",
    tone: {
      bg: "bg-sky-100",
      text: "text-sky-700",
      border: "border-sky-200",
      soft: "bg-sky-50",
      accent: "bg-sky-500",
    },
    description:
      "Spoken language, writing, and reading — built layer by layer through phonetic awareness.",
    subcategories: [
      {
        id: "lang-spoken",
        name: "Spoken Language",
        activities: [
          {
            id: "lang-sound-games",
            name: "Sound Games",
            description: "Isolating sounds within spoken words.",
            variations: [
              { id: "lang-sg-beg", name: "Beginning Sounds" },
              { id: "lang-sg-end", name: "Ending Sounds" },
              { id: "lang-sg-mid", name: "Middle Sounds" },
            ],
          },
          {
            id: "lang-vocab-enrich",
            name: "Vocabulary Enrichment",
            description: "Naming objects, parts of the room, and materials.",
            variations: [],
          },
        ],
      },
      {
        id: "lang-writing",
        name: "Writing",
        activities: [
          {
            id: "lang-sandpaper",
            name: "Sandpaper Letters",
            description:
              "Tactile, visual, and auditory introduction to letter sounds.",
            variations: [
              { id: "lang-sp-a", name: "A" },
              { id: "lang-sp-m", name: "M" },
              { id: "lang-sp-s", name: "S" },
              { id: "lang-sp-t", name: "T" },
              { id: "lang-sp-p", name: "P" },
            ],
          },
          {
            id: "lang-movable",
            name: "Movable Alphabet",
            description:
              "Composing words from known sounds before formal writing.",
            variations: [
              { id: "lang-ma-box", name: "Using the Box" },
              { id: "lang-ma-write", name: "Write Ideas" },
            ],
          },
          {
            id: "lang-metal-insets",
            name: "Metal Insets",
            description: "Pencil control and handwriting preparation.",
            variations: [],
          },
        ],
      },
      {
        id: "lang-reading",
        name: "Reading",
        activities: [
          {
            id: "lang-phonetic-box",
            name: "Phonetic Object Box",
            description: "Reading short phonetic words with objects.",
            variations: [],
          },
          {
            id: "lang-puzzle-words",
            name: "Puzzle Words",
            description: "Sight reading of non-phonetic words.",
            variations: [],
          },
        ],
      },
    ],
  },

  {
    id: "math",
    name: "Math",
    color: "amber",
    tone: {
      bg: "bg-amber-100",
      text: "text-amber-700",
      border: "border-amber-200",
      soft: "bg-amber-50",
      accent: "bg-amber-500",
    },
    description:
      "Concrete-to-abstract path through quantity, symbol, and the decimal system.",
    subcategories: [
      {
        id: "math-counting",
        name: "Counting 1 to 10",
        activities: [
          {
            id: "math-number-rods",
            name: "Number Rods",
            description: "Quantity 1–10 through length.",
            variations: [
              { id: "math-nr-align", name: "Align" },
              { id: "math-nr-names", name: "Names" },
              { id: "math-nr-find", name: "Find the Number" },
            ],
          },
          {
            id: "math-sandpaper",
            name: "Sandpaper Numbers",
            description: "Symbols 0–9 — tactile introduction.",
            variations: [
              { id: "math-sp-14", name: "1–4" },
              { id: "math-sp-59", name: "5–9" },
            ],
          },
          {
            id: "math-spindle",
            name: "Spindle Box",
            description: "Quantity-to-symbol association including zero.",
            variations: [],
          },
          {
            id: "math-cards-counters",
            name: "Cards & Counters",
            description: "Odd and even — concept of pairs.",
            variations: [],
          },
        ],
      },
      {
        id: "math-decimal",
        name: "Decimal System",
        activities: [
          {
            id: "math-teen-board",
            name: "Teen Board",
            description: "11–19 with beads and symbols.",
            variations: [],
          },
          {
            id: "math-hundred-board",
            name: "Hundred Board",
            description: "Sequencing 1–100.",
            variations: [],
          },
          {
            id: "math-golden-beads",
            name: "Golden Beads",
            description: "Hierarchies of the decimal system.",
            variations: [
              { id: "math-gb-names", name: "Names" },
              { id: "math-gb-bank", name: "Get from Bank" },
            ],
          },
        ],
      },
    ],
  },

  {
    id: "cultural",
    name: "Cultural",
    color: "pink",
    tone: {
      bg: "bg-pink-100",
      text: "text-pink-700",
      border: "border-pink-200",
      soft: "bg-pink-50",
      accent: "bg-pink-500",
    },
    description:
      "Geography, biology, history, art, and music — the child's place in the wider world.",
    subcategories: [
      {
        id: "cult-geography",
        name: "Geography",
        activities: [
          {
            id: "cult-continent-map",
            name: "Continent Puzzle Map",
            description: "Names and locations of the continents.",
            variations: [],
          },
          {
            id: "cult-north-america",
            name: "North America Map",
            description: "Countries of North America.",
            variations: [],
          },
          {
            id: "cult-land-water",
            name: "Land & Water Cards",
            description: "Identifying basic geographic forms.",
            variations: [
              { id: "cult-lw-forms", name: "Match to Forms" },
              { id: "cult-lw-cards", name: "Match Cards" },
            ],
          },
        ],
      },
      {
        id: "cult-art",
        name: "Visual Art",
        activities: [
          {
            id: "cult-cutting",
            name: "Cutting Paper",
            description: "Scissor control and craft preparation.",
            variations: [],
          },
          {
            id: "cult-painting",
            name: "Painting at Easel",
            description: "Independent painting with watercolours.",
            variations: [],
          },
          {
            id: "cult-clay",
            name: "Working with Clay",
            description: "Sculpting, pinching, rolling.",
            variations: [],
          },
        ],
      },
    ],
  },
];

export type Leaf = {
  leafId: string;
  leafName: string;
  activityId: string;
  activityName: string;
  subcategoryId: string;
  subcategoryName: string;
  areaId: string;
  areaName: string;
  areaColor: string;
  areaTone: Area["tone"];
  description?: string;
};

let cachedLeaves: Leaf[] | null = null;
let cachedLeafIndex: Map<string, Leaf> | null = null;

export function getAllLeaves(): Leaf[] {
  if (cachedLeaves) return cachedLeaves;
  const leaves: Leaf[] = [];
  for (const area of CURRICULUM) {
    for (const sub of area.subcategories) {
      for (const act of sub.activities) {
        if (act.variations.length === 0) {
          leaves.push({
            leafId: act.id,
            leafName: act.name,
            activityId: act.id,
            activityName: act.name,
            subcategoryId: sub.id,
            subcategoryName: sub.name,
            areaId: area.id,
            areaName: area.name,
            areaColor: area.color,
            areaTone: area.tone,
            description: act.description,
          });
        } else {
          for (const v of act.variations) {
            leaves.push({
              leafId: v.id,
              leafName: v.name,
              activityId: act.id,
              activityName: act.name,
              subcategoryId: sub.id,
              subcategoryName: sub.name,
              areaId: area.id,
              areaName: area.name,
              areaColor: area.color,
              areaTone: area.tone,
              description: act.description,
            });
          }
        }
      }
    }
  }
  cachedLeaves = leaves;
  return leaves;
}

export function getLeafIndex(): Map<string, Leaf> {
  if (cachedLeafIndex) return cachedLeafIndex;
  const index = new Map<string, Leaf>();
  for (const leaf of getAllLeaves()) {
    index.set(leaf.leafId, leaf);
  }
  cachedLeafIndex = index;
  return index;
}

export function getLeafById(leafId: string): Leaf | undefined {
  return getLeafIndex().get(leafId);
}

export function getAreaById(areaId: string): Area | undefined {
  return CURRICULUM.find((a) => a.id === areaId);
}
