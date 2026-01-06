package models

import (
	"time"
)

// TagType représente le type d'un tag
type TagType string

const (
	TagTypePerson   TagType = "person"   // Personne
	TagTypeLocation TagType = "location" // Lieu
	TagTypeEvent    TagType = "event"    // Événement
	TagTypeOther    TagType = "other"    // Autre
)

// Tag représente un tag qui peut être associé à des photos
type Tag struct {
	Name      string    `gorm:"primaryKey" json:"name"` // Nom unique du tag (ID)
	Type      TagType   `gorm:"not null" json:"type"`   // Type du tag
	Color     string    `json:"color"`                  // Couleur HEX pour l'UI (ex: "#3B82F6")
	CreatedAt time.Time `gorm:"autoCreateTime" json:"createdAt"`

	// Relations
	Pictures []Picture `gorm:"many2many:picture_tags;" json:"pictures,omitempty"` // Photos associées
}

// TableName spécifie le nom de la table dans la DB
func (Tag) TableName() string {
	return "tags"
}
