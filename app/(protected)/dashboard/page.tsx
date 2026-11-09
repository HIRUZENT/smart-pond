import { redirect } from "next/navigation";
import { requireUser } from "@/src/lib/auth";

export default async function DashboardPage() {
  const user = await requireUser();
  if (user.role === "ADMIN") redirect("/users");

  return (
    <section>
      <h1>Dashboard SMART-POND</h1>
      <p>Selamat datang, {user.name}.</p>
      <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: "1.5rem", marginTop: "1.5rem" }}>
        <h2 style={{ marginTop: 0 }}>Data monitoring belum tersedia</h2>
        <p>UI dashboard yang sudah kamu desain dapat dihubungkan ke Firebase RTDB pada tahap integrasi sensor.</p>
      </div>
    </section>
  );
}
