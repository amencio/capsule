# Capsule — Contexte Projet

> **RÈGLE IMPÉRATIVE :** Toujours update `context.md` après ajout feature, modif architecture, nouvelle dépendance, ou changement important. Agent IA reprenant projet doit trouver ici toutes infos nécessaires.

---

## Quick Start

```bash
# 1. Installer les dépendances
npm install --legacy-peer-deps

# 2. Configurer Supabase dans app.json
#    Remplacer YOUR_SUPABASE_URL et YOUR_SUPABASE_ANON_KEY

# 3. Exécuter les migrations SQL dans le SQL Editor du dashboard Supabase
#    - supabase/migrations/0001_init.sql
#    - supabase/migrations/0002_rpc_tickets.sql
#    - supabase/migrations/0003_refonte_capsules.sql

# 4. Lancer l'app
npx expo start

# Vérifications
npx tsc --noEmit    # Typecheck → 0 erreur attendue
npx expo lint        # ESLint → 0 erreur attendue
```

---

## Stack Technique

| Package | Version | Rôle |
|---|---|---|
| `expo` | `~57.0.0` | Framework (SDK 57) |
| `react-native` | `0.86.3` | Runtime natif |
| `react` | `19.2.3` | UI library |
| `expo-router` | `~57.0.0` | Navigation file-based |
| `nativewind` | `^4.2.7` | Tailwind CSS pour RN (v4, compatible Tailwind v3) |
| `tailwindcss` | `^3.4.17` | Styling utility-first |
| `react-native-reanimated` | `~4.5.1` | Animations 60fps (thread UI natif) |
| `react-native-worklets` | `0.10.1` | Dépendance Reanimated |
| `@tanstack/react-query` | `^5.0.0` | Cache, mutations, stale-while-revalidate |
| `@supabase/supabase-js` | `^2.109.0` | Client backend (auth, DB, realtime) |
| `expo-haptics` | `~57.0.0` | Retours haptiques |
| `expo-linear-gradient` | `~57.0.0` | Dégradés |
| `expo-image` | `~3.0.0` | Avatars performants |
| `lucide-react-native` | `^1.52.0` | Icônes tab bar |
| `react-native-svg` | `^15.15.4` | SVG (cosmonautes, décor, logo) |
| `typescript` | `~6.0.3` | Typage strict |

**Pas de support web.** Mobile-only (Expo Go). `react-dom`, `react-native-web`, `@expo/metro-runtime` volontairement absents.

---

## Vision et Concept

Capsule = app mobile suivi dettes sociales de bar, RPG spatial entre amis. Chaque verre dû = "contrat social" unique avec histoire + validation bilatérale. Nom "Capsule" pont entre capsule bouteille et capsule spatiale (mise en "orbite").

---

## Identité Visuelle et Lexique

- **Style :** Cartoon/Bande Dessinée spatial. Bordures noires épaisses (`border-2 border-black`), hard shadows solides (no blur), arrondis prononcés. Fond dégradé `#1a233a → #0d111a`.
- **Palette :** `#0D0D11` (fond), `#1A1A24` (surface), `#00FF66` (vert néon), `#FF3B30` (rouge), `#FFD60A` (jaune alerte), `#00F0FF` (cyan info), `#FF6B1A` (orange CTA), `#f97316` (orange cartoon), `#4ade80` (vert cartoon), `#f8f9fa` (blanc cartes). Définie dans `src/constants/theme.ts` et `tailwind.config.js`.
- **Lexique :**
  - *Demander un verre :* Lancer une capsule
  - *Payer/Valider un verre :* Décapsuler (décollage)
  - *La jauge d'état :* L'Orbite (OrbitTrack)
  - *Score :* Altitude (Σ capsules resolved où creditor)
  - *0 verre bu :* Gravité Zéro / Houston (sur Terre)
  - *Capsules active :* Carburant (prêt à décapsuler)

---

## Mécaniques de Base (Core Loop)

1. **Demande :** User A réclame verre à User B (boisson + motif obligatoire). Statut `pending`.
2. **Validation :** B accepte/refuse. Accepté → statut `active` = carburant. `solde_global` ajusté par trigger DB.
3. **Ardoise :** Capsules validées = carburant, affichées dans feed Dashboard + onglet Activité.
4. **Décollage :** Clic "DÉCAPSULER" → statut `resolved`, `resolved_at` auto-set. Altitude creditor +1. Avatar propulsé sur jauge. Haptique succès.

### Règle Altitude (Pivot)

- **Altitude** = Σ(`amount` où `creditor_id = userId` ET `status = 'resolved'`)
- Score cumulatif, jamais négatif. Tous commencent à 0 (Terre/Houston).
- Capsules `active` = carburant, ne font PAS monter sur jauge.
- `calculateAltitude()` dans `src/utils/karma.ts`

---

## Architecture & Data Flow

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐     ┌──────────────────┐
│   Écran      │────▶│  Hook             │────▶│  Service    │────▶│  Supabase        │
│  (app/)      │     │  (hooks/)         │     │  (services/) │     │  RPC / Query     │
│              │◀────│  useQuery         │◀────│              │◀────│                  │
└─────────────┘     │  useMutation      │     └─────────────┘     └──────┬───────────┘
                    └────────┬─────────┘                                 │
                             │ invalidateQueries                          │ Trigger
                             ▼                                            ▼
                    ┌──────────────────┐                          ┌──────────────────┐
                    │  TanStack Cache  │                          │  recalcul solde  │
                    │  (queryClient)   │                          │  (auto DB)       │
                    └──────────────────┘                          └──────────────────┘
                             ▲
                             │ Realtime event
                    ┌────────┴─────────┐
                     │  Supabase Channel │
                     │  (capsules_realtime)│
                    └──────────────────┘
```

**Flux données :**
1. Écran appelle hook (`useCapsules`, `useProfiles`, `useAuthContext`)
2. Hook utilise TanStack Query (`useQuery` read, `useMutation` write)
3. Service appelle Supabase (query directe ou RPC `SECURITY DEFINER`)
4. Mutation réussie → `queryClient.invalidateQueries()` → refetch auto
5. Changement externe → Supabase Realtime → channel → `invalidateQueries()` → UI rafraîchie
6. **Altitude** calculé frontend via `calculateAltitude(capsules, userId)` = Σ(amount where creditor + resolved). `solde_global` DB maintenu par trigger pour requêtes serveur.

---

## Sécurité & Schéma DB

### Tables

| Table | Colonnes | RLS |
|---|---|---|
| `profiles` | `id` (UUID PK, FK auth.users), `pseudo` (unique), `avatar_url`, `solde_global` (int, default 0), `created_at` | SELECT tous authentifiés, UPDATE propriétaire |
| `capsules` | `id` (UUID PK), `creditor_id` (FK), `debtor_id` (FK), `drink_type` (text), `amount` (int, default 1), `reason` (text), `status` (`pending`/`active`/`resolved`), `created_at`, `updated_at`, `resolved_at` | SELECT/INSERT/DELETE participants uniquement |

### RPC (SECURITY DEFINER)

| Fonction | Règles |
|---|---|
| `accept_capsule(capsule_uuid)` | Vérifie `auth.uid() = debtor_id` ET `status = 'pending'` → `active` |
| `resolve_capsule(capsule_uuid)` | Vérifie `auth.uid() = creditor_id OR debtor_id` ET `status = 'active'` → `resolved` + auto-set `resolved_at` |

### Trigger : `recalculate_solde`

- **INSERT + status='active'** : `creditor_id -amount`, `debtor_id +amount`
- **UPDATE pending→active** : `creditor_id -amount`, `debtor_id +amount`
- **UPDATE active→resolved** : `creditor_id +amount`, `debtor_id -amount`, auto-set `resolved_at = now()`
- **UPDATE active→pending** (rollback) : `creditor_id +amount`, `debtor_id -amount`
- **UPDATE pending→resolved** : **BLOQUÉ**
- **UPDATE resolved→anything** : **BLOQUÉ**
- **DELETE + status='active'** : reverse solde (`creditor_id +amount`, `debtor_id -amount`)
- **DELETE + status='pending'/'resolved'** : aucun impact

### Auto-création profil

Trigger `on_auth_user_created` : inscription crée auto profil dans `profiles` avec `pseudo` = métadonnée `pseudo` ou partie avant `@` de l'email.

---

## Composant UI Central : OrbitTrack (L'Orbite)

`src/components/GravJauge.tsx`

- Ligne pointillée verticale (`border-dashed border-white/50`) de Terre → ISS
- Conteneur `h-[55vh]` s'étire de Terre à ISS
- **Positionnement avatars** : `bottom: (altitude / maxAltitude) * 100`%
- **Cosmonaute SVG** : casque rond + corps + backpack. Photo utilisateur dans visière (overlay `expo-image` `rounded-full`)
- **Badge score** : blanc `bg-white text-black border-2 border-black rounded-full`. Texte `+X 🍻` ou `Gravité Zéro`
- **Couronne 👑** si altitude max (leader), `absolute -top-5 -right-2`
- **ISS 🛰️** en haut, **Terre 🌍** en bas
- **Animation propulsion** : `withSpring` énergique (damping 6, stiffness 150) + float `withRepeat`
- **Altitude 0** : avatar sur Terre, bordure `earth-dark`
- **Altitude > 0** : avatar flotte, bordure `neon-green`

---

## Composants UI (Refonte v3 — Cartoon)

| Composant | Fichier | Description |
|---|---|---|
| `SpaceBackground` | `src/components/SpaceBackground.tsx` | Dégradé `#1a233a→#0d111a` + étoiles SVG + ISS 🛰️ top-left + Terre SVG bottom (cercle bleu + taches vertes) |
| `CapsuleLogo` | `src/components/CapsuleLogo.tsx` | Logo hybride capsule/vaisseau SVG (28x28) |
| `GravJauge` | `src/components/GravJauge.tsx` | OrbitTrack : ligne pointillée + cosmonautes SVG avec photos dans visières + badges score + couronne leader |
| `CapsuleCard` | `src/components/CapsuleCard.tsx` | Cartes blanches cartoon `#f8f9fa` + `border-2 border-black` + hard shadows. Header photo + "te doit X [drink] [emoji]". Bouton vert `#4ade80` DÉCAPSULER |
| `PendingAlertBanner` | `src/components/PendingAlertBanner.tsx` | Bannière jaune "X capsule(s) en attente validation" |
| `ProfileSwitcher` | `src/components/ProfileSwitcher.tsx` | Dropdown dev-only "Vue de : [User]" |
| `LaunchModal` | `src/components/LaunchModal.tsx` | Bottom sheet : ami (chips) + drink_type (prédéfini + custom) + quantité (+/−) + motif + bouton LANCER |
| `ErrorBoundary` | `src/components/ErrorBoundary.tsx` | Error boundary global + resetKey remount |

### Design System Cartoon

- **Bordures** : `border-2 border-black` sur tout élément interactif
- **Hard shadows** : inline `shadowOffset: {width: 4, height: 4}, shadowOpacity: 1, shadowRadius: 0, elevation: 5` (no blur)
- **Arrondis** : `rounded-xl` ou `rounded-2xl`
- **Bouton press** : `active:translate-y-1` + shadow réduit
- **Cartes** : fond blanc `#f8f9fa`, texte noir, contrast maximal avec fond spatial

---

## Navigation (Refonte v2)

```
/ (root)
├── _layout.tsx          → Stack navigator, headerShown: false
│                          Screens: "login", "(tabs)"
│                          Redirect to /login if no session
│
├── login.tsx            → Login/Register screen (standalone, no tab bar)
│
└── (tabs)/
    ├── _layout.tsx       → Tabs navigator with 4 tabs
    │                       Realtime hooks (useCapsulesRealtime, useProfilesRealtime)
    │
    ├── index.tsx         → Tab "Dashboard" (LayoutDashboard icon)
    │                       Layout asymétrique : Jauge gauche 35% + bouton orange + feed droite
    │                       SpaceBackground, ProfileSwitcher, LaunchModal
    │
    ├── activite.tsx      → Tab "Activité" (Activity icon)
    │                       Historique complet avec filtres (Tout/Pending/Active/Resolved)
    │
    ├── amis.tsx          → Tab "Amis" (Users icon)
    │                       Classement par altitude, clic pour voir capsules en commun
    │
    └── profil.tsx        → Tab "Profil" (User icon)
                            Avatar, stats (altitude + capsules totales), paramètres, déconnexion
```

---

## Distribution

- **Dev :** Expo Go. `npx expo start` → QR code / lien.
- **OTA :** `eas update` publie code JS sur Expo Cloud → MAJ au prochain lancement.
- **Backend :** Supabase Cloud (gratuit, hébergé).
- **Deep linking :** `scheme: "capsule"` dans `app.json`. Emails de confirmation redirigent vers `capsule://login`.

---

## Arborescence du Projet

```text
.
├── assets/                          # Assets visuels (icon, splash, adaptive icons)
├── supabase/
│   └── migrations/
│       ├── 0001_init.sql            # Schéma tables, triggers solde, RLS, Realtime
│       ├── 0002_rpc_tickets.sql     # RPC sécurité (accept_ticket, pay_ticket) + trigger complet
│       └── 0003_refonte_capsules.sql # Rename tickets→capsules, add drink_type/amount/resolved_at, status paid→resolved, new RPCs
├── src/
│   ├── app/                         # Expo Router screens
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx          # Onglets (Dashboard, Activité, Amis, Profil) + Realtime hooks + tab bar dynamique
│   │   │   ├── index.tsx            # Écran Dashboard (OrbitTrack + bouton orange cartoon + feed + LaunchModal + ProfileSwitcher)
│   │   │   ├── activite.tsx         # Écran Activité (Historique complet + filtres par statut)
│   │   │   ├── amis.tsx             # Écran Amis (Classement par altitude + détails capsules en commun)
│   │   │   └── profil.tsx           # Écran Profil (Avatar, stats, paramètres, déconnexion)
│   │   ├── _layout.tsx              # Root layout : QueryClientProvider, AuthProvider, HoustonToastProvider, ErrorBoundary
│   │   └── login.tsx                # Auth (useAuthContext) + vérif session avant navigation
│   ├── components/
│   │   ├── CapsuleCard.tsx          # Carte capsule cartoon (blanc, border-black, hard shadows, drink emojis)
│   │   ├── ErrorBoundary.tsx        # Error boundary global "Houston, on a un problème 🚨" + resetKey remount
│   │   ├── GravJauge.tsx            # OrbitTrack : ligne pointillée + cosmonautes SVG + photos visière + badges score
│   │   ├── LaunchModal.tsx          # Bottom sheet (ami + boisson + quantité + motif)
│   │   ├── PendingAlertBanner.tsx   # Bannière jaune "X capsule(s) en attente"
│   │   ├── ProfileSwitcher.tsx      # Dropdown dev-only "Vue de : [User]"
│   │   ├── SpaceBackground.tsx      # Dégradé spatial + étoiles SVG + ISS + Terre
│   │   └── CapsuleLogo.tsx          # Logo hybride capsule/vaisseau SVG
│   ├── constants/
│   │   └── theme.ts                 # Palette couleurs + labels statuts + couleurs statuts + DRINK_TYPES
│   ├── context/
│   │   ├── AuthProvider.tsx         # Context d'auth Supabase (useAuth wrapped)
│   │   └── HoustonToastContext.tsx  # Toasts animés (FadeInUp/FadeOutUp) — 4 niveaux + SafeAreaInsets
│   ├── data/
│   │   └── mocks.ts                 # Mock data : 3 users (pravatar.cc), 1 pending, 2 active, 5 resolved + DRINK_EMOJIS
│   ├── hooks/
│   │   ├── useAuth.ts               # Auth Supabase : getSession, onAuthStateChange, isMounted ref pour Strict Mode
│   │   ├── useProfiles.ts           # TanStack Query useQuery + useProfilesRealtime (channel unique)
│   │   ├── useCapsules.ts           # TanStack Query useQuery/useMutation + useCapsulesRealtime (channel unique)
│   │   └── useTickets.ts            # Re-export de useCapsules (backward compat)
│   ├── lib/
│   │   ├── queryClient.ts           # Config TanStack Query (staleTime 30s, gcTime 5min, retry 2)
│   │   └── supabase.ts              # Client Supabase + adaptateur AsyncStorage
│   ├── services/
│   │   ├── profiles.ts              # fetchProfile, fetchAllProfiles, updateProfilePseudo, updateProfileAvatar
│   │   ├── capsules.ts              # fetchActive/Pending/All, createCapsule, acceptCapsule (RPC), refuseCapsule, resolveCapsule (RPC)
│   │   └── tickets.ts               # Re-export de capsules.ts (backward compat)
│   ├── types/
│   │   └── index.ts                 # UserProfile, Capsule (creditor_id, debtor_id, drink_type, amount, reason, status, resolved_at), CapsuleTicket (compat)
│   └── utils/
│       └── karma.ts                 # calculateKarma + calculateKarmaForAll + calculateAltitude + calculateAltitudeForAll
├── app.json                         # Config Expo (dark mode, scheme "capsule", Supabase credentials, redirectUrl)
├── babel.config.js                  # babel-preset-expo + nativewind/babel
├── metro.config.js                  # Metro + withNativeWind
├── tailwind.config.js               # Tailwind v3 + preset nativewind + couleurs custom (space/neon/earth)
├── global.css                       # @tailwind base/components/utilities
├── tsconfig.json                    # extends expo/tsconfig.base, strict, ignoreDeprecations 6.0
├── eslint.config.js                 # eslint-config-expo/flat + no-unused-vars warn
├── nativewind-env.d.ts             # Triple-slash: nativewind/types + module "*.css"
└── context.md                       # Ce fichier
```

---

## Conventions de Code

- **Pas de commentaires** dans le code (règle AGENTS.md)
- **NativeWind v4 / Tailwind v3** (jamais Tailwind v4)
- **`useAuthContext()`** partout dans écrans. Jamais `useAuth()` directement hors `AuthProvider.tsx`
- **Mutations via TanStack Query** : `useMutation` + `onSuccess: invalidateQueries`. Jamais `useState` + `useEffect` pour fetch
- **Realtime** : hooks séparés `useCapsulesRealtime` + `useProfilesRealtime` appelés **une fois** dans `(tabs)/_layout.tsx`. Channels uniques (`capsules_realtime_${counter}`) + `channel.unsubscribe()` + `isMounted` ref pour Strict Mode
- **Sécurité** : transitions statut via RPC Supabase (`accept_capsule`, `resolve_capsule`), jamais updates directes
- **Styling** : NativeWind (`className="..."`), palette `space-*`, `neon-*`, `earth-*` dans `tailwind.config.js`. Cartoon : `border-2 border-black` + hard shadows inline
- **SafeArea** : `SafeAreaView` `edges={["top"]}` sur écrans. Tab bar height dynamique (`60 + insets.bottom`). Toasts utilisent `useSafeAreaInsets` pour `top`
- **useAuth** : ref `isMounted` pour éviter state updates post-unmount en Strict Mode. `getSession()` + `fetchProfile()` wrappés dans guards `isMounted.current`
- **Reanimated** : `cancelAnimation()` dans cleanup `useEffect` pour éviter animations orphelines en Strict Mode
- **Hard shadows** : inline styles `shadowOffset: {width: X, height: Y}, shadowOpacity: 1, shadowRadius: 0, elevation: N`

---

## Tableau de Suivi des Tâches

### Terminé

| Tâche | Description |
|---|---|
| Init projet | Expo Router, NativeWind v4, TypeScript, structure base |
| Types TS | `UserProfile`, `CapsuleTicket`, `Capsule`, `CapsuleStatus` |
| DB Supabase | Schéma SQL, triggers solde, RLS, Realtime |
| Sécurité RPC | `accept_capsule` / `resolve_capsule` (SECURITY DEFINER), trigger complet |
| Config Supabase | Client AsyncStorage, polyfill supprimé |
| Alignement SDK 57 | `expo ~57`, `react-native 0.86.3`, `react 19.2.3` |
| TanStack Query | Refactor `useCapsules` / `useProfiles`, cache partagé, invalidation Realtime |
| Jauge Gravitationnelle | Reanimated 4 + LinearGradient + expo-image |
| Lancer capsule | Formulaire sélection astronaute + motifs |
| Validation bilatérale | Accepter / Refuser via RPC |
| Décapsuler | Clôture via RPC + haptics + loading state |
| Loading states | `pendingActionId` anti double-tap + `ActivityIndicator` |
| Error Boundary | Fallback "Houston" + resetKey remount |
| Temps Réel | Realtime Supabase → invalidateQueries + toasts Houston |
| Deep linking | `scheme: "capsule"` + `emailRedirectTo` |
| Linter & Typecheck | `tsc --noEmit` 0 erreur, `eslint` 0 warning |
| Bugfix: Realtime channels double | Extraction hooks realtime appelés une fois dans `(tabs)/_layout.tsx` |
| Bugfix: useAuth promesses | Ref `isMounted` + try/catch |
| Bugfix: GravJauge transforms | Wrapper View positionnement, Animated.View transform |
| Bugfix: login nav post-signUp | Vérif `session` avant `router.replace` |
| Bugfix: useProfiles sans auth | `enabled: !!userId` |
| Bugfix: HoustonToast SafeArea | `useSafeAreaInsets` |
| Bugfix: ErrorBoundary recovery | `resetKey` forçant remount |
| Bugfix: GravJauge animations orphelines | `cancelAnimation()` cleanup |
| Bugfix: Tab bar masquée | `edgeToEdgeEnabled` + hauteur dynamique |
| Bugfix: Versions incompatibles | `npx expo install --fix` + `react-native-worklets@0.10.1` |
| Bouton Déconnexion | `signOut()` via `useAuthContext()`, redirect auto `/login` |
| Git & GitHub | Repo `github.com/amencio/capsule`, auth PAT |
| Refonte v2: Dashboard | Layout asymétrique, SpaceBackground, CapsuleLogo, ProfileSwitcher, LaunchModal |
| Refonte v2: Navigation | 4 tabs (Dashboard, Activité, Amis, Profil) |
| Refonte v2: Types | `Capsule` (creditor_id, debtor_id, drink_type, amount, reason, resolved_at) |
| Refonte v2: DB Migration 0003 | Rename tickets→capsules, new columns, status paid→resolved, new RPCs |
| Refonte v2: Services/Hooks | `services/capsules.ts` + `hooks/useCapsules.ts`. Old = re-exports |
| Pivot Altitude | `calculateAltitude()` = Σ(resolved où creditor). 0 = Terre. Active = carburant. Plus de négatif |
| Refonte v3: Cartoon | Bordures noires `border-2 border-black`, hard shadows, cartes blanches, bouton orange cartoon |
| Refonte v3: OrbitTrack | Ligne pointillée Terre→ISS, cosmonautes SVG avec photos dans visières, badges score blancs |
| Refonte v3: Mocks | 3 users (pravatar.cc), Thomas altitude 0, Léa 2, Camille 3 (leader) |

---

## Git & GitHub

- **Repo GitHub** : privé, `capsule`
- **Branche** : `main`
- **Auth** : GitHub CLI (`gh auth login`) ou PAT (scope `repo`)
- **Supabase credentials** : `anon key` dans `app.json` = clé publique (RLS protège), safe à commiter
- **Commit style** : Conventional Commits anglais (`feat:`, `fix:`, `refactor:`, `docs:`)

---

### À faire

| Tâche | Description | Priorité |
|---|---|---|
| Wire Supabase réel | Brancher `useCapsules(userId)` dans Dashboard, Activité, Amis (remplacer mocks) | Haute |
| Profil editing | Édition pseudo + upload avatar | Moyenne |
| Animations étoiles | Twinkle sur SpaceBackground | Basse |
| ISS animation | Déplacement lent ISS dans SpaceBackground | Basse |

---

## État Actuel (octobre 2026)

- **App fonctionnelle** avec mock data (`src/data/mocks.ts`). 4 tabs : Dashboard, Activité, Amis, Profil.
- **Style cartoon v3** : bordures noires, hard shadows, cartes blanches, cosmonautes SVG avec photos pravatar.cc dans visières.
- **Pivot Altitude** appliqué : score = Σ(resolved où creditor). 0 = Terre/Houston. Active = carburant. Plus de négatif.
- **DB Supabase migrée** : migration 0003 exécutée (table `capsules`, RPCs `accept_capsule`/`resolve_capsule`).
- **Hooks + services prêts** mais **pas encore branchés** aux écrans (mocks).
- **ProfileSwitcher** : dev-only, sera supprimé au wire Supabase.
- **Git** : repo `github.com/amencio/capsule`, branche `main`. Refonte v2 + v3 pas encore commitées.
