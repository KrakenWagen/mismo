import { Link } from "@mismo/core";

export default function Home() {
  return (
    <main>
      <h1>mismo</h1>
      <Link to={{ href: "/orgs/[id]", params: { id: "acme" } }}>Acme</Link>
    </main>
  );
}
