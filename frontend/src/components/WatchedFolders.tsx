import { useState, useEffect } from 'react'
import { GetWatchedFolders, AddWatchedFolder, RemoveWatchedFolder, IndexWatchedFolder, ReindexAllWatchedFolders, SelectFolder } from '../../wailsjs/go/main/App'
import { models } from '../../wailsjs/go/models'

export default function WatchedFolders() {
  const [folders, setFolders] = useState<models.WatchedFolder[]>([])
  const [loading, setLoading] = useState(false)
  const [indexing, setIndexing] = useState<string | null>(null)

  // Charger les dossiers surveillés au montage du composant
  useEffect(() => {
    loadFolders()
  }, [])

  const loadFolders = async () => {
    try {
      const result = await GetWatchedFolders()
      setFolders(result || [])
    } catch (error) {
      console.error('Failed to load watched folders:', error)
    }
  }

  const handleAddFolder = async () => {
    try {
      // Ouvrir un dialogue de sélection de dossier natif
      const folderPath = await SelectFolder()

      if (!folderPath) return

      const folderName = prompt('Enter a friendly name (optional):') || ''

      setLoading(true)
      await AddWatchedFolder(folderPath, folderName, false)
      await loadFolders()
    } catch (error) {
      alert(`Failed to add folder: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveFolder = async (path: string) => {
    if (!confirm(`Remove folder "${path}" from watched list?`)) return

    try {
      setLoading(true)
      await RemoveWatchedFolder(path)
      await loadFolders()
    } catch (error) {
      alert(`Failed to remove folder: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const handleIndexFolder = async (path: string) => {
    try {
      setIndexing(path)
      const count = await IndexWatchedFolder(path)
      alert(`Successfully indexed ${count} pictures`)
      await loadFolders() // Recharger pour mettre à jour les stats
    } catch (error) {
      alert(`Failed to index folder: ${error}`)
    } finally {
      setIndexing(null)
    }
  }

  const handleReindexAll = async () => {
    if (!confirm('Reindex all watched folders?')) return

    try {
      setLoading(true)
      const count = await ReindexAllWatchedFolders()
      alert(`Successfully indexed ${count} pictures across all folders`)
      await loadFolders()
    } catch (error) {
      alert(`Failed to reindex folders: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: any) => {
    if (!date) return 'Never'
    return new Date(date).toLocaleString()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Watched Folders</h2>
        <div className="space-x-2">
          <button
            onClick={handleAddFolder}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            Add Folder
          </button>
          <button
            onClick={handleReindexAll}
            disabled={loading || folders.length === 0}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            Reindex All
          </button>
        </div>
      </div>

      {folders.length === 0 ? (
        <div className="text-center py-12 bg-gray-800 rounded-lg">
          <p className="text-gray-400 text-lg">No folders being watched</p>
          <p className="text-gray-500 text-sm mt-2">Add a folder to start indexing your photos</p>
        </div>
      ) : (
        <div className="space-y-4">
          {folders.map((folder) => (
            <div
              key={folder.path}
              className="bg-gray-800 rounded-lg p-4 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white">
                    {folder.name || 'Unnamed Folder'}
                  </h3>
                  <p className="text-gray-400 text-sm font-mono">{folder.path}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleIndexFolder(folder.path)}
                    disabled={indexing === folder.path}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors disabled:opacity-50"
                  >
                    {indexing === folder.path ? 'Indexing...' : 'Index'}
                  </button>
                  <button
                    onClick={() => handleRemoveFolder(folder.path)}
                    disabled={loading}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Pictures:</span>
                  <span className="ml-2 text-white font-medium">{folder.pictureCount || 0}</span>
                </div>
                <div>
                  <span className="text-gray-500">Added:</span>
                  <span className="ml-2 text-white">{formatDate(folder.addedAt)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Last Indexed:</span>
                  <span className="ml-2 text-white">{formatDate(folder.lastIndexedAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
