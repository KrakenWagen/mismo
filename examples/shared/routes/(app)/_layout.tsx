import { Link, Slot } from "@mismo/core";

export default function AppLayout() {
  return (
    <div>
      <nav>
        <Link to="/">Home</Link>
      </nav>
      <Slot />
    </div>
  );
}
