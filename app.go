package main

import (
	"context"
	"fmt"
	"os"
	"path/filepath"

	"easygallery/backend/database"
	"easygallery/backend/models"
	"easygallery/backend/services"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App est la structure principale du backend
// Toutes ses méthodes publiques sont accessibles depuis React
type App struct {
	ctx        context.Context
	indexer    *services.Indexer
	tagService *services.TagService
	dataDir    string
}

// NewApp crée une nouvelle instance de App
func NewApp() *App {
	return &App{}
}

// startup est appelé au démarrage de l'application
// Le context permet d'interagir avec le frontend
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	fmt.Println("EasyGallery starting...")

	// Déterminer le dossier de données
	userHome, err := os.UserHomeDir()
	if err != nil {
		fmt.Println("Warning: could not get user home directory, using current directory")
		userHome = "."
	}
	a.dataDir = filepath.Join(userHome, ".easygallery")

	// Initialiser la base de données
	if err := database.Init(a.dataDir); err != nil {
		fmt.Printf("Error initializing database: %v\n", err)
		// Ne pas initialiser l'indexer si la DB a échoué
		return
	}

	// Initialiser les services seulement si la DB est prête
	a.indexer = services.NewIndexer(a.dataDir)
	a.tagService = services.NewTagService()
}

// shutdown est appelé à la fermeture de l'application
func (a *App) shutdown(ctx context.Context) {
	fmt.Println("EasyGallery shutting down...")

	// Fermer la connexion à la base de données
	if err := database.Close(); err != nil {
		fmt.Printf("Error closing database: %v\n", err)
	}
}

// Greet est une méthode de test accessible depuis React
// Elle sera automatiquement exposée au frontend
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, welcome to EasyGallery!", name)
}

// SelectFolder ouvre un dialogue de sélection de dossier
func (a *App) SelectFolder() (string, error) {
	return runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Select a folder to watch",
	})
}

// IndexFolder indexe un dossier de photos
// Retourne le nombre de photos indexées ou une erreur
func (a *App) IndexFolder(folderPath string) (int, error) {
	if a.indexer == nil {
		return 0, fmt.Errorf("indexer not initialized")
	}

	// TODO: Émettre des événements de progression vers le frontend
	count, err := a.indexer.IndexFolder(folderPath, nil)
	if err != nil {
		return 0, err
	}

	return count, nil
}

// GetIndexedPictures retourne toutes les photos indexées
func (a *App) GetIndexedPictures() ([]models.Picture, error) {
	if a.indexer == nil {
		return nil, fmt.Errorf("indexer not initialized")
	}

	return a.indexer.GetIndexedPictures()
}

// GetPictureCount retourne le nombre total de photos indexées
func (a *App) GetPictureCount() (int64, error) {
	if a.indexer == nil {
		return 0, fmt.Errorf("indexer not initialized")
	}

	return a.indexer.GetPictureCount()
}

// DeletePicture supprime une photo de l'index et optionnellement du disque
func (a *App) DeletePicture(picturePath string, deleteFromDisk bool) error {
	if a.indexer == nil {
		return fmt.Errorf("indexer not initialized")
	}

	return a.indexer.DeletePicture(picturePath, deleteFromDisk)
}

// === Gestion des dossiers surveillés ===

// AddWatchedFolder ajoute un dossier à la liste des dossiers surveillés
func (a *App) AddWatchedFolder(folderPath string, name string, autoReindex bool) error {
	if a.indexer == nil {
		return fmt.Errorf("indexer not initialized")
	}

	return a.indexer.AddWatchedFolder(folderPath, name, autoReindex)
}

// RemoveWatchedFolder retire un dossier de la liste des dossiers surveillés
func (a *App) RemoveWatchedFolder(folderPath string) error {
	if a.indexer == nil {
		return fmt.Errorf("indexer not initialized")
	}

	return a.indexer.RemoveWatchedFolder(folderPath)
}

// GetWatchedFolders retourne tous les dossiers surveillés
func (a *App) GetWatchedFolders() ([]models.WatchedFolder, error) {
	if a.indexer == nil {
		return nil, fmt.Errorf("indexer not initialized")
	}

	return a.indexer.GetWatchedFolders()
}

// UpdateWatchedFolder met à jour les métadonnées d'un dossier surveillé
func (a *App) UpdateWatchedFolder(folderPath string, name string, autoReindex bool) error {
	if a.indexer == nil {
		return fmt.Errorf("indexer not initialized")
	}

	return a.indexer.UpdateWatchedFolder(folderPath, name, autoReindex)
}

// IndexWatchedFolder indexe un dossier surveillé spécifique
func (a *App) IndexWatchedFolder(folderPath string) (int, error) {
	if a.indexer == nil {
		return 0, fmt.Errorf("indexer not initialized")
	}

	// TODO: Émettre des événements de progression vers le frontend
	return a.indexer.IndexWatchedFolder(folderPath, nil)
}

// ReindexAllWatchedFolders ré-indexe tous les dossiers surveillés
func (a *App) ReindexAllWatchedFolders() (int, error) {
	if a.indexer == nil {
		return 0, fmt.Errorf("indexer not initialized")
	}

	// TODO: Émettre des événements de progression vers le frontend
	return a.indexer.ReindexAllWatchedFolders(nil)
}

// === Gestion des tags ===

// CreateTag crée un nouveau tag
func (a *App) CreateTag(name string, tagType string, color string) error {
	if a.tagService == nil {
		return fmt.Errorf("tag service not initialized")
	}

	return a.tagService.CreateTag(name, models.TagType(tagType), color)
}

// GetAllTags retourne tous les tags
func (a *App) GetAllTags() ([]models.Tag, error) {
	if a.tagService == nil {
		return nil, fmt.Errorf("tag service not initialized")
	}

	return a.tagService.GetAllTags()
}

// GetAllTagsWithCount retourne tous les tags avec leur nombre de photos
func (a *App) GetAllTagsWithCount() ([]services.TagWithCount, error) {
	if a.tagService == nil {
		return nil, fmt.Errorf("tag service not initialized")
	}

	return a.tagService.GetAllTagsWithCount()
}

// UpdateTag met à jour un tag existant
func (a *App) UpdateTag(name string, tagType string, color string) error {
	if a.tagService == nil {
		return fmt.Errorf("tag service not initialized")
	}

	return a.tagService.UpdateTag(name, models.TagType(tagType), color)
}

// DeleteTag supprime un tag et toutes ses associations
func (a *App) DeleteTag(name string) error {
	if a.tagService == nil {
		return fmt.Errorf("tag service not initialized")
	}

	return a.tagService.DeleteTag(name)
}

// AddTagToPicture associe un tag à une photo
func (a *App) AddTagToPicture(picturePath string, tagName string) error {
	if a.tagService == nil {
		return fmt.Errorf("tag service not initialized")
	}

	return a.tagService.AddTagToPicture(picturePath, tagName)
}

// RemoveTagFromPicture dissocie un tag d'une photo
func (a *App) RemoveTagFromPicture(picturePath string, tagName string) error {
	if a.tagService == nil {
		return fmt.Errorf("tag service not initialized")
	}

	return a.tagService.RemoveTagFromPicture(picturePath, tagName)
}

// GetTagsForPicture retourne tous les tags d'une photo
func (a *App) GetTagsForPicture(picturePath string) ([]models.Tag, error) {
	if a.tagService == nil {
		return nil, fmt.Errorf("tag service not initialized")
	}

	return a.tagService.GetTagsForPicture(picturePath)
}

// SearchPicturesAdvanced effectue une recherche avancée par tags
// Exemple: (Clara AND Romaric) AND (Paris OR Compiegne)
func (a *App) SearchPicturesAdvanced(criteria services.SearchCriteria) ([]models.Picture, error) {
	if a.tagService == nil {
		return nil, fmt.Errorf("tag service not initialized")
	}

	return a.tagService.SearchPicturesAdvanced(criteria)
}
