package models

import (
	"time"
)

// Picture représente une photo dans la galerie
type Picture struct {
	Path       string    `gorm:"primaryKey" json:"path"`        // Chemin absolu (ID unique)
	Filename   string    `gorm:"not null" json:"filename"`      // Nom du fichier
	Size       int64     `json:"size"`                          // Taille en bytes
	Width      int       `json:"width"`                         // Largeur en pixels
	Height     int       `json:"height"`                        // Hauteur en pixels
	CreatedAt  time.Time `json:"createdAt"`                     // Date de création du fichier
	ModifiedAt time.Time `json:"modifiedAt"`                    // Date de modification du fichier
	IndexedAt  time.Time `gorm:"autoCreateTime" json:"indexedAt"` // Date d'indexation dans la DB

	// Relations
	Tags []Tag `gorm:"many2many:picture_tags;" json:"tags"` // Tags associés à la photo
}

// TableName spécifie le nom de la table dans la DB
func (Picture) TableName() string {
	return "pictures"
}
