/**
 * Convertit un chemin de fichier local en URL utilisable par l'application.
 * Utilise le middleware /localfile/ pour servir les fichiers du système.
 */
export function getImageUrl(filePath: string): string {
  // Encoder le chemin pour l'URL (gérer les espaces et caractères spéciaux)
  const encodedPath = filePath
    .replace(/\\/g, '/')  // Convertir les backslashes Windows en slashes

  return `/localfile/${encodedPath}`
}
