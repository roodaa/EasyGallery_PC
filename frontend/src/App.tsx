import { useState } from 'react'
import WatchedFolders from './components/WatchedFolders'
import PhotoGallery from './components/PhotoGallery'

type View = 'gallery' | 'folders' | 'tags'

function App() {
  const [currentView, setCurrentView] = useState<View>('gallery')

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-white">EasyGallery</h1>
          <p className="text-gray-400 text-sm mt-1">Smart photo management</p>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <button
            onClick={() => setCurrentView('gallery')}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
              currentView === 'gallery'
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            <div className="flex items-center space-x-3">
              <span className="text-xl">🖼️</span>
              <span>Gallery</span>
            </div>
          </button>

          <button
            onClick={() => setCurrentView('folders')}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
              currentView === 'folders'
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            <div className="flex items-center space-x-3">
              <span className="text-xl">📁</span>
              <span>Watched Folders</span>
            </div>
          </button>

          <button
            onClick={() => setCurrentView('tags')}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
              currentView === 'tags'
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            <div className="flex items-center space-x-3">
              <span className="text-xl">🏷️</span>
              <span>Tags</span>
            </div>
          </button>
        </nav>

        <div className="p-4 border-t border-gray-700">
          <p className="text-gray-500 text-xs text-center">
            Powered by Wails + React + Go
          </p>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {currentView === 'gallery' && <PhotoGallery />}
          {currentView === 'folders' && <WatchedFolders />}
          {currentView === 'tags' && (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">Tags management coming soon...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
