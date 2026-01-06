import { useState } from 'react'

function App() {
  const [name, setName] = useState('')
  const [greeting, setGreeting] = useState('')

  // Fonction de test pour appeler le backend Go
  const greet = async () => {
    // TODO: Remplacer par l'import des bindings Wails générés
    // const result = await Greet(name)
    // setGreeting(result)
    setGreeting(`Hello ${name}, welcome to EasyGallery! (Backend coming soon...)`)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="text-center space-y-8">
        <h1 className="text-6xl font-bold text-white mb-4">
          EasyGallery
        </h1>
        <p className="text-gray-400 text-xl">
          Your modern photo gallery with smart tagging
        </p>

        {/* Test de connexion backend */}
        <div className="mt-12 space-y-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            className="px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-blue-500"
          />
          <br />
          <button
            onClick={greet}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Greet
          </button>
          {greeting && (
            <p className="text-green-400 mt-4">{greeting}</p>
          )}
        </div>

        <div className="mt-12 text-gray-500 text-sm">
          <p>Powered by Wails + React + Go</p>
        </div>
      </div>
    </div>
  )
}

export default App
