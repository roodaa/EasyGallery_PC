# EasyGallery PC

Une application desktop moderne pour organiser, taguer et rechercher vos photos avec une interface intuitive.

> ✅ **V1.0 Terminee** - Gestion des tags et recherche avancee implementees

## Description

EasyGallery est une application de gestion de galerie photos qui permet de:
- Scanner automatiquement les photos de votre ordinateur
- Gérer plusieurs dossiers surveillés pour une indexation centralisée
- Ajouter des tags personnalisés (personnes, lieux, événements, etc.)
- Parcourir vos photos avec une interface moderne et fluide

### Fonctionnalités Implémentées

- ✅ Gestion des dossiers surveillés avec statistiques
- ✅ Scan récursif de dossiers photos
- ✅ Extraction automatique de métadonnées (dimensions, taille, dates)
- ✅ Base de données SQLite avec GORM (driver pur Go, sans CGO)
- ✅ Système de tags multi-types (personne, lieu, événement, autre)
- ✅ Galerie responsive avec vue en grille
- ✅ **Visionneuse d'images plein écran** avec navigation et panneau d'infos
- ✅ **Suppression de photos** (de l'index ou du disque)
- ✅ Génération de thumbnails
- ✅ Interface moderne avec React + TailwindCSS
- ✅ Dialogue natif de sélection de dossier
- ✅ Raccourcis clavier (navigation, suppression, toggle info)
- ✅ **Interface de gestion des tags** avec palette de couleurs et types
- ✅ **Attribution de tags aux photos** depuis la visionneuse
- ✅ **Recherche avancée** avec opérateurs booléens par type de tag

### Fonctionnalités à Venir

- 🔄 Amélioration de la génération de miniatures (resize réel)

### Fonctionnalités V2 (futures)

- 🔮 Reconnaissance faciale automatique avec regroupement
- 🔮 Détection automatique de lieux via métadonnées GPS
- 🔮 Timeline chronologique des photos
- 🔮 Export de sélections

## Stack Technologique

### Frontend
- **React 18** avec TypeScript
- **TailwindCSS** pour le styling
- **Vite** comme bundler
- Interface moderne et responsive

### Backend
- **Go** pour la logique métier
- **GORM** comme ORM
- **SQLite** pour la base de données
- Gestion native du filesystem

### Desktop
- **Wails v2** - Framework Go + React pour applications desktop
- Exécutables natifs et légers
- Communication bidirectionnelle Go ↔ React

## Notes Techniques

### Middleware de Fichiers Locaux

Les applications Wails utilisent une WebView pour le rendu du frontend. Pour des raisons de sécurité, le protocole `file://` est bloqué par défaut, ce qui empêche le chargement direct des images locales.

**Solution implémentée**: Un middleware HTTP personnalisé intercepte les requêtes vers `/localfile/` et sert les fichiers du système de fichiers local.

```go
// main.go - LocalFileMiddleware
func LocalFileMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        if strings.HasPrefix(r.URL.Path, "/localfile/") {
            filePath := strings.TrimPrefix(r.URL.Path, "/localfile/")
            http.ServeFile(w, r, filePath)
            return
        }
        next.ServeHTTP(w, r)
    })
}
```

**Utilisation côté frontend**:
```typescript
// utils/imageUrl.ts
export function getImageUrl(filePath: string): string {
  const encodedPath = filePath.replace(/\\/g, '/')
  return `/localfile/${encodedPath}`
}

// Utilisation
<img src={getImageUrl(picture.path)} />
```

### Driver SQLite sans CGO

Le projet utilise `github.com/glebarez/sqlite` au lieu de `gorm.io/driver/sqlite` standard. Ce driver est une implémentation pure Go de SQLite qui ne nécessite pas CGO ni de compilateur C, ce qui simplifie la compilation sur Windows.

## Architecture

```
EasyGallery_PC/
├── app.go               # Application principale Wails (endpoints API)
├── main.go              # Point d'entrée
├── backend/             # Backend Go
│   ├── models/          # Modèles de données (Picture, Tag, WatchedFolder)
│   ├── database/        # Configuration DB et migrations
│   └── services/        # Logique métier
│       ├── indexer.go   # Indexation des photos
│       └── tag_service.go # Gestion des tags et recherche
├── frontend/            # Frontend React
│   └── src/
│       ├── components/
│       │   ├── PhotoGallery.tsx  # Galerie avec recherche
│       │   ├── ImageViewer.tsx   # Visionneuse plein écran
│       │   ├── WatchedFolders.tsx # Gestion des dossiers
│       │   ├── TagManager.tsx    # Gestion des tags
│       │   └── SearchBar.tsx     # Recherche avancée
│       ├── App.tsx      # Application principale avec navigation
│       └── styles/      # Styles globaux TailwindCSS
└── build/               # Exécutables compilés
```

## Schéma de Base de Données

### Table `pictures`
- **path** (TEXT, PRIMARY KEY) - Chemin absolu du fichier
- filename, size, width, height
- created_at, modified_at, indexed_at

### Table `tags`
- **name** (TEXT, PRIMARY KEY) - Nom unique du tag
- **type** (TEXT) - Type: 'person', 'location', 'event', 'other'
- color (TEXT) - Couleur HEX pour l'UI
- created_at

### Table `picture_tags` (Association many-to-many)
- picture_path (FK → pictures.path)
- tag_name (FK → tags.name)
- created_at

### Table `watched_folders`
- **path** (TEXT, PRIMARY KEY) - Chemin absolu du dossier
- name (TEXT) - Nom convivial du dossier
- added_at, last_indexed_at
- picture_count (INTEGER) - Nombre de photos indexées
- auto_reindex (BOOLEAN) - Ré-indexation automatique

## Données Utilisateur

Les données sont stockées dans le dossier utilisateur:

- **Windows**: `%USERPROFILE%\.easygallery\`
- **macOS**: `~/.easygallery/`
- **Linux**: `~/.easygallery/`

Contenu:
```
.easygallery/
├── easygallery.db      # Base SQLite
└── thumbnails/         # Cache des miniatures
```

## Installation et Développement

### Prérequis

- **Go** 1.21+ ([go.dev](https://go.dev))
- **Node.js** 18+ et npm ([nodejs.org](https://nodejs.org))
- **Wails CLI** v2 ([wails.io](https://wails.io))

### Installation Wails

```bash
go install github.com/wailsapp/wails/v2/cmd/wails@latest
```

### Installation des dépendances

```bash
# Dépendances Go
go mod download

# Dépendances Frontend
cd frontend
npm install
```

### Développement

Mode développement avec hot-reload:

```bash
wails dev
```

### Build

Compiler l'application pour votre OS:

```bash
wails build
```

Build pour un OS spécifique:

```bash
# Windows
wails build -platform windows/amd64

# macOS
wails build -platform darwin/universal

# Linux
wails build -platform linux/amd64
```

Les exécutables sont générés dans le dossier `build/bin/`.

## Utilisation

### 1. Ajouter des Dossiers Surveillés
- Cliquez sur l'onglet "Watched Folders" dans la sidebar
- Cliquez sur "Add Folder" et sélectionnez un dossier contenant des photos
- Donnez-lui un nom convivial (optionnel)

### 2. Indexer les Photos
- Cliquez sur "Index" pour un dossier spécifique
- Ou cliquez sur "Reindex All" pour tous les dossiers
- Les métadonnées (dimensions, taille, dates) sont extraites automatiquement

### 3. Parcourir la Galerie
- Cliquez sur l'onglet "Gallery" pour voir toutes vos photos indexées
- Cliquez sur une photo pour voir ses détails complets
- Les miniatures sont générées automatiquement

### 4. Gestion des Tags
- Cliquez sur l'onglet "Tags" dans la sidebar
- Cliquez sur "Nouveau Tag" pour créer un tag
- Choisissez un type (Personne, Lieu, Evenement, Autre) et une couleur
- Modifiez ou supprimez des tags existants

### 5. Attribution de Tags aux Photos
- Ouvrez une photo dans la visionneuse (clic sur une image)
- Dans le panneau d'infos (touche `I`), section "Tags"
- Cliquez sur `+` pour ajouter un tag depuis la liste
- Cliquez sur `x` sur un tag pour le retirer de la photo

### 6. Recherche Avancee
- Dans la galerie, cliquez sur "Recherche par tags"
- Selectionnez des tags par type (Personnes, Lieux, Evenements, Autres)
- Choisissez l'operateur interne (AND/OR) pour chaque groupe
- Les groupes sont combines avec AND entre eux
- Exemple: `(Clara AND Romaric) AND (Paris OR Compiegne)`
- Le filtrage s'applique en temps reel

## Roadmap

### V1.0 (Termine)
- [x] Architecture projet
- [x] Modeles et base de donnees (Picture, Tag, WatchedFolder, PictureTag)
- [x] Scanner de fichiers avec extraction de metadonnees
- [x] Interface galerie responsive avec grille et modal de details
- [x] Gestion des dossiers surveilles
- [x] Generation de thumbnails (basique)
- [x] Interface de gestion des tags (CRUD avec types et couleurs)
- [x] Attribution de tags aux photos (depuis la visionneuse)
- [x] Recherche avancee avec operateurs booleens par type

### V1.5
- [ ] Amélioration génération de miniatures (resize réel avec bibliothèque d'images)
- [ ] Événements de progression pour l'indexation
- [ ] Optimisation performances (pagination, lazy loading)
- [ ] Export de sélections
- [ ] Import/Export de tags
- [ ] Statistiques de galerie

### V2.0
- [ ] Reconnaissance faciale (ML Kit ou équivalent)
- [ ] Détection automatique de lieux via GPS EXIF
- [ ] Timeline chronologique
- [ ] Version web démo

## Déploiement Web (V2)

Le même frontend React pourra être réutilisé pour une version web:
- Backend Go → API REST
- Frontend React inchangé (remplacer bindings Wails par fetch API)
- Déploiement: Go backend + React static sur serveur

## Auteur

**Romaric Dacosse** - Étudiant Ingénieur Informatique UTC
- Spécialisation: IA, analyse data, machine learning, développement logiciel

## License

Projet personnel - Tous droits réservés

## Technologies Utilisées

![Go](https://img.shields.io/badge/Go-00ADD8?style=flat&logo=go&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind-38B2AC?style=flat&logo=tailwind-css&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=flat&logo=sqlite&logoColor=white)
![Wails](https://img.shields.io/badge/Wails-DF0000?style=flat&logo=wails&logoColor=white)
