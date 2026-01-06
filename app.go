package main

import (
	"context"
	"fmt"
)

// App est la structure principale du backend
// Toutes ses méthodes publiques sont accessibles depuis React
type App struct {
	ctx context.Context
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

	// TODO: Initialiser la base de données ici
	// TODO: Créer les dossiers data (thumbnails, config)
}

// shutdown est appelé à la fermeture de l'application
func (a *App) shutdown(ctx context.Context) {
	fmt.Println("EasyGallery shutting down...")

	// TODO: Fermer la connexion à la base de données
}

// Greet est une méthode de test accessible depuis React
// Elle sera automatiquement exposée au frontend
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, welcome to EasyGallery!", name)
}
