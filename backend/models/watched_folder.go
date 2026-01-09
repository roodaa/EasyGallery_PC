package models

import (
	"time"
)

// WatchedFolder représente un dossier surveillé pour l'indexation
type WatchedFolder struct {
	Path           string    `gorm:"primaryKey" json:"path"`           // Chemin absolu du dossier (ID unique)
	Name           string    `gorm:"not null" json:"name"`             // Nom convivial du dossier
	AddedAt        time.Time `gorm:"autoCreateTime" json:"addedAt"`    // Date d'ajout
	LastIndexedAt  time.Time `json:"lastIndexedAt"`                    // Dernière indexation
	PictureCount   int       `json:"pictureCount"`                     // Nombre de photos indexées
	AutoReindex    bool      `gorm:"default:false" json:"autoReindex"` // Ré-indexation automatique
}

// TableName spécifie le nom de la table dans la DB
func (WatchedFolder) TableName() string {
	return "watched_folders"
}
