package models

import (
	"time"
)

// PictureTag représente la table d'association many-to-many entre Picture et Tag
type PictureTag struct {
	PicturePath string    `gorm:"primaryKey" json:"picturePath"` // FK vers Picture.Path
	TagName     string    `gorm:"primaryKey" json:"tagName"`     // FK vers Tag.Name
	CreatedAt   time.Time `gorm:"autoCreateTime" json:"createdAt"`

	// Relations
	Picture Picture `gorm:"foreignKey:PicturePath;references:Path" json:"picture,omitempty"`
	Tag     Tag     `gorm:"foreignKey:TagName;references:Name" json:"tag,omitempty"`
}

// TableName spécifie le nom de la table dans la DB
func (PictureTag) TableName() string {
	return "picture_tags"
}
