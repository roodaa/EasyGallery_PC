import { useState, useEffect } from 'react'
import { GetAllTagsWithCount, CreateTag, UpdateTag, DeleteTag } from '../../wailsjs/go/main/App'
import { services } from '../../wailsjs/go/models'

// Palette de couleurs prédéfinies
const COLOR_PALETTE = [
  { hex: '#EF4444', name: 'Rouge' },
  { hex: '#F97316', name: 'Orange' },
  { hex: '#EAB308', name: 'Jaune' },
  { hex: '#22C55E', name: 'Vert' },
  { hex: '#06B6D4', name: 'Cyan' },
  { hex: '#3B82F6', name: 'Bleu' },
  { hex: '#8B5CF6', name: 'Violet' },
  { hex: '#EC4899', name: 'Rose' },
  { hex: '#6B7280', name: 'Gris' },
]

// Types de tags disponibles
const TAG_TYPES = [
  { value: 'person', label: 'Personne' },
  { value: 'location', label: 'Lieu' },
  { value: 'event', label: 'Evenement' },
  { value: 'other', label: 'Autre' },
]

export default function TagManager() {
  const [tags, setTags] = useState<services.TagWithCount[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingTag, setEditingTag] = useState<string | null>(null)

  // Formulaire
  const [formName, setFormName] = useState('')
  const [formType, setFormType] = useState('other')
  const [formColor, setFormColor] = useState(COLOR_PALETTE[5].hex) // Bleu par défaut

  useEffect(() => {
    loadTags()
  }, [])

  const loadTags = async () => {
    try {
      const result = await GetAllTagsWithCount()
      setTags(result || [])
    } catch (error) {
      console.error('Failed to load tags:', error)
    }
  }

  const resetForm = () => {
    setFormName('')
    setFormType('other')
    setFormColor(COLOR_PALETTE[5].hex)
    setShowForm(false)
    setEditingTag(null)
  }

  const handleCreate = async () => {
    if (!formName.trim()) {
      alert('Le nom du tag est requis')
      return
    }

    try {
      setLoading(true)
      await CreateTag(formName.trim(), formType, formColor)
      await loadTags()
      resetForm()
    } catch (error) {
      alert(`Erreur: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (tag: services.TagWithCount) => {
    setEditingTag(tag.name)
    setFormName(tag.name)
    setFormType(tag.type)
    setFormColor(tag.color || COLOR_PALETTE[5].hex)
    setShowForm(true)
  }

  const handleUpdate = async () => {
    if (!editingTag) return

    try {
      setLoading(true)
      await UpdateTag(editingTag, formType, formColor)
      await loadTags()
      resetForm()
    } catch (error) {
      alert(`Erreur: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (name: string) => {
    if (!confirm(`Supprimer le tag "${name}" ? Cette action est irreversible.`)) return

    try {
      setLoading(true)
      await DeleteTag(name)
      await loadTags()
    } catch (error) {
      alert(`Erreur: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const getTypeLabel = (type: string) => {
    return TAG_TYPES.find(t => t.value === type)?.label || type
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'person': return '👤'
      case 'location': return '📍'
      case 'event': return '📅'
      default: return '🏷️'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Gestion des Tags</h2>
        <button
          onClick={() => { resetForm(); setShowForm(true) }}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          Nouveau Tag
        </button>
      </div>

      {/* Formulaire de création/édition */}
      {showForm && (
        <div className="bg-gray-800 rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white">
            {editingTag ? `Modifier "${editingTag}"` : 'Nouveau Tag'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Nom */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Nom</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                disabled={!!editingTag}
                placeholder="Ex: Vacances, Marie..."
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none disabled:opacity-50"
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Type</label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
              >
                {TAG_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            {/* Couleur */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Couleur</label>
              <div className="flex flex-wrap gap-2">
                {COLOR_PALETTE.map(color => (
                  <button
                    key={color.hex}
                    onClick={() => setFormColor(color.hex)}
                    title={color.name}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      formColor === color.hex
                        ? 'border-white scale-110'
                        : 'border-transparent hover:border-gray-400'
                    }`}
                    style={{ backgroundColor: color.hex }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              onClick={resetForm}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={editingTag ? handleUpdate : handleCreate}
              disabled={loading || (!editingTag && !formName.trim())}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Enregistrement...' : (editingTag ? 'Modifier' : 'Creer')}
            </button>
          </div>
        </div>
      )}

      {/* Liste des tags */}
      {tags.length === 0 ? (
        <div className="text-center py-12 bg-gray-800 rounded-lg">
          <p className="text-gray-400 text-lg">Aucun tag</p>
          <p className="text-gray-500 text-sm mt-2">Creez votre premier tag pour organiser vos photos</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tags.map((tag) => (
            <div
              key={tag.name}
              className="bg-gray-800 rounded-lg p-4 flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: tag.color || '#6B7280' }}
                />
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-white font-medium">{tag.name}</span>
                    <span className="text-sm">{getTypeIcon(tag.type)}</span>
                  </div>
                  <div className="text-sm text-gray-400">
                    {getTypeLabel(tag.type)} - {tag.pictureCount} photo{tag.pictureCount !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>

              <div className="flex space-x-1">
                <button
                  onClick={() => handleEdit(tag)}
                  disabled={loading}
                  className="p-2 text-gray-400 hover:text-blue-400 transition-colors"
                  title="Modifier"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(tag.name)}
                  disabled={loading}
                  className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                  title="Supprimer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Résumé */}
      {tags.length > 0 && (
        <div className="text-sm text-gray-500 text-center">
          {tags.length} tag{tags.length !== 1 ? 's' : ''} au total
        </div>
      )}
    </div>
  )
}
