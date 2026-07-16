import { redirect } from "next/navigation";

// La raiz siempre lleva al panel; el layout protegido decide si pide login.
export default function Home() {
  redirect("/panel");
}
