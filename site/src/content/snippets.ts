// Every code sample on the page, highlighted once at build time (see server/highlight.ts).

export type Snippet = { file: string; lang: "tsx" | "ts" | "js" | "sh" | "text"; code: string };

export const snippets = {
  // The hero's editor: an example app's routes folder, one entry per file.
  heroLayout: {
    file: "routes/(app)/_layout.tsx",
    lang: "tsx",
    code: `import { Slot } from "@mismo/core";

// Wraps every screen in (app). Shell is a
// sidebar on the web, a tab bar on native.
export default function AppLayout() {
  return (
    <Shell>
      <Slot />
    </Shell>
  );
}`,
  },

  heroIndex: {
    file: "routes/(app)/index.tsx",
    lang: "tsx",
    code: `import { Link } from "@mismo/core";

export default function Home() {
  const orgs = useOrgs();

  return (
    <Screen title="Organizations">
      {orgs.map((org) => (
        <Link
          key={org.id}
          to={{ href: "/orgs/[id]", params: org }}
        >
          <OrgRow org={org} />
        </Link>
      ))}
    </Screen>
  );
}`,
  },

  heroOrg: {
    file: "routes/(app)/orgs/[id].tsx",
    lang: "tsx",
    code: `import { Link, useParams } from "@mismo/core";

export default function Org() {
  const { id } = useParams("/orgs/[id]");
  const org = useOrg(id);

  return (
    <Screen title={org.name}>
      {org.members.map((p) => (
        <Link
          key={p.id}
          to={{ href: "/people/[id]", params: p }}
        >
          <PersonRow person={p} />
        </Link>
      ))}
    </Screen>
  );
}`,
  },

  heroPerson: {
    file: "routes/(app)/people/[id].tsx",
    lang: "tsx",
    code: `import { useNav, useParams } from "@mismo/core";

export default function Person() {
  const { id } = useParams("/people/[id]");
  const person = usePerson(id);
  const nav = useNav();

  return (
    <Screen title={person.name}>
      <Profile person={person} />
      <Button onPress={() => nav.back()}>
        Back to the team
      </Button>
    </Screen>
  );
}`,
  },

  heroSettings: {
    file: "routes/(app)/settings.tsx",
    lang: "tsx",
    code: `import { Redirect } from "@mismo/core";

export default function Settings() {
  const session = useSession();
  if (!session) return <Redirect to="/sign-in" />;

  return (
    <Screen title="Settings">
      <Toggle label="Notifications" />
      <Toggle label="Weekly digest" />
      <SignOutButton />
    </Screen>
  );
}`,
  },

  heroSignIn: {
    file: "routes/sign-in.tsx",
    lang: "tsx",
    code: `import { useNav } from "@mismo/core";

// Outside (app): no sidebar, no tab bar.
export default function SignIn() {
  const nav = useNav();

  return (
    <Screen title="Sign in">
      <EmailField />
      <Button onPress={() => nav.replace("/")}>
        Continue
      </Button>
    </Screen>
  );
}`,
  },
} satisfies Record<string, Snippet>;

export type SnippetName = keyof typeof snippets;
