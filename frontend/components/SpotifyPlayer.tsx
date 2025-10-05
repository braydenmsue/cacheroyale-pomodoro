'use client'

import { useState, useEffect } from 'react'
import SpotifyWebPlayback from 'react-spotify-web-playback'

interface SpotifyPlayerProps {}

// PKCE helper functions
const generateRandomString = (length: number) => {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const values = crypto.getRandomValues(new Uint8Array(length))
  return values.reduce((acc, x) => acc + possible[x % possible.length], '')
}

const sha256 = async (plain: string) => {
  const encoder = new TextEncoder()
  const data = encoder.encode(plain)
  return window.crypto.subtle.digest('SHA-256', data)
}

const base64encode = (input: ArrayBuffer) => {
  const uint8Array = new Uint8Array(input)
  const charArray = Array.from(uint8Array, byte => String.fromCharCode(byte))
  return btoa(charArray.join(''))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

export default function SpotifyPlayer({}: SpotifyPlayerProps) {
  const [token, setToken] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [uris, setUris] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showSearch, setShowSearch] = useState(false)
  const [playlists, setPlaylists] = useState<any[]>([])
  const [showPlaylists, setShowPlaylists] = useState(false)
  const [playlistSearchQuery, setPlaylistSearchQuery] = useState('')
  const [selectedPlaylist, setSelectedPlaylist] = useState<any>(null)
  const [playlistTracks, setPlaylistTracks] = useState<any[]>([])

  // Get Spotify client ID from environment
  const SPOTIFY_CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || ''
  // Spotify requires http://127.0.0.1 for local development (not localhost)
  const REDIRECT_URI = typeof window !== 'undefined'
    ? window.location.origin.replace('localhost', '127.0.0.1')
    : ''

  useEffect(() => {
    // Check for authorization code in URL (from Spotify redirect)
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')

    if (code) {
      // Exchange code for token
      const codeVerifier = sessionStorage.getItem('code_verifier')
      if (codeVerifier) {
        exchangeCodeForToken(code, codeVerifier)
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname)
      }
    } else {
      // Check if token exists in sessionStorage
      const storedToken = sessionStorage.getItem('spotify_token')
      if (storedToken) {
        setToken(storedToken)
        setIsAuthenticated(true)
      }
    }
  }, [])

  const exchangeCodeForToken = async (code: string, codeVerifier: string) => {
    const params = new URLSearchParams({
      client_id: SPOTIFY_CLIENT_ID,
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      code_verifier: codeVerifier,
    })

    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      })

      const data = await response.json()
      if (data.access_token) {
        setToken(data.access_token)
        setIsAuthenticated(true)
        sessionStorage.setItem('spotify_token', data.access_token)
        sessionStorage.removeItem('code_verifier')
      }
    } catch (error) {
      console.error('Error exchanging code for token:', error)
    }
  }


  const handleSpotifyLogin = async () => {
    const codeVerifier = generateRandomString(64)
    const hashed = await sha256(codeVerifier)
    const codeChallenge = base64encode(hashed)

    // Store code verifier for later use
    sessionStorage.setItem('code_verifier', codeVerifier)

    const scopes = [
      'streaming',
      'user-read-email',
      'user-read-private',
      'user-read-playback-state',
      'user-modify-playback-state',
    ]

    const authUrl = `https://accounts.spotify.com/authorize?client_id=${SPOTIFY_CLIENT_ID}&redirect_uri=${encodeURIComponent(
      REDIRECT_URI
    )}&scope=${encodeURIComponent(scopes.join(' '))}&response_type=code&code_challenge_method=S256&code_challenge=${codeChallenge}`

    window.location.href = authUrl
  }

  const handleLogout = () => {
    setToken('')
    setIsAuthenticated(false)
    sessionStorage.removeItem('spotify_token')
  }

  const loadFocusPlaylist = async () => {
    if (!token) return

    try {
      // Search for focus/study playlists
      const response = await fetch(
        'https://api.spotify.com/v1/search?q=focus%20study&type=playlist&limit=1',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const data = await response.json()
      if (data.playlists?.items?.[0]?.uri) {
        setUris([data.playlists.items[0].uri])
      }
    } catch (error) {
      console.error('Error loading playlist:', error)
    }
  }

  const searchTracks = async (query: string) => {
    if (!token || !query) {
      setSearchResults([])
      return
    }

    try {
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const data = await response.json()
      if (data.tracks?.items) {
        setSearchResults(data.tracks.items)
      }
    } catch (error) {
      console.error('Error searching tracks:', error)
    }
  }

  const playTrack = (uri: string) => {
    setUris([uri])
    setShowSearch(false)
    setSearchQuery('')
    setSearchResults([])
    setShowPlaylists(false)
    setSelectedPlaylist(null)
    setPlaylistTracks([])
  }

  const fetchUserPlaylists = async () => {
    if (!token) return

    try {
      const response = await fetch('https://api.spotify.com/v1/me/playlists?limit=50', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()
      if (data.items) {
        setPlaylists(data.items)
      }
    } catch (error) {
      console.error('Error fetching playlists:', error)
    }
  }

  const fetchPlaylistTracks = async (playlistId: string) => {
    if (!token) return

    try {
      const response = await fetch(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const data = await response.json()
      if (data.items) {
        setPlaylistTracks(data.items)
      }
    } catch (error) {
      console.error('Error fetching playlist tracks:', error)
    }
  }

  const viewPlaylistTracks = (playlist: any) => {
    setSelectedPlaylist(playlist)
    fetchPlaylistTracks(playlist.id)
  }

  const playPlaylist = (uri: string) => {
    setUris([uri])
    setShowPlaylists(false)
    setPlaylistSearchQuery('')
    setSelectedPlaylist(null)
    setPlaylistTracks([])
  }

  const backToPlaylists = () => {
    setSelectedPlaylist(null)
    setPlaylistTracks([])
  }

  useEffect(() => {
    if (isAuthenticated && uris.length === 0) {
      loadFocusPlaylist()
    }
    if (isAuthenticated) {
      fetchUserPlaylists()
    }
  }, [isAuthenticated])

  if (!SPOTIFY_CLIENT_ID) {
    return null
  }

  if (!isAuthenticated) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 h-full flex flex-col justify-center">
        <div className="text-center">
          <h3 className="text-base font-semibold text-gray-700 dark:text-gray-200 mb-3">
            🎵 Music
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Connect Spotify for music
          </p>
          <button
            onClick={handleSpotifyLogin}
            className="px-5 py-2.5 bg-green-500 text-white text-sm rounded-full font-semibold hover:bg-green-600 transition-colors shadow-md"
          >
            Connect Spotify
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-base font-semibold text-gray-700 dark:text-gray-200">
          🎵 Music
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setShowPlaylists(!showPlaylists)
              setShowSearch(false)
            }}
            className="text-xs px-3 py-1 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
          >
            {showPlaylists ? 'Hide' : 'Playlists'}
          </button>
          <button
            onClick={() => {
              setShowSearch(!showSearch)
              setShowPlaylists(false)
            }}
            className="text-xs px-3 py-1 bg-indigo-500 text-white rounded-full hover:bg-indigo-600 transition-colors"
          >
            {showSearch ? 'Hide' : 'Search'}
          </button>
          <button
            onClick={handleLogout}
            className="text-xs px-3 py-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            Disconnect
          </button>
        </div>
      </div>

      {showPlaylists && !selectedPlaylist && (
        <div className="mb-3 relative">
          <input
            type="text"
            placeholder="Search playlists..."
            value={playlistSearchQuery}
            onChange={(e) => setPlaylistSearchQuery(e.target.value)}
            className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <div className="absolute z-50 w-full mt-2 max-h-64 overflow-y-auto bg-gray-50 dark:bg-gray-700 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-600">
            {playlists.filter(p =>
              p.name.toLowerCase().includes(playlistSearchQuery.toLowerCase())
            ).length > 0 ? (
              playlists
                .filter(p => p.name.toLowerCase().includes(playlistSearchQuery.toLowerCase()))
                .map((playlist) => (
                  <div key={playlist.id} className="flex items-center border-b border-gray-200 dark:border-gray-600 last:border-b-0">
                    <button
                      onClick={() => viewPlaylistTracks(playlist)}
                      className="flex-1 px-3 py-2 text-left hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
                    >
                      {playlist.images?.[0] && (
                        <img
                          src={playlist.images[0].url}
                          alt={playlist.name}
                          className="w-10 h-10 rounded"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                          {playlist.name}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                          {playlist.tracks.total} tracks
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={() => playPlaylist(playlist.uri)}
                      className="px-3 py-2 text-green-500 hover:text-green-600 text-xl"
                      title="Play all"
                    >
                      ▶
                    </button>
                  </div>
                ))
            ) : (
              <div className="px-3 py-4 text-center text-sm text-gray-600 dark:text-gray-400">
                {playlistSearchQuery ? 'No matching playlists' : 'No playlists found'}
              </div>
            )}
          </div>
        </div>
      )}

      {showPlaylists && selectedPlaylist && (
        <div className="mb-3 relative">
          <div className="mb-2 flex items-center gap-2">
            <button
              onClick={backToPlaylists}
              className="text-sm px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              ← Back
            </button>
            <div className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
              {selectedPlaylist.name}
            </div>
          </div>
          <div className="absolute z-50 w-full max-h-64 overflow-y-auto bg-gray-50 dark:bg-gray-700 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-600">
            {playlistTracks.length > 0 ? (
              playlistTracks.map((item) => (
                item.track && (
                  <button
                    key={item.track.id}
                    onClick={() => playTrack(item.track.uri)}
                    className="w-full px-3 py-2 text-left hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2 border-b border-gray-200 dark:border-gray-600 last:border-b-0"
                  >
                    {item.track.album.images[2] && (
                      <img
                        src={item.track.album.images[2].url}
                        alt={item.track.name}
                        className="w-8 h-8 rounded"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                        {item.track.name}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                        {item.track.artists.map((a: any) => a.name).join(', ')}
                      </div>
                    </div>
                  </button>
                )
              ))
            ) : (
              <div className="px-3 py-4 text-center text-sm text-gray-600 dark:text-gray-400">
                Loading tracks...
              </div>
            )}
          </div>
        </div>
      )}

      {showSearch && (
        <div className="mb-3 relative">
          <input
            type="text"
            placeholder="Search for songs..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              searchTracks(e.target.value)
            }}
            className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {searchResults.length > 0 && (
            <div className="absolute z-50 w-full mt-2 max-h-64 overflow-y-auto bg-gray-50 dark:bg-gray-700 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-600">
              {searchResults.map((track) => (
                <button
                  key={track.id}
                  onClick={() => playTrack(track.uri)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
                >
                  {track.album.images[2] && (
                    <img
                      src={track.album.images[2].url}
                      alt={track.name}
                      className="w-8 h-8 rounded"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                      {track.name}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                      {track.artists.map((a: any) => a.name).join(', ')}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className={`spotify-player-wrapper flex-1 ${!showSearch && !showPlaylists ? 'mt-12' : ''}`}>
        <SpotifyWebPlayback
          token={token}
          uris={uris}
          styles={{
            activeColor: '#6366f1',
            bgColor: 'transparent',
            color: '#9ca3af',
            loaderColor: '#6366f1',
            sliderColor: '#6366f1',
            trackArtistColor: '#9ca3af',
            trackNameColor: '#d1d5db',
          }}
          magnifySliderOnHover={true}
        />
      </div>
    </div>
  )
}
