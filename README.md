# EasyGallery PC

Une application desktop moderne pour organiser, taguer et rechercher vos photos avec une interface intuitive.

## Description

EasyGallery est une application de gestion de galerie photos qui permet de:
- Scanner automatiquement les photos de votre ordinateur
- Ajouter des tags personnalisés (personnes, lieux, événements, etc.)
- Effectuer des recherches avancées avec opérateurs AND/OR
- Parcourir vos photos avec une interface moderne et fluide

### Fonctionnalités V1

- ✅ Scan de dossiers photos avec gestion des permissions
- ✅ Système de tags multi-types (personne, lieu, événement, autre)
- ✅ Recherche avancée avec opérateurs booléens (AND/OR)
- ✅ Galerie responsive avec vue en grille
- ✅ Gestion des métadonnées EXIF
- ✅ Génération automatique de thumbnails
- ✅ Interface moderne avec React + TailwindCSS

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
├── backend/              # Backend Go
│   ├── models/          # Modèles de données (Picture, Tag)
│   ├── database/        # Configuration DB et migrations
│   ├── services/        # Logique métier (scanner, search, CRUD)
│   └── utils/           # Utilitaires (config, filesystem, images)
├── frontend/            # Frontend React
│   └── src/
│       ├── components/  # Composants UI
│       ├── pages/       # Pages principales
│       ├── hooks/       # Hooks personnalisés
│       ├── types/       # Types TypeScript
│       └── utils/       # Helpers frontend
└── build/              # Configuration build par OS
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

## Données Utilisateur

Les données sont stockées dans l'emplacement standard de chaque OS:

- **Windows**: `%APPDATA%\EasyGallery\`
- **macOS**: `~/Library/Application Support/EasyGallery/`
- **Linux**: `~/.local/share/easygallery/`

Contenu:
```
EasyGallery/
├── easygallery.db      # Base SQLite
├── thumbnails/         # Cache des miniatures
└── config.json         # Configuration (dossiers autorisés)
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

1. **Premier lancement**: Configurez les dossiers où EasyGallery peut rechercher des photos
2. **Scanner**: Lancez un scan pour indexer vos photos
3. **Taguer**: Ajoutez des tags à vos photos (personnes, lieux, événements)
4. **Rechercher**: Utilisez la recherche avancée
   - `Marie AND Paris` - Photos de Marie à Paris
   - `Vacances OR Voyage` - Photos taguées Vacances ou Voyage
   - `Jean AND (Paris OR Lyon)` - Photos de Jean à Paris ou Lyon

## Roadmap

### V1.0 (Actuel)
- [x] Architecture projet
- [ ] Modèles et base de données
- [ ] Scanner de fichiers
- [ ] Interface galerie basique
- [ ] Système de tags manuel
- [ ] Recherche avancée

### V1.5
- [ ] Optimisation performances (pagination, lazy loading)
- [ ] Export de sélections
- [ ] Import/Export de tags
- [ ] Statistiques de galerie

### V2.0
- [ ] Reconnaissance faciale (ML Kit ou équivalent)
- [ ] Détection automatique de lieux
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
