import {
  Briefcase,
  GraduationCap,
  BookOpen,
  Building2,
  School,
  MapPin,
  type LucideIcon,
} from "lucide-react";

// Built-in catalog groups (seeded in dc_catalog_groups) get icons + i18n
// labels; everything — built-in and custom — uses the same generic Items
// table, Pages composer, and Parameters editor over the dc backend.
// Characteristics is intentionally NOT here: it's not a data catalog and lives
// in its own tab on the hub.
export const CATALOGS: { id: string; icon: LucideIcon; labelKey: string }[] = [
  { id: "professions", icon: Briefcase, labelKey: "cm.methodic.tabs.professions" },
  { id: "univerPrograms", icon: GraduationCap, labelKey: "cm.methodic.tabs.univerPrograms" },
  { id: "collegePrograms", icon: BookOpen, labelKey: "cm.methodic.tabs.collegePrograms" },
  { id: "universities", icon: Building2, labelKey: "cm.methodic.tabs.universities" },
  { id: "colleges", icon: School, labelKey: "cm.methodic.tabs.colleges" },
  { id: "cities", icon: MapPin, labelKey: "cm.methodic.tabs.cities" },
];
