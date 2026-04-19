# Ludo-Mind

<!-- SECTION:overview -->
## Vue d'ensemble

Ludo-Mind est une application mobile React Native construite avec **Expo SDK 53** et **expo-router**. Elle propose un système d'authentification complet (inscription, connexion, gestion de session) adossé à **Supabase**, avec un écran de profil utilisateur éditable. L'interface adopte un design system sombre personnalisé (tokens dans `lib/tokens.ts`).

**Stack technique :**

| Couche | Technologie |
|--------|------------|
| Runtime | React Native 0.79 / Expo ~53 |
| Routing | expo-router ~4.0 |
| Backend | Supabase (auth + base de données) |
| Validation | Zod 3.x |
| Stockage sécurisé | expo-secure-store |
| Cache local | @react-native-async-storage/async-storage |
| Langage | TypeScript (strict) |
| Tests | Jest 29 / jest-expo / React Native Testing Library |
<!-- END:overview -->

<!-- SECTION:getting-started -->
## Mise en route

### Prerequis

- Node.js (>= 18 recommande)
- npm
- Expo CLI (`npx expo`)
- Un projet Supabase avec une table `profiles`

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
    (auth)/
      login.tsx              # Ecran de connexion
      register.tsx           # Ecran d'inscription
    (authenticated)/
      _layout.tsx            # Layout protege (TopAppBar + BottomTabBar)
      profile.tsx            # Ecran de profil utilisateur
  components/
    layout/
      TopAppBar.tsx          # Barre superieure (logo + avatar)
      BottomTabBar.tsx       # Navigation par onglets (Home, Oracle, Scanner, Library)
  context/
    AuthProvider.tsx         # Provider React pour l'etat d'authentification
  hooks/
    useSession.ts            # Hook de restauration/rafraichissement de session JWT
  lib/
    schemas.ts               # Schemas Zod (User, Session, validation)
    supabase.ts              # Client Supabase configure
    errors.ts                # Classes d'erreur metier (ConflictError, AuthError, NetworkError)
    tokens.ts                # Design tokens (palette de couleurs)
  services/
    AuthService.ts           # Inscription, connexion, deconnexion
    ProfileService.ts        # Lecture et mise a jour du profil (avec cache offline)
  __mocks__/                 # Mocks Jest (expo-secure-store, async-storage, expo-router, supabase)
  __tests__/                 # Tests unitaires (services, hooks, composants, ecrans, layouts)
```

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
| Cache offline profil | Implemente | Fallback AsyncStorage si erreur reseau sur `ProfileService.getMe()` |
| Deconnexion | Implemente | Nettoyage SecureStore + signOut Supabase |
| Navigation | Implemente | 4 onglets (Home, Oracle, Scanner, Library) — ecrans non encore developpes |
| Design system | Implemente | Palette sombre avec tokens centralises |
<!-- END:features -->

<!-- SECTION:test-coverage -->
## Couverture de tests

6 suites de tests, 26 tests — tous passent.

| Suite | Fichier | Domaine |
|-------|---------|---------|
| AuthService | `__tests__/services/AuthService.test.ts` | Inscription, connexion, deconnexion |
| ProfileService | `__tests__/services/ProfileService.test.ts` | Lecture/mise a jour profil, cache offline |
| useSession | `__tests__/hooks/useSession.test.ts` | Restauration session, rafraichissement JWT |
| AuthenticatedLayout | `__tests__/layouts/AuthenticatedLayout.test.tsx` | Redirection si non authentifie |
| ProfileScreen | `__tests__/screens/ProfileScreen.test.tsx` | Ecran profil (affichage, edition) |
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
- **Supabase** : configuration via variables d'environnement `EXPO_PUBLIC_SUPABASE_URL` et `EXPO_PUBLIC_SUPABASE_ANON_KEY` (`lib/supabase.ts`)

Aucun fichier `config/project.json` present.
<!-- END:configuration -->
