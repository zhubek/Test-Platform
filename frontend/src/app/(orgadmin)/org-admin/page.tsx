import { redirect } from "next/navigation";

export default function OrgAdminRoot() {
  redirect("/org-admin/licenses");
}
