// musicServices.js
// Builds a YouTube search URL in the format "song name - artist" and a download URL
// that opens a third-party YouTube-to-MP3 service with the same query pre-filled.
// Exposes window.MusicServices with buildLink(song, fallbackArtist)
// and buildDownloadLink(song, fallbackArtist).
//
// Per the user, legal restrictions around downloads are the user's responsibility.

(function () {
  'use strict';

  // Public YouTube-to-MP3 service. Users land here, search/select a video, and download.
  // The `q=` parameter seeds the search box on the converter page when supported.
  var DOWNLOAD_HOST = 'https://ytmp3.cc/youtube-to-mp3/';

  function buildQuery(song, fallbackArtist) {
    var title = (song && (song.title || song.raw)) || '';
    var explicitArtist = song && song.artist ? song.artist : '';
    var artist = explicitArtist || fallbackArtist || '';

    // Format requested by the user: "song name - artist".
    // If no artist is available we just use the title, so we never produce
    // a stray " - " suffix.
    if (title && artist) return title + ' - ' + artist;
    if (title) return title;
    if (artist) return artist;
    return '';
  }

  function buildLink(song, fallbackArtist) {
    var query = buildQuery(song, fallbackArtist);
    return {
      id: 'youtube',
      name: 'YouTube',
      icon: '▶️',
      href: 'https://www.youtube.com/results?search_query=' + encodeURIComponent(query)
    };
  }

  function buildDownloadLink(song, fallbackArtist) {
    var query = buildQuery(song, fallbackArtist);
    var href = DOWNLOAD_HOST;
    if (query) href += '?q=' + encodeURIComponent(query);
    return {
      id: 'download',
      name: 'Download',
      icon: '⬇️',
      href: href
    };
  }

  window.MusicServices = {
    buildLink: buildLink,
    buildDownloadLink: buildDownloadLink
  };
})();