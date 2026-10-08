# Capsule — Contexte Projet

> **RÈGLE IMPÉRATIVE :** Toujours mettre à jour ce fichier (`context.md`) après toute ajout de fonctionnalité, modification d'architecture, nouvelle dépendance, ou changement important. Un agent IA reprenant ce projet doit trouver ici toutes les informations nécessaires.

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
| `expo` | `~57.0.0` | Framework principal (SDK 57) |
| `react-native` | `0.86.3` | Runtime natif |
| `react` | `19.2.3` | UI library |
| `expo-router` | `~57.0.0` | Navigation file-based |
| `nativewind` | `^4.2.7` | Tailwind CSS pour RN (v4, compatible Tailwind v3) |
| `tailwindcss` | `^3.4.17` | Styling utility-first |
| `react-native-reanimated` | `~4.5.1` | Animations 60fps (thread UI natif) |
| `react-native-worklets` | `0.10.1` | Dépendance Reanimated (thread JS worklets) |
| `@tanstack/react-query` | `^5.0.0` | Cache, déduplication, mutations, stale-while-revalidate |
| `@supabase/supabase-js` | `^2.109.0` | Client backend (auth, DB, realtime) |
| `expo-haptics` | `~57.0.0` | Retours haptiques (décapsulage, acceptation) |
| `expo-linear-gradient` | `~57.0.0` | Dégradés néon dans la jauge |
| `expo-image` | `~3.0.0` | Avatars performants |
| `lucide-react-native` | `^1.52.0` | Icônes tab bar |
| `typescript` | `~6.0.3` | Typage strict |

**Pas de support web.** Mobile-only (Expo Go). `react-dom`, `react-native-web`, `@expo/metro-runtime` sont volontairement absents.

---

## Vision et Concept

Capsule est une application mobile de suivi de dettes sociales de bar, pensée comme un jeu de rôle (RPG) spatial entre amis. Chaque verre dû est un "contrat social" unique avec son histoire et nécessite une validation bilatérale. Le nom "Capsule" fait le pont entre la capsule de bouteille et la capsule spatiale (mise en "orbite" des utilisateurs).

---

## Identité Visuelle et Lexique

- **Esthétique :** "Néon Bar" croisée avec le thème spatial. Mode sombre obligatoire (Espace profond / Noir mat) avec des accents vert néon éclatants (référence au Get 27).
- **Palette :** `#0D0D11` (fond), `#1A1A24` (surface), `#00FF66` (vert néon), `#FF3B30` (rouge gravité), `#FFD60A` (jaune alerte), `#00F0FF` (cyan info). Définie dans `src/constants/theme.ts` et `tailwind.config.js`.
- **Lexique :**
  - *Demander un verre :* Lancer une capsule
  - *Payer/Valider un verre :* Décapsuler
  - *La jauge d'état :* L'Orbite
  - *L'équilibre parfait (0 dette) :* Gravité Zéro
  - *Notifications :* Orientées "Houston, on a un problème" ou "Capsule en approche"

---

## Mécaniques de Base (Core Loop)

1. **La Demande :** L'utilisateur A réclame un verre à l'utilisateur B (motif obligatoire). Statut `pending`.
2. **La Validation :** B accepte ou refuse. Si accepté → statut `active`, le solde de A diminue de 1, celui de B augmente de 1.
3. **L'Ardoise (Le Frigo) :** Les verres validés s'affichent sous forme de cartes individuelles dans l'onglet Frigo.
4. **Le Paiement :** Clic sur "Décapsuler" → statut `paid`, le solde est reversé. Retour haptique de succès.

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
                    │  (tickets_realtime)│
                    └──────────────────┘
```

**Flux de données :**
1. Un écran appelle un hook (`useTickets`, `useProfiles`, `useAuthContext`)
2. Le hook utilise TanStack Query (`useQuery` pour lire, `useMutation` pour écrire)
3. Le service appelle Supabase (query directe ou RPC `SECURITY DEFINER`)
4. Une mutation réussie → `queryClient.invalidateQueries()` → refetch automatique
5. Un changement externe (autre utilisateur) → Supabase Realtime → channel → `invalidateQueries()` → UI rafraîchie

---

## Sécurité & Schéma DB

### Tables

| Table | Colonnes | RLS |
|---|---|---|
| `profiles` | `id` (UUID PK, FK auth.users), `pseudo` (unique), `avatar_url`, `solde_global` (int, default 0), `created_at` | SELECT par tous les authentifiés, UPDATE par le propriétaire |
| `tickets` | `id` (UUID PK), `from_user` (FK), `to_user` (FK), `motif` (text), `status` (`pending`/`active`/`paid`), `created_at`, `updated_at` | SELECT/INSERT/DELETE par participants uniquement |

### RPC (SECURITY DEFINER)

| Fonction | Règles |
|---|---|
| `accept_ticket(ticket_uuid)` | Vérifie `auth.uid() = to_user` ET `status = 'pending'` → passe à `active` |
| `pay_ticket(ticket_uuid)` | Vérifie `auth.uid() = from_user OR to_user` ET `status = 'active'` → passe à `paid` |

### Trigger : `recalculate_solde`

- **INSERT + status='active'** : `from_user -1`, `to_user +1`
- **UPDATE pending→active** : `from_user -1`, `to_user +1`
- **UPDATE active→paid** : `from_user +1`, `to_user -1`
- **UPDATE active→pending** (rollback) : `from_user +1`, `to_user -1`
- **UPDATE pending→paid** : **BLOQUÉ** (exception levée)
- **UPDATE paid→anything** : **BLOQUÉ** (exception levée)
- **DELETE + status='active'** : reverse le solde (`from_user +1`, `to_user -1`)
- **DELETE + status='pending'/'paid'** : aucun impact

### Auto-création de profil

Trigger `on_auth_user_created` : à l'inscription, crée automatiquement un profil dans `profiles` avec `pseudo` = métadonnée `pseudo` ou partie avant `@` de l'email.

---

## Composant UI Central : La Jauge Gravitationnelle

`src/components/GravJauge.tsx`

- Jauge verticale (20×80 NativeWind) sur l'écran d'accueil (Orbite)
- **Zone haute (Verte / Apesanteur) :** Solde positif → avatar flotte vers le haut + couronne 👑
- **Zone basse (Rouge / Gravité maximale) :** Solde négatif → avatar coule en bas + 💤
- **Solde = 0 :** Gravité Zéro, avatar centré, bordure cyan
- **Animation :** `react-native-reanimated` — `withSpring` pour la transition de position, `withRepeat` + `withSequence` + `withTiming` pour le flottement
- **Dégradé :** `expo-linear-gradient` vert→rouge sur toute la hauteur
- **Avatars :** `expo-image` si `avatar_url` présent, fallback sur la première lettre du pseudo
- **Clamp :** Solde borné entre -10 et +10 pour l'affichage

---

## Distribution

- **Dev :** Expo Go (gratuit, Play Store + App Store). `npx expo start` → partage du QR code / lien à ton ami.
- **Mise à jour OTA :** `eas update` publie le code JS sur les serveurs Expo Cloud → les téléphones récupèrent la MAJ au prochain lancement, sans PC allumé.
- **Backend :** Supabase Cloud (gratuit, hébergé, toujours disponible).
- **Deep linking :** `scheme: "capsule"` dans `app.json`. Les emails de confirmation redirigent vers `capsule://login`.

---

## Arborescence du Projet

```text
.
├── assets/                          # Assets visuels (icon, splash, adaptive icons)
├── supabase/
│   └── migrations/
│       ├── 0001_init.sql            # Schéma tables, triggers solde, RLS, Realtime
│       └── 0002_rpc_tickets.sql     # RPC sécurité (accept_ticket, pay_ticket) + trigger complet
├── src/
│   ├── app/                         # Expo Router screens
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx          # Onglets (Orbite, Frigo, Lancer) + Realtime hooks + tab bar dynamique
│   │   │   ├── index.tsx            # Écran Orbite (Jauge Gravitationnelle & stats + bouton Déconnexion) — edges={["top"]}
│   │   │   ├── frigo.tsx            # Écran Frigo (Ardoise + loading states + pendingActionId)
│   │   │   └── lancer.tsx           # Écran Lancer (Demande de capsule + vérif session post-signup)
│   │   ├── _layout.tsx              # Root layout : QueryClientProvider, AuthProvider, HoustonToastProvider, ErrorBoundary
│   │   └── login.tsx                # Auth (useAuthContext) + vérif session avant navigation
│   ├── components/
│   │   ├── CapsuleCard.tsx          # Carte ticket + actions (accepter/refuser/décapsuler) + isPending loader
│   │   ├── ErrorBoundary.tsx        # Error boundary global "Houston, on a un problème 🚨" + resetKey remount
│   │   └── GravJauge.tsx            # Jauge Reanimated + LinearGradient + expo-image + cancelAnimation cleanup
│   ├── constants/
│   │   └── theme.ts                 # Palette couleurs + labels statuts + couleurs statuts
│   ├── context/
│   │   ├── AuthProvider.tsx         # Context d'auth Supabase (useAuth wrapped)
│   │   └── HoustonToastContext.tsx  # Toasts animés (FadeInUp/FadeOutUp) — 4 niveaux + SafeAreaInsets
│   ├── hooks/
│   │   ├── useAuth.ts               # Auth Supabase : getSession, onAuthStateChange, isMounted ref pour Strict Mode
│   │   ├── useProfiles.ts           # TanStack Query useQuery + useProfilesRealtime (channel unique)
│   │   └── useTickets.ts            # TanStack Query useQuery/useMutation + useTicketsRealtime (channel unique)
│   ├── lib/
│   │   ├── queryClient.ts           # Config TanStack Query (staleTime 30s, gcTime 5min, retry 2)
│   │   └── supabase.ts              # Client Supabase + adaptateur AsyncStorage
│   ├── services/
│   │   ├── profiles.ts              # fetchProfile, fetchAllProfiles, updateProfilePseudo, updateProfileAvatar
│   │   └── tickets.ts               # fetchActive/Pending, createTicket, acceptTicket (RPC), refuseTicket, payTicket (RPC)
│   └── types/
│       └── index.ts                 # UserProfile, CapsuleTicket
├── app.json                         # Config Expo (dark mode, scheme "capsule", Supabase credentials, redirectUrl)
├── babel.config.js                  # babel-preset-expo + nativewind/babel
├── metro.config.js                  # Metro + withNativeWind
├── tailwind.config.js               # Tailwind v3 + preset nativewind + couleurs custom (space/neon)
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
- **`useAuthContext()`** partout dans les écrans. Ne jamais appeler `useAuth()` directement hors de `AuthProvider.tsx`
- **Mutations via TanStack Query** : `useMutation` + `onSuccess: invalidateQueries`. Ne jamais faire de `useState` + `useEffect` pour du fetch de données
- **Realtime** : hooks séparés `useTicketsRealtime` et `useProfilesRealtime` appelés **une seule fois** dans `(tabs)/_layout.tsx`. Noms de channels uniques (`tickets_realtime_${Date.now()}`) + `channel.unsubscribe()` + flag `isMounted` pour la compatibilité Strict Mode
- **Sécurité** : les transitions de statut passent par les RPC Supabase (`accept_ticket`, `pay_ticket`), jamais par des updates directes
- **Styling** : classes NativeWind (`className="..."`), couleurs via la palette `space-*` et `neon-*` définies dans `tailwind.config.js`
- **SafeArea** : `SafeAreaView` avec `edges={["top"]}` sur les écrans (le bottom est géré par la tab bar). Tab bar height dynamique (`60 + insets.bottom`). Toasts utilisent `useSafeAreaInsets` pour `top`
- **useAuth** : utilise un ref `isMounted` pour éviter les state updates après unmount en Strict Mode. `getSession()` et `fetchProfile()` sont wrappés dans des guards `isMounted.current`
- **Animations Reanimated** : `cancelAnimation()` dans le cleanup des `useEffect` pour éviter les animations orphelines en Strict Mode
- **Caveman mode** actif dans le chat (réponses terse, fragments OK, code/commits en anglais normal)

---

## Tableau de Suivi des Tâches

### Terminé

| Tâche | Description |
|---|---|
| Initialisation du projet | Expo Router, NativeWind v4, TypeScript, structure de base |
| Types TypeScript | `UserProfile`, `CapsuleTicket` |
| Base de données Supabase | Schéma SQL, triggers de solde, RLS, Realtime |
| Sécurité RPC | `accept_ticket` / `pay_ticket` (SECURITY DEFINER), trigger complet (DELETE + blocage transitions illégales) |
| Configuration Supabase | Client avec AsyncStorage, `react-native-url-polyfill` supprimé |
| Alignement SDK 57 | `expo ~57`, `react-native 0.86`, `react 19.2.3`, suppression web deps |
| TanStack Query | Refactor `useTickets` / `useProfiles`, cache partagé, invalidation Realtime |
| Jauge Gravitationnelle | Reanimated 4 + LinearGradient + expo-image |
| Lancer une capsule | Formulaire sélection astronaute + motifs prédéfinis |
| Validation bilatérale | Accepter / Refuser via RPC sécurisé |
| Le Frigo | Liste dynamique des tickets actifs et en attente |
| Décapsuler | Clôture via RPC + haptics + loading state |
| Loading states mutations | `pendingActionId` anti double-tap + `ActivityIndicator` |
| Error Boundary global | Fallback "Houston, on a un problème 🚨" + bouton restart |
| Temps Réel & Notifications | Realtime Supabase → invalidateQueries + toasts Houston animés |
| Deep linking auth | `scheme: "capsule"` + `emailRedirectTo` |
| Linter & Typecheck | `tsc --noEmit` 0 erreur, `eslint` 0 erreur 0 warning |
| Bugfix: Realtime channels en double | Extraction `useTicketsRealtime` / `useProfilesRealtime` appelés une seule fois dans `(tabs)/_layout.tsx`. Noms uniques + `channel.unsubscribe()` |
| Bugfix: useAuth promesses non catchées | Ref `isMounted` + try/catch sur `getSession()` et `fetchProfile()` dans `onAuthStateChange` |
| Bugfix: GravJauge conflit de transforms | Wrapper View pour positionnement, Animated.View pour transform uniquement |
| Bugfix: login navigation après signUp sans session | Vérification `session` avant `router.replace`, reset champs si pas de session |
| Bugfix: useProfiles sans auth | `enabled: !!userId` sur la query TanStack |
| Bugfix: HoustonToast hors SafeArea | `useSafeAreaInsets` pour `top: insets.top + 12` |
| Bugfix: ErrorBoundary recovery | `resetKey` incrémenté pour forcer le remontage des enfants |
| Bugfix: GravJauge animations orphelines (Strict Mode) | `cancelAnimation(translateY)` + `cancelAnimation(floatAnim)` dans le cleanup |
| Bugfix: Tab bar masquée par nav bar Samsung | `edgeToEdgeEnabled` + hauteur dynamique `60 + insets.bottom` + `edges={["top"]}` sur les écrans |
| Bugfix: Versions incompatibles SDK 57 | `npx expo install --fix` + `react-native-worklets@0.10.1` |
| Bouton Déconnexion | `signOut()` exposé via `useAuthContext()`, bouton Pressable en haut à droite de l'écran Orbite. Au tap → `supabase.auth.signOut()` → session supprimée → redirection auto vers `/login` via `_layout.tsx` |
| Git & GitHub | Repo initialisé, premier commit, `git push` configuré. Auth via GitHub CLI (`gh auth login`) ou Personal Access Token (PAT) |

---

## Git & GitHub

- **Repo GitHub** : privé, nommé `capsule`
- **Branche principale** : `main`
- **Authentification** : GitHub CLI (`gh auth login`) ou Personal Access Token (PAT, scope `repo`, expiration 90j)
- **Supabase credentials** : la `anon key` dans `app.json` est une clé publique (sécurité gérée par RLS Supabase), donc safe à commiter
- **Commit message style** : Conventional Commits en anglais (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`)

---

### À faire

| Tâche | Description | Priorité |
|---|---|---|
| — | Ajouter ici les futures tâches | — |
