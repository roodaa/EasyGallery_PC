package main

import (
	"embed"
	"net/http"
	"os"
	"strings"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

// Embarque tous les fichiers React compilés dans l'exécutable
//go:embed all:frontend/dist
var assets embed.FS

// LocalFileMiddleware crée un middleware qui sert les fichiers locaux via /localfile/
func LocalFileMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Intercepter les requêtes vers /localfile/
		if strings.HasPrefix(r.URL.Path, "/localfile/") {
			// Extraire le chemin du fichier (après /localfile/)
			filePath := strings.TrimPrefix(r.URL.Path, "/localfile/")

			// Décoder les caractères URL encodés
			filePath = strings.ReplaceAll(filePath, "%20", " ")
			filePath = strings.ReplaceAll(filePath, "%5C", "\\")

			// Vérifier que le fichier existe
			if _, err := os.Stat(filePath); os.IsNotExist(err) {
				http.Error(w, "File not found", http.StatusNotFound)
				return
			}

			// Servir le fichier
			http.ServeFile(w, r, filePath)
			return
		}

		// Pour les autres requêtes, passer au handler suivant
		next.ServeHTTP(w, r)
	})
}

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
			Assets:     assets,
			Middleware: assetserver.ChainMiddleware(LocalFileMiddleware),
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
