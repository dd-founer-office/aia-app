import type { MissionTemplate } from "@/types/mission-camera";

// Mission Templates — Mission Camera Constitution v1.0 (LOCKED).
// Configurable by administrators per the constitution; hardcoded here
// until an Ops Portal exists to manage them.
export const MISSION_TEMPLATES: MissionTemplate[] = [
  {
    id: "tree_plantation",
    name: "Tree Plantation",
    category: "tree",
    requirements: [
      { id: "site_overview", label: "Site Overview", kind: "photo" },
      { id: "digging_pit", label: "Digging Pit", kind: "photo" },
      { id: "sapling_placement", label: "Sapling Placement", kind: "photo" },
      { id: "watering", label: "Watering", kind: "photo" },
      { id: "closeup_sapling", label: "Close-up of Sapling", kind: "photo" },
      { id: "volunteer_group", label: "Volunteer Group", kind: "photo" },
      { id: "growth_video", label: "Short Growth Video", kind: "video", durationSeconds: 15 },
    ],
  },
  {
    id: "annadhanam",
    name: "Annadhanam",
    category: "annadhanam",
    requirements: [
      { id: "cooking", label: "Cooking", kind: "photo" },
      { id: "food_ready", label: "Food Ready", kind: "photo" },
      { id: "serving", label: "Serving", kind: "photo" },
      { id: "beneficiary_receiving", label: "Beneficiary Receiving Meal", kind: "photo" },
      { id: "group_photo", label: "Group Photo", kind: "photo" },
      { id: "closing_video", label: "Closing Video", kind: "video", durationSeconds: 15 },
    ],
  },
  {
    id: "education_kit_distribution",
    name: "Education Kit Distribution",
    category: "student",
    requirements: [
      { id: "school_exterior", label: "School Exterior", kind: "photo" },
      { id: "kit_arrangement", label: "Kit Arrangement", kind: "photo" },
      { id: "distribution_begins", label: "Distribution Begins", kind: "photo" },
      { id: "student_receiving_kit", label: "Student Receiving Kit", kind: "photo" },
      { id: "volunteer_interaction", label: "Volunteer Interaction", kind: "photo" },
      { id: "group_photo", label: "Group Photo", kind: "photo" },
      { id: "short_video", label: "Short Video", kind: "video", durationSeconds: 15 },
    ],
  },
  {
    id: "medical_family_support",
    name: "Medical Family Support",
    category: "family",
    requirements: [
      { id: "family_assessment", label: "Family Assessment", kind: "photo" },
      { id: "support_confirmation", label: "Support Confirmation Document", kind: "photo" },
      { id: "treatment_support", label: "Treatment / Support Provided", kind: "photo" },
      { id: "family_outcome", label: "Family Recovery / Outcome", kind: "photo" },
      { id: "closing_video", label: "Closing Video", kind: "video", durationSeconds: 15 },
    ],
  },
];

export function getMissionTemplate(id: string): MissionTemplate | undefined {
  return MISSION_TEMPLATES.find((m) => m.id === id);
}

export function getMissionTemplateByCategory(category: string): MissionTemplate | undefined {
  return MISSION_TEMPLATES.find((m) => m.category === category);
}
