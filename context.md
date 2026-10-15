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
#    - supabase/migrations/0004_double_validation.sql
#    - supabase/migrations/0005_cockpit_pivot.sql

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
| `react-native-reanimated` | `^4.5.1` | Animations 60fps (thread UI natif) |
| `react-native-worklets` | `0.10.1` | Dépendance Reanimated |
| `@tanstack/react-query` | `^5.0.0` | Cache, mutations, stale-while-revalidate |
| `@supabase/supabase-js` | `^2.109.0` | Client backend (auth, DB, realtime) |
| `expo-haptics` | `~57.0.0` | Retours haptiques |
| `expo-linear-gradient` | `~57.0.0` | Dégradés |
| `expo-image` | `~57.0.5` | Avatars performants |
| `lucide-react-native` | `^1.52.0` | Icônes (Fuel, Flame, Satellite, etc.) |
| `react-native-svg` | `^15.15.4` | SVG (cosmonautes, décor, logo, vaisseau) |
| `@react-native-async-storage/async-storage` | `~2.2.0` | Persistance mock state + session Supabase |
| `typescript` | `~6.0.3` | Typage strict |

**Pas de support web.** Mobile-only (Expo Go). `react-dom`, `react-native-web`, `@expo/metro-runtime` volontairement absents.

---

## Vision et Concept

Capsule = app mobile suivi dettes sociales de bar, RPG spatial entre amis. Chaque verre dû = "capsule" (jeu de mot capsule bouteille / capsule spatiale). L'UI de jeu se concentre sur UN seul écran principal — le Cockpit — soutenu par 3 modales d'action. La navigation générale (nav bar) reste inchangée.

---

## Architecture Actuelle — Dashboard Redesign + Modal Queue (octobre 2026)

### Écran principal : Le Cockpit (`src/app/(tabs)/index.tsx`)

Écran avec scroll vertical. Structure :

```
SafeAreaView (flex-1)
├── SpaceBackground (absolute)
├── ScrollView (flex-1)
│   ├── Header (CapsuleLogo + "CAPSULE" + ProfileSwitcher)
│   ├── UserStatusCard (compact: avatar + rank + FuelGauge)
│   ├── TrajectoryMap (parabolic curve: Earth → ISS, avatars positionnés)
│   ├── TableauBord (3 boutons: Demander / Allumage / Ravitailer + badge)
│   └── Modales (DemanderModal, AllumageModal, RavitaillementModal)
├── ModalQueueProvider (wrap AppContent)
│   ├── LaunchAlertModal (priority 0, zIndex 9999)
│   └── RavitaillementAlertModal (priority 1, zIndex 9998)
```

### 3 Modales d'Action (useState de visibilité, pas de navigation)

| Modale | Titre exact | Couleur | Fichier | Action |
|---|---|---|---|---|
| 1 | DEMANDER DU CARBURANT | Vert `#00FF66` | `DemanderModal.tsx` | Crée capsule `pending` avec `expires_at = now + 24h` |
| 2 | ALLUMAGE MOTEURS | Orange `#FF6B1A` | `AllumageModal.tsx` | Sélection carburant `active` → `launch_requested` + countdown forçage |
| 3 | RAVITAILLER LES AMIS | Dark `#1A1A24` | `RavitaillementModal.tsx` | Liste demandes `pending` reçues → FOURNIR (→`active`) ou REFUSER (→`rejected`) |
| Alert Launch | ALLUMAGE DEMANDÉ | Orange `#FF6B1A` | `LaunchAlertModal.tsx` | Overlay plein écran si `launch_requested` où user est débiteur. Swipe-to-confirm → `resolved` |
| Alert Ravit | DEMANDE DE RAVITAILLEMENT | Dark `#1A1A24` | `RavitaillementAlertModal.tsx` | Overlay plein écran si `pending` reçu. Swipe-to-confirm → `active` |

### Modal Queue System (`src/context/ModalQueueContext.tsx`)

File de priorité pour les modales alerte :
- **Priority 0** : `LaunchAlertModal` (launch_requested entrant) — zIndex 9999, timer auto
- **Priority 1** : `RavitaillementAlertModal` (pending reçu) — zIndex 9998, deferrable
- `"Plus tard"` = dismiss permanent de la queue (accessible via bouton manuel + badge)
- `AllumageModal` peut être interrompu par une alerte (l'alerte s'affiche par-dessus)
- `dismissedIds` : Set d'IDs dismissés, empêche le ré-affichage auto

---

## Logique Métier & Cycle de Vie des Capsules

### Statuts (6 au total)

| Statut | Signification | Effet |
|---|---|---|
| `pending` | Demande envoyée, en attente du débiteur | Visible dans Modale 3 du débiteur ; expire après 24h |
| `active` | Dette validée ("FOURNIR") | +1 réservoir du créditeur (max 5/5) |
| `launch_requested` | Mise à feu demandée | Modale plein écran chez le débiteur ; retombe en `active` après 1h |
| `resolved` | Verre bu (validé OU forcé) | +1 altitude créditeur, -1 réservoir ; marqueur `validated` ou `forced` |
| `rejected` | Demande refusée | Disparaît des listes ; notification au créditeur |
| `expired` | Demande expirée (24h sans réponse) | Disparaît des listes ; notification au créditeur |

### Rôles

- **CRÉDITEUR** : celui à qui l'on doit le verre (il demande, il consomme, il monte en altitude).
- **DÉBITEUR** : celui qui doit le verre (il ravitaille, il valide l'allumage).

### Règles de Score

- **Altitude** = Σ(capsules où `creditor_id = userId` ET `status = 'resolved'`). Cumulatif, jamais négatif. 0 = Terre.
- **Réservoir (Tank)** = Σ(capsules où `creditor_id = userId` ET `status = 'active'`). Plafonné à `TANK_MAX_CAPACITY = 5`.
- **Carburant en combustion** = Σ(capsules où `creditor_id = userId` ET `status = 'launch_requested'`).
- `amount` hardcoded à 1 partout (plus de sélecteur de quantité — champ conservé en DB/types pour compat).
- Seule la consommation réelle (passage en `resolved`) fait monter sur le leaderboard.

### Constantes Centralisées (`src/constants/game.ts`)

```ts
TANK_MAX_CAPACITY = 5
PENDING_EXPIRY_HOURS = 24
FORCE_IGNITION_DELAY_MINUTES = 3
LAUNCH_TIMEOUT_HOURS = 1
```

Toutes les durées sont des constantes, jamais de valeurs en dur disséminées.

### Temps, Expiration, Retombée

- **Expiration pending (24h)** : `handleExpiryCheck()` au mount du Cockpit + à l'ouverture des modales. `pending` → `expired` + toast créditeur.
- **Forçage allumage (3 min)** : bouton de forçage inactif pendant 3 min après `launch_requested`. Countdown visible. Confirmation obligatoire. Marqueur `forced` (distinct de `validated`).
- **Retombée allumage (1h)** : `handleLaunchTimeoutCheck()` au mount. `launch_requested` → `active` (retombée) + toast créditeur. Aucune donnée perdue.

### Notifications (HoustonToast)

| Événement | Type toast | Message |
|---|---|---|
| Refus | `danger` | "🚫 [Débiteur] a refusé de te ravitailler ([Boisson])." |
| Expiration | `warning` | "⏳ Ta demande à [Débiteur] a expiré sans réponse." |
| Retombée | `warning` | "🔥 Ta mise à feu n'a pas abouti : le carburant est retourné dans ton réservoir." |
| Allumage forcé | `warning` | "🔥 Allumage forcé — carburant consommé sans validation de [Débiteur]." |

---

## Persistance Mock State

L'app tourne sur mock data persistée via AsyncStorage :
- **Key** : `"capsule_mock_state"` dans `CapsuleProvider.tsx`
- **Au mount** : `AsyncStorage.getItem` → si trouvé, `JSON.parse` → `setCapsules(parsed)`. Sinon → `MOCK_CAPSULES`.
- **À chaque mutation** : `updateCapsules(next)` fait `setCapsules(next)` directement (next calculé hors updater). AsyncStorage persist via `useEffect` sur `capsules` (skip premier render).
- **capsulesRef** : ref qui track le dernier état pour lecture synchrone dans les handlers (évite les side effects dans les state updaters).
- **hydrated flag** : empêche les checks d'expiration/retombée de tourner avant chargement AsyncStorage.
- Quand l'app passera en Supabase réel, ce cache sera ignoré.

---

## Schéma DB (Supabase)

### Tables

| Table | Colonnes | RLS |
|---|---|---|
| `profiles` | `id` (UUID PK, FK auth.users), `pseudo` (unique), `avatar_url`, `solde_global` (int, default 0), `created_at` | SELECT tous authentifiés, UPDATE propriétaire |
| `capsules` | `id`, `creditor_id`, `debtor_id`, `drink_type`, `amount`, `reason`, `status` (`pending`/`active`/`launch_requested`/`resolved`/`rejected`/`expired`), `created_at`, `resolved_at`, `expires_at`, `launch_requested_at`, `resolution` (`validated`/`forced`/`null`) | SELECT/INSERT/DELETE participants uniquement |

### Migrations SQL

| Migration | Description |
|---|---|
| 0001_init.sql | Schéma initial (tickets), triggers solde, RLS, Realtime |
| 0002_rpc_tickets.sql | RPC sécurité (accept_ticket, pay_ticket) |
| 0003_refonte_capsules.sql | Rename tickets→capsules, add drink_type/amount/resolved_at, status paid→resolved |
| 0004_double_validation.sql | Add `pending_launch` status, RPCs `request_launch`/`authorize_launch` |
| 0005_cockpit_pivot.sql | Rename `pending_launch`→`launch_requested`, add `rejected`/`expired` statuses, add `expires_at`/`launch_requested_at`/`resolution` columns, RPCs `force_launch`/`refuse_capsule`, trigger updated |

### RPC (SECURITY DEFINER)

| Fonction | Règles |
|---|---|
| `accept_capsule(capsule_uuid)` | Debtor only, `pending`→`active` |
| `refuse_capsule(capsule_uuid)` | Debtor only, `pending`→`rejected` |
| `request_launch(capsule_uuid)` | Creditor only, `active`→`launch_requested`, set `launch_requested_at = now()` |
| `authorize_launch(capsule_uuid)` | Debtor only, `launch_requested`→`resolved`, `resolution = 'validated'` |
| `force_launch(capsule_uuid)` | Creditor only, `launch_requested`→`resolved`, `resolution = 'forced'` |

---

## Architecture & Data Flow

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐     ┌──────────────────┐
│   Écran      │────▶│  CapsuleProvider  │────▶│  Service    │────▶│  Supabase        │
│  (app/)      │     │  (context/)       │     │  (services/) │     │  RPC / Query     │
│              │◀────│  useState +       │◀────│              │◀────│                  │
└─────────────┘     │  AsyncStorage      │     └─────────────┘     └──────┬───────────┘
                     └────────┬─────────┘                                 │ Trigger
                              │ useMemo (derived)                          ▼
                              ▼                                   ┌──────────────────┐
                     ┌──────────────────┐                        │  recalcul solde  │
                     │  Listes filtrées   │                        │  (auto DB)       │
                     │  + métriques       │                        └──────────────────┘
                     └──────────────────┘
```

**État actuel** : `CapsuleProvider` utilise mock data + AsyncStorage. Hooks/services Supabase prêts mais pas encore branchés aux écrans.

---

## Composants UI

| Composant | Fichier | Description |
|---|---|---|
| `SpaceBackground` | `SpaceBackground.tsx` | Dégradé `#1a233a→#0d111a` + étoiles SVG (Terre retirée, gérée par TrajectoryMap) |
| `CapsuleLogo` | `CapsuleLogo.tsx` | Logo hybride capsule/vaisseau SVG |
| `TrajectoryMap` | `TrajectoryMap.tsx` | Carte trajectoire parabolique (courbe bézier quadratique). Earth + ISS SVG, avatars positionnés sur courbe, dots rangs. Clustering vertical anti-chevauchement. |
| `UserStatusCard` | `UserStatusCard.tsx` | Carte compacte : avatar + pseudo + rank + FuelGauge + statut carburant |
| `FuelGauge` | `FuelGauge.tsx` | Jauge carburant horizontale 5 segments (flex-1 min-w-0, pas de minWidth) |
| `TableauBord` | `TableauBord.tsx` | 3 boutons (vert/orange/dark) + badge + icônes Lucide |
| `SwipeToConfirm` | `SwipeToConfirm.tsx` | Widget slide-to-unlock. `PanResponder` natif RN. |
| `LaunchAlertModal` | `LaunchAlertModal.tsx` | Overlay orange `#FF6B1A` plein écran + SwipeToConfirm + overlay "Validé ✅". Split outer/inner. |
| `RavitaillementAlertModal` | `RavitaillementAlertModal.tsx` | Overlay dark `#1A1A24` plein écran + SwipeToConfirm + boutons Refuser/Plus tard. Queue-aware. |
| `DemanderModal` | `DemanderModal.tsx` | Modale 1 (vert) : ami + boisson + motif. Dark theme. |
| `AllumageModal` | `AllumageModal.tsx` | Modale 2 (orange) : liste carburant `active` + `launch_requested` + countdown forçage. Dark theme. |
| `RavitaillementModal` | `RavitaillementModal.tsx` | Modale 3 (dark) : demandes `pending` reçues + FOURNIR/REFUSER + timer. Dark theme. |
| `CapsuleCard` | `CapsuleCard.tsx` | Carte activité (dark theme). 3 modes : creditor, debtor, observer (double avatar). Badges colorés, phrases contextuelles, boutons si impliqué. |
| `ProfileSwitcher` | `ProfileSwitcher.tsx` | Dropdown dev-only "Vue de : [User]" |
| `ErrorBoundary` | `ErrorBoundary.tsx` | Error boundary global |

### Système de Couleurs Unifié (`src/constants/theme.ts`)

**Palettes :** `COLORS.space.*` (fonds dark), `COLORS.neon.*` (actions), `COLORS.earth.*` (décor).

**`ACTION_COLORS`** — une couleur par concept, utilisé partout (badges, boutons, textes) :

| Concept | Couleur | Hex |
|---|---|---|
| Ravitaillement / Carburant | Vert neon | `#00FF66` |
| Mise à feu / Allumage | Orange neon | `#FF6B1A` |
| Refus / Destructif | Rouge neon | `#FF3B30` |
| En attente / Timer | Jaune neon | `#FFD60A` |
| Résolu / Décollé | Cyan neon | `#00F0FF` |
| Expiré | Gris | `#9ca3af` |

**`ROLE_COLORS`** :

| Rôle | Couleur | Hex |
|---|---|---|
| Current user | Cyan | `#00F0FF` |
| Creditor | Vert | `#00FF66` |
| Debtor | Orange | `#FF6B1A` |

**Règle :** Plus de couleurs `cartoon.*` (ancien thème clair). Tout est `neon.*` sur fond `space.*`.

### Design System Dark

- **Fonds** : `#0D0D11` (deep), `#1a1a24` (surface), `#22222E` (card), `#2E2E3A` (border)
- **Bordures** : `border-2 border-[#2E2E3A]` (ou `border` pour subtil)
- **Boutons** : bordure couleur neon + fond translucide (`bg-[#color]/15`), texte couleur neon. Boutons primaires : fond plein.
- **Cartes** : fond `#1a1a24`, texte `text-white`, sous-texte `text-white/40`
- **Hard shadows** : retirés (invisibles sur dark)

---

## Navigation

```
/ (root)
    ├── _layout.tsx          → Stack navigator, headerShown: false
    │                          QueryClientProvider → AuthProvider → HoustonToastProvider → ErrorBoundary → SafeAreaProvider
    │
    ├── login.tsx            → Login/Register screen
    │
    └── (tabs)/
        ├── _layout.tsx       → Tabs (Dashboard, Activité, Amis, Profil) — mémoïsé via memo()
        │                       CapsuleProvider wrapper (pas de realtime hooks en mode mock)
    │
    ├── index.tsx         → Cockpit (UserStatusCard + TrajectoryMap + TableauBord + modales)
    ├── activite.tsx      → Historique + toggle scope (Mes activités/Amis) + 5 filtres (Ravitaillement, Carburant, Mise à feu, Terminées)
    ├── amis.tsx          → Classement par altitude (dark theme)
    └── profil.tsx        → Avatar, stats (altitude, tankLevel, capsules), karma, déconnexion (dark theme)
```

---

## Arborescence du Projet

```text
.
├── supabase/migrations/
│   ├── 0001_init.sql
│   ├── 0002_rpc_tickets.sql
│   ├── 0003_refonte_capsules.sql
│   ├── 0004_double_validation.sql
│   └── 0005_cockpit_pivot.sql          # Cockpit pivot : launch_requested, rejected, expired, force_launch, refuse_capsule
├── src/
│   ├── app/
    │   │   ├── (tabs)/
    │   │   │   ├── _layout.tsx              # Tabs (memoized) + CapsuleProvider
    │   │   │   ├── index.tsx                # Cockpit (Radar + CapsuleShip + TableauBord + 4 overlays)
    │   │   │   ├── activite.tsx             # Historique + filtres (7 statuts)
    │   │   │   ├── amis.tsx                 # Classement altitude
    │   │   │   └── profil.tsx               # Profil (altitude, tankLevel, karma, rank)
│   │   ├── _layout.tsx                  # Root: QueryClient → Auth → HoustonToast → ErrorBoundary → SafeArea
│   │   └── login.tsx
    │   ├── components/
    │   │   ├── CapsuleLogo.tsx
    │   │   ├── TrajectoryMap.tsx             # Courbe parabolique Earth→ISS, avatars, clustering anti-chevauchement
    │   │   ├── UserStatusCard.tsx            # Carte compacte user (avatar + rank + FuelGauge)
    │   │   ├── FuelGauge.tsx                 # Jauge 5 segments horizontale (flex-1 min-w-0)
    │   │   ├── CapsuleCard.tsx              # Carte activité (3 modes: creditor/debtor/observer, dark theme)
    │   │   ├── DemanderModal.tsx            # Modale 1 : DEMANDER DU CARBURANT (dark theme)
    │   │   ├── AllumageModal.tsx            # Modale 2 : ALLUMAGE MOTEURS (dark theme + countdown)
    │   │   ├── RavitaillementModal.tsx      # Modale 3 : RAVITAILLER LES AMIS (dark theme)
    │   │   ├── RavitaillementAlertModal.tsx # Alert overlay : DEMANDE DE RAVITAILLEMENT (swipe-to-confirm, queue-aware)
    │   │   ├── LaunchAlertModal.tsx         # Alert overlay : ALLUMAGE DEMANDÉ (swipe-to-confirm, split outer/inner)
    │   │   ├── SwipeToConfirm.tsx           # Widget slide-to-unlock (PanResponder natif RN)
    │   │   ├── TableauBord.tsx              # 3 boutons (vert/orange/dark) + badge
    │   │   ├── ProfileSwitcher.tsx
    │   │   ├── SpaceBackground.tsx          # Dégradé + étoiles (Terre retirée)
    │   │   └── ErrorBoundary.tsx
    │   ├── context/
    │   │   ├── AuthProvider.tsx
    │   │   ├── CapsuleProvider.tsx          # Mock store + AsyncStorage + handlers + allUserCapsules + allFriendsCapsules
    │   │   ├── ModalQueueContext.tsx        # File priorité alertes (launch > ravitaillement, dismissedIds)
    │   │   └── HoustonToastContext.tsx
│   ├── data/
│   │   └── mocks.ts                     # 3 users, 13 capsules (pending/active/launch_requested/resolved/rejected/expired)
    │   ├── hooks/
    │   │   ├── useAuth.ts
    │   │   ├── useCapsules.ts               # TanStack Query (prêt pour Supabase, non branché en mode mock)
    │   │   └── useProfiles.ts
│   ├── lib/
│   │   ├── queryClient.ts
│   │   └── supabase.ts
│   ├── services/
│   │   └── capsules.ts                  # fetchActive/Pending/All, createCapsule (expires_at), acceptCapsule, refuseCapsule (RPC), requestLaunch, authorizeLaunch, forceLaunch
│   ├── types/
│   │   └── index.ts                     # CapsuleStatus (6), CapsuleResolution, Capsule (+expires_at, launch_requested_at, resolution)
│   └── utils/
│       ├── karma.ts                     # calculateAltitude, calculateKarma
│       ├── ranks.ts                     # OrbitalRank, getRank, getNextRank, getProgressToNext
│       └── capsule.ts                   # formatTimeRemaining, formatCountdown, isExpired, isLaunchTimedOut, canForceLaunch, getSecondsUntilForce, getSecondsUntilFallback, computeExpiresAt
├── app.json
├── babel.config.js
├── metro.config.js
├── tailwind.config.js
├── global.css
├── tsconfig.json
├── eslint.config.js
├── nativewind-env.d.ts
└── context.md
```

---

## Conventions de Code

- **Pas de commentaires** dans le code (règle AGENTS.md)
- **NativeWind v4 / Tailwind v3** (jamais Tailwind v4)
- **`useCapsuleStore()`** pour accès données. `useAuthContext()` pour auth.
- **Modales pilotées par `useState` de visibilité** — aucune navigation expo-router pour ouvrir/fermer les modales
- **Pas de `<Modal>` RN** — les modales sont des overlays `<View style={absoluteFill}>` + animation Reanimated (slide up / fade in). Sur Fabric (RN 0.86), `<Modal>` RN ne propage pas les React Contexts → crash `NavigationStateContext`. Voir Bug History.
- **Pas de `GestureHandlerRootView`** — `SwipeToConfirm` utilise `PanResponder` natif. `react-native-gesture-handler` retiré du projet.
- **`<Tabs>` mémoïsé** dans `_layout.tsx` — `memo(TabsContent)` empêche `CapsuleProvider` de re-render le navigator (qui accède `NavigationStateContext` via `useNavigationBuilder`). Les screens re-render via `CapsuleStoreContext` (React Context) indépendamment.
- **Side effects hors `setCapsules`** — `CapsuleProvider` utilise `capsulesRef` pour lire l'état courant, calcule le next state en dehors du updater, appelle `setCapsules(next)` directement. AsyncStorage persist via `useEffect` sur `capsules`. Toasts appelés avant `setCapsules`, jamais dedans.
- **Titres des modales utilisent EXACTEMENT** les termes du cahier des charges
- **Header et Bottom Nav impérativement en `w-full`**
- **`GestureHandlerRootView`** : JAMAIS dans l'app. Retiré entièrement. `SwipeToConfirm` utilise `PanResponder`.
- **Constantes de durée** centralisées dans `src/constants/game.ts` — jamais de valeurs en dur
- **Mutations via TanStack Query** : `useMutation` + `onSuccess: invalidateQueries`
- **Realtime** : hooks appelés une fois dans `(tabs)/_layout.tsx`. Channels uniques + `isMounted` ref
- **Styling** : NativeWind `className="..."`, palette `space-*`, `neon-*`, `earth-*`. Dark theme partout. `ACTION_COLORS` et `ROLE_COLORS` pour cohérence des couleurs.
- **SafeArea** : `SafeAreaView` `edges={["top"]}` sur écrans
- **Reanimated** : `cancelAnimation()` dans cleanup `useEffect`
- **Selected capsule pattern** : stocker l'ID dans le state, dériver l'objet capsule depuis les props/store (évite les snapshots stale)
- **`eslint-disable`** pour `react-hooks/set-state-in-effect` quand le setState dans un useEffect est légitime (mount-time checks, auto-open modales)
- **`eslint-disable`** pour `react-hooks/immutability` sur les `sharedValue.value =` dans `useEffect` (Reanimated)
- **`LogBox.ignoreLogs`** pour les warnings dev-only connus (HMR Expo CLI, etc.) dans `src/app/_layout.tsx`
- **Commit style** : Conventional Commits anglais (`feat:`, `fix:`, `refactor:`, `docs:`)

---

## Tableau de Suivi des Tâches

### Terminé

| Tâche | Description |
|---|---|
| Init projet | Expo Router, NativeWind v4, TypeScript |
| Types TS | `UserProfile`, `Capsule` (6 statuts, expires_at, launch_requested_at, resolution) |
| DB Supabase | 5 migrations SQL, triggers solde, RLS, Realtime |
| Sécurité RPC | `accept_capsule`, `refuse_capsule`, `request_launch`, `authorize_launch`, `force_launch` (SECURITY DEFINER) |
| TanStack Query | `useCapsules` / `useProfiles` avec mutations + invalidation |
| Cockpit Screen | Header w-full + Radar 1/3 + CapsuleShip 2/3 + TableauBord 3 boutons |
| 3 Modales | DemanderModal (vert), AllumageModal (rouge + countdown), RavitaillementModal (bleu + badge) |
| LaunchAlertModal | Modale rouge plein écran + SwipeToConfirm + overlay "Validé ✅" |
| SwipeToConfirm | Widget slide-to-unlock avec react-native-gesture-handler Gesture.Pan() |
| Constantes game.ts | TANK_MAX_CAPACITY=5, PENDING_EXPIRY_HOURS=24, FORCE_IGNITION_DELAY_MINUTES=3, LAUNCH_TIMEOUT_HOURS=1 |
| Expiration 24h | `handleExpiryCheck()` au mount + à l'ouverture modales |
| Retombée 1h | `handleLaunchTimeoutCheck()` au mount |
| Forçage 3 min | Countdown visible + bouton inactif pendant délai + confirmation obligatoire |
| Marqueur resolution | `validated` vs `forced` pour tracer l'historique |
| Notifications | HoustonToast : refus, expiration, retombée, allumage forcé |
| Persistance mock | AsyncStorage `capsule_mock_state` + hydrated flag |
| Mocks | 13 capsules couvrant tous les statuts, timestamps relatifs |
| Bugfix: GestureHandlerRootView root | Retiré du root (interrompait NavigationStateContext → crash dans Modals) |
| Bugfix: selectedCapsule stale | Stocker ID au lieu de snapshot objet → dériver depuis props |
| Bugfix: myFuelCapsules launch_requested | Inclure `launch_requested` dans la liste (pas seulement `active`) |
| Bugfix: allumageDisabled | Basé sur `myFuelCapsules.length` (inclut launch_requested) |
| Bugfix: LaunchAlertModal dead code | Overlay `justResolved` dupliqué supprimé |
| Bugfix: CapsuleShip SVG fill | `fill="url(#visorClip)"` invalide → `fill="rgba(0,0,0,0.3)"` |
| Bugfix: AllumageModal prop inutilisée | `currentUserId` retiré de l'interface |
| Bugfix: Mock state reset au reload | AsyncStorage persistence dans CapsuleProvider |
| Bugfix: LaunchAlertModal re-s'ouvre | `justResolved` early return avant `!currentRequest` |
| Linter & Typecheck | `tsc --noEmit` 0 erreur, `eslint` 0 erreur/warning |

### Bug History — NavigationStateContext Crash (Fabric / RN 0.86 / React 19)

Le bug le plus tenace du projet : crash `NavigationStateContext` ("Couldn't find a navigation context") dans `AllumageModal` lors de la sélection de carburant à brûler. Plusieurs tentatives de fix, chacune résolvant une partie du problème :

| # | Hypothèse | Fix appliqué | Résultat |
|---|---|---|---|
| 1 | `GestureHandlerRootView` au root casse le contexte | Retiré du root `_layout.tsx` | Crash persiste |
| 2 | `GestureHandlerRootView` dans `<Modal>` de LaunchAlertModal interfère | Retiré de LaunchAlertModal + `if (!visible) return null` | Crash persiste |
| 3 | `Gesture.Pan()` de `react-native-gesture-handler` interfere | Remplacé par `PanResponder` natif RN dans `SwipeToConfirm` | Crash persiste |
| 4 | `<Modal>` RN ne propage pas les React Contexts sur Fabric (New Architecture) | Remplacé les 4 `<Modal>` par overlays `<View style={absoluteFill}>` + animation Reanimated (slide up / fade in) | Crash persiste |
| 5 | Overlays sans `zIndex` → dashboard visible derrière | Ajout `zIndex: 500` (actions) et `zIndex: 9999` (LaunchAlert) | Affichage corrigé mais crash persiste |
| 6 | `LaunchAlertModal` hooks Reanimated tournent même quand `visible=false` | Split en outer (gère `visible`) + inner (hooks Reanimated). Outer retourne `null` si pas visible | Crash persiste |
| 7 | `if (!visible) return null` insuffisant sur `AllumageModal` (crash quand visible) | Ajouté sur les 4 modales | Pas suffisant |
| 8 | `CapsuleProvider` state change → `<Tabs>` navigator re-render → `useNavigationBuilder` accède `NavigationStateContext` | `memo(TabsContent)` dans `_layout.tsx` | Crash persiste |
| 9 | Side effects dans les `setCapsules` updaters → React Compiler | Refactor `CapsuleProvider` : `capsulesRef` + `updateCapsules(next)` + AsyncStorage via `useEffect` | Crash persiste |
| 10 | `CapsuleProvider` inside navigator → re-render cascade | Déplacé `CapsuleProvider` au root `_layout.tsx` + `memo(AppContent)` | Crash persiste |
| 11 | **ROOT CAUSE** : NativeWind v4 `react-native-css-interop` `printUpgradeWarning()` → `stringify()` → `Object.entries()` traverse tous les objets → tombe sur `NavigationStateContext` getter `getKey` qui throw. Déclenché quand des styles `active:` (pseudo-classes) sont ajoutés **dynamiquement** à un `<Pressable>` après le render initial (ex: bouton "DEMANDER LA MISE À FEU" qui passe de `bg-[#f97316]/20` à `bg-[#f97316] shadow-[...] active:shadow-[...] active:translate-y-0.5` quand capsule sélectionnée). | Déplacer les `active:` styles **hors du conditionnel** — toujours présents dès le render initial, seules les couleurs/shadows statiques changent | **Fix appliqué** |

**ROOT CAUSE DÉFINITIVE (fix #11) :** Le crash `NavigationStateContext` n'avait **rien à voir** avec la navigation, Fabric, les `<Modal>`, ou `CapsuleProvider`. C'était un bug de NativeWind v4 (`react-native-css-interop` 0.2.7) : quand des pseudo-classes CSS (`active:`, `hover:`, etc.) sont ajoutées dynamiquement à un composant après son render initial, NativeWind déclenche un "upgrade warning" pour alerter que le composant va être remounté. Pour générer le message de warning, il sérialise (`JSON.stringify` avec replacer récursif) les props du composant. Ce sérialiseur traverse tous les objets accessibles, y compris les context React qui ont des getters qui throw par défaut (comme `NavigationStateContext.getKey`).

**Leçons apprises :**
- **NativeWind v4 + pseudo-classes dynamiques = crash** : Ne JAMAIS ajouter des styles `active:`, `hover:`, `focus:` dynamiquement (via conditionnel) après le render initial. Toujours les inclure dans le className de base. Seules les couleurs et shadows statiques peuvent être conditionnels.
- Sur Fabric (RN 0.86+), `<Modal>` RN ne propage pas les React Contexts comme sur l'ancienne architecture (Bridge). Préférer des overlays `<View>` absolus.
- `GestureHandlerRootView` appelle `maybeInitializeFabric()` → `RNGestureHandlerModule.install()` qui peut interférer avec la propagation de contexte. Éviter si pas nécessaire.
- Les side effects dans les state updaters (`setX((prev) => { sideEffect(); return next; })`) sont interdits par React 19 / React Compiler. Toujours calculer le next state en dehors, puis appeler `setX(next)` directement.
- `PanResponder` (RN natif) est suffisant pour un swipe-to-unlock simple. `react-native-gesture-handler` apporte des complications non nécessaires.
- `memo()` sur les navigators (Tabs, Stack) est une bonne pratique pour éviter les re-renders cascade depuis les providers.

**Fichiers supprimés pendant le debug :**
- `FuelGauge.tsx` (dead code — orphelin, plus importé)
- `useTickets.ts` (dead code — alias non utilisé)
- `react-native-gesture-handler` retiré de `package.json`

**Fichiers modifiés pendant le debug :**
- `_layout.tsx` (tabs) : retrait realtime hooks + retrait `useAuthContext`. Simple `<Tabs>` sans CapsuleProvider.
- `_layout.tsx` (root) : `CapsuleProvider` déplacé ici (au-dessus de `AppContent`). `memo(AppContent)` pour bloquer re-render cascade vers navigators.
- `CapsuleProvider.tsx` : `capsulesRef` + `updateCapsules` + AsyncStorage via `useEffect` + toasts hors updaters
- `AllumageModal.tsx` : `<Modal>` → overlay `<View>` + animation slide + `if (!visible) return null` + `zIndex: 500`
- `DemanderModal.tsx` : `<Modal>` → overlay `<View>` + animation slide + `if (!visible) return null` + `zIndex: 500`
- `RavitaillementModal.tsx` : `<Modal>` → overlay `<View>` + animation slide + `if (!visible) return null` + `zIndex: 500`
- `LaunchAlertModal.tsx` : `<Modal>` → overlay `<Animated.View>` + animation fade + split outer/inner + `zIndex: 9999`
- `SwipeToConfirm.tsx` : `Gesture.Pan()` → `PanResponder` natif RN
- `index.tsx` (tabs) : retrait `GestureHandlerRootView` wrapper
- `package.json` : retrait `react-native-gesture-handler`

### À faire

| Tâche | Description | Priorité |
|---|---|---|
| Wire Supabase réel | Brancher `useCapsules(userId)` dans les écrans (remplacer mocks) | Haute |
| Profil editing | Édition pseudo + upload avatar | Moyenne |
| Animations étoiles | Twinkle sur SpaceBackground | Basse |
| ISS animation | Déplacement lent ISS dans SpaceBackground | Basse |
| Animations au passage resolved | Flammes sur le Radar + montée d'avatar | Moyenne |
| Vérifier fix NavigationStateContext | Tester fix NativeWind `active:` styles dynamiques sur device | Haute |

---

## Git & GitHub

- **Repo GitHub** : privé, `capsule`
- **Branche active** : `feat/activite-redesign`
- **Auth** : GitHub CLI (`gh auth login`) ou PAT (scope `repo`)
- **Supabase credentials** : `anon key` dans `app.json` = clé publique (RLS protège), safe à commiter
- **Commit style** : Conventional Commits anglais (`feat:`, `fix:`, `refactor:`, `docs:`)

---

## État Actuel (octobre 2026)

- **App fonctionnelle** avec mock data persistée via AsyncStorage.
- **Dashboard redesigné** : UserStatusCard + TrajectoryMap (courbe parabolique) + TableauBord. Layout vertical.
- **Modal Queue** : file de priorité pour alertes (launch > ravitaillement). `ModalQueueContext` wrapper dans `_layout.tsx`.
- **Onglet Activité refondu** : dark theme, toggle scope (Mes activités / Amis), 5 filtres (Ravitaillement, Carburant, Mise à feu, Terminées). CapsuleCard 3 modes (creditor/debtor/observer avec double avatar).
- **Système de couleurs unifié** : `ACTION_COLORS` + `ROLE_COLORS` dans `theme.ts`. Palette neon sur fond space. Plus de couleurs cartoon.
- **Quantité retirée** : `amount` hardcoded à 1, plus de sélecteur UI.
- **6 statuts de capsule** : `pending`, `active`, `launch_requested`, `resolved`, `rejected`, `expired`.
- **Système de temps complet** : expiration 24h, forçage 3 min, retombée 1h.
- **Swipe-to-confirm** fonctionnel (PanResponder natif).
- **Modales** : overlays `<View>` absolus + animation Reanimated. Pas de `<Modal>` RN.
- **DB Supabase migrée** mais hooks/services pas encore branchés (mocks).
- **Lint + typecheck** : 0 erreur, 0 warning.
