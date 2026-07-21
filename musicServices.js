// musicServices.js
// Generates search URLs for official, licensed streaming platforms.
// Exposes window.MusicServices with services() and buildLinks(song).

(function () {
  'use strict';

  // Each service has a name, emoji, and a url(artist, title) that returns a search URL.
  // We use public search endpoints that don't require API keys.
  var SERVICES = [
    {
      id: 'spotify',
      name: 'Spotify',
      icon: '🎵',
      url: function (a, t) { return 'https://open.spotify.com/search/' + encodeURIComponent(a + ' ' + t); }
    },
    {
      id: 'youtube-music',
      name: 'YouTube Music',
      icon: '▶️',
      url: function (a, t) { return 'https://music.youtube.com/search?q=' + encodeURIComponent(a + ' ' + t); }
    },
    {
      id: 'apple-music',
      name: 'Apple Music',
      icon: '🍎',
      url: function (a, t) { return 'https://music.apple.com/search?term=' + encodeURIComponent(a + ' ' + t); }
    },
    {
      id: 'youtube',
      name: 'YouTube',
      icon: '▶️',
      url: function (a, t) { return 'https://www.youtube.com/results?search_query=' + encodeURIComponent(a + ' ' + t); }
    },
    {
      id: 'soundcloud',
      name: 'SoundCloud',
      icon: '☁️',
      url: function (a, t) { return 'https://soundcloud.com/search?q=' + encodeURIComponent(a + ' ' + t); }
    },
    {
      id: 'bandcamp',
      name: 'Bandcamp',
      icon: '🎶',
      url: function (a, t) { return 'https://bandcamp.com/search?q=' + encodeURIComponent(a + ' ' + t); }
    },
    {
      id: 'tidal',
      name: 'Tidal',
      icon: '🌊',
      url: function (a, t) { return 'https://listen.tidal.com/search?q=' + encodeURIComponent(a + ' ' + t); }
    }
  ];

  // Normalize "Artist - Title" or "Artist — Title" or "Title by Artist" into a structured pair.
  function splitArtistTitle(raw) {
    if (!raw) return { artist: '', title: '' };
    var s = raw.replace(/\s+/g, ' ').trim();
    // Patterns: "Artist - Title", "Artist — Title", "Artist | Title"
    var sepMatch = s.match(/^(.*?)\s*[\-–—|]\s*(.*)$/);
    if (sepMatch && sepMatch[1] && sepMatch[2]) {
      return { artist: sepMatch[1].trim(), title: sepMatch[2].trim() };
    }
    // Pattern: "Title by Artist"
    var byMatch = s.match(/^(.*?)\s+by\s+(.*)$/i);
    if (byMatch && byMatch[1] && byMatch[2]) {
      return { artist: byMatch[2].trim(), title: byMatch[1].trim() };
    }
    return { artist: '', title: s };
  }

  // buildLinks({ artist, title }) => [{ id, name, icon, href }]
  function buildLinks(song) {
    var parts = song && song.artist ? { artist: song.artist, title: song.title || '' } : splitArtistTitle(song && song.raw);
    var query = (parts.artist + ' ' + parts.title).trim() || (song && song.title) || (song && song.raw) || '';
    return SERVICES.map(function (svc) {
      return {
        id: svc.id,
        name: svc.name,
        icon: svc.icon,
        href: svc.url(parts.artist || '', parts.title || query)
      };
    });
  }

  window.MusicServices = {
    services: SERVICES,
    splitArtistTitle: splitArtistTitle,
    buildLinks: buildLinks
  };
})();