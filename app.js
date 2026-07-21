// app.js
// Wires up the UI: validates URL, fetches via a public CORS proxy, hands HTML to the parser,
// renders results, and exposes streaming-service links for each song.

(function () {
  'use strict';

  // CORS proxy adapters, tried in order. Each adapter knows how to build its request URL
  // and how to extract the HTML body from the response. If a proxy is down or rate-limited,
  // we fall through to the next one.
  var PROXIES = [
    {
      // JSON envelope: { contents: "<html>", status: { http_code: 200 } }
      name: 'allorigins (json)',
      urlFor: function (target) { return 'https://api.allorigins.win/get?url=' + encodeURIComponent(target); },
      extract: function (res) {
        return res.json().then(function (data) {
          if (!data || typeof data.contents !== 'string') {
            throw new Error('unexpected JSON envelope from allorigins');
          }
          return data.contents;
        });
      }
    },
    {
      // Raw passthrough: response body is the upstream HTML directly.
      name: 'allorigins (raw)',
      urlFor: function (target) { return 'https://api.allorigins.win/raw?url=' + encodeURIComponent(target); },
      extract: function (res) { return res.text(); }
    },
    {
      // Independent proxy with separate infrastructure.
      name: 'corsproxy.io',
      urlFor: function (target) { return 'https://corsproxy.io/?' + encodeURIComponent(target); },
      extract: function (res) { return res.text(); }
    }
  ];

  var form = document.getElementById('extract-form');
  var urlInput = document.getElementById('profile-url');
  var submitBtn = document.getElementById('submit-btn');
  var statusEl = document.getElementById('status');
  var troubleshootEl = document.getElementById('troubleshoot');
  var resultsSection = document.getElementById('results-section');
  var resultsList = document.getElementById('results-list');
  var resultsSummary = document.getElementById('results-summary');

  function setStatus(message, kind) {
    statusEl.textContent = message || '';
    statusEl.classList.remove('error', 'success');
    if (kind) statusEl.classList.add(kind);
    // Reset troubleshooting hint on each new attempt; shown only on terminal failure.
    if (troubleshootEl) troubleshootEl.classList.add('hidden');
  }

  function showTroubleshoot() {
    if (troubleshootEl) troubleshootEl.classList.remove('hidden');
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

  // Extract the username segment from a MySpace profile URL.
  // Examples:
  //   https://myspace.com/rot1com/music/songs -> "rot1com"
  //   https://myspace.com/rot1com             -> "rot1com"
  //   https://myspace.com/                    -> ""
  function getUsernameFromUrl(value) {
    try {
      var u = new URL(value);
      var parts = u.pathname.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
      return parts.length ? parts[0] : '';
    } catch (e) {
      return '';
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
    var errors = [];
    for (var i = 0; i < PROXIES.length; i++) {
      var adapter = PROXIES[i];
      setStatus('Trying CORS proxy (' + (i + 1) + '/' + PROXIES.length + '): ' + adapter.name + '…');
      try {
        var res = await fetch(adapter.urlFor(url), { headers: { 'Accept': 'application/json' } });
        if (!res.ok) {
          errors.push(adapter.name + ': HTTP ' + res.status);
          continue;
        }
        var html = await adapter.extract(res);
        if (typeof html === 'string' && html.length > 0) {
          return { html: html, proxy: adapter.name };
        }
        errors.push(adapter.name + ': empty response body');
      } catch (err) {
        errors.push(adapter.name + ': ' + (err && err.message ? err.message : String(err)));
      }
    }
    var detail = errors.join(' • ');
    var err = new Error('All CORS proxies failed (' + detail + ')');
    err.detail = detail;
    throw err;
  }

  function renderResults(songs, fallbackArtist) {
    resultsList.innerHTML = '';
    if (!songs.length) {
      resultsSummary.textContent = 'No songs found. The profile may not have publicly visible music.';
      return;
    }
    resultsSummary.textContent = 'Found ' + songs.length + ' song' + (songs.length === 1 ? '' : 's') + '.';
    var frag = document.createDocumentFragment();
    songs.forEach(function (song) {
      var link = window.MusicServices.buildLink(song, fallbackArtist);
      var li = document.createElement('li');
      li.className = 'song';

      var heading = document.createElement('h3');
      heading.textContent = song.title || '(untitled)';
      li.appendChild(heading);

      var shownArtist = song.artist || fallbackArtist;
      if (shownArtist) {
        var artistEl = document.createElement('p');
        artistEl.className = 'artist';
        artistEl.textContent = shownArtist + (song.artist ? '' : ' (from profile)');
        li.appendChild(artistEl);
      }

      var linksEl = document.createElement('div');
      linksEl.className = 'service-links';
      var a = document.createElement('a');
      a.href = link.href;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = (link.icon ? link.icon + ' ' : '') + link.name;
      linksEl.appendChild(a);
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
      var result = await fetchProfile(url);
      setStatus('Loaded ' + result.html.length.toLocaleString() + ' characters via ' + result.proxy + '. Parsing…');
      var songs = window.HtmlParser.parse(result.html);
      var fallbackArtist = getUsernameFromUrl(url);
      resultsSection.classList.remove('hidden');
      renderResults(songs, fallbackArtist);
      if (songs.length) {
        setStatus('Done — ' + songs.length + ' song' + (songs.length === 1 ? '' : 's') + ' found (via ' + result.proxy + ').', 'success');
      } else {
        setStatus('No songs found on this profile (loaded via ' + result.proxy + ').', 'error');
        showTroubleshoot();
      }
    } catch (err) {
      setStatus('Failed to fetch MySpace profile: ' + (err && err.message ? err.message : String(err)), 'error');
      showTroubleshoot();
    } finally {
      submitBtn.disabled = false;
    }
  }

  form.addEventListener('submit', onSubmit);
})();