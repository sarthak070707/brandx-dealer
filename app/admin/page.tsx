import { redirect } from "next/navigation";

// The admin opens on its first section; more sections join the same tabs.
export default function AdminPage() {
  redirect("/admin/cars");
}
