package database

import (
	"fmt"
	"os"
	"path/filepath"

	"easygallery/backend/models"
	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

// Init initialise la connexion à la base de données SQLite
func Init(dataDir string) error {
	// Créer le dossier data s'il n'existe pas
	if err := os.MkdirAll(dataDir, 0755); err != nil {
		return fmt.Errorf("failed to create data directory: %w", err)
	}

	// Créer les sous-dossiers nécessaires
	thumbnailsDir := filepath.Join(dataDir, "thumbnails")
	if err := os.MkdirAll(thumbnailsDir, 0755); err != nil {
		return fmt.Errorf("failed to create thumbnails directory: %w", err)
	}

	// Chemin de la base de données
	dbPath := filepath.Join(dataDir, "easygallery.db")

	// Ouvrir la connexion SQLite avec GORM
	var err error
	DB, err = gorm.Open(sqlite.Open(dbPath), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		return fmt.Errorf("failed to open database: %w", err)
	}

	// Migration automatique des modèles
	if err := DB.AutoMigrate(
		&models.Picture{},
		&models.Tag{},
		&models.PictureTag{},
		&models.WatchedFolder{},
	); err != nil {
		return fmt.Errorf("failed to migrate database: %w", err)
	}

	fmt.Println("Database initialized successfully at:", dbPath)
	return nil
}

// Close ferme proprement la connexion à la base de données
func Close() error {
	if DB == nil {
		return nil
	}

	sqlDB, err := DB.DB()
	if err != nil {
		return fmt.Errorf("failed to get database instance: %w", err)
	}

	if err := sqlDB.Close(); err != nil {
		return fmt.Errorf("failed to close database: %w", err)
	}

	fmt.Println("Database closed successfully")
	return nil
}
