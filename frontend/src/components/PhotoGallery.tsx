import { useState, useEffect } from 'react'
import { GetIndexedPictures, GetPictureCount } from '../../wailsjs/go/main/App'
import { models } from '../../wailsjs/go/models'

export default function PhotoGallery() {
  const [pictures, setPictures] = useState<models.Picture[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedPicture, setSelectedPicture] = useState<models.Picture | null>(null)

  useEffect(() => {
    loadPictures()
    loadCount()
  }, [])

  const loadPictures = async () => {
    try {
      setLoading(true)
      const result = await GetIndexedPictures()
      setPictures(result || [])
    } catch (error) {
      console.error('Failed to load pictures:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCount = async () => {
    try {
      const count = await GetPictureCount()
      setTotalCount(count)
    } catch (error) {
      console.error('Failed to load picture count:', error)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDate = (date: any) => {
    if (!date) return 'Unknown'
    return new Date(date).toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400 text-xl">Loading pictures...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">
          Photo Gallery
          <span className="ml-3 text-gray-400 text-lg font-normal">
            ({totalCount} {totalCount === 1 ? 'picture' : 'pictures'})
          </span>
        </h2>
        <button
          onClick={loadPictures}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
        >
          Refresh
        </button>
      </div>

      {pictures.length === 0 ? (
        <div className="text-center py-12 bg-gray-800 rounded-lg">
          <p className="text-gray-400 text-lg">No pictures indexed yet</p>
          <p className="text-gray-500 text-sm mt-2">Add and index a folder to see your photos here</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {pictures.map((picture) => (
              <div
                key={picture.path}
                onClick={() => setSelectedPicture(picture)}
                className="group relative aspect-square bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
              >
                <img
                  src={`file://${picture.path}`}
                  alt={picture.filename}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback si l'image ne charge pas
                    e.currentTarget.style.display = 'none'
                  }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-opacity flex items-end p-3">
                  <div className="text-white text-sm truncate opacity-0 group-hover:opacity-100 transition-opacity">
                    {picture.filename}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Modal de détails de la photo */}
          {selectedPicture && (
            <div
              className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-8 z-50"
              onClick={() => setSelectedPicture(null)}
            >
              <div
                className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-full overflow-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <h3 className="text-2xl font-bold text-white">{selectedPicture.filename}</h3>
                    <button
                      onClick={() => setSelectedPicture(null)}
                      className="text-gray-400 hover:text-white text-2xl"
                    >
                      ×
                    </button>
                  </div>

                  <div className="bg-gray-900 rounded-lg p-4">
                    <img
                      src={`file://${selectedPicture.path}`}
                      alt={selectedPicture.filename}
                      className="w-full h-auto max-h-96 object-contain"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Path:</span>
                      <p className="text-white font-mono text-xs mt-1 break-all">{selectedPicture.path}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Size:</span>
                      <p className="text-white mt-1">{formatFileSize(selectedPicture.size)}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Dimensions:</span>
                      <p className="text-white mt-1">{selectedPicture.width} × {selectedPicture.height}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Created:</span>
                      <p className="text-white mt-1">{formatDate(selectedPicture.createdAt)}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Modified:</span>
                      <p className="text-white mt-1">{formatDate(selectedPicture.modifiedAt)}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Indexed:</span>
                      <p className="text-white mt-1">{formatDate(selectedPicture.indexedAt)}</p>
                    </div>
                  </div>

                  {selectedPicture.tags && selectedPicture.tags.length > 0 && (
                    <div>
                      <span className="text-gray-400 text-sm">Tags:</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedPicture.tags.map((tag) => (
                          <span
                            key={tag.name}
                            className="px-3 py-1 rounded-full text-sm"
                            style={{ backgroundColor: tag.color || '#3B82F6' }}
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
