import { useState, useEffect } from 'react'
import { GetAllTags } from '../../wailsjs/go/main/App'
import { models, services } from '../../wailsjs/go/models'

interface SearchBarProps {
  onSearch: (criteria: services.SearchCriteria) => void
  onClear: () => void
}

// Groupe les tags par type pour l'affichage
type TagsByType = {
  person: models.Tag[]
  location: models.Tag[]
  event: models.Tag[]
  other: models.Tag[]
}

// Type d'un critere de recherche par groupe
interface GroupCriteria {
  tags: string[]
  operator: 'AND' | 'OR'
}

// Configuration des types de tags
const TAG_TYPE_CONFIG = {
  person: { label: 'Personnes', icon: '👤', color: 'blue' },
  location: { label: 'Lieux', icon: '📍', color: 'green' },
  event: { label: 'Evenements', icon: '📅', color: 'purple' },
  other: { label: 'Autres', icon: '🏷️', color: 'gray' },
}

export default function SearchBar({ onSearch, onClear }: SearchBarProps) {
  const [allTags, setAllTags] = useState<models.Tag[]>([])
  const [tagsByType, setTagsByType] = useState<TagsByType>({
    person: [], location: [], event: [], other: []
  })

  // Criteres de recherche par type
  const [criteria, setCriteria] = useState<{
    person: GroupCriteria
    location: GroupCriteria
    event: GroupCriteria
    other: GroupCriteria
  }>({
    person: { tags: [], operator: 'AND' },
    location: { tags: [], operator: 'OR' },
    event: { tags: [], operator: 'OR' },
    other: { tags: [], operator: 'OR' },
  })

  const [isExpanded, setIsExpanded] = useState(false)

  // Charger les tags au montage
  useEffect(() => {
    const loadTags = async () => {
      try {
        const tags = await GetAllTags()
        setAllTags(tags || [])

        // Grouper par type
        const grouped: TagsByType = { person: [], location: [], event: [], other: [] }
        for (const tag of (tags || [])) {
          const type = tag.type as keyof TagsByType
          if (grouped[type]) {
            grouped[type].push(tag)
          } else {
            grouped.other.push(tag)
          }
        }
        setTagsByType(grouped)
      } catch (error) {
        console.error('Failed to load tags:', error)
      }
    }
    loadTags()
  }, [])

  // Déclencher la recherche quand les critères changent
  useEffect(() => {
    const hasAnyCriteria =
      criteria.person.tags.length > 0 ||
      criteria.location.tags.length > 0 ||
      criteria.event.tags.length > 0 ||
      criteria.other.tags.length > 0

    if (hasAnyCriteria) {
      const searchCriteria = new services.SearchCriteria({
        persons: { tags: criteria.person.tags, operator: criteria.person.operator },
        locations: { tags: criteria.location.tags, operator: criteria.location.operator },
        events: { tags: criteria.event.tags, operator: criteria.event.operator },
        others: { tags: criteria.other.tags, operator: criteria.other.operator },
      })
      onSearch(searchCriteria)
    } else {
      onClear()
    }
  }, [criteria, onSearch, onClear])

  const toggleTag = (type: keyof typeof criteria, tagName: string) => {
    setCriteria(prev => {
      const current = prev[type].tags
      const newTags = current.includes(tagName)
        ? current.filter(t => t !== tagName)
        : [...current, tagName]
      return {
        ...prev,
        [type]: { ...prev[type], tags: newTags }
      }
    })
  }

  const toggleOperator = (type: keyof typeof criteria) => {
    setCriteria(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        operator: prev[type].operator === 'AND' ? 'OR' : 'AND'
      }
    }))
  }

  const clearAll = () => {
    setCriteria({
      person: { tags: [], operator: 'AND' },
      location: { tags: [], operator: 'OR' },
      event: { tags: [], operator: 'OR' },
      other: { tags: [], operator: 'OR' },
    })
  }

  const totalSelected =
    criteria.person.tags.length +
    criteria.location.tags.length +
    criteria.event.tags.length +
    criteria.other.tags.length

  // Si aucun tag n'existe, ne pas afficher la barre de recherche
  if (allTags.length === 0) {
    return null
  }

  return (
    <div className="mb-6">
      {/* Barre compacte */}
      <div className="flex items-center gap-4 bg-gray-800 rounded-lg p-3">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
        >
          <svg
            className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          <span className="font-medium">Recherche par tags</span>
        </button>

        {/* Affichage compact des tags sélectionnés */}
        {totalSelected > 0 && (
          <div className="flex items-center gap-2 flex-1 overflow-x-auto">
            {Object.entries(criteria).map(([type, { tags }]) =>
              tags.map(tagName => {
                const tag = allTags.find(t => t.name === tagName)
                return (
                  <span
                    key={tagName}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs text-white whitespace-nowrap"
                    style={{ backgroundColor: tag?.color || '#3B82F6' }}
                  >
                    {tagName}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleTag(type as keyof typeof criteria, tagName)
                      }}
                      className="opacity-70 hover:opacity-100"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                )
              })
            )}
          </div>
        )}

        {totalSelected > 0 && (
          <button
            onClick={clearAll}
            className="text-gray-400 hover:text-white text-sm transition-colors"
          >
            Effacer
          </button>
        )}
      </div>

      {/* Panneau étendu */}
      {isExpanded && (
        <div className="mt-2 bg-gray-800 rounded-lg p-4 space-y-4">
          <p className="text-gray-400 text-sm">
            Selectionnez des tags pour filtrer. Les groupes sont combines avec AND entre eux.
          </p>

          {(Object.entries(TAG_TYPE_CONFIG) as [keyof typeof TAG_TYPE_CONFIG, typeof TAG_TYPE_CONFIG.person][]).map(([type, config]) => {
            const typeTags = tagsByType[type]
            if (typeTags.length === 0) return null

            const selected = criteria[type]

            return (
              <div key={type} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{config.icon}</span>
                    <span className="text-white font-medium">{config.label}</span>
                    {selected.tags.length > 1 && (
                      <button
                        onClick={() => toggleOperator(type)}
                        className={`px-2 py-0.5 text-xs rounded font-mono ${
                          selected.operator === 'AND'
                            ? 'bg-blue-600 text-white'
                            : 'bg-orange-600 text-white'
                        }`}
                        title={selected.operator === 'AND'
                          ? 'Toutes les conditions doivent etre remplies'
                          : 'Au moins une condition doit etre remplie'}
                      >
                        {selected.operator}
                      </button>
                    )}
                  </div>
                  {selected.tags.length > 0 && (
                    <span className="text-gray-400 text-xs">
                      {selected.tags.length} selectionne(s)
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {typeTags.map(tag => {
                    const isSelected = selected.tags.includes(tag.name)
                    return (
                      <button
                        key={tag.name}
                        onClick={() => toggleTag(type, tag.name)}
                        className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                          isSelected
                            ? 'text-white ring-2 ring-white ring-offset-2 ring-offset-gray-800'
                            : 'text-white opacity-60 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: tag.color || '#3B82F6' }}
                      >
                        {tag.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* Résumé de la requête */}
          {totalSelected > 0 && (
            <div className="pt-3 border-t border-gray-700">
              <p className="text-gray-400 text-sm">
                <span className="text-white">Requete: </span>
                {Object.entries(criteria)
                  .filter(([_, { tags }]) => tags.length > 0)
                  .map(([type, { tags, operator }], index) => (
                    <span key={type}>
                      {index > 0 && <span className="text-blue-400 mx-1">AND</span>}
                      <span className="text-gray-300">
                        ({tags.join(` ${operator} `)})
                      </span>
                    </span>
                  ))
                }
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
