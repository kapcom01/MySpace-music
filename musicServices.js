// musicServices.js
// Builds a YouTube search URL in the format "song name - artist" and a MySpace-based
// download URL. Exposes window.MusicServices with buildLink(song, fallbackArtist)
// and buildDownloadLink(song, fallbackArtist).
//
// Download behaviour:
//   - If the parser captured a direct audio URL (from <audio src="..."> or
//     <source src="...">) on the song, the Download button opens that URL —
//     the browser will play or save the file directly.
//   - Otherwise the button opens the MySpace profile's /music/songs page so the
//     user can pick the song manually.
//
// Per the user, legal responsibility for the download path (including ensuring
// the music is royalty-free / licensed) is theirs. A license checker is planned.

(function () {
  'use strict';

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
    // Preferred: open a direct audio file URL captured by the parser.
    if (song && song.downloadUrl) {
      return {
        id: 'download',
        name: 'Download',
        icon: '⬇️',
        href: song.downloadUrl
      };
    }
    // Fallback: open the MySpace profile's music page so the user can pick the song.
    var username = fallbackArtist || (song && song.artist) || '';
    var href = username
      ? 'https://myspace.com/' + encodeURIComponent(username) + '/music/songs'
      : 'https://myspace.com/music';
    return {
      id: 'download',
      name: 'MySpace',
      icon: '🎵',
      href: href
    };
  }

  window.MusicServices = {
    buildLink: buildLink,
    buildDownloadLink: buildDownloadLink
  };
})();