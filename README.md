# Ludo-Mind

<!-- SECTION:overview -->
## Vue d'ensemble

Ludo-Mind est une application mobile React Native construite avec **Expo SDK 53** et **expo-router**. Elle permet de gerer une collection personnelle de jeux de societe : recherche dans un catalogue, ajout a sa bibliotheque, suivi des parties jouees avec scoring multi-joueurs. L'application integre un systeme d'authentification complet (inscription, connexion, gestion de session JWT) adosse a **Supabase**, avec un profil utilisateur editable et un cache offline. Un pipeline d'import depuis **BoardGameGeek (BGG)** alimente le catalogue via une Edge Function Supabase. L'interface adopte un design system sombre personnalise.

**Stack technique :**

| Couche | Technologie | Version |
|--------|------------|---------|
| Runtime | React Native / Expo | 0.79.2 / ~53.0 |
| Routing | expo-router | ~5.1.0 |
| Backend | Supabase (auth + PostgreSQL + Edge Functions) | ^2.92.1 |
| Etat serveur | TanStack React Query | ^5.99.2 |
| Validation | Zod | ^3.24.3 |
| Stockage securise | expo-secure-store | ~14.0.0 |
| Cache local | @react-native-async-storage/async-storage | ^2.1.2 |
| Animations | react-native-reanimated | ~3.17.4 |
| Parsing XML | fast-xml-parser | ^5.7.1 |
| Langage | TypeScript (strict) | ^5.8.3 |
| Tests | Jest 29 / jest-expo / React Native Testing Library | 29.7.0 |
<!-- END:overview -->

<!-- SECTION:getting-started -->
## Mise en route

### Prerequis

- Node.js (>= 18 recommande)
- npm
- Expo CLI (`npx expo`)
- Un projet Supabase local ou heberge

### Installation

```bash
git clone <repo-url>
cd ludo-mind
npm install
```

### Variables d'environnement

Creer un fichier `.env` a la racine :

```
EXPO_PUBLIC_SUPABASE_URL=https://<votre-projet>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<votre-cle-anon>
```

### Migrations Supabase

Appliquer le schema de base de donnees :

```bash
supabase db push
```

Trois migrations sont disponibles :

- `20260418_game_library.sql` — extension `pg_trgm`, tables `games` et `user_games` avec politiques RLS
- `20260420_game_sessions.sql` — tables `game_sessions`, `game_session_players`, `game_session_rounds`, `game_session_final_scores` avec politiques RLS
- `20260420_bgg_catalog.sql` — colonnes BGG (`bgg_id`, `publisher`, `bgg_rating`, `bgg_rank`) et extension `scoring_family`

### Lancement

```bash
npx expo start
```

### Tests

```bash
npm test
```
<!-- END:getting-started -->

<!-- SECTION:architecture -->
## Architecture

```
ludo-mind/
  app/
    _layout.tsx                   # Layout racine (QueryClientProvider)
    (auth)/
      login.tsx                   # Ecran de connexion
      register.tsx                # Ecran d'inscription
    (authenticated)/
      _layout.tsx                 # Layout protege (TopAppBar + BottomTabBar)
      index.tsx                   # Dashboard (session active, actions rapides, suggestions)
      profile.tsx                 # Ecran de profil utilisateur
      library/
        index.tsx                 # Collection de jeux de l'utilisateur
        search.tsx                # Recherche dans le catalogue de jeux
        [game_id].tsx             # Detail d'un jeu
      session/
        new.tsx                   # Creation d'une nouvelle session de jeu
        history.tsx               # Historique des sessions
        [id]/
          play.tsx                # Ecran de jeu en cours (saisie des scores par manche)
          end.tsx                 # Ecran de fin de session (classement final)
  components/
    layout/
      TopAppBar.tsx               # Barre superieure (logo + avatar)
      BottomTabBar.tsx            # Navigation par onglets
    library/
      FeaturedGameCard.tsx        # Carte de jeu mise en avant
      StandardGameCard.tsx        # Carte de jeu standard
      GhostAddCard.tsx            # Carte d'ajout rapide
    session/
      ActiveSessionCard.tsx       # Carte de session en cours (dashboard)
      OracleSuggestionBox.tsx     # Suggestion de jeu par l'Oracle
      QuickActionCard.tsx         # Actions rapides (dashboard)
      RecommendedIntelCard.tsx    # Intelligence recommandee (dashboard)
  context/
    AuthProvider.tsx              # Provider React pour l'etat d'authentification
  hooks/
    useSession.ts                 # Restauration/rafraichissement de session JWT
    useActiveSession.ts           # Session de jeu active (React Query)
    useLibrary.ts                 # Requetes et mutations de la bibliotheque (React Query)
    useDebounce.ts                # Debounce pour la recherche
  lib/
    schemas.ts                    # Schemas Zod (User, Session, Game, GameSession, validation)
    supabase.ts                   # Client Supabase configure
    errors.ts                     # Classes d'erreur metier
    tokens.ts                     # Design tokens (palette sombre)
    queryKeys.ts                  # Factory de cles React Query
  services/
    AuthService.ts                # Inscription, connexion, deconnexion
    ProfileService.ts             # Lecture/mise a jour profil (avec cache offline)
    GameCatalogService.ts         # Recherche plein texte et consultation par ID dans le catalogue
    UserLibraryService.ts         # Gestion de la collection utilisateur (ajout, retrait, compteur)
    SessionService.ts             # CRUD sessions de jeu (creation, manches, fin, historique)
    bgg/
      BggApiClient.ts             # Client HTTP pour l'API XML BoardGameGeek
      BggXmlParser.ts             # Parsing XML → objets types BGG
      CatalogImporter.ts          # Import batch BGG → table games (upsert)
      ScoringFamilyResolver.ts    # Resolution de la famille de scoring depuis les mecaniques BGG
      types.ts                    # Types BGG (BggSearchResult, BggGameDetail, etc.)
  supabase/
    migrations/                   # Migrations SQL
    functions/
      catalog-bgg-search/         # Edge Function Supabase — recherche BGG
  __mocks__/                      # Mocks Jest
  __tests__/                      # Tests unitaires et d'integration
```

### Schema de base de donnees

- **games** : id, title, description, min_players, max_players, cover_url, category, scoring_family, rules_indexed, created_at, bgg_id, publisher, bgg_rating, bgg_rank — index GIN trigram sur le titre, index unique sur bgg_id
- **user_games** : id, user_id, game_id, added_at, last_played_at, play_count — contrainte unique (user_id, game_id), cascade delete
- **game_sessions** : id, user_id, game_id, status (active/finished), created_at, ended_at — cascade delete
- **game_session_players** : id, session_id, display_name, order_index — contrainte unique (session_id, order_index)
- **game_session_rounds** : id, session_id, round_number, results (JSONB), created_at — contrainte unique (session_id, round_number)
- **game_session_final_scores** : id, session_id, player_id, display_name, total, rank — cascade delete

### Flux d'authentification

1. `AuthService.register()` cree un compte Supabase + un profil dans la table `profiles`
2. `AuthService.login()` authentifie, recupere le profil, et persiste la session dans `SecureStore`
3. `useSession` restaure la session au demarrage, rafraichit le token JWT si expire
4. `AuthProvider` expose la session via React Context
5. `AuthenticatedLayout` redirige vers `/login` si aucune session active

### Flux de session de jeu

1. L'utilisateur cree une session via `new.tsx` (selection du jeu + ajout des joueurs)
2. `SessionService.create()` insere la session et les joueurs dans Supabase
3. Ecran `play.tsx` : saisie des scores manche par manche via `SessionService.addRound()`
4. Fin de session via `SessionService.end()` : calcul du classement final, affichage dans `end.tsx`
5. `useActiveSession` surveille la session active depuis le dashboard
6. Historique consultable via `history.tsx` avec `SessionService.getHistory()`

### Pipeline BGG

1. `BggApiClient` interroge l'API XML de BoardGameGeek (recherche, hot list, details batch)
2. `BggXmlParser` transforme le XML en objets TypeScript types
3. `ScoringFamilyResolver` deduit la famille de scoring a partir des mecaniques BGG
4. `CatalogImporter` orchestre l'import batch avec upsert dans la table `games`
5. L'Edge Function `catalog-bgg-search` expose la recherche BGG comme endpoint Supabase
<!-- END:architecture -->

<!-- SECTION:features -->
## Fonctionnalites

| Fonctionnalite | Statut | Description |
|----------------|--------|-------------|
| Inscription | Implemente | Validation Zod (email + mot de passe 8 car. min), detection de conflit email |
| Connexion | Implemente | Authentification Supabase, persistance SecureStore |
| Session JWT | Implemente | Restauration automatique, rafraichissement si token expire |
| Profil utilisateur | Implemente | Affichage email, badge plan (free/premium), edition display_name et avatar_url |
| Cache offline profil | Implemente | Fallback AsyncStorage si erreur reseau |
| Deconnexion | Implemente | Nettoyage SecureStore + signOut Supabase |
| Catalogue de jeux | Implemente | Recherche plein texte (index GIN trigram PostgreSQL), consultation par ID |
| Import BGG | Implemente | Pipeline complet : API XML → parsing → resolution scoring → upsert batch |
| Edge Function BGG | Implemente | Recherche BGG via endpoint Supabase (catalog-bgg-search) |
| Bibliotheque personnelle | Implemente | Ajout/retrait de jeux, suivi du nombre de parties jouees |
| Filtrage local | Implemente | Filtre cote client sur la collection |
| Detail d'un jeu | Implemente | Titre, description, scoring family, nombre de joueurs, badge regles, donnees BGG |
| Dashboard | Implemente | Session active, actions rapides, suggestions Oracle, intelligence recommandee |
| Sessions de jeu | Implemente | Creation de session multi-joueurs, saisie de scores par manche, classement final |
| Historique des sessions | Implemente | Liste des sessions terminees par jeu |
| Composants de cartes | Implemente | FeaturedGameCard, StandardGameCard, GhostAddCard, ActiveSessionCard, QuickActionCard |
| Navigation | Implemente | 4 onglets (Home, Oracle, Scanner, Library) — Oracle et Scanner non encore developpes |
| Design system | Implemente | Palette sombre avec tokens centralises |
<!-- END:features -->

<!-- SECTION:test-coverage -->
## Couverture de tests

25 suites de tests, 129 tests — tous passent.

| Suite | Fichier | Domaine |
|-------|---------|---------|
| AuthService | `__tests__/services/AuthService.test.ts` | Inscription, connexion, deconnexion |
| ProfileService | `__tests__/services/ProfileService.test.ts` | Lecture/mise a jour profil, cache offline |
| GameCatalogService | `__tests__/services/GameCatalogService.test.ts` | Recherche de jeux par titre, consultation par ID |
| UserLibraryService | `__tests__/services/UserLibraryService.test.ts` | Collection utilisateur (ajout, retrait, lecture) |
| SessionService | `__tests__/services/SessionService.test.ts` | CRUD sessions, manches, fin, historique |
| BggApiClient | `__tests__/services/bgg/BggApiClient.test.ts` | Client HTTP API BGG (recherche, hot, details) |
| BggXmlParser | `__tests__/services/bgg/BggXmlParser.test.ts` | Parsing XML BGG → objets types |
| CatalogImporter | `__tests__/services/bgg/CatalogImporter.test.ts` | Import batch BGG → upsert games |
| ScoringFamilyResolver | `__tests__/services/bgg/ScoringFamilyResolver.test.ts` | Resolution famille de scoring |
| catalog-bgg-search | `__tests__/functions/catalog-bgg-search.test.ts` | Edge Function recherche BGG |
| useSession | `__tests__/hooks/useSession.test.ts` | Restauration session, rafraichissement JWT |
| useActiveSession | `__tests__/hooks/useActiveSession.test.ts` | Session de jeu active (React Query) |
| useLibrary | `__tests__/hooks/useLibrary.test.ts` | Requetes bibliotheque, mutations, invalidation cache |
| AuthenticatedLayout | `__tests__/layouts/AuthenticatedLayout.test.tsx` | Redirection si non authentifie |
| DashboardScreen | `__tests__/screens/DashboardScreen.test.tsx` | Dashboard (session active, actions, suggestions) |
| NewSessionScreen | `__tests__/screens/NewSessionScreen.test.tsx` | Creation de session de jeu |
| PlayScreen | `__tests__/screens/PlayScreen.test.tsx` | Ecran de jeu en cours |
| EndScreen | `__tests__/screens/EndScreen.test.tsx` | Ecran de fin de session |
| HistoryScreen | `__tests__/screens/HistoryScreen.test.tsx` | Historique des sessions |
| ProfileScreen | `__tests__/screens/ProfileScreen.test.tsx` | Ecran profil (affichage, edition) |
| LibraryScreen | `__tests__/screens/LibraryScreen.test.tsx` | Affichage de la bibliotheque |
| SearchScreen | `__tests__/screens/SearchScreen.test.tsx` | Interface de recherche |
| GameDetailScreen | `__tests__/screens/GameDetailScreen.test.tsx` | Detail d'un jeu |
| BottomTabBar | `__tests__/components/BottomTabBar.test.tsx` | Navigation par onglets |
| OracleSuggestionBox | `__tests__/components/OracleSuggestionBox.test.tsx` | Composant suggestion Oracle |

Mocks disponibles : `expo-secure-store`, `@react-native-async-storage/async-storage`, `expo-router`, `expo-blur`, `supabase`.

Fixtures XML BGG : `__tests__/fixtures/bgg-hot.xml`, `bgg-search.xml`, `bgg-thing-batch.xml`.
<!-- END:test-coverage -->

<!-- SECTION:backlog -->
## Backlog

Aucun backlog structure disponible (`backlog/` absent).
<!-- END:backlog -->

<!-- SECTION:configuration -->
## Configuration

- **TypeScript** : mode strict, alias `@/*` vers la racine (`tsconfig.json`)
- **Babel** : preset `babel-preset-expo` (`babel.config.js`)
- **Jest** : preset `jest-expo`, mocks personnalises, `transformIgnorePatterns` pour les modules natifs (`package.json`)
- **React Query** : `QueryClientProvider` configure dans le layout racine (`app/_layout.tsx`)
- **Supabase** : configuration via variables d'environnement `EXPO_PUBLIC_SUPABASE_URL` et `EXPO_PUBLIC_SUPABASE_ANON_KEY` (`lib/supabase.ts`)

Aucun fichier `config/project.json` present.
<!-- END:configuration -->
