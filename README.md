# EasyGallery PC

Une application desktop moderne pour organiser, taguer et rechercher vos photos avec une interface intuitive.

> 🚧 **Projet en développement actif** - V1.0 en cours d'implémentation

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
- ✅ Base de données SQLite avec GORM
- ✅ Système de tags multi-types (personne, lieu, événement, autre)
- ✅ Galerie responsive avec vue en grille
- ✅ Modal de détails de photo avec métadonnées complètes
- ✅ Génération de thumbnails
- ✅ Interface moderne avec React + TailwindCSS
- ✅ Dialogue natif de sélection de dossier

### Fonctionnalités à Venir

- 🔄 Recherche avancée avec opérateurs booléens (AND/OR)
- 🔄 Interface de gestion des tags
- 🔄 Attribution de tags aux photos
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

## Architecture

```
EasyGallery_PC/
├── app.go               # Application principale Wails
├── main.go              # Point d'entrée
├── backend/             # Backend Go
│   ├── models/          # Modèles de données (Picture, Tag, WatchedFolder)
│   ├── database/        # Configuration DB et migrations
│   └── services/        # Logique métier (indexer)
├── frontend/            # Frontend React
│   └── src/
│       ├── components/  # Composants UI (WatchedFolders, PhotoGallery)
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

### 4. Gestion (À venir)
- Attribution de tags aux photos
- Recherche avancée avec filtres
- Timeline chronologique

## Roadmap

### V1.0 (En cours)
- [x] Architecture projet
- [x] Modèles et base de données (Picture, Tag, WatchedFolder, PictureTag)
- [x] Scanner de fichiers avec extraction de métadonnées
- [x] Interface galerie responsive avec grille et modal de détails
- [x] Gestion des dossiers surveillés
- [x] Génération de thumbnails (basique)
- [ ] Interface de gestion des tags
- [ ] Attribution de tags aux photos
- [ ] Recherche avancée avec opérateurs booléens

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
