import { useState, useEffect, useCallback } from 'react'
import { models } from '../../wailsjs/go/models'
import { DeletePicture, GetAllTags, GetTagsForPicture, AddTagToPicture, RemoveTagFromPicture } from '../../wailsjs/go/main/App'
import { getImageUrl } from '../utils/imageUrl'

interface ImageViewerProps {
  pictures: models.Picture[]
  initialIndex: number
  onClose: () => void
  onDelete?: (path: string) => void
}

export default function ImageViewer({ pictures, initialIndex, onClose, onDelete }: ImageViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [showInfo, setShowInfo] = useState(true)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Tags state
  const [allTags, setAllTags] = useState<models.Tag[]>([])
  const [pictureTags, setPictureTags] = useState<models.Tag[]>([])
  const [showTagSelector, setShowTagSelector] = useState(false)
  const [tagLoading, setTagLoading] = useState(false)

  const currentPicture = pictures[currentIndex]

  // Load all available tags
  useEffect(() => {
    const loadAllTags = async () => {
      try {
        const tags = await GetAllTags()
        setAllTags(tags || [])
      } catch (error) {
        console.error('Failed to load tags:', error)
      }
    }
    loadAllTags()
  }, [])

  // Load tags for current picture when it changes
  useEffect(() => {
    const loadPictureTags = async () => {
      if (!currentPicture) return
      try {
        const tags = await GetTagsForPicture(currentPicture.path)
        setPictureTags(tags || [])
      } catch (error) {
        console.error('Failed to load picture tags:', error)
        setPictureTags([])
      }
    }
    loadPictureTags()
  }, [currentPicture?.path])

  const handleAddTag = async (tagName: string) => {
    if (!currentPicture || tagLoading) return
    setTagLoading(true)
    try {
      await AddTagToPicture(currentPicture.path, tagName)
      const tags = await GetTagsForPicture(currentPicture.path)
      setPictureTags(tags || [])
    } catch (error) {
      console.error('Failed to add tag:', error)
    } finally {
      setTagLoading(false)
      setShowTagSelector(false)
    }
  }

  const handleRemoveTag = async (tagName: string) => {
    if (!currentPicture || tagLoading) return
    setTagLoading(true)
    try {
      await RemoveTagFromPicture(currentPicture.path, tagName)
      const tags = await GetTagsForPicture(currentPicture.path)
      setPictureTags(tags || [])
    } catch (error) {
      console.error('Failed to remove tag:', error)
    } finally {
      setTagLoading(false)
    }
  }

  // Tags not yet assigned to this picture
  const availableTags = allTags.filter(
    tag => !pictureTags.some(pt => pt.name === tag.name)
  )

  const handleDelete = async (deleteFromDisk: boolean) => {
    if (!currentPicture || isDeleting) return

    setIsDeleting(true)
    try {
      await DeletePicture(currentPicture.path, deleteFromDisk)

      // Notify parent component
      if (onDelete) {
        onDelete(currentPicture.path)
      }

      // If this was the last picture, close the viewer
      if (pictures.length <= 1) {
        onClose()
        return
      }

      // Move to next picture (or previous if we're at the end)
      if (currentIndex >= pictures.length - 1) {
        setCurrentIndex(currentIndex - 1)
      }

      setShowDeleteDialog(false)
    } catch (error) {
      console.error('Failed to delete picture:', error)
      alert(`Failed to delete: ${error}`)
    } finally {
      setIsDeleting(false)
    }
  }

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : pictures.length - 1))
  }, [pictures.length])

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < pictures.length - 1 ? prev + 1 : 0))
  }, [pictures.length])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle keys if delete dialog is open
      if (showDeleteDialog) {
        if (e.key === 'Escape') {
          setShowDeleteDialog(false)
        }
        return
      }

      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case 'ArrowLeft':
          goToPrevious()
          break
        case 'ArrowRight':
          goToNext()
          break
        case 'i':
          setShowInfo((prev) => !prev)
          break
        case 'Delete':
          setShowDeleteDialog(true)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, goToPrevious, goToNext, showDeleteDialog])

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDate = (date: any) => {
    if (!date) return 'Unknown'
    return new Date(date).toLocaleDateString()
  }

  if (!currentPicture) return null

  return (
    <div className="fixed inset-0 bg-black z-50 flex">
      {/* Main image area */}
      <div
        className="flex-1 relative flex items-center justify-center"
        onClick={onClose}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
          title="Close (Escape)"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Top right buttons */}
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          {/* Delete button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowDeleteDialog(true)
            }}
            className="p-2 rounded-full bg-black/50 hover:bg-red-600/70 text-white transition-colors"
            title="Delete (Delete key)"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>

          {/* Toggle info button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowInfo((prev) => !prev)
            }}
            className="p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
            title="Toggle info (I)"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>

        {/* Previous button */}
        {pictures.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              goToPrevious()
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
            title="Previous (Left arrow)"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* Next button */}
        {pictures.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              goToNext()
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
            style={{ right: showInfo ? '324px' : '16px' }}
            title="Next (Right arrow)"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        {/* Image counter */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/50 text-white text-sm">
          {currentIndex + 1} / {pictures.length}
        </div>

        {/* The image */}
        <img
          src={getImageUrl(currentPicture.path)}
          alt={currentPicture.filename}
          className="max-w-full max-h-full object-contain"
          style={{ maxWidth: showInfo ? 'calc(100% - 320px)' : '100%' }}
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* Info panel */}
      <div
        className={`w-80 bg-gray-900 border-l border-gray-700 overflow-y-auto transition-all duration-300 ${
          showInfo ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ position: showInfo ? 'relative' : 'absolute', right: 0, height: '100%' }}
      >
        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-xl font-bold text-white break-words">{currentPicture.filename}</h3>
          </div>

          <div className="space-y-4">
            <div>
              <span className="text-gray-400 text-sm">Path</span>
              <p className="text-white font-mono text-xs mt-1 break-all">{currentPicture.path}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-400 text-sm">Size</span>
                <p className="text-white mt-1">{formatFileSize(currentPicture.size)}</p>
              </div>
              <div>
                <span className="text-gray-400 text-sm">Dimensions</span>
                <p className="text-white mt-1">{currentPicture.width} x {currentPicture.height}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-400 text-sm">Created</span>
                <p className="text-white mt-1">{formatDate(currentPicture.createdAt)}</p>
              </div>
              <div>
                <span className="text-gray-400 text-sm">Modified</span>
                <p className="text-white mt-1">{formatDate(currentPicture.modifiedAt)}</p>
              </div>
            </div>

            <div>
              <span className="text-gray-400 text-sm">Indexed</span>
              <p className="text-white mt-1">{formatDate(currentPicture.indexedAt)}</p>
            </div>
          </div>

          {/* Tags Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Tags</span>
              <button
                onClick={() => setShowTagSelector(!showTagSelector)}
                disabled={tagLoading || availableTags.length === 0}
                className="p-1 text-gray-400 hover:text-blue-400 transition-colors disabled:opacity-50"
                title={availableTags.length === 0 ? "Aucun tag disponible" : "Ajouter un tag"}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            </div>

            {/* Tag selector dropdown */}
            {showTagSelector && availableTags.length > 0 && (
              <div className="mb-3 p-2 bg-gray-800 rounded-lg border border-gray-600 max-h-40 overflow-y-auto">
                {availableTags.map((tag) => (
                  <button
                    key={tag.name}
                    onClick={() => handleAddTag(tag.name)}
                    disabled={tagLoading}
                    className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-gray-700 rounded text-left transition-colors"
                  >
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: tag.color || '#3B82F6' }}
                    />
                    <span className="text-white text-sm">{tag.name}</span>
                    <span className="text-gray-500 text-xs ml-auto">{tag.type}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Current tags */}
            {pictureTags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {pictureTags.map((tag) => (
                  <span
                    key={tag.name}
                    className="group inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm text-white"
                    style={{ backgroundColor: tag.color || '#3B82F6' }}
                  >
                    {tag.name}
                    <button
                      onClick={() => handleRemoveTag(tag.name)}
                      disabled={tagLoading}
                      className="ml-1 opacity-60 hover:opacity-100 transition-opacity"
                      title="Retirer ce tag"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Aucun tag</p>
            )}

            {allTags.length === 0 && (
              <p className="text-gray-500 text-xs mt-2">Creez des tags dans l'onglet "Tags"</p>
            )}
          </div>

          <div className="pt-4 border-t border-gray-700">
            <p className="text-gray-500 text-xs">
              Keyboard shortcuts: Arrow keys to navigate, I to toggle info, Delete to remove, Escape to close
            </p>
          </div>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      {showDeleteDialog && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-60"
          onClick={() => setShowDeleteDialog(false)}
        >
          <div
            className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-white">Delete picture?</h3>
            <p className="text-gray-300">
              {currentPicture.filename}
            </p>
            <p className="text-gray-400 text-sm">
              Choose whether to remove only from the gallery index or also delete the file from disk.
            </p>

            <div className="flex flex-col gap-3 pt-4">
              <button
                onClick={() => handleDelete(false)}
                disabled={isDeleting}
                className="w-full px-4 py-3 bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-600 text-white rounded-lg transition-colors"
              >
                {isDeleting ? 'Removing...' : 'Remove from gallery only'}
              </button>
              <button
                onClick={() => handleDelete(true)}
                disabled={isDeleting}
                className="w-full px-4 py-3 bg-red-600 hover:bg-red-500 disabled:bg-gray-600 text-white rounded-lg transition-colors"
              >
                {isDeleting ? 'Deleting...' : 'Delete from disk'}
              </button>
              <button
                onClick={() => setShowDeleteDialog(false)}
                disabled={isDeleting}
                className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
