# Capsule

App mobile suivi dettes sociales de bar, RPG spatial entre amis. Chaque verre dû = "capsule" (jeu de mot capsule bouteille / capsule spatiale).

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
npx tsc --noEmit    # Typecheck
npx expo lint        # ESLint
```

## Stack

- **Expo SDK 57** / React Native 0.86 / React 19
- **Expo Router** (file-based navigation)
- **NativeWind v4** / Tailwind CSS v3
- **Reanimated v4** (animations)
- **TanStack Query** (cache, mutations)
- **Supabase** (auth, DB, realtime)
- **AsyncStorage** (mock state persistence)

## Concept

L'UI de jeu se concentre sur un seul écran — le **Cockpit** — soutenu par 3 modales d'action + 1 modale alerte. Pas de scroll, pas de navigation entre écrans pour les actions de jeu.

### Cycle de vie d'une capsule

```
DEMANDER → pending (24h expiry)
    ↓ FOURNIR
active (carburant en réservoir, max 5)
    ↓ ALLUMAGE MOTEURS
launch_requested (3 min force, 1h timeout)
    ↓ VALIDER / FORCER
resolved (+altitude créditeur)
```

### Statuts

| Statut | Description |
|---|---|
| `pending` | Demande envoyée, en attente |
| `active` | Carburant validé, dans le réservoir |
| `launch_requested` | Mise à feu demandée |
| `resolved` | Verre bu (validé ou forcé) |
| `rejected` | Demande refusée |
| `expired` | Demande expirée (24h) |

## Architecture

```
src/
├── app/
│   ├── _layout.tsx          # Root: QueryClient → Auth → HoustonToast → CapsuleProvider → AppContent (memo)
│   ├── login.tsx
│   └── (tabs)/
│       ├── _layout.tsx       # Tabs navigator
│       ├── index.tsx         # Cockpit (Radar + CapsuleShip + TableauBord + 4 overlays)
│       ├── activite.tsx      # Historique + filtres
│       ├── amis.tsx          # Classement altitude
│       └── profil.tsx        # Profil + stats
├── components/               # 14 composants (modales, ship, radar, etc.)
├── context/                  # CapsuleProvider, AuthProvider, HoustonToastContext
├── constants/                # game.ts (durées), theme.ts (couleurs, labels)
├── data/mocks.ts             # 3 users, 13 capsules
├── hooks/                    # useAuth, useCapsules, useProfiles
├── services/                 # capsules.ts, profiles.ts (Supabase RPC)
├── types/                     # Capsule, UserProfile, CapsuleStatus
└── utils/                     # karma, ranks, capsule (time logic)
```

## Conventions

- **Pas de `<Modal>` RN** — overlays `<View>` absolus + animation Reanimated (bug NativeWind v4 sur Fabric)
- **Pas de `react-native-gesture-handler`** — `PanResponder` natif pour swipe-to-confirm
- **Styles `active:` toujours présents** dans le className de base, jamais ajoutés dynamiquement (bug NativeWind v4 `printUpgradeWarning`)
- **`CapsuleProvider` au root** — au-dessus des navigators, `memo(AppContent)` bloque les re-renders cascade
- **Side effects hors `setState`** — calculer next state en dehors, appeler `setState(next)` directement
- **Pas de commentaires** dans le code
- **Commit style** : Conventional Commits anglais (`feat:`, `fix:`, `refactor:`, `docs:`)

Voir `context.md` pour la documentation complète (architecture, bug history, conventions, tâches).

## Développement — WSL2 + Expo Go

Expo Go ne peut pas atteindre Metro directement sous WSL2 (IP virtuelle `172.x.x.x` non accessible depuis le téléphone). Trois solutions :

### Option A — Port forwarding Windows → WSL2 (recommandé)

Dans un **PowerShell administrateur** sur Windows :

```powershell
# Récupérer l'IP WSL2
$wslIp = wsl hostname -I

# Forward port 8081
netsh interface portproxy add v4tov4 listenport=8081 listenaddress=0.0.0.0 connectport=8081 connectaddress=$wslIp

# Ouvrir le firewall Windows
New-NetFirewallRule -DisplayName "Expo Metro" -Direction Inbound -LocalPort 8081 -Protocol TCP -Action Allow

# Vérifier
netsh interface portproxy show v4tov4
```

Puis dans WSL2 :
```bash
npx expo start --clear
```

Dans Expo Go sur le téléphone → "Enter URL manually" → `http://<IP_WINDOWS>:8081`

### Option B — WSL2 mirrored networking (Windows 11 22H2+)

Créer/modifier `%USERPROFILE%/.wslconfig` :
```ini
[wsl2]
networkingMode=mirrored
```

Redémarrer WSL :
```powershell
wsl --shutdown
```

L'IP WSL devient l'IP Windows → le téléphone accède directement à Metro. Lancer `npx expo start --clear` et scanner le QR code.

### Option C — Tunnel ngrok (`--tunnel`)

```bash
npx expo start --clear --tunnel
```

Instable en 2026 (restrictions ngrok gratuit, outages fréquents). Préférer l'option A ou B.

### Note

Le warning `Cannot connect to Expo CLI` dans LogBox est un faux positif — le client HMR d'Expo perd parfois la connexion au dev server via le tunnel. Il est ignoré via `LogBox.ignoreLogs` dans `_layout.tsx`.
