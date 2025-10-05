'use client'

import { useState, useEffect } from 'react'
import SpotifyWebPlayback from 'react-spotify-web-playback'

interface SpotifyPlayerProps {}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

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

  useEffect(() => {
    const checkAuth = async () => {
      // Check if redirected back from Spotify with success
      const urlParams = new URLSearchParams(window.location.search)
      const spotifyAuth = urlParams.get('spotify_auth')
      const spotifyError = urlParams.get('spotify_error')

      if (spotifyError) {
        console.error('Spotify auth error:', spotifyError)
        window.history.replaceState({}, document.title, window.location.pathname)
        return
      }

      if (spotifyAuth === 'success') {
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname)
      }

      // Try to get token from backend
      try {
        const response = await fetch(`${API_URL}/api/spotify/token`, {
          credentials: 'include',
        })

        if (response.ok) {
          const data = await response.json()
          setToken(data.access_token)
          setIsAuthenticated(true)
        }
      } catch (error) {
        console.error('Error fetching token:', error)
      }
    }

    checkAuth()
  }, [])

  const handleSpotifyLogin = () => {
    // Redirect to backend OAuth endpoint
    window.location.href = `${API_URL}/api/spotify/login`
  }

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/api/spotify/logout`, {
        method: 'POST',
        credentials: 'include',
      })
    } catch (error) {
      console.error('Error logging out:', error)
    }

    setToken('')
    setIsAuthenticated(false)
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

      <div className={`spotify-player-wrapper flex-1 flex items-center ${!showSearch && !showPlaylists ? 'justify-center' : ''}`}>
        <div className="w-full">
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
    </div>
  )
}
