// musicServices.js
// Builds a YouTube search URL in the format "song name - artist".
// Exposes window.MusicServices with buildLink(song, fallbackArtist).
//
// We dropped the other streaming-service integrations at the user's request —
// only YouTube is exposed now.

(function () {
  'use strict';

  function buildLink(song, fallbackArtist) {
    var title = (song && (song.title || song.raw)) || '';
    var explicitArtist = song && song.artist ? song.artist : '';
    var artist = explicitArtist || fallbackArtist || '';

    // Format requested by the user: "song name - artist".
    // If no artist is available we just use the title, so we never produce
    // a stray " - " suffix.
    var query;
    if (title && artist) query = title + ' - ' + artist;
    else if (title) query = title;
    else if (artist) query = artist;
    else query = '';

    return {
      id: 'youtube',
      name: 'YouTube',
      icon: '▶️',
      href: 'https://www.youtube.com/results?search_query=' + encodeURIComponent(query)
    };
  }

  window.MusicServices = { buildLink: buildLink };
})();