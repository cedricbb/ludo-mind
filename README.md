# Ludo-Mind

<!-- SECTION:overview -->
## Vue d'ensemble

Ludo-Mind est une application mobile React Native construite avec **Expo SDK 53** et **expo-router**. Elle permet de gerer une collection personnelle de jeux de societe : recherche dans un catalogue, ajout a sa bibliotheque, suivi des parties jouees. L'application integre un systeme d'authentification complet (inscription, connexion, gestion de session JWT) adosse a **Supabase**, avec un profil utilisateur editable et un cache offline. L'interface adopte un design system sombre personnalise.

**Stack technique :**

| Couche | Technologie | Version |
|--------|------------|---------|
| Runtime | React Native / Expo | 0.79.2 / ~53.0 |
| Routing | expo-router | ~5.1.0 |
| Backend | Supabase (auth + PostgreSQL) | ^2.92.1 |
| Etat serveur | TanStack React Query | ^5.99.2 |
| Validation | Zod | ^3.24.3 |
| Stockage securise | expo-secure-store | ~14.0.0 |
| Cache local | @react-native-async-storage/async-storage | ^2.1.2 |
| Animations | react-native-reanimated | ~3.17.4 |
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

Le fichier `supabase/migrations/20260418_game_library.sql` cree les tables `games` et `user_games` avec leurs politiques RLS.

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
    _layout.tsx                # Layout racine (QueryClientProvider)
    (auth)/
      login.tsx                # Ecran de connexion
      register.tsx             # Ecran d'inscription
    (authenticated)/
      _layout.tsx              # Layout protege (TopAppBar + BottomTabBar)
      profile.tsx              # Ecran de profil utilisateur
      library/
        index.tsx              # Collection de jeux de l'utilisateur
        search.tsx             # Recherche dans le catalogue de jeux
        [game_id].tsx          # Detail d'un jeu
  components/
    layout/
      TopAppBar.tsx            # Barre superieure (logo + avatar)
      BottomTabBar.tsx         # Navigation par onglets
    library/
      FeaturedGameCard.tsx     # Carte de jeu mise en avant
      StandardGameCard.tsx     # Carte de jeu standard
      GhostAddCard.tsx         # Carte d'ajout rapide
  context/
    AuthProvider.tsx           # Provider React pour l'etat d'authentification
  hooks/
    useSession.ts              # Restauration/rafraichissement de session JWT
    useLibrary.ts              # Requetes et mutations de la bibliotheque (React Query)
    useDebounce.ts             # Debounce pour la recherche
  lib/
    schemas.ts                 # Schemas Zod (User, Session, Game, validation)
    supabase.ts                # Client Supabase configure
    errors.ts                  # Classes d'erreur metier
    tokens.ts                  # Design tokens (palette sombre)
    queryKeys.ts               # Factory de cles React Query
  services/
    AuthService.ts             # Inscription, connexion, deconnexion
    ProfileService.ts          # Lecture/mise a jour profil (avec cache offline)
    GameCatalogService.ts      # Recherche plein texte dans le catalogue de jeux
    UserLibraryService.ts      # Gestion de la collection utilisateur (ajout, retrait, compteur)
  supabase/
    migrations/
      20260418_game_library.sql  # Schema des tables games et user_games
  __mocks__/                   # Mocks Jest
  __tests__/                   # Tests unitaires et d'integration
```

### Schema de base de donnees

- **games** : id, title, description, min_players, max_players, cover_url, category, scoring_family, rules_indexed, created_at — index GIN trigram sur le titre
- **user_games** : id, user_id, game_id, added_at, last_played_at, play_count — contrainte unique (user_id, game_id), cascade delete

### Flux d'authentification

1. `AuthService.register()` cree un compte Supabase + un profil dans la table `profiles`
2. `AuthService.login()` authentifie, recupere le profil, et persiste la session dans `SecureStore`
3. `useSession` restaure la session au demarrage, rafraichit le token JWT si expire
4. `AuthProvider` expose la session via React Context
5. `AuthenticatedLayout` redirige vers `/login` si aucune session active
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
| Catalogue de jeux | Implemente | Recherche plein texte (index GIN trigram PostgreSQL) |
| Bibliotheque personnelle | Implemente | Ajout/retrait de jeux, suivi du nombre de parties jouees |
| Filtrage local | Implemente | Filtre cote client sur la collection |
| Detail d'un jeu | Implemente | Titre, description, scoring family, nombre de joueurs, badge regles |
| Composants de cartes | Implemente | FeaturedGameCard, StandardGameCard, GhostAddCard |
| Navigation | Implemente | 4 onglets (Home, Oracle, Scanner, Library) — Home, Oracle et Scanner non encore developpes |
| Design system | Implemente | Palette sombre avec tokens centralises |
<!-- END:features -->

<!-- SECTION:test-coverage -->
## Couverture de tests

12 suites de tests, 46 tests — tous passent.

| Suite | Fichier | Domaine |
|-------|---------|---------|
| AuthService | `__tests__/services/AuthService.test.ts` | Inscription, connexion, deconnexion |
| ProfileService | `__tests__/services/ProfileService.test.ts` | Lecture/mise a jour profil, cache offline |
| GameCatalogService | `__tests__/services/GameCatalogService.test.ts` | Recherche de jeux par titre |
| UserLibraryService | `__tests__/services/UserLibraryService.test.ts` | Collection utilisateur (ajout, retrait, lecture) |
| useSession | `__tests__/hooks/useSession.test.ts` | Restauration session, rafraichissement JWT |
| useLibrary | `__tests__/hooks/useLibrary.test.ts` | Requetes bibliotheque, mutations, invalidation cache |
| AuthenticatedLayout | `__tests__/layouts/AuthenticatedLayout.test.tsx` | Redirection si non authentifie |
| ProfileScreen | `__tests__/screens/ProfileScreen.test.tsx` | Ecran profil (affichage, edition) |
| LibraryScreen | `__tests__/screens/LibraryScreen.test.tsx` | Affichage de la bibliotheque |
| SearchScreen | `__tests__/screens/SearchScreen.test.tsx` | Interface de recherche |
| GameDetailScreen | `__tests__/screens/GameDetailScreen.test.tsx` | Detail d'un jeu |
| BottomTabBar | `__tests__/components/BottomTabBar.test.tsx` | Navigation par onglets |

Mocks disponibles : `expo-secure-store`, `@react-native-async-storage/async-storage`, `expo-router`, `supabase`.
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
