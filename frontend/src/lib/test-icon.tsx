import {
  Compass,
  Fingerprint,
  Puzzle,
  Heart,
  Briefcase,
  Wrench,
  Scale,
  BookOpen,
  type LucideIcon,
} from "lucide-react";

const icons: Record<string, LucideIcon> = {
  compass: Compass,
  fingerprint: Fingerprint,
  puzzle: Puzzle,
  heart: Heart,
  briefcase: Briefcase,
  wrench: Wrench,
  scale: Scale,
  "book-open": BookOpen,
};

export function getTestIcon(key: string | null | undefined): LucideIcon {
  return icons[key ?? "compass"] ?? Compass;
}
