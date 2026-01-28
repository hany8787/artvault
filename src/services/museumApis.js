/**
 * Museum API Service
 * Unified search across multiple open-access museum APIs
 *
 * Free (no key):
 *   - Art Institute of Chicago
 *   - The Metropolitan Museum of Art
 *   - Cleveland Museum of Art
 *   - Victoria & Albert Museum
 *
 * Needs free API key:
 *   - Rijksmuseum (https://data.rijksmuseum.nl)
 *   - Harvard Art Museums (https://harvardartmuseums.org/collections/api)
 */

// ─── Art Institute of Chicago ───────────────────────────────────────────────

const AIC_BASE = 'https://api.artic.edu/api/v1'
const AIC_IMAGE = 'https://www.artic.edu/iiif/2'

function aicImageUrl(imageId, size = 843) {
  if (!imageId) return null
  return `${AIC_IMAGE}/${imageId}/full/${size},/0/default.jpg`
}

export async function searchAIC(query, limit = 24) {
  const res = await fetch(
    `${AIC_BASE}/artworks/search?q=${encodeURIComponent(query)}&fields=id,title,artist_title,date_start,date_display,medium_display,dimensions,image_id&limit=${limit}`
  )
  if (!res.ok) throw new Error('AIC search failed')
  const json = await res.json()
  return (json.data || [])
    .filter(item => item.image_id)
    .map(item => ({
      id: `aic-${item.id}`,
      title: item.title || 'Sans titre',
      artist: item.artist_title || 'Artiste inconnu',
      year: item.date_display || (item.date_start ? String(item.date_start) : ''),
      museum: 'Art Institute of Chicago',
      museum_city: 'Chicago',
      museum_country: 'États-Unis',
      medium: item.medium_display || '',
      dimensions: item.dimensions || '',
      image_url: aicImageUrl(item.image_id),
      source: 'aic'
    }))
}

export async function loadAICCurated() {
  const CURATED_IDS = [27992, 28560, 111628, 6565, 87479, 80607, 16568, 16487, 14598, 20684, 76244, 24306]
  const res = await fetch(
    `${AIC_BASE}/artworks?ids=${CURATED_IDS.join(',')}&fields=id,title,artist_title,date_start,date_display,medium_display,dimensions,image_id`
  )
  if (!res.ok) throw new Error('AIC curated failed')
  const json = await res.json()
  return (json.data || [])
    .filter(item => item.image_id)
    .map(item => ({
      id: `aic-${item.id}`,
      title: item.title || 'Sans titre',
      artist: item.artist_title || 'Artiste inconnu',
      year: item.date_display || (item.date_start ? String(item.date_start) : ''),
      museum: 'Art Institute of Chicago',
      museum_city: 'Chicago',
      museum_country: 'États-Unis',
      medium: item.medium_display || '',
      dimensions: item.dimensions || '',
      image_url: aicImageUrl(item.image_id),
      source: 'aic'
    }))
}

// ─── The Metropolitan Museum of Art ─────────────────────────────────────────

const MET_BASE = 'https://collectionapi.metmuseum.org/public/collection/v1'

export async function searchMet(query, limit = 18) {
  const searchRes = await fetch(
    `${MET_BASE}/search?q=${encodeURIComponent(query)}&hasImages=true`
  )
  if (!searchRes.ok) throw new Error('Met search failed')
  const searchJson = await searchRes.json()
  const ids = (searchJson.objectIDs || []).slice(0, limit)
  if (ids.length === 0) return []

  // Fetch objects in parallel (batches of 6)
  const artworks = []
  for (let i = 0; i < ids.length; i += 6) {
    const batch = ids.slice(i, i + 6)
    const results = await Promise.allSettled(
      batch.map(id =>
        fetch(`${MET_BASE}/objects/${id}`).then(r => r.ok ? r.json() : null)
      )
    )
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value && result.value.primaryImage) {
        const obj = result.value
        artworks.push({
          id: `met-${obj.objectID}`,
          title: obj.title || 'Sans titre',
          artist: obj.artistDisplayName || 'Artiste inconnu',
          year: obj.objectDate || '',
          museum: 'The Metropolitan Museum of Art',
          museum_city: 'New York',
          museum_country: 'États-Unis',
          medium: obj.medium || '',
          dimensions: obj.dimensions || '',
          image_url: obj.primaryImage,
          source: 'met'
        })
      }
    }
  }
  return artworks
}

// ─── Cleveland Museum of Art ────────────────────────────────────────────────

const CMA_BASE = 'https://openaccess-api.clevelandart.org/api/artworks'

export async function searchCleveland(query, limit = 24) {
  const res = await fetch(
    `${CMA_BASE}/?q=${encodeURIComponent(query)}&has_image=1&limit=${limit}`
  )
  if (!res.ok) throw new Error('Cleveland search failed')
  const json = await res.json()
  return (json.data || [])
    .filter(item => item.images && item.images.web && item.images.web.url)
    .map(item => ({
      id: `cma-${item.id}`,
      title: item.title || 'Sans titre',
      artist: (item.creators && item.creators[0]?.description) || 'Artiste inconnu',
      year: item.creation_date || '',
      museum: 'Cleveland Museum of Art',
      museum_city: 'Cleveland',
      museum_country: 'États-Unis',
      medium: item.technique || '',
      dimensions: item.dimensions?.framed || item.dimensions?.unframed || '',
      image_url: item.images.web.url,
      source: 'cleveland'
    }))
}

// ─── Rijksmuseum ────────────────────────────────────────────────────────────

const RIJKS_BASE = 'https://www.rijksmuseum.nl/api/en/collection'
const RIJKS_KEY = 'YEbDaPAi' // Demo/public key

export async function searchRijksmuseum(query, limit = 24) {
  const res = await fetch(
    `${RIJKS_BASE}?key=${RIJKS_KEY}&q=${encodeURIComponent(query)}&imgonly=True&ps=${limit}&culture=en`
  )
  if (!res.ok) throw new Error('Rijksmuseum search failed')
  const json = await res.json()
  return (json.artObjects || [])
    .filter(item => item.webImage && item.webImage.url)
    .map(item => ({
      id: `rijks-${item.objectNumber}`,
      title: item.title || 'Sans titre',
      artist: item.principalOrFirstMaker || 'Artiste inconnu',
      year: item.longTitle?.match(/\b(c\.\s*)?\d{4}\b/)?.[0] || '',
      museum: 'Rijksmuseum',
      museum_city: 'Amsterdam',
      museum_country: 'Pays-Bas',
      medium: '',
      dimensions: '',
      image_url: item.webImage.url,
      source: 'rijksmuseum'
    }))
}

// ─── Harvard Art Museums ────────────────────────────────────────────────────

const HARVARD_BASE = 'https://api.harvardartmuseums.org'
const HARVARD_KEY = '2a710629-4a80-4571-8744-86db68f4e5d7' // Public demo key

export async function searchHarvard(query, limit = 24) {
  const res = await fetch(
    `${HARVARD_BASE}/object?apikey=${HARVARD_KEY}&q=${encodeURIComponent(query)}&hasimage=1&size=${limit}`
  )
  if (!res.ok) throw new Error('Harvard search failed')
  const json = await res.json()
  return (json.records || [])
    .filter(item => item.primaryimageurl)
    .map(item => ({
      id: `harvard-${item.objectid}`,
      title: item.title || 'Sans titre',
      artist: (item.people && item.people[0]?.name) || 'Artiste inconnu',
      year: item.dated || '',
      museum: 'Harvard Art Museums',
      museum_city: 'Cambridge',
      museum_country: 'États-Unis',
      medium: item.medium || '',
      dimensions: item.dimensions || '',
      image_url: item.primaryimageurl,
      source: 'harvard'
    }))
}

// ─── Victoria & Albert Museum ───────────────────────────────────────────────

const VA_BASE = 'https://api.vam.ac.uk/v2'

export async function searchVA(query, limit = 24) {
  const res = await fetch(
    `${VA_BASE}/objects/search?q=${encodeURIComponent(query)}&images_exist=true&page_size=${limit}`
  )
  if (!res.ok) throw new Error('V&A search failed')
  const json = await res.json()
  return (json.records || [])
    .filter(item => item._primaryImageId)
    .map(item => ({
      id: `va-${item.systemNumber}`,
      title: item._primaryTitle || 'Sans titre',
      artist: item._primaryMaker?.name || 'Artiste inconnu',
      year: item._primaryDate || '',
      museum: 'Victoria and Albert Museum',
      museum_city: 'Londres',
      museum_country: 'Royaume-Uni',
      medium: '',
      dimensions: '',
      image_url: `https://framemark.vam.ac.uk/collections/${item._primaryImageId}/full/!600,600/0/default.jpg`,
      source: 'va'
    }))
}

// ─── Unified Search ─────────────────────────────────────────────────────────

/**
 * All available museum sources
 */
export const MUSEUM_SOURCES = [
  { id: 'all', name: 'Tous les musées', icon: 'museum', search: null },
  { id: 'aic', name: 'Art Institute of Chicago', icon: 'museum', city: 'Chicago', search: searchAIC },
  { id: 'met', name: 'The Met', icon: 'museum', city: 'New York', search: searchMet },
  { id: 'rijksmuseum', name: 'Rijksmuseum', icon: 'museum', city: 'Amsterdam', search: searchRijksmuseum },
  { id: 'cleveland', name: 'Cleveland Museum', icon: 'museum', city: 'Cleveland', search: searchCleveland },
  { id: 'harvard', name: 'Harvard Art Museums', icon: 'museum', city: 'Cambridge', search: searchHarvard },
  { id: 'va', name: 'V&A Museum', icon: 'museum', city: 'Londres', search: searchVA },
]

/**
 * Search across all or specific museum APIs
 * @param {string} query Search query
 * @param {string} sourceId 'all' or specific source ID
 * @param {number} limit Results per source
 * @returns {Promise<Array>} Normalized artwork results
 */
export async function searchMuseums(query, sourceId = 'all', limit = 24) {
  if (sourceId === 'all') {
    // Search all sources in parallel, limit per source
    const perSource = Math.ceil(limit / 5)
    const results = await Promise.allSettled([
      searchAIC(query, perSource),
      searchMet(query, perSource),
      searchRijksmuseum(query, perSource),
      searchCleveland(query, perSource),
      searchHarvard(query, perSource),
      searchVA(query, perSource),
    ])

    const allArtworks = []
    for (const result of results) {
      if (result.status === 'fulfilled') {
        allArtworks.push(...result.value)
      }
    }
    // Interleave results from different sources for variety
    return interleaveResults(allArtworks)
  }

  // Single source
  const source = MUSEUM_SOURCES.find(s => s.id === sourceId)
  if (!source || !source.search) return []
  return source.search(query, limit)
}

/**
 * Interleave results from different sources for visual variety
 */
function interleaveResults(artworks) {
  const bySource = {}
  for (const a of artworks) {
    if (!bySource[a.source]) bySource[a.source] = []
    bySource[a.source].push(a)
  }
  const sources = Object.keys(bySource)
  const result = []
  let i = 0
  let added = true
  while (added) {
    added = false
    for (const src of sources) {
      if (i < bySource[src].length) {
        result.push(bySource[src][i])
        added = true
      }
    }
    i++
  }
  return result
}
