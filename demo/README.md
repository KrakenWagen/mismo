# mismo demo

[demo.mismo.dev](https://demo.mismo.dev): the notes app from `pnpm create mismo`, on the web and on phones.

One Cloudflare Worker serves both:

- **Browsers** get the TanStack Start app as static files, with a "Try it on your phone" panel added by the build.
- **Expo Go** gets the native app, from a small server for the [Expo Updates protocol](https://docs.expo.dev/technical-specs/expo-updates-1/) in `src/handler.ts`.

```sh
pnpm build         # From the published starter. MISMO_STARTER=/path/to/starter uses a local copy
pnpm dev           # At http://localhost:8799, and exp://127.0.0.1:8799 in Expo Go
pnpm run deploy    # Builds, then publishes to demo.mismo.dev
pnpm typecheck
```

Nothing here goes in the starter: the build makes these changes to its own copy.

## What's here

| | |
| --- | --- |
| `build.ts` | Builds the demo. It pins the `create-mismo` version and the starter's commit at its top, so a deploy builds what the last one did: change them to take a newer starter. |
| `src/handler.ts` | What the Worker does with a request: the manifest for Expo Go, and the web app's files for everyone else. |
| `src/manifest.ts` | The manifests, from the files `expo export` wrote. |
| `src/worker.ts` | The Worker: the handler, with the manifests the build wrote (`src/manifests.json`, not committed). |
| `src/panel/` | The panel on the web app: `panel.ts`, with its styles and markup in `panel.css`, `panel.html` and `launcher.html`. The build bundles them, and the QR code library, into one script. |

The handler and the manifests have tests in `tests/src/demo.test.ts`.

## Why the native app is self-hosted

Since May 2026, [Expo Go only opens EAS Update projects you own](https://expo.dev/changelog/expo-go-loading-changes-may-2026), so EAS Update can't give the public a QR code. Expo Go still opens updates from other servers, as long as they're plain JavaScript, which is why the build uses `--no-bytecode`.

Expo doesn't support custom update servers, and this could stop working. The build targets whichever SDK the starter uses, so redeploy after upgrading the starter's Expo version.
