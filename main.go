package main

import (
	"embed"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

// Embarque tous les fichiers React compilés dans l'exécutable
//go:embed all:frontend/dist
var assets embed.FS

func main() {
	// Créer l'instance de l'application backend
	app := NewApp()

	// Lancer l'application Wails
	err := wails.Run(&options.App{
		Title:  "EasyGallery",
		Width:  1280,
		Height: 768,
		MinWidth:  800,
		MinHeight: 600,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 26, G: 26, B: 26, A: 1},
		OnStartup:  app.startup,
		OnShutdown: app.shutdown,
		// Expose les méthodes de app au frontend React
		Bind: []interface{}{
			app,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
