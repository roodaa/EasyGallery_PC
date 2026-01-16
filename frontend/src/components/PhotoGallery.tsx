import { useState, useEffect, useCallback } from 'react'
import { GetIndexedPictures, GetPictureCount, SearchPicturesAdvanced } from '../../wailsjs/go/main/App'
import { models, services } from '../../wailsjs/go/models'
import ImageViewer from './ImageViewer'
import SearchBar from './SearchBar'
import { getImageUrl } from '../utils/imageUrl'

export default function PhotoGallery() {
  const [allPictures, setAllPictures] = useState<models.Picture[]>([])
  const [displayedPictures, setDisplayedPictures] = useState<models.Picture[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [isFiltered, setIsFiltered] = useState(false)

  useEffect(() => {
    loadPictures()
    loadCount()
  }, [])

  const loadPictures = async () => {
    try {
      setLoading(true)
      const result = await GetIndexedPictures()
      const pictures = result || []
      setAllPictures(pictures)
      setDisplayedPictures(pictures)
      setIsFiltered(false)
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

  // Recherche par tags
  const handleSearch = useCallback(async (criteria: services.SearchCriteria) => {
    try {
      const result = await SearchPicturesAdvanced(criteria)
      setDisplayedPictures(result || [])
      setIsFiltered(true)
    } catch (error) {
      console.error('Search failed:', error)
    }
  }, [])

  // Effacer le filtre
  const handleClearSearch = useCallback(() => {
    setDisplayedPictures(allPictures)
    setIsFiltered(false)
  }, [allPictures])

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
            {isFiltered ? (
              <>{displayedPictures.length} / {totalCount} photos</>
            ) : (
              <>({totalCount} {totalCount === 1 ? 'photo' : 'photos'})</>
            )}
          </span>
        </h2>
        <button
          onClick={loadPictures}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Barre de recherche */}
      <SearchBar onSearch={handleSearch} onClear={handleClearSearch} />

      {allPictures.length === 0 ? (
        <div className="text-center py-12 bg-gray-800 rounded-lg">
          <p className="text-gray-400 text-lg">No pictures indexed yet</p>
          <p className="text-gray-500 text-sm mt-2">Add and index a folder to see your photos here</p>
        </div>
      ) : displayedPictures.length === 0 ? (
        <div className="text-center py-12 bg-gray-800 rounded-lg">
          <p className="text-gray-400 text-lg">Aucune photo ne correspond aux criteres</p>
          <p className="text-gray-500 text-sm mt-2">Modifiez vos filtres ou effacez la recherche</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {displayedPictures.map((picture, index) => (
              <div
                key={picture.path}
                onClick={() => setSelectedIndex(index)}
                className="group relative aspect-square bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
              >
                <img
                  src={getImageUrl(picture.path)}
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

          {/* Image viewer */}
          {selectedIndex !== null && (
            <ImageViewer
              pictures={displayedPictures}
              initialIndex={selectedIndex}
              onClose={() => setSelectedIndex(null)}
              onDelete={(deletedPath) => {
                // Remove the deleted picture from local state
                setAllPictures((prev) => prev.filter((p) => p.path !== deletedPath))
                setDisplayedPictures((prev) => prev.filter((p) => p.path !== deletedPath))
                setTotalCount((prev) => prev - 1)
              }}
            />
          )}
        </>
      )}
    </div>
  )
}
