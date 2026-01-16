package services

import (
	"fmt"
	"strings"

	"easygallery/backend/database"
	"easygallery/backend/models"
)

// TagService gère les opérations sur les tags
type TagService struct{}

// NewTagService crée une nouvelle instance de TagService
func NewTagService() *TagService {
	return &TagService{}
}

// CreateTag crée un nouveau tag
func (ts *TagService) CreateTag(name string, tagType models.TagType, color string) error {
	if err := checkDB(); err != nil {
		return err
	}

	// Valider le nom
	name = strings.TrimSpace(name)
	if name == "" {
		return fmt.Errorf("tag name cannot be empty")
	}

	// Valider le type
	validTypes := map[models.TagType]bool{
		models.TagTypePerson:   true,
		models.TagTypeLocation: true,
		models.TagTypeEvent:    true,
		models.TagTypeOther:    true,
	}
	if !validTypes[tagType] {
		return fmt.Errorf("invalid tag type: %s", tagType)
	}

	// Vérifier si le tag existe déjà
	var existing models.Tag
	if err := database.DB.Where("name = ?", name).First(&existing).Error; err == nil {
		return fmt.Errorf("tag '%s' already exists", name)
	}

	tag := models.Tag{
		Name:  name,
		Type:  tagType,
		Color: color,
	}

	if err := database.DB.Create(&tag).Error; err != nil {
		return fmt.Errorf("cannot create tag: %w", err)
	}

	return nil
}

// GetAllTags retourne tous les tags
func (ts *TagService) GetAllTags() ([]models.Tag, error) {
	if err := checkDB(); err != nil {
		return nil, err
	}

	var tags []models.Tag
	if err := database.DB.Find(&tags).Error; err != nil {
		return nil, fmt.Errorf("cannot fetch tags: %w", err)
	}

	return tags, nil
}

// TagWithCount représente un tag avec son nombre de photos associées
type TagWithCount struct {
	models.Tag
	PictureCount int64 `json:"pictureCount"`
}

// GetAllTagsWithCount retourne tous les tags avec leur nombre de photos
func (ts *TagService) GetAllTagsWithCount() ([]TagWithCount, error) {
	if err := checkDB(); err != nil {
		return nil, err
	}

	var tags []models.Tag
	if err := database.DB.Find(&tags).Error; err != nil {
		return nil, fmt.Errorf("cannot fetch tags: %w", err)
	}

	result := make([]TagWithCount, len(tags))
	for i, tag := range tags {
		var count int64
		database.DB.Model(&models.PictureTag{}).Where("tag_name = ?", tag.Name).Count(&count)
		result[i] = TagWithCount{
			Tag:          tag,
			PictureCount: count,
		}
	}

	return result, nil
}

// UpdateTag met à jour un tag existant
func (ts *TagService) UpdateTag(name string, tagType models.TagType, color string) error {
	if err := checkDB(); err != nil {
		return err
	}

	var tag models.Tag
	if err := database.DB.Where("name = ?", name).First(&tag).Error; err != nil {
		return fmt.Errorf("tag '%s' not found", name)
	}

	tag.Type = tagType
	tag.Color = color

	if err := database.DB.Save(&tag).Error; err != nil {
		return fmt.Errorf("cannot update tag: %w", err)
	}

	return nil
}

// DeleteTag supprime un tag et toutes ses associations
func (ts *TagService) DeleteTag(name string) error {
	if err := checkDB(); err != nil {
		return err
	}

	// Supprimer d'abord les associations
	if err := database.DB.Where("tag_name = ?", name).Delete(&models.PictureTag{}).Error; err != nil {
		return fmt.Errorf("cannot delete tag associations: %w", err)
	}

	// Supprimer le tag
	result := database.DB.Where("name = ?", name).Delete(&models.Tag{})
	if result.Error != nil {
		return fmt.Errorf("cannot delete tag: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return fmt.Errorf("tag '%s' not found", name)
	}

	return nil
}

// AddTagToPicture associe un tag à une photo
func (ts *TagService) AddTagToPicture(picturePath string, tagName string) error {
	if err := checkDB(); err != nil {
		return err
	}

	// Vérifier que la photo existe
	var picture models.Picture
	if err := database.DB.Where("path = ?", picturePath).First(&picture).Error; err != nil {
		return fmt.Errorf("picture not found: %s", picturePath)
	}

	// Vérifier que le tag existe
	var tag models.Tag
	if err := database.DB.Where("name = ?", tagName).First(&tag).Error; err != nil {
		return fmt.Errorf("tag not found: %s", tagName)
	}

	// Vérifier si l'association existe déjà
	var existing models.PictureTag
	if err := database.DB.Where("picture_path = ? AND tag_name = ?", picturePath, tagName).First(&existing).Error; err == nil {
		return nil // L'association existe déjà, pas d'erreur
	}

	// Créer l'association
	pictureTag := models.PictureTag{
		PicturePath: picturePath,
		TagName:     tagName,
	}

	if err := database.DB.Create(&pictureTag).Error; err != nil {
		return fmt.Errorf("cannot add tag to picture: %w", err)
	}

	return nil
}

// RemoveTagFromPicture dissocie un tag d'une photo
func (ts *TagService) RemoveTagFromPicture(picturePath string, tagName string) error {
	if err := checkDB(); err != nil {
		return err
	}

	result := database.DB.Where("picture_path = ? AND tag_name = ?", picturePath, tagName).Delete(&models.PictureTag{})
	if result.Error != nil {
		return fmt.Errorf("cannot remove tag from picture: %w", result.Error)
	}

	return nil
}

// GetTagsForPicture retourne tous les tags d'une photo
func (ts *TagService) GetTagsForPicture(picturePath string) ([]models.Tag, error) {
	if err := checkDB(); err != nil {
		return nil, err
	}

	var tags []models.Tag
	err := database.DB.
		Joins("JOIN picture_tags ON picture_tags.tag_name = tags.name").
		Where("picture_tags.picture_path = ?", picturePath).
		Find(&tags).Error

	if err != nil {
		return nil, fmt.Errorf("cannot fetch tags for picture: %w", err)
	}

	return tags, nil
}

// TagCriteria représente les critères de recherche pour un type de tag
type TagCriteria struct {
	Tags     []string `json:"tags"`     // Liste des noms de tags
	Operator string   `json:"operator"` // "AND" ou "OR"
}

// SearchCriteria représente les critères de recherche avancée
// Exemple: (Clara AND Romaric) AND (Paris OR Compiegne)
type SearchCriteria struct {
	Persons   TagCriteria `json:"persons"`   // Tags de type person
	Locations TagCriteria `json:"locations"` // Tags de type location
	Events    TagCriteria `json:"events"`    // Tags de type event
	Others    TagCriteria `json:"others"`    // Tags de type other
}

// SearchPicturesAdvanced effectue une recherche avancée avec critères par type
// Chaque groupe de type utilise son opérateur interne (AND/OR)
// Les groupes non-vides sont combinés avec AND entre eux
//
// Requête SQL optimisée générée dynamiquement
func (ts *TagService) SearchPicturesAdvanced(criteria SearchCriteria) ([]models.Picture, error) {
	if err := checkDB(); err != nil {
		return nil, err
	}

	// Collecter tous les groupes non-vides avec leurs critères
	type groupCriteria struct {
		tags     []string
		operator string
	}
	var groups []groupCriteria

	if len(criteria.Persons.Tags) > 0 {
		groups = append(groups, groupCriteria{criteria.Persons.Tags, criteria.Persons.Operator})
	}
	if len(criteria.Locations.Tags) > 0 {
		groups = append(groups, groupCriteria{criteria.Locations.Tags, criteria.Locations.Operator})
	}
	if len(criteria.Events.Tags) > 0 {
		groups = append(groups, groupCriteria{criteria.Events.Tags, criteria.Events.Operator})
	}
	if len(criteria.Others.Tags) > 0 {
		groups = append(groups, groupCriteria{criteria.Others.Tags, criteria.Others.Operator})
	}

	// Si aucun critère, retourner toutes les photos
	if len(groups) == 0 {
		var pictures []models.Picture
		if err := database.DB.Find(&pictures).Error; err != nil {
			return nil, err
		}
		return pictures, nil
	}

	// Construction de la requête SQL optimisée
	// Stratégie: pour chaque groupe, on crée une sous-requête qui retourne les picture_path
	// puis on fait l'intersection (AND) de toutes ces sous-requêtes
	//
	// Pour un groupe avec OR: SELECT DISTINCT picture_path FROM picture_tags WHERE tag_name IN (...)
	// Pour un groupe avec AND: SELECT picture_path FROM picture_tags WHERE tag_name IN (...) GROUP BY picture_path HAVING COUNT(DISTINCT tag_name) = n

	var subQueries []string
	var allArgs []interface{}

	for _, g := range groups {
		if strings.ToUpper(g.operator) == "OR" || len(g.tags) == 1 {
			// OR: au moins un tag du groupe
			subQueries = append(subQueries,
				"SELECT DISTINCT picture_path FROM picture_tags WHERE tag_name IN (?)")
			allArgs = append(allArgs, g.tags)
		} else {
			// AND: tous les tags du groupe
			subQueries = append(subQueries,
				"SELECT picture_path FROM picture_tags WHERE tag_name IN (?) GROUP BY picture_path HAVING COUNT(DISTINCT tag_name) = ?")
			allArgs = append(allArgs, g.tags, len(g.tags))
		}
	}

	// Intersection de toutes les sous-requêtes
	// Utilise INTERSECT pour combiner les résultats (AND entre groupes)
	var finalQuery string
	if len(subQueries) == 1 {
		finalQuery = subQueries[0]
	} else {
		// SQLite supporte INTERSECT
		finalQuery = "(" + strings.Join(subQueries, ") INTERSECT (") + ")"
	}

	// Exécuter la requête pour obtenir les paths
	var paths []string
	if err := database.DB.Raw(finalQuery, allArgs...).Scan(&paths).Error; err != nil {
		return nil, fmt.Errorf("cannot execute search query: %w", err)
	}

	if len(paths) == 0 {
		return []models.Picture{}, nil
	}

	// Récupérer les photos correspondantes
	var pictures []models.Picture
	if err := database.DB.Where("path IN ?", paths).Find(&pictures).Error; err != nil {
		return nil, fmt.Errorf("cannot fetch pictures: %w", err)
	}

	return pictures, nil
}
