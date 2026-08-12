// Developmental checklists on the progress report — three sections, each a
// Rarely / Sometimes / Usually matrix with its own comment box.
//
// These live in code (like the curriculum catalog) rather than the database.
// Answers are stored against the stable `id`s below, keyed "<sectionId>:<itemId>",
// so relabelling an item never orphans a saved answer — and a per-school
// override table can be layered on later without touching stored payloads.

export type DevLevel = "rarely" | "sometimes" | "usually";

export const DEV_LEVELS: { key: DevLevel; label: string }[] = [
  { key: "rarely", label: "Rarely" },
  { key: "sometimes", label: "Sometimes" },
  { key: "usually", label: "Usually" },
];

export type DevItem = { id: string; label: string };
export type DevSection = { id: string; title: string; items: DevItem[] };

export const DEVELOPMENT_SECTIONS: DevSection[] = [
  {
    id: "physical-emotional",
    title: "Physical and Emotional Development",
    items: [
      { id: "secure-in-environment", label: "Seems secure in the environment" },
      {
        id: "works-without-approval",
        label: "Works without need for frequent adult approval/confident",
      },
      {
        id: "flexible-adaptable",
        label: "Is flexible and adaptable in competitive situations",
      },
      {
        id: "acts-with-forethought",
        label: "Acts with forethought/controls impulsivity",
      },
      { id: "thoughtful-of-others", label: "Is thoughtful of others" },
      {
        id: "conflict-resolution",
        label: "Uses appropriate conflict resolution skills",
      },
      { id: "observant-curious", label: "Is observant, curious, aware" },
      {
        id: "responsibility-for-actions",
        label: "Takes responsibility for actions",
      },
      {
        id: "good-coordination",
        label: "Shows good coordination/moves with care",
      },
      { id: "well-rested", label: "Seems well rested" },
    ],
  },
  {
    id: "social",
    title: "Social Development",
    items: [
      { id: "receptive-to-direction", label: "Is receptive to direction" },
      { id: "responds-to-lessons", label: "Responds positively to lessons" },
      {
        id: "communicates-with-adults",
        label: "Communicates comfortably with adults",
      },
      { id: "respectful-cooperative", label: "Is respectful/cooperative" },
      {
        id: "comfortable-with-peers",
        label: "Is comfortable in a group of peers",
      },
      { id: "resolves-conflicts", label: "Works at resolving conflicts" },
      { id: "works-well-with-peers", label: "Works well with peers" },
      {
        id: "helps-others",
        label: "Takes responsibility for helping others",
      },
      { id: "uses-materials-carefully", label: "Uses materials carefully" },
      { id: "maintains-classroom", label: "Helps maintain the classroom" },
      {
        id: "oriented-to-routine",
        label: "Is oriented to the routine and arrangement of classroom",
      },
    ],
  },
  {
    id: "work-habits",
    title: "Work Habits",
    items: [
      { id: "attentive-in-lessons", label: "Remains attentive in lessons" },
      {
        id: "participates-eagerly",
        label: "Participates eagerly and contributes equitably to work",
      },
      {
        id: "works-independently",
        label: "Works independently of other children",
      },
      { id: "maintains-focus", label: "Maintains focus" },
      { id: "organizes-own-time", label: "Organizes own time and work" },
      { id: "works-with-care", label: "Works with care" },
      { id: "extended-periods", label: "Works for extended periods" },
      { id: "reasonable-rate", label: "Works at a reasonable rate" },
      { id: "chooses-challenging", label: "Chooses challenging work" },
      { id: "completes-tasks", label: "Completes tasks" },
      { id: "desire-to-work", label: "Has desire to work" },
      { id: "tries-new-things", label: "Tries new things" },
      {
        id: "follows-directions",
        label: "Follows both written and oral directions",
      },
      {
        id: "good-memory",
        label: "Has good memory, recalls with consistency",
      },
      { id: "grasps-concepts", label: "Grasps new concepts" },
      { id: "uses-materials-successfully", label: "Uses materials successfully" },
      { id: "repeats-lessons", label: "Repeats lessons independently" },
      {
        id: "fine-motor-control",
        label: "Has fine motor control appropriate to age",
      },
    ],
  },
];

/** Key used in the stored `development` map. */
export function devKey(sectionId: string, itemId: string): string {
  return `${sectionId}:${itemId}`;
}
