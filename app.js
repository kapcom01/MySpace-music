// app.js
// Wires up the UI: validates URL, fetches via a public CORS proxy, hands HTML to the parser,
// renders results, and exposes streaming-service links for each song.

(function () {
  'use strict';

  // CORS proxy used to fetch MySpace pages from the browser.
  // allorigins.win wraps any URL with a JSON envelope ({ contents: <html>, status: ... }).
  var CORS_PROXY = 'https://api.allorigins.win/get?url=';

  var form = document.getElementById('extract-form');
  var urlInput = document.getElementById('profile-url');
  var submitBtn = document.getElementById('submit-btn');
  var statusEl = document.getElementById('status');
  var resultsSection = document.getElementById('results-section');
  var resultsList = document.getElementById('results-list');
  var resultsSummary = document.getElementById('results-summary');

  function setStatus(message, kind) {
    statusEl.textContent = message || '';
    statusEl.classList.remove('error', 'success');
    if (kind) statusEl.classList.add(kind);
  }

  function isValidMySpaceUrl(value) {
    try {
      var u = new URL(value);
      // Accept myspace.com or www.myspace.com hosts. Match anywhere in the path so we tolerate
      // /username/music/songs, /username, /music/..., etc.
      var hostOk = /(^|\.)myspace\.com$/i.test(u.hostname);
      return hostOk;
    } catch (e) {
      return false;
    }
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  async function fetchProfile(url) {
    var proxyUrl = CORS_PROXY + encodeURIComponent(url);
    var res = await fetch(proxyUrl, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) throw new Error('Proxy returned HTTP ' + res.status);
    var data = await res.json();
    if (!data || typeof data.contents !== 'string') {
      throw new Error('Unexpected response from CORS proxy');
    }
    return data.contents;
  }

  function renderResults(songs) {
    resultsList.innerHTML = '';
    if (!songs.length) {
      resultsSummary.textContent = 'No songs found. The profile may not have publicly visible music.';
      return;
    }
    resultsSummary.textContent = 'Found ' + songs.length + ' song' + (songs.length === 1 ? '' : 's') + '.';
    var frag = document.createDocumentFragment();
    songs.forEach(function (song) {
      var links = window.MusicServices.buildLinks(song);
      var li = document.createElement('li');
      li.className = 'song';

      var heading = document.createElement('h3');
      heading.textContent = song.title || '(untitled)';
      li.appendChild(heading);

      if (song.artist) {
        var artistEl = document.createElement('p');
        artistEl.className = 'artist';
        artistEl.textContent = song.artist;
        li.appendChild(artistEl);
      }

      var linksEl = document.createElement('div');
      linksEl.className = 'service-links';
      links.forEach(function (l) {
        var a = document.createElement('a');
        a.href = l.href;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = (l.icon ? l.icon + ' ' : '') + l.name;
        linksEl.appendChild(a);
      });
      li.appendChild(linksEl);
      frag.appendChild(li);
    });
    resultsList.appendChild(frag);
  }

  async function onSubmit(event) {
    event.preventDefault();
    var url = (urlInput.value || '').trim();
    resultsSection.classList.add('hidden');

    if (!url) {
      setStatus('Please enter a MySpace profile URL.', 'error');
      return;
    }
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
      urlInput.value = url;
    }
    if (!isValidMySpaceUrl(url)) {
      setStatus('That doesn\'t look like a MySpace URL. Expected https://myspace.com/...', 'error');
      return;
    }

    submitBtn.disabled = true;
    setStatus('Fetching profile via CORS proxy…');
    try {
      var html = await fetchProfile(url);
      setStatus('Parsing ' + html.length.toLocaleString() + ' characters of HTML…');
      var songs = window.HtmlParser.parse(html);
      resultsSection.classList.remove('hidden');
      renderResults(songs);
      if (songs.length) {
        setStatus('Done — ' + songs.length + ' song' + (songs.length === 1 ? '' : 's') + ' found.', 'success');
      } else {
        setStatus('No songs found on this profile.', 'error');
      }
    } catch (err) {
      setStatus('Failed to fetch MySpace profile: ' + (err && err.message ? err.message : err), 'error');
    } finally {
      submitBtn.disabled = false;
    }
  }

  form.addEventListener('submit', onSubmit);
})();