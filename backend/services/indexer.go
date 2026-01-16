package services

import (
	"fmt"
	"image"
	_ "image/gif"
	_ "image/jpeg"
	_ "image/png"
	"io"
	"os"
	"path/filepath"
	"strings"
	"time"

	"easygallery/backend/database"
	"easygallery/backend/models"
)

// Indexer gère l'indexation des photos
type Indexer struct {
	dataDir string
}

// NewIndexer crée une nouvelle instance d'Indexer
func NewIndexer(dataDir string) *Indexer {
	return &Indexer{
		dataDir: dataDir,
	}
}

// checkDB vérifie si la base de données est initialisée
func checkDB() error {
	if database.DB == nil {
		return fmt.Errorf("database not initialized")
	}
	return nil
}

// SupportedExtensions liste des extensions d'images supportées
var SupportedExtensions = []string{".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"}

// isSupportedImage vérifie si le fichier est une image supportée
func isSupportedImage(filename string) bool {
	ext := strings.ToLower(filepath.Ext(filename))
	for _, supportedExt := range SupportedExtensions {
		if ext == supportedExt {
			return true
		}
	}
	return false
}

// IndexFolder indexe récursivement un dossier
// Retourne le nombre de photos indexées et une erreur éventuelle
func (idx *Indexer) IndexFolder(folderPath string, onProgress func(current, total int, filename string)) (int, error) {
	// Vérifier que le dossier existe
	info, err := os.Stat(folderPath)
	if err != nil {
		return 0, fmt.Errorf("folder not found: %w", err)
	}
	if !info.IsDir() {
		return 0, fmt.Errorf("path is not a directory: %s", folderPath)
	}

	// Première passe: compter les fichiers images
	var imageFiles []string
	err = filepath.Walk(folderPath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if !info.IsDir() && isSupportedImage(info.Name()) {
			imageFiles = append(imageFiles, path)
		}
		return nil
	})
	if err != nil {
		return 0, fmt.Errorf("error scanning folder: %w", err)
	}

	// Indexer chaque fichier
	indexed := 0
	total := len(imageFiles)

	for i, imagePath := range imageFiles {
		// Notifier la progression
		if onProgress != nil {
			onProgress(i+1, total, filepath.Base(imagePath))
		}

		// Indexer l'image
		if err := idx.indexImage(imagePath); err != nil {
			fmt.Printf("Warning: failed to index %s: %v\n", imagePath, err)
			// Continue avec les autres images
			continue
		}

		indexed++
	}

	return indexed, nil
}

// indexImage indexe une seule image
func (idx *Indexer) indexImage(imagePath string) error {
	if err := checkDB(); err != nil {
		return err
	}

	// Vérifier si l'image existe déjà dans la DB
	var existingPicture models.Picture
	result := database.DB.Where("path = ?", imagePath).First(&existingPicture)

	// Si elle existe déjà, vérifier si elle a été modifiée
	fileInfo, err := os.Stat(imagePath)
	if err != nil {
		return fmt.Errorf("cannot stat file: %w", err)
	}

	if result.Error == nil {
		// L'image existe déjà
		if fileInfo.ModTime().Equal(existingPicture.ModifiedAt) {
			// Pas de modification, on skip
			return nil
		}
	}

	// Extraire les métadonnées
	metadata, err := idx.extractMetadata(imagePath)
	if err != nil {
		return fmt.Errorf("cannot extract metadata: %w", err)
	}

	// Générer la miniature
	thumbnailPath, err := idx.generateThumbnail(imagePath)
	if err != nil {
		fmt.Printf("Warning: failed to generate thumbnail for %s: %v\n", imagePath, err)
		// On continue même si la miniature échoue
	}
	_ = thumbnailPath // Pour l'instant, on stocke juste le chemin

	// Créer ou mettre à jour l'entrée dans la DB
	picture := models.Picture{
		Path:       imagePath,
		Filename:   filepath.Base(imagePath),
		Size:       metadata.Size,
		Width:      metadata.Width,
		Height:     metadata.Height,
		CreatedAt:  metadata.CreatedAt,
		ModifiedAt: metadata.ModifiedAt,
	}

	// Upsert (insert or update)
	if err := database.DB.Save(&picture).Error; err != nil {
		return fmt.Errorf("cannot save to database: %w", err)
	}

	return nil
}

// ImageMetadata contient les métadonnées d'une image
type ImageMetadata struct {
	Width      int
	Height     int
	Size       int64
	CreatedAt  time.Time
	ModifiedAt time.Time
}

// extractMetadata extrait les métadonnées d'une image
func (idx *Indexer) extractMetadata(imagePath string) (*ImageMetadata, error) {
	// Ouvrir le fichier
	file, err := os.Open(imagePath)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	// Obtenir les infos du fichier
	fileInfo, err := file.Stat()
	if err != nil {
		return nil, err
	}

	// Décoder l'image pour obtenir les dimensions
	img, _, err := image.DecodeConfig(file)
	if err != nil {
		return nil, fmt.Errorf("cannot decode image: %w", err)
	}

	return &ImageMetadata{
		Width:      img.Width,
		Height:     img.Height,
		Size:       fileInfo.Size(),
		CreatedAt:  fileInfo.ModTime(), // Sous Windows, c'est souvent la date de création
		ModifiedAt: fileInfo.ModTime(),
	}, nil
}

// generateThumbnail génère une miniature de l'image
func (idx *Indexer) generateThumbnail(imagePath string) (string, error) {
	// Créer le dossier thumbnails s'il n'existe pas
	thumbnailsDir := filepath.Join(idx.dataDir, "thumbnails")
	if err := os.MkdirAll(thumbnailsDir, 0755); err != nil {
		return "", err
	}

	// Générer un nom de fichier pour la miniature basé sur le hash du chemin
	// Pour simplifier, on utilise le nom de fichier + un hash simple
	thumbnailName := fmt.Sprintf("thumb_%s", filepath.Base(imagePath))
	thumbnailPath := filepath.Join(thumbnailsDir, thumbnailName)

	// TODO: Implémenter la génération de miniature réelle avec resize
	// Pour l'instant, on retourne juste le chemin

	// Placeholder: copier le fichier original (à remplacer par un vrai resize)
	src, err := os.Open(imagePath)
	if err != nil {
		return "", err
	}
	defer src.Close()

	dst, err := os.Create(thumbnailPath)
	if err != nil {
		return "", err
	}
	defer dst.Close()

	if _, err := io.Copy(dst, src); err != nil {
		return "", err
	}

	return thumbnailPath, nil
}

// GetIndexedPictures retourne toutes les photos indexées
func (idx *Indexer) GetIndexedPictures() ([]models.Picture, error) {
	if err := checkDB(); err != nil {
		return nil, err
	}

	var pictures []models.Picture
	if err := database.DB.Find(&pictures).Error; err != nil {
		return nil, err
	}
	return pictures, nil
}

// GetPictureCount retourne le nombre de photos indexées
func (idx *Indexer) GetPictureCount() (int64, error) {
	if err := checkDB(); err != nil {
		return 0, err
	}

	var count int64
	if err := database.DB.Model(&models.Picture{}).Count(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}

// DeletePicture supprime une photo de l'index et optionnellement du disque
func (idx *Indexer) DeletePicture(picturePath string, deleteFromDisk bool) error {
	if err := checkDB(); err != nil {
		return err
	}

	// Supprimer de la base de données
	result := database.DB.Delete(&models.Picture{}, "path = ?", picturePath)
	if result.Error != nil {
		return fmt.Errorf("cannot delete picture from database: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return fmt.Errorf("picture not found in database: %s", picturePath)
	}

	// Supprimer du disque si demandé
	if deleteFromDisk {
		if err := os.Remove(picturePath); err != nil {
			return fmt.Errorf("deleted from database but failed to delete file: %w", err)
		}
	}

	return nil
}

// === Gestion des dossiers surveillés ===

// AddWatchedFolder ajoute un dossier à la liste des dossiers surveillés
func (idx *Indexer) AddWatchedFolder(folderPath string, name string, autoReindex bool) error {
	if err := checkDB(); err != nil {
		return err
	}

	// Vérifier que le dossier existe
	info, err := os.Stat(folderPath)
	if err != nil {
		return fmt.Errorf("folder not found: %w", err)
	}
	if !info.IsDir() {
		return fmt.Errorf("path is not a directory: %s", folderPath)
	}

	// Convertir en chemin absolu
	absPath, err := filepath.Abs(folderPath)
	if err != nil {
		return fmt.Errorf("cannot get absolute path: %w", err)
	}

	// Si le nom n'est pas fourni, utiliser le nom du dossier
	if name == "" {
		name = filepath.Base(absPath)
	}

	// Créer l'entrée dans la DB
	watchedFolder := models.WatchedFolder{
		Path:        absPath,
		Name:        name,
		AutoReindex: autoReindex,
	}

	// Upsert
	if err := database.DB.Save(&watchedFolder).Error; err != nil {
		return fmt.Errorf("cannot save watched folder: %w", err)
	}

	return nil
}

// RemoveWatchedFolder retire un dossier de la liste des dossiers surveillés
func (idx *Indexer) RemoveWatchedFolder(folderPath string) error {
	if err := checkDB(); err != nil {
		return err
	}

	result := database.DB.Delete(&models.WatchedFolder{}, "path = ?", folderPath)
	if result.Error != nil {
		return fmt.Errorf("cannot delete watched folder: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return fmt.Errorf("watched folder not found: %s", folderPath)
	}
	return nil
}

// GetWatchedFolders retourne tous les dossiers surveillés
func (idx *Indexer) GetWatchedFolders() ([]models.WatchedFolder, error) {
	if err := checkDB(); err != nil {
		return nil, err
	}

	var folders []models.WatchedFolder
	if err := database.DB.Find(&folders).Error; err != nil {
		return nil, err
	}
	return folders, nil
}

// UpdateWatchedFolder met à jour les métadonnées d'un dossier surveillé
func (idx *Indexer) UpdateWatchedFolder(folderPath string, name string, autoReindex bool) error {
	if err := checkDB(); err != nil {
		return err
	}

	var folder models.WatchedFolder
	if err := database.DB.Where("path = ?", folderPath).First(&folder).Error; err != nil {
		return fmt.Errorf("watched folder not found: %w", err)
	}

	folder.Name = name
	folder.AutoReindex = autoReindex

	if err := database.DB.Save(&folder).Error; err != nil {
		return fmt.Errorf("cannot update watched folder: %w", err)
	}

	return nil
}

// IndexWatchedFolder indexe un dossier surveillé et met à jour ses statistiques
func (idx *Indexer) IndexWatchedFolder(folderPath string, onProgress func(current, total int, filename string)) (int, error) {
	if err := checkDB(); err != nil {
		return 0, err
	}

	// Vérifier que le dossier est bien surveillé
	var folder models.WatchedFolder
	if err := database.DB.Where("path = ?", folderPath).First(&folder).Error; err != nil {
		return 0, fmt.Errorf("watched folder not found: %w", err)
	}

	// Indexer le dossier
	count, err := idx.IndexFolder(folderPath, onProgress)
	if err != nil {
		return 0, err
	}

	// Mettre à jour les statistiques
	folder.LastIndexedAt = time.Now()
	folder.PictureCount = count

	if err := database.DB.Save(&folder).Error; err != nil {
		return count, fmt.Errorf("indexed %d pictures but failed to update stats: %w", count, err)
	}

	return count, nil
}

// ReindexAllWatchedFolders ré-indexe tous les dossiers surveillés
func (idx *Indexer) ReindexAllWatchedFolders(onProgress func(folderName string, current, total int)) (int, error) {
	folders, err := idx.GetWatchedFolders()
	if err != nil {
		return 0, err
	}

	totalIndexed := 0
	for _, folder := range folders {
		if onProgress != nil {
			onProgress(folder.Name, 0, 0)
		}

		count, err := idx.IndexWatchedFolder(folder.Path, nil)
		if err != nil {
			fmt.Printf("Warning: failed to index folder %s: %v\n", folder.Path, err)
			continue
		}

		totalIndexed += count
	}

	return totalIndexed, nil
}
