package main

import (
	"context"
	"fmt"
	"os"
	"path/filepath"

	"easygallery/backend/database"
	"easygallery/backend/models"
	"easygallery/backend/services"
)

// App est la structure principale du backend
// Toutes ses méthodes publiques sont accessibles depuis React
type App struct {
	ctx     context.Context
	indexer *services.Indexer
	dataDir string
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
		// Note: En production, on pourrait vouloir afficher une erreur à l'utilisateur
	}

	// Initialiser l'indexer
	a.indexer = services.NewIndexer(a.dataDir)
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
