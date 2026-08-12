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
  /** Optional blurb printed under the heading on the progress report. */
  description?: string;
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
          { id: "pl-orientation", name: "Orientation", variations: [] },
          { id: "pl-faucet", name: "Using the Faucet", variations: [] },
          { id: "pl-sponge", name: "Using a Sponge", variations: [] },
          {
            id: "pl-rolling-rug",
            name: "Rolling a Rug",
            description: "Foundation movement — order and care of workspace.",
            variations: [],
          },
          { id: "pl-carrying", name: "Carrying", variations: [] },
          { id: "pl-book", name: "Using a Book", variations: [] },
          { id: "pl-napkin", name: "Using a Napkin", variations: [] },
          {
            id: "pl-spooning",
            name: "Spooning",
            description: "Transfer with a spoon — develops grip and control.",
            variations: [],
          },
          {
            id: "pl-pouring",
            name: "Pouring",
            description: "Liquid and dry pouring with progressive challenge.",
            variations: [
              { id: "pl-pouring-rice", name: "Rice" },
              { id: "pl-pouring-water", name: "Water" },
              { id: "pl-pouring-stem", name: "Stem Glass" },
              { id: "pl-pouring-different", name: "Different Containers" },
              { id: "pl-pouring-cup", name: "Cup & Saucer" },
            ],
          },
          {
            id: "pl-pitcher",
            name: "Using a Pitcher",
            description: "Two-handed lift and controlled pour.",
            variations: [],
          },
          {
            id: "pl-finger-pouch",
            name: "Cloth Finger Pouch",
            variations: [],
          },
          { id: "pl-apron", name: "Using an Apron", variations: [] },
          { id: "pl-blowing-nose", name: "Blowing Your Nose", variations: [] },
          { id: "pl-opening-closing", name: "Opening & Closing", variations: [] },
          { id: "pl-scissors", name: "Passing Scissors", variations: [] },
          { id: "pl-clothespins", name: "Clothespins", variations: [] },
          { id: "pl-disposition", name: "Disposition of Items", variations: [] },
        ],
      },
      {
        id: "pl-care-person",
        name: "Care of the Person",
        activities: [
          { id: "pl-drink", name: "Getting a Drink", variations: [] },
          { id: "pl-bathroom", name: "Using the Bathroom", variations: [] },
          { id: "pl-cubby", name: "Using a Cubby", variations: [] },
          { id: "pl-snack", name: "Having Snack", variations: [] },
          { id: "pl-lunch", name: "Having Lunch", variations: [] },
          {
            id: "pl-handwashing",
            name: "Washing Hands",
            description: "Complete sequence at the sink.",
            variations: [
              { id: "pl-handwashing-sink", name: "Sink" },
              { id: "pl-handwashing-complete", name: "Complete" },
            ],
          },
          { id: "pl-cleaning-sneakers", name: "Cleaning Sneakers", variations: [] },
          { id: "pl-shoe-polishing", name: "Shoe Polishing", variations: [] },
          { id: "pl-food-prep", name: "Food Preparation", variations: [] },
          { id: "pl-shelling", name: "Shelling (Eggs/Nuts)", variations: [] },
          { id: "pl-juicing", name: "Juicing", variations: [] },
          {
            id: "pl-knives",
            name: "Knives",
            variations: [
              { id: "pl-knives-spreading", name: "Spreading" },
              { id: "pl-knives-dull", name: "Dull Knife (Banana)" },
              { id: "pl-knives-pairing", name: "Pairing Knife (Pickle)" },
              { id: "pl-knives-peel-chop", name: "Peel & Chop (Carrot)" },
            ],
          },
          {
            id: "pl-dressing",
            name: "Dressing Frames",
            description: "Develops fine motor control for self-dressing.",
            variations: [
              { id: "pl-dressing-velcro", name: "Velcro" },
              { id: "pl-dressing-snapping", name: "Snapping" },
              { id: "pl-dressing-button-large", name: "Large Buttoning" },
              { id: "pl-dressing-button-small", name: "Small Buttoning" },
              { id: "pl-dressing-zipping", name: "Zipping" },
              { id: "pl-dressing-buckling", name: "Buckling" },
              { id: "pl-dressing-hook-eye", name: "Hook & Eye" },
              { id: "pl-dressing-bow", name: "Bow Tie" },
              { id: "pl-dressing-lacing", name: "Lacing" },
              { id: "pl-dressing-safety-pins", name: "Safety Pins" },
            ],
          },
          {
            id: "pl-sewing",
            name: "Sewing",
            variations: [
              { id: "pl-sewing-cards", name: "Sewing Cards" },
              { id: "pl-sewing-thread", name: "Threading Needle" },
              { id: "pl-sewing-canvas", name: "Plastic Canvas" },
              { id: "pl-sewing-hoop", name: "Using a Hoop" },
              { id: "pl-sewing-button", name: "Sewing Button" },
              { id: "pl-sewing-loose-weave", name: "Loose Weave Shape" },
              { id: "pl-sewing-finer-weave", name: "Finer Weave Shape" },
              { id: "pl-sewing-pouch", name: "Making a Pouch" },
              { id: "pl-sewing-pillow", name: "Making a Pillow" },
            ],
          },
          { id: "pl-ironing", name: "Ironing", variations: [] },
        ],
      },
      {
        id: "pl-care-environ",
        name: "Care of the Environment",
        activities: [
          { id: "pl-dusting", name: "Dusting", variations: [] },
          {
            id: "pl-folding",
            name: "Folding Cloths",
            description: "Precision folding along marked lines.",
            variations: [],
          },
          {
            id: "pl-sweeping",
            name: "Sweeping",
            description: "Floor sweeping with child-sized broom.",
            variations: [],
          },
          { id: "pl-floor-cleaning", name: "Floor Cleaning", variations: [] },
          {
            id: "pl-table",
            name: "Table Care",
            variations: [
              { id: "pl-table-sponging", name: "Sponging" },
              { id: "pl-table-scrubbing", name: "Scrubbing" },
            ],
          },
          { id: "pl-polishing-wood", name: "Polishing Wood", variations: [] },
          { id: "pl-polishing-metal", name: "Polishing Metal", variations: [] },
          { id: "pl-chalkboard-cleaning", name: "Chalkboard Cleaning", variations: [] },
          { id: "pl-easel-cleaning", name: "Easel Cleaning", variations: [] },
          {
            id: "pl-dishwashing",
            name: "Dishwashing",
            description: "Full wash, rinse, dry sequence.",
            variations: [],
          },
          { id: "pl-cloth-washing", name: "Cloth Washing", variations: [] },
          {
            id: "pl-plants",
            name: "Plant Care",
            variations: [
              { id: "pl-plants-leaf-washing", name: "Leaf Washing" },
              { id: "pl-plants-watering", name: "Watering a Plant" },
              { id: "pl-plants-dead-leaves", name: "Removing Dead Leaves" },
              { id: "pl-plants-flower-water", name: "Changing Flower Water" },
            ],
          },
          { id: "pl-flower-arranging", name: "Flower Arranging", variations: [] },
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
            variations: [
              { id: "sens-tt-match", name: "Match" },
              { id: "sens-tt-match-blind", name: "Match w/ Blindfold" },
              { id: "sens-tt-grade-blind", name: "Grade w/ Blindfold" },
              { id: "sens-tt-match-dist", name: "Match @ Distance" },
              { id: "sens-tt-grade-dist", name: "Grade @ Distance" },
            ],
          },
          {
            id: "sens-fabrics",
            name: "Fabrics",
            variations: [
              { id: "sens-fab-matching", name: "Matching" },
              { id: "sens-fab-match-blind", name: "Matching w/ Blindfold" },
              { id: "sens-fab-match-dist", name: "Match @ Distance" },
              { id: "sens-fab-grade-dist", name: "Grade @ Distance" },
              { id: "sens-fab-missing", name: "What's Missing" },
            ],
          },
        ],
      },
      {
        id: "sens-stereognostic",
        name: "Stereognostic",
        activities: [
          {
            id: "sens-mystery-bag",
            name: "Mystery Bag",
            variations: [
              { id: "sens-mb-missing", name: "What's Missing" },
            ],
          },
          {
            id: "sens-geo-solids",
            name: "Geometric Solids",
            variations: [
              { id: "sens-gs-ovoid", name: "Ovoid" },
              { id: "sens-gs-csc", name: "Cone, Sphere, Cube" },
              { id: "sens-gs-sq-pyr", name: "Square Pyramid" },
              { id: "sens-gs-tri-pyr", name: "Triangular Pyramid" },
              { id: "sens-gs-ellipsoid", name: "Ellipsoid" },
              { id: "sens-gs-rect-prism", name: "Rectangular Prism" },
              { id: "sens-gs-tri-prism", name: "Triangular Prism" },
              { id: "sens-gs-basket", name: "Covered Basket" },
              { id: "sens-gs-cards", name: "Solids & Cards" },
              { id: "sens-gs-missing", name: "What's Missing?" },
            ],
          },
          { id: "sens-blindfolded-sorting", name: "Blindfolded Sorting", variations: [] },
        ],
      },
      {
        id: "sens-complex-touch",
        name: "Complex Touch",
        activities: [
          {
            id: "sens-baric-tablets",
            name: "Baric Tablets",
            variations: [
              { id: "sens-bt-hl", name: "Heavy/Light" },
              { id: "sens-bt-hl-blind", name: "Heavy/Light Blindfold" },
              { id: "sens-bt-ml-blind", name: "Medium/Light Blindfold" },
              { id: "sens-bt-all-blind", name: "All Blindfold" },
            ],
          },
          {
            id: "sens-thermic-bottles",
            name: "Thermic Bottles",
            variations: [
              { id: "sens-tb-match", name: "Match" },
              { id: "sens-tb-grade", name: "Grade" },
              { id: "sens-tb-match-dist", name: "Match @ Distance" },
              { id: "sens-tb-grade-dist", name: "Grade @ Distance" },
              { id: "sens-tb-coop", name: "Cooperation Game" },
            ],
          },
          {
            id: "sens-thermic-tablets",
            name: "Thermic Tablets",
            variations: [
              { id: "sens-tht-link", name: "Link to Environment" },
            ],
          },
        ],
      },
      {
        id: "sens-visual",
        name: "Visual",
        activities: [
          {
            id: "sens-cylinder-blocks",
            name: "Cylinder Blocks",
            description: "Four blocks isolating diameter and height.",
            variations: [
              { id: "sens-cb-one", name: "1 Block" },
              { id: "sens-cb-two", name: "Two Blocks" },
              { id: "sens-cb-three", name: "Three Blocks" },
              { id: "sens-cb-four", name: "Four Blocks" },
              { id: "sens-cb-match-dist", name: "Match at a Distance" },
              { id: "sens-cb-blindfold", name: "Blindfold" },
            ],
          },
          {
            id: "sens-pink-tower",
            name: "Pink Tower",
            description:
              "Visual discrimination of three dimensions — the cube progression.",
            variations: [
              { id: "sens-pt-build", name: "Build" },
              { id: "sens-pt-measure", name: "Measure" },
              { id: "sens-pt-distance", name: "Grading at Distance" },
              { id: "sens-pt-blindfold", name: "Blindfold" },
              { id: "sens-pt-coop", name: "Cooperation Game" },
              { id: "sens-pt-missing", name: "What's Missing" },
              { id: "sens-pt-link", name: "Link to Environment" },
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
              { id: "sens-c2-match-dist", name: "Matching @ Distance" },
              { id: "sens-c2-missing", name: "What's Missing" },
              { id: "sens-c2-link", name: "Link to Environment" },
            ],
          },
          {
            id: "sens-geo-cabinet",
            name: "Geometric Cabinet",
            variations: [
              { id: "sens-gc-3-contrasts", name: "3 Contrasts" },
              { id: "sens-gc-6-contrasts", name: "6 Contrasts" },
              { id: "sens-gc-6-similar", name: "6 Similar (One Drawer)" },
              { id: "sens-gc-many-drawers", name: "Many Drawers" },
              { id: "sens-gc-vocab-triangle", name: "Vocab: Triangle" },
              { id: "sens-gc-vocab-quadrilateral", name: "Vocab: Quadrilateral" },
              { id: "sens-gc-vocab-polygon", name: "Vocab: Polygon" },
              { id: "sens-gc-vocab-curvilinear", name: "Vocab: Curvilinear" },
              { id: "sens-gc-match-dist", name: "Matching @ Distance" },
              { id: "sens-gc-blindfold", name: "Blindfold" },
              { id: "sens-gc-solid-cards", name: "Solid Cards" },
              { id: "sens-gc-thick-cards", name: "Thick Cards" },
              { id: "sens-gc-thin-cards", name: "Thin Cards" },
              { id: "sens-gc-all-solid", name: "All Shapes / Solid Cards" },
              { id: "sens-gc-all-thick", name: "All Shapes / Thick Cards" },
              { id: "sens-gc-all-thin", name: "All Shapes / Thin Cards" },
              { id: "sens-gc-all-mix", name: "All Shapes / Mixed Cards" },
              { id: "sens-gc-coop", name: "Cooperation Game" },
              { id: "sens-gc-missing", name: "What's Missing?" },
              { id: "sens-gc-link", name: "Link to Environment" },
            ],
          },
          {
            id: "sens-brown-stair",
            name: "Broad Stair",
            description: "Two-dimensional grading — thickness.",
            variations: [
              { id: "sens-bs-build", name: "Build" },
              { id: "sens-bs-measure", name: "Measure" },
              { id: "sens-bs-distance", name: "Grading at Distance" },
              { id: "sens-bs-blindfold", name: "Blindfold" },
              { id: "sens-bs-coop", name: "Cooperation Game" },
              { id: "sens-bs-missing", name: "What's Missing" },
              { id: "sens-bs-link", name: "Link to Environment" },
            ],
          },
          {
            id: "sens-red-rods",
            name: "Red Rods",
            description: "One-dimensional grading — length.",
            variations: [
              { id: "sens-rr-align", name: "Align" },
              { id: "sens-rr-measure", name: "Measure" },
              { id: "sens-rr-grade-dist", name: "Grade @ Distance" },
            ],
          },
          {
            id: "sens-box-a",
            name: "Constructive Triangles · Box A",
            variations: [
              { id: "sens-box-a-3", name: "3 Contrasts" },
              { id: "sens-box-a-parallelograms", name: "4 Parallelograms" },
              { id: "sens-box-a-all", name: "All Shapes" },
            ],
          },
          {
            id: "sens-box-b",
            name: "Constructive Triangles · Box B",
            variations: [
              { id: "sens-box-b-slide", name: "Slide" },
              { id: "sens-box-b-pivot", name: "Slide / Pivot" },
              { id: "sens-box-b-flip", name: "Slide / Flip" },
            ],
          },
          {
            id: "sens-triangle-box",
            name: "Triangle Box",
            variations: [
              { id: "sens-tribox-match-gray", name: "Match Gray" },
            ],
          },
          {
            id: "sens-small-hexagonal",
            name: "Small Hexagonal Box",
            variations: [
              { id: "sens-small-hex-lines", name: "Lines" },
            ],
          },
          {
            id: "sens-large-hexagonal",
            name: "Large Hexagonal Box",
            variations: [
              { id: "sens-large-hex-lines-fold", name: "Lines / Fold" },
            ],
          },
          {
            id: "sens-knobless",
            name: "Knobless Cylinders",
            variations: [
              { id: "sens-knob-one", name: "One" },
              { id: "sens-knob-side-by-side", name: "2 Side-by-Side" },
              { id: "sens-knob-stack-2", name: "Stack 2 (Red on Green)" },
              { id: "sens-knob-stack-3", name: "Stack 3" },
              { id: "sens-knob-towers", name: "Towers" },
              { id: "sens-knob-all", name: "All Cylinders" },
              { id: "sens-knob-grade-dist", name: "Grade @ Distance" },
            ],
          },
          {
            id: "sens-binomial",
            name: "Binomial Cube",
            variations: [
              { id: "sens-bin-by-row", name: "By Row" },
              { id: "sens-bin-mix-all", name: "Mix All" },
              { id: "sens-bin-out-of-box", name: "Out of Box" },
              { id: "sens-bin-parade", name: "Parade of Colors" },
              { id: "sens-bin-blindfold", name: "Blindfold" },
            ],
          },
          {
            id: "sens-trinomial",
            name: "Trinomial Cube",
            variations: [
              { id: "sens-tri-by-row", name: "By Row" },
              { id: "sens-tri-mix-2", name: "Mix 2 Rows" },
              { id: "sens-tri-mix-all", name: "Mix All" },
              { id: "sens-tri-out-of-box", name: "Out of Box" },
              { id: "sens-tri-color-parade", name: "Color Parade" },
              { id: "sens-tri-blindfold", name: "Blindfold" },
              { id: "sens-tri-coop", name: "Cooperation Game" },
            ],
          },
          {
            id: "sens-colour-3",
            name: "Colour Box 3",
            variations: [
              { id: "sens-c3-1", name: "1 Color" },
              { id: "sens-c3-2", name: "2 Colors" },
              { id: "sens-c3-more", name: "More Colors" },
              { id: "sens-c3-9", name: "9 Colors" },
              { id: "sens-c3-grade-dist", name: "Gradation Distance" },
              { id: "sens-c3-coop", name: "Cooperation Game" },
              { id: "sens-c3-link", name: "Link to Environment" },
            ],
          },
          {
            id: "sens-botany",
            name: "Botany Cabinet",
            variations: [
              { id: "sens-bot-3-contrasts", name: "3 Contrasts" },
              { id: "sens-bot-6-contrasts", name: "6 Contrasts" },
              { id: "sens-bot-6-similar", name: "6 Similar" },
              { id: "sens-bot-all-shapes", name: "All Shapes" },
              { id: "sens-bot-language", name: "Language" },
              { id: "sens-bot-show-card", name: "Show Card, Get Shape" },
              { id: "sens-bot-all-solid", name: "All Shapes: Solid Cards" },
              { id: "sens-bot-thick", name: "Thick Cards" },
              { id: "sens-bot-thin", name: "Thin Cards" },
              { id: "sens-bot-mixed", name: "Mixed Cards" },
              { id: "sens-bot-match-dist", name: "Games: Match @ Distance" },
              { id: "sens-bot-blindfold", name: "Games: Blindfold" },
              { id: "sens-bot-coop", name: "Games: Cooperation" },
              { id: "sens-bot-missing", name: "Games: What's Missing?" },
              { id: "sens-bot-link", name: "Games: Link to Environment" },
              { id: "sens-bot-leaf-aciculate", name: "Leaf: Aciculate" },
              { id: "sens-bot-leaf-cordate", name: "Leaf: Cordate / Obcordate" },
              { id: "sens-bot-leaf-deltoid", name: "Leaf: Deltoid" },
              { id: "sens-bot-leaf-elliptical", name: "Leaf: Elliptical / Orbiculate" },
              { id: "sens-bot-leaf-hastate", name: "Leaf: Hastate / Sagittate" },
              { id: "sens-bot-leaf-linear", name: "Leaf: Linear / Lanceolate" },
              { id: "sens-bot-leaf-ovate", name: "Leaf: Ovate / Obovate" },
              { id: "sens-bot-leaf-reniform", name: "Leaf: Reniform" },
              { id: "sens-bot-leaf-spatulate", name: "Leaf: Spatulate" },
            ],
          },
          {
            id: "sens-inscribed",
            name: "Inscribed & Concentric Figures",
            variations: [
              { id: "sens-ins-inscribed", name: "Inscribed" },
              { id: "sens-ins-adjacent", name: "Adjacent" },
              { id: "sens-ins-concentric", name: "Concentric" },
              { id: "sens-ins-tangent", name: "Tangent" },
              { id: "sens-ins-free", name: "Free Design" },
            ],
          },
        ],
      },
      {
        id: "sens-olfactory",
        name: "Olfactory",
        activities: [
          {
            id: "sens-smelling-jars",
            name: "Smelling Jars",
            variations: [
              { id: "sens-smell-match-dist", name: "Matching @ Distance" },
            ],
          },
        ],
      },
      {
        id: "sens-gustatory",
        name: "Gustatory",
        activities: [
          {
            id: "sens-tasting-jars",
            name: "Tasting Jars",
            variations: [
              { id: "sens-taste-match-dist", name: "Matching @ Distance" },
            ],
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
            variations: [
              { id: "sens-sc-3", name: "3 Cylinders" },
              { id: "sens-sc-6", name: "All 6" },
              { id: "sens-sc-gradation", name: "Gradation" },
              { id: "sens-sc-language", name: "Language" },
              { id: "sens-sc-match-dist", name: "Matching @ Distance" },
              { id: "sens-sc-grade-dist", name: "Grading @ Distance" },
              { id: "sens-sc-coop", name: "Cooperation Game" },
              { id: "sens-sc-missing", name: "What's Missing" },
            ],
          },
          {
            id: "sens-bells",
            name: "Bells",
            description: "Pitch matching — pre-musical preparation.",
            variations: [
              { id: "sens-bells-carry", name: "Carry & Strike" },
              { id: "sens-bells-match-3", name: "Match 3" },
              { id: "sens-bells-match-6", name: "Match 6" },
              { id: "sens-bells-match-all", name: "Match All" },
              { id: "sens-bells-match-dist", name: "Match @ Distance" },
              { id: "sens-bells-sing", name: "Sing the Scale" },
              { id: "sens-bells-gradation", name: "Gradation" },
              { id: "sens-bells-grade-dist", name: "Grade @ Distance" },
            ],
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
            id: "lang-listen-do",
            name: "Listen & Do",
            variations: [
              { id: "lang-ld-furnishings", name: "Furnishings" },
              { id: "lang-ld-names", name: "Names of Exercises" },
              { id: "lang-ld-parts", name: "Parts of an Exercise" },
              { id: "lang-ld-classifications", name: "Classifications of Things" },
              { id: "lang-ld-double", name: "Double Commands" },
            ],
          },
          { id: "lang-convers-picture", name: "Conversations at a Picture", variations: [] },
          { id: "lang-true-stories", name: "True Stories", variations: [] },
          { id: "lang-poetry", name: "Poetry", variations: [] },
          { id: "lang-songs", name: "Songs", variations: [] },
          {
            id: "lang-books",
            name: "Books",
            variations: [
              { id: "lang-books-parts", name: "Parts" },
              { id: "lang-books-self", name: "Read to Self" },
              { id: "lang-books-others", name: "Read to Others" },
              { id: "lang-books-types", name: "Types" },
            ],
          },
          { id: "lang-question-game", name: "Question Game", variations: [] },
          {
            id: "lang-spoken-class",
            name: "Spoken Classifications",
            variations: [
              { id: "lang-sc-groups", name: "Groups of Things" },
              { id: "lang-sc-compound", name: "Compound Words" },
              { id: "lang-sc-plurals", name: "Plurals" },
              { id: "lang-sc-synonyms", name: "Synonyms" },
              { id: "lang-sc-antonyms", name: "Antonyms" },
            ],
          },
          {
            id: "lang-vocab-enrich",
            name: "Vocabulary Enrichment",
            description: "Naming objects, parts of the room, and materials.",
            variations: [
              { id: "lang-ve-body", name: "Child Body Parts" },
              { id: "lang-ve-room", name: "Room Orientation" },
              { id: "lang-ve-materials", name: "Montessori Materials" },
              { id: "lang-ve-sensorial", name: "Sensorial Comparison & Superlative" },
              { id: "lang-ve-cards-sorting", name: "Vocab Cards: Sorting" },
              { id: "lang-ve-cards-matching", name: "Vocab Cards: Matching" },
              { id: "lang-ve-cards-sort-match", name: "Vocab Cards: Sort & Match" },
            ],
          },
          {
            id: "lang-sound-games",
            name: "Sound Games",
            description: "Isolating sounds within spoken words.",
            variations: [
              { id: "lang-sg-beg", name: "Beginning Sounds" },
              { id: "lang-sg-end", name: "Ending Sounds" },
              { id: "lang-sg-mid", name: "Middle Sounds" },
              { id: "lang-sg-segment", name: "Segmenting" },
            ],
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
              { id: "lang-sp-b", name: "B" },
              { id: "lang-sp-c", name: "C" },
              { id: "lang-sp-d", name: "D" },
              { id: "lang-sp-e", name: "E" },
              { id: "lang-sp-f", name: "F" },
              { id: "lang-sp-g", name: "G" },
              { id: "lang-sp-h", name: "H" },
              { id: "lang-sp-i", name: "I" },
              { id: "lang-sp-j", name: "J" },
              { id: "lang-sp-k", name: "K" },
              { id: "lang-sp-l", name: "L" },
              { id: "lang-sp-m", name: "M" },
              { id: "lang-sp-n", name: "N" },
              { id: "lang-sp-o", name: "O" },
              { id: "lang-sp-p", name: "P" },
              { id: "lang-sp-q", name: "Q" },
              { id: "lang-sp-r", name: "R" },
              { id: "lang-sp-s", name: "S" },
              { id: "lang-sp-t", name: "T" },
              { id: "lang-sp-u", name: "U" },
              { id: "lang-sp-v", name: "V" },
              { id: "lang-sp-w", name: "W" },
              { id: "lang-sp-x", name: "X" },
              { id: "lang-sp-y", name: "Y" },
              { id: "lang-sp-z", name: "Z" },
            ],
          },
          {
            id: "lang-phonogram",
            name: "Phonogram Spellings",
            variations: [
              { id: "lang-pg-ai", name: "AI" },
              { id: "lang-pg-ar", name: "AR" },
              { id: "lang-pg-ch", name: "CH" },
              { id: "lang-pg-ee", name: "EE" },
              { id: "lang-pg-ie", name: "IE" },
              { id: "lang-pg-ng", name: "NG" },
              { id: "lang-pg-oa", name: "OA" },
              { id: "lang-pg-oo", name: "OO" },
              { id: "lang-pg-or", name: "OR" },
              { id: "lang-pg-ou", name: "OU" },
              { id: "lang-pg-oy", name: "OY" },
              { id: "lang-pg-qu", name: "QU" },
              { id: "lang-pg-sh", name: "SH" },
              { id: "lang-pg-th", name: "TH" },
              { id: "lang-pg-ue", name: "UE" },
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
            variations: [
              { id: "lang-mi-outline", name: "Outline" },
              { id: "lang-mi-outline-thick", name: "Outline / Thick Fill" },
              { id: "lang-mi-outline-med", name: "Outline / Medium Fill" },
              { id: "lang-mi-outline-fill", name: "Outline / Fill" },
              { id: "lang-mi-two-shapes", name: "Two Shapes" },
              { id: "lang-mi-three-shapes", name: "Three Shapes" },
              { id: "lang-mi-1-2ways", name: "1 Shape / 2 Ways" },
              { id: "lang-mi-1-3ways", name: "1 Shape / 3 Ways" },
              { id: "lang-mi-circle", name: "Language: Circle" },
              { id: "lang-mi-rectangle", name: "Language: Rectangle" },
              { id: "lang-mi-quatrefoil", name: "Language: Quatrefoil" },
              { id: "lang-mi-triangle", name: "Language: Triangle" },
              { id: "lang-mi-trapezoid", name: "Language: Trapezoid" },
              { id: "lang-mi-pentagon", name: "Language: Pentagon" },
              { id: "lang-mi-oval", name: "Language: Oval" },
              { id: "lang-mi-ellipse", name: "Language: Ellipse" },
              { id: "lang-mi-curvilinear", name: "Language: Curvilinear Triangle" },
              { id: "lang-mi-square", name: "Language: Square" },
            ],
          },
          {
            id: "lang-recording",
            name: "Recording Process",
            variations: [
              { id: "lang-rec-blank", name: "Blank Green Board" },
              { id: "lang-rec-baseline", name: "Baseline Green Board" },
              { id: "lang-rec-waistline", name: "Waistline Green Board" },
            ],
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
            variations: [
              { id: "lang-pb-3part", name: "Phonetic 3-Part Cards" },
              { id: "lang-pb-words", name: "Phonetic Word Cards" },
            ],
          },
          {
            id: "lang-phonogram-box",
            name: "Phonogram Object Box",
            variations: [
              { id: "lang-pgb-3part", name: "Phonogram 3-Part Cards" },
              { id: "lang-pgb-lists", name: "Phonogram Lists" },
            ],
          },
          {
            id: "lang-puzzle-words",
            name: "Puzzle Words",
            description: "Sight reading of non-phonetic words.",
            variations: [],
          },
          {
            id: "lang-dwyer",
            name: "Dwyer Folders",
            variations: [
              { id: "lang-dw-3folders", name: "3 Phonogram Folders" },
              { id: "lang-dw-dictionary", name: "Dictionary" },
              { id: "lang-dw-test", name: "The Test" },
              { id: "lang-dw-dictation", name: "Dictation" },
            ],
          },
          {
            id: "lang-reading-class",
            name: "Reading Classification",
            variations: [
              { id: "lang-rc-body", name: "Labeling Body" },
              { id: "lang-rc-classroom", name: "Labeling Classroom" },
              { id: "lang-rc-cards", name: "Cards" },
              { id: "lang-rc-def-1", name: "Further Definition 1" },
              { id: "lang-rc-def-2", name: "Further Definition 2" },
              { id: "lang-rc-def-3", name: "Further Definition 3" },
            ],
          },
          {
            id: "lang-bells-notation",
            name: "Bells Notation",
            variations: [
              { id: "lang-bn-note-names", name: "Note Names" },
              { id: "lang-bn-painted", name: "Painted Staff" },
              { id: "lang-bn-blank", name: "Blank Staff" },
            ],
          },
        ],
      },
      {
        id: "lang-word-study",
        name: "Word Study",
        activities: [
          { id: "lang-ws-compound", name: "Compound Words", variations: [] },
          { id: "lang-ws-plurals", name: "Plurals", variations: [] },
          { id: "lang-ws-contractions", name: "Contractions", variations: [] },
          { id: "lang-ws-related-nouns", name: "Related Nouns", variations: [] },
          { id: "lang-ws-word-families", name: "Word Families", variations: [] },
          { id: "lang-ws-antonyms", name: "Antonyms", variations: [] },
          { id: "lang-ws-synonyms", name: "Synonyms", variations: [] },
          { id: "lang-ws-homonyms", name: "Homonyms", variations: [] },
        ],
      },
      {
        id: "lang-grammar",
        name: "Grammar & Function Words",
        activities: [
          { id: "lang-gr-article", name: "The Article", variations: [] },
          { id: "lang-gr-adjective", name: "The Adjective", variations: [] },
          { id: "lang-gr-logical-adj", name: "Logical Adjective Matching", variations: [] },
          { id: "lang-gr-detective", name: "Detective Adjective", variations: [] },
          { id: "lang-gr-conjunction", name: "Conjunction", variations: [] },
          { id: "lang-gr-preposition", name: "Preposition", variations: [] },
          {
            id: "lang-gr-verb-action",
            name: "Verb: Give Me Action",
            variations: [
              { id: "lang-gr-va-charades", name: "Box 1 (Charades)" },
            ],
          },
          {
            id: "lang-gr-adverb",
            name: "Adverb: Logical Adverb",
            variations: [
              { id: "lang-gr-ad-chain", name: "Adverb Chain" },
            ],
          },
          {
            id: "lang-gr-verb-trans",
            name: "Verb: Transitive / Intransitive",
            variations: [
              { id: "lang-gr-vt-mental", name: "Mental Activity" },
              { id: "lang-gr-vt-syntax", name: "Syntax" },
              { id: "lang-gr-vt-tense", name: "Tense" },
            ],
          },
          { id: "lang-gr-commands", name: "Continuation of Commands", variations: [] },
        ],
      },
      {
        id: "lang-reading-analysis",
        name: "Reading Analysis",
        activities: [
          {
            id: "lang-ra-stage1",
            name: "Simple Sentence · 1st Stage",
            variations: [
              { id: "lang-ra-s1-2a1s", name: "2 Actions / 1 Subject" },
              { id: "lang-ra-s1-2a2s", name: "2 Actions / 2 Subjects" },
              { id: "lang-ra-s1-1a1o", name: "1 Action / 1 Object" },
              { id: "lang-ra-s1-1a2o", name: "1 Action / 2 Objects" },
              { id: "lang-ra-s1-2a2o", name: "2 Actions / 2 Objects" },
              { id: "lang-ra-s1-2a2op", name: "2 Actions / 2 Objects / Pronoun" },
            ],
          },
          {
            id: "lang-ra-stage2",
            name: "Simple Sentence · 2nd Stage",
            variations: [
              { id: "lang-ra-s2-svdo", name: "Subject, Verb, DO" },
              { id: "lang-ra-s2-spdoio", name: "Subject, Predicate, DO, IO" },
            ],
          },
          {
            id: "lang-ra-stage3",
            name: "Simple Sentence · 3rd Stage",
            variations: [
              { id: "lang-ra-s3-adverbial", name: "Adverbial Clauses" },
              { id: "lang-ra-s3-adj-ext", name: "Adjective Extensions" },
              { id: "lang-ra-s3-appositions", name: "Appositions" },
            ],
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
              { id: "math-nr-onemoreless", name: "One More / Less" },
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
            id: "math-rods-cards",
            name: "Number Rods & Cards",
            variations: [
              { id: "math-rc-match", name: "Match Symbol / Rod" },
              { id: "math-rc-get-card", name: "Get the Card" },
              { id: "math-rc-get-rod", name: "Get the Rod" },
              { id: "math-rc-add-10", name: "Add the Rods (10)" },
              { id: "math-rc-add-other", name: "Add Other Rods" },
              { id: "math-rc-subtract", name: "Subtract the Rods" },
            ],
          },
          {
            id: "math-spindle",
            name: "Spindle Box",
            description: "Quantity-to-symbol association including zero.",
            variations: [
              { id: "math-spindle-counting", name: "Counting" },
              { id: "math-spindle-groups", name: "Grouping / Making Sets" },
              { id: "math-spindle-environment", name: "Environment" },
            ],
          },
          {
            id: "math-cards-counters",
            name: "Cards & Counters",
            description: "Odd and even — concept of pairs.",
            variations: [],
          },
          { id: "math-memory", name: "Memory Game of Numbers", variations: [] },
        ],
      },
      {
        id: "math-linear",
        name: "Linear Counting 10+",
        activities: [
          { id: "math-11-19-beads", name: "11–19 Beads", variations: [] },
          { id: "math-teen-board", name: "Teen Board", variations: [] },
          { id: "math-teen-beads", name: "Teen Board + Beads", variations: [] },
          { id: "math-ten-board-tens", name: "Ten Board / Beads: Tens", variations: [] },
          {
            id: "math-hundred-board",
            name: "Hundred Board",
            description: "Sequencing 1–100.",
            variations: [],
          },
          {
            id: "math-chain",
            name: "Chains",
            variations: [
              { id: "math-chain-100", name: "100 Chain" },
              { id: "math-chain-1000", name: "1,000 Chain" },
              { id: "math-chain-100-1000", name: "100 + 1,000 Chain" },
              { id: "math-chain-roll", name: "Number Roll" },
            ],
          },
          {
            id: "math-hierarchy",
            name: "Hierarchy Materials",
            variations: [
              { id: "math-hier-beads", name: "Beads" },
              { id: "math-hier-cards", name: "Cards" },
              { id: "math-hier-beads-cards", name: "Beads & Cards" },
            ],
          },
        ],
      },
      {
        id: "math-decimal",
        name: "Decimal System",
        activities: [
          {
            id: "math-golden-beads",
            name: "Golden Beads",
            description: "Hierarchies of the decimal system.",
            variations: [
              { id: "math-gb-names", name: "Names" },
              { id: "math-gb-bank", name: "Get from Bank" },
            ],
          },
          {
            id: "math-cards-decimal",
            name: "Decimal Cards (1111)",
            variations: [
              { id: "math-cd-all", name: "All Cards" },
              { id: "math-cd-get", name: "Get the Card" },
              { id: "math-cd-mixed", name: "Get Mixed Cards" },
            ],
          },
          {
            id: "math-beads-cards-decimal",
            name: "Beads / Cards",
            variations: [
              { id: "math-bcd-get-crds", name: "Get Cards" },
              { id: "math-bcd-get-beads", name: "Get Beads" },
            ],
          },
        ],
      },
      {
        id: "math-ops-concrete",
        name: "Operations: Concrete",
        activities: [
          {
            id: "math-bank-add",
            name: "Bank Game: Addition",
            variations: [
              { id: "math-ba-static-indep", name: "Static · Independent Work" },
              { id: "math-ba-dynamic", name: "Dynamic" },
              { id: "math-ba-dynamic-indep", name: "Dynamic · Independent Work" },
            ],
          },
          {
            id: "math-stamp-add",
            name: "Stamp Game: Addition",
            variations: [
              { id: "math-sa-prepared", name: "Prepared Slips" },
              { id: "math-sa-dynamic", name: "Dynamic: Give #" },
              { id: "math-sa-prepared-2", name: "Prepared Slips (Continued)" },
            ],
          },
          { id: "math-dot-game", name: "Dot Game", variations: [] },
          {
            id: "math-bank-mult",
            name: "Bank Game: Multiplication",
            variations: [
              { id: "math-bm-static-indep", name: "Static · Independent Work" },
              { id: "math-bm-dynamic", name: "Dynamic" },
              { id: "math-bm-dynamic-indep", name: "Dynamic · Independent Work" },
            ],
          },
          {
            id: "math-stamp-mult",
            name: "Stamp Game: Multiplication",
            variations: [
              { id: "math-sm-prepared", name: "Prepared Slips" },
              { id: "math-sm-dynamic", name: "Dynamic: Give #" },
              { id: "math-sm-prepared-2", name: "Prepared Slips (Continued)" },
            ],
          },
          {
            id: "math-bank-sub",
            name: "Bank Game: Subtraction",
            variations: [
              { id: "math-bs-static-indep", name: "Static · Independent Work" },
              { id: "math-bs-dynamic", name: "Dynamic" },
              { id: "math-bs-dynamic-indep", name: "Dynamic · Independent Work" },
            ],
          },
          {
            id: "math-stamp-sub",
            name: "Stamp Game: Subtraction",
            variations: [
              { id: "math-ss-prepared", name: "Prepared Slips" },
              { id: "math-ss-dynamic", name: "Dynamic: Give #" },
              { id: "math-ss-prepared-2", name: "Prepared Slips (Continued)" },
            ],
          },
          {
            id: "math-bank-div",
            name: "Bank Game: Division",
            variations: [
              { id: "math-bd-static-indep", name: "Static · Independent Work" },
              { id: "math-bd-dynamic-short", name: "Dynamic Short" },
              { id: "math-bd-dynamic-short-indep", name: "Dynamic Short · Independent Work" },
              { id: "math-bd-static-long", name: "Static Long" },
              { id: "math-bd-static-long-indep", name: "Static Long · Independent Work" },
              { id: "math-bd-dynamic-long", name: "Dynamic Long" },
              { id: "math-bd-dynamic-long-indep", name: "Dynamic Long · Independent Work" },
            ],
          },
          {
            id: "math-stamp-div",
            name: "Stamp Game: Division",
            variations: [
              { id: "math-sd-prepared", name: "Prepared Slips" },
              { id: "math-sd-dynamic-short", name: "Dynamic Short: Give #" },
              { id: "math-sd-prepared-2", name: "Prepared Slips (Dynamic Short)" },
              { id: "math-sd-static-long", name: "Static Long: Give #" },
              { id: "math-sd-prepared-3", name: "Prepared Slips (Static Long)" },
              { id: "math-sd-dynamic-long", name: "Dynamic Long: Give #" },
              { id: "math-sd-prepared-4", name: "Prepared Slips (Dynamic Long)" },
            ],
          },
        ],
      },
      {
        id: "math-skip",
        name: "Skip Counting",
        activities: [
          {
            id: "math-skip-5",
            name: "Skip Count: 5",
            variations: [
              { id: "math-skip-5-short", name: "Short Chain" },
              { id: "math-skip-5-long", name: "Long Chain" },
              { id: "math-skip-5-both", name: "Short + Long Chain" },
            ],
          },
          { id: "math-skip-1", name: "1 Chains", variations: [] },
          {
            id: "math-skip-2",
            name: "Skip Count: 2",
            variations: [
              { id: "math-skip-2-short", name: "Short Chain" },
              { id: "math-skip-2-long", name: "Long Chain" },
              { id: "math-skip-2-both", name: "Short + Long Chain" },
            ],
          },
          {
            id: "math-skip-3",
            name: "Skip Count: 3",
            variations: [
              { id: "math-skip-3-short", name: "Short Chain" },
              { id: "math-skip-3-long", name: "Long Chain" },
              { id: "math-skip-3-both", name: "Short + Long Chain" },
            ],
          },
          {
            id: "math-skip-4",
            name: "Skip Count: 4",
            variations: [
              { id: "math-skip-4-short", name: "Short Chain" },
              { id: "math-skip-4-long", name: "Long Chain" },
              { id: "math-skip-4-both", name: "Short + Long Chain" },
            ],
          },
          {
            id: "math-skip-6",
            name: "Skip Count: 6",
            variations: [
              { id: "math-skip-6-short", name: "Short Chain" },
              { id: "math-skip-6-long", name: "Long Chain" },
              { id: "math-skip-6-both", name: "Short + Long Chain" },
            ],
          },
          {
            id: "math-skip-7",
            name: "Skip Count: 7",
            variations: [
              { id: "math-skip-7-short", name: "Short Chain" },
              { id: "math-skip-7-long", name: "Long Chain" },
              { id: "math-skip-7-both", name: "Short + Long Chain" },
            ],
          },
          {
            id: "math-skip-8",
            name: "Skip Count: 8",
            variations: [
              { id: "math-skip-8-short", name: "Short Chain" },
              { id: "math-skip-8-long", name: "Long Chain" },
              { id: "math-skip-8-both", name: "Short / Long Chains" },
            ],
          },
          {
            id: "math-skip-9",
            name: "Skip Count: 9",
            variations: [
              { id: "math-skip-9-short", name: "Short Chain" },
              { id: "math-skip-9-long", name: "Long Chain" },
              { id: "math-skip-9-both", name: "Short / Long Chain" },
            ],
          },
          { id: "math-skip-all-short", name: "All Short Chains", variations: [] },
          { id: "math-skip-all-long", name: "All Long Chains", variations: [] },
          { id: "math-skip-all-mixed", name: "All Short / Long Chains", variations: [] },
        ],
      },
      {
        id: "math-add",
        name: "Addition: Bridge to Abstract",
        activities: [
          {
            id: "math-add-snake",
            name: "Snake Game",
            variations: [
              { id: "math-as-no-rem", name: "No Remainder" },
              { id: "math-as-remainder", name: "Remainder" },
            ],
          },
          {
            id: "math-add-strip",
            name: "Strip Board (1+1, 1+2, ...)",
            variations: [
              { id: "math-ast-ways", name: "All Ways to Make a #" },
              { id: "math-ast-commutative", name: "Commutative Property" },
            ],
          },
          {
            id: "math-add-finger",
            name: "Finger Chart",
            variations: [
              { id: "math-af-full", name: "Full" },
              { id: "math-af-partial", name: "Partial" },
              { id: "math-af-minimal", name: "Minimal" },
              { id: "math-af-blind", name: "Blind" },
            ],
          },
          {
            id: "math-add-sml-bead",
            name: "Small Bead Frame",
            variations: [
              { id: "math-asb-paper", name: "Paper / Move" },
              { id: "math-asb-static", name: "Static +" },
              { id: "math-asb-dynamic", name: "Dynamic +" },
            ],
          },
          { id: "math-add-large-bead", name: "Large Bead Frame", variations: [] },
        ],
      },
      {
        id: "math-mult",
        name: "Multiplication: Bridge",
        activities: [
          {
            id: "math-mult-bead-bars",
            name: "Bead Bars",
            variations: [
              { id: "math-mbb-table", name: "# Table" },
              { id: "math-mbb-combos", name: "All Combos of a #" },
              { id: "math-mbb-commutative", name: "Commutative Property" },
              { id: "math-mbb-10", name: "10 Table" },
              { id: "math-mbb-squares", name: "Squares" },
            ],
          },
          {
            id: "math-mult-bead-board",
            name: "Bead Board",
            variations: [
              { id: "math-mb-table", name: "# Table" },
              { id: "math-mb-12", name: "1 & 2 Table" },
              { id: "math-mb-3", name: "3 Table" },
              { id: "math-mb-4", name: "4 Table" },
              { id: "math-mb-6", name: "6 Table" },
              { id: "math-mb-7", name: "7 Table" },
              { id: "math-mb-8", name: "8 Table" },
              { id: "math-mb-9", name: "9 Table" },
              { id: "math-mb-10", name: "10 Table" },
            ],
          },
          {
            id: "math-mult-finger",
            name: "Finger Chart",
            variations: [
              { id: "math-mf-full", name: "Full" },
              { id: "math-mf-partial", name: "Partial" },
              { id: "math-mf-blind", name: "Blind" },
            ],
          },
        ],
      },
      {
        id: "math-sub",
        name: "Subtraction: Bridge",
        activities: [
          {
            id: "math-sub-snake",
            name: "Snake Game",
            variations: [
              { id: "math-subs-1vert", name: "1 Vertical" },
              { id: "math-subs-inside", name: "Inside the Gray" },
            ],
          },
          { id: "math-sub-strip", name: "Strip Board (18, 17, ...)", variations: [] },
          {
            id: "math-sub-finger",
            name: "Finger Chart",
            variations: [
              { id: "math-subf-full", name: "Full" },
              { id: "math-subf-blind", name: "Blind" },
            ],
          },
          {
            id: "math-sub-sml-bead",
            name: "Small Bead Frame",
            variations: [
              { id: "math-subsb-static", name: "Static" },
              { id: "math-subsb-dynamic", name: "Dynamic" },
            ],
          },
          { id: "math-sub-large-bead", name: "Large Bead Frame", variations: [] },
        ],
      },
      {
        id: "math-div",
        name: "Division: Bridge",
        activities: [
          {
            id: "math-div-bead",
            name: "Bead Board (81, 80, ...)",
            variations: [
              { id: "math-divb-divide", name: "Divide One #" },
              { id: "math-divb-match", name: "Match w/ Bead Bars" },
            ],
          },
          {
            id: "math-div-finger",
            name: "Finger Chart",
            variations: [
              { id: "math-divf-full", name: "Full" },
              { id: "math-divf-blind", name: "Blind" },
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
        id: "cult-art",
        name: "Visual Art",
        activities: [
          { id: "cult-displaying", name: "Displaying Art", variations: [] },
          { id: "cult-art-folders", name: "Fine Art Folders", variations: [] },
          {
            id: "cult-drawing",
            name: "Drawing on the Chalkboard",
            variations: [
              { id: "cult-draw-crayons", name: "Crayons" },
              { id: "cult-draw-pencils", name: "Colored Pencils" },
              { id: "cult-draw-pastels", name: "Pastels" },
            ],
          },
          {
            id: "cult-cutting",
            name: "Cutting",
            description: "Scissor control and craft preparation.",
            variations: [
              { id: "cult-cutting-paper", name: "Paper" },
              { id: "cult-cutting-other", name: "Other Items" },
            ],
          },
          {
            id: "cult-joining",
            name: "Joining",
            variations: [
              { id: "cult-join-glue-stick", name: "Glue Stick" },
              { id: "cult-join-wet-glue", name: "Wet Glue" },
              { id: "cult-join-taping", name: "Taping" },
              { id: "cult-join-stapling", name: "Stapling" },
              { id: "cult-join-hole-punch", name: "Hole Punch & Ring" },
            ],
          },
          {
            id: "cult-painting",
            name: "Painting at Easel",
            description: "Independent painting with watercolours.",
            variations: [
              { id: "cult-painting-watercolors", name: "Watercolours" },
              { id: "cult-painting-crayon-resist", name: "Crayon Resist" },
            ],
          },
          {
            id: "cult-clay",
            name: "Working with Clay",
            description: "Sculpting, pinching, rolling.",
            variations: [],
          },
        ],
      },
      {
        id: "cult-music",
        name: "Music",
        activities: [
          {
            id: "cult-music-listening",
            name: "Listening to Recordings",
            variations: [
              { id: "cult-listen-dancing", name: "Dancing" },
            ],
          },
          {
            id: "cult-music-making",
            name: "Making Music",
            variations: [
              { id: "cult-make-singing", name: "Singing" },
              { id: "cult-make-clapping", name: "Clapping" },
              { id: "cult-make-percussion", name: "Outdoor Percussion" },
              { id: "cult-make-guest", name: "Guest Musicians" },
            ],
          },
        ],
      },
      {
        id: "cult-geography",
        name: "Geography",
        activities: [
          {
            id: "cult-land-water",
            name: "Land & Water Cards",
            description: "Identifying basic geographic forms.",
            variations: [
              { id: "cult-lw-forms", name: "Match to Forms" },
              { id: "cult-lw-cards", name: "Match Cards" },
              { id: "cult-lw-written", name: "Written Labels" },
              { id: "cult-lw-printed", name: "Printed Labels" },
              { id: "cult-lw-defs", name: "Definitions" },
              { id: "cult-lw-split", name: "Split Definitions" },
            ],
          },
          {
            id: "cult-continent-map",
            name: "Continent Puzzle Map",
            description: "Names and locations of the continents.",
            variations: [
              { id: "cult-cm-color", name: "Outline Map: Color" },
              { id: "cult-cm-language", name: "Language" },
              { id: "cult-cm-written", name: "Written Labels" },
              { id: "cult-cm-prepared", name: "Prepared Labels" },
              { id: "cult-cm-label", name: "Outline Map: Label" },
              { id: "cult-cm-trace", name: "Trace the Map" },
            ],
          },
          {
            id: "cult-north-america",
            name: "North America Map",
            description: "Countries of North America.",
            variations: [
              { id: "cult-na-color", name: "Outline Map: Color" },
              { id: "cult-na-language", name: "Language" },
              { id: "cult-na-written", name: "Written Labels" },
              { id: "cult-na-prepared", name: "Prepared Labels" },
              { id: "cult-na-label", name: "Outline Map: Label" },
              { id: "cult-na-trace", name: "Trace the Map" },
            ],
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

// A "general" observation isn't tied to a specific activity/leaf — it captures a
// whole-area note. Encoded as `general:<areaId>` so it still carries an Area.
export const GENERAL_LEAF_PREFIX = "general:";

export function generalLeafId(areaId: string): string {
  return `${GENERAL_LEAF_PREFIX}${areaId}`;
}

export function isGeneralLeafId(leafId: string): boolean {
  return leafId.startsWith(GENERAL_LEAF_PREFIX);
}

export function getLeafById(leafId: string): Leaf | undefined {
  if (isGeneralLeafId(leafId)) {
    const area = getAreaById(leafId.slice(GENERAL_LEAF_PREFIX.length));
    if (!area) return undefined;
    return {
      leafId,
      leafName: "General",
      activityId: leafId,
      activityName: "General",
      subcategoryId: "",
      subcategoryName: "",
      areaId: area.id,
      areaName: area.name,
      areaColor: area.color,
      areaTone: area.tone,
    };
  }
  return getLeafIndex().get(leafId);
}

export function getAreaById(areaId: string): Area | undefined {
  return CURRICULUM.find((a) => a.id === areaId);
}
