import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// proxy.ts already redirects unauthenticated visitors to /login and routes
// each role to its own area - this only exists to give authenticated users
// hitting bare "/" somewhere to land.
export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const roleHome: Record<string, string> = {
    client: "/build",
    captain: "/captain",
    contractor: "/contractor",
    admin: "/admin",
  };
  redirect(roleHome[profile?.role ?? "client"]);
}
