<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project rules
- All pages live under the `/$lang` route (mn default, zh); `/` redirects. Why: spec requires locale-prefixed URLs.
- UI strings come from `src/i18n/locales/{mn,zh}.ts` via `useT()`; never hardcode visible text. Why: bilingual from day one.
- Signed-in pages go under `src/routes/$lang._authenticated.*` (client-only gate redirecting to `/$lang/auth`). Why: locale-aware auth gate; session lives in browser storage.
- Permissions are enforced with RLS on every table, not only in UI. Why: spec requirement.
- Wishlist uses an owner-scoped join table and user-keyed query caches; only published products can be saved and listed. Why: keep account data private and hide withdrawn listings.
- Store maps share a Leaflet component with OpenStreetMap tiles; import Leaflet only inside effects and persist only explicitly chosen coordinate pairs. Public store locations use the shared StoreLocationButton dialog on store and product pages. Why: keep SSR safe, never publish fallback coordinates, and consistently open the saved pin without editing it.
- Promotional posts use a separate store-owned table and private media bucket, with published-only public reads and owner-scoped mutations; share the vertical feed across Shorts and store pages. Why: posts are independent from products and drafts must stay private.
- Post thumbnail links pass a post ID in the Shorts search parameters; the shared feed opens that post once, loading additional published pages when needed. Why: opening a thumbnail must preserve the selected post without locking subsequent browsing.
- Store follows use an owner-scoped join table; the followed-stores feed lists only published products. Why: follows are private account data.
- Product views are counted once per browser session via a security-definer RPC into a non-readable stats table; owners read view/save counts only through an owns_store-guarded RPC. Why: counts stay private to owners and cannot be written directly.
