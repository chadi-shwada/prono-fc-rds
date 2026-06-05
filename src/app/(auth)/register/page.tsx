import { redirect } from "next/navigation";

// Plus de page d'inscription séparée : tout se fait sur /login (pseudo + code).
export default function RegisterPage() {
  redirect("/login");
}
