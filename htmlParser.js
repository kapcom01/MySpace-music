// htmlParser.js
// Extracts song metadata from raw HTML using several strategies and deduplicates.
// Exposes window.HtmlParser with parse(html).

(function () {
  'use strict';

  // Minimal HTML entity decoder for the entities we actually expect.
  function decodeEntities(s) {
    if (!s) return s;
    return s
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&#x27;/g, "'")
      .replace(/&nbsp;/g, ' ');
  }

  // Strip HTML tags while preserving text content. Newlines are preserved so that
  // callers like fromTextPatterns can detect line boundaries between sibling items.
  function stripTags(html) {
    return html.replace(/<[^>]+>/g, ' ').replace(/[ \t\f\v]+/g, ' ').trim();
  }

  // Strategy 1: <audio> and <source> elements with src attributes.
  // Captures the raw audio URL as `downloadUrl` on each song so the Download
  // button can open the file directly when the profile exposes one.
  function fromAudioElements(html) {
    var out = [];
    var seen = {};
    // Match <audio ...>...</audio> blocks so we can pick up <source src="..."> children.
    var audioBlockRe = /<audio\b([^>]*)>([\s\S]*?)<\/audio>/gi;
    var srcAttrRe = /src\s*=\s*["']([^"']+)["']/i;
    var m;
    while ((m = audioBlockRe.exec(html)) !== null) {
      var attrs = m[1] || '';
      var inner = m[2] || '';
      var src = ((attrs.match(srcAttrRe) || [])[1]) || '';
      if (!src) {
        var innerMatch = inner.match(/<source\b[^>]*src\s*=\s*["']([^"']+)["']/i);
        if (innerMatch) src = innerMatch[1];
      }
      if (src && !seen[src]) {
        seen[src] = true;
        out.push({
          title: src.split('/').pop() || src,
          artist: '',
          downloadUrl: src,
          source: 'audio'
        });
      }
    }
    // Also catch standalone <source src="..."> elements outside of <audio>.
    var sourceRe = /<source[^>]*src\s*=\s*["']([^"']+)["'][^>]*>/gi;
    while ((m = sourceRe.exec(html)) !== null) {
      var s = m[1];
      if (s && !seen[s]) {
        seen[s] = true;
        out.push({
          title: s.split('/').pop() || s,
          artist: '',
          downloadUrl: s,
          source: 'source'
        });
      }
    }
    return out;
  }

  // Strategy 2: data-* attributes commonly used for tracks.
  function fromDataAttributes(html) {
    var out = [];
    var re = /data-(?:song|title|track|name)\s*=\s*["']([^"']+)["']/gi;
    var seen = {};
    var m;
    while ((m = re.exec(html)) !== null) {
      var v = decodeEntities(m[1]).trim();
      if (v && !seen[v.toLowerCase()]) {
        seen[v.toLowerCase()] = true;
        out.push({ title: v, artist: '', source: 'data-attr' });
      }
    }
    // data-artist / data-track-artist pairs (matched in either attribute order).
    var pairRe = /data-(?:artist|track-artist)\s*=\s*["']([^"']+)["'][^>]*?\bdata-(?:song|track|title)\s*=\s*["']([^"']+)["']/gi;
    while ((m = pairRe.exec(html)) !== null) {
      out.push({ artist: decodeEntities(m[1]).trim(), title: decodeEntities(m[2]).trim(), source: 'data-pair' });
    }
    var pairRe2 = /data-(?:song|track|title)\s*=\s*["']([^"']+)["'][^>]*?\bdata-(?:artist|track-artist)\s*=\s*["']([^"']+)["']/gi;
    while ((m = pairRe2.exec(html)) !== null) {
      out.push({ title: decodeEntities(m[1]).trim(), artist: decodeEntities(m[2]).trim(), source: 'data-pair' });
    }
    return out;
  }

  // Strategy 3: JSON-LD structured data (schema.org MusicRecording / Song).
  function fromJsonLd(html) {
    var out = [];
    var re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    var m;
    while ((m = re.exec(html)) !== null) {
      var body = m[1].trim();
      if (!body) continue;
      try {
        var data = JSON.parse(body);
        harvest(data, out);
      } catch (e) { /* malformed JSON-LD; skip */ }
    }
    return out;
  }

  function harvest(node, out) {
    if (!node) return;
    if (Array.isArray(node)) { node.forEach(function (n) { harvest(n, out); }); return; }
    if (typeof node !== 'object') return;

    var t = node['@type'];
    var isMusic = (t === 'MusicRecording' || t === 'Song' ||
                   (Array.isArray(t) && t.some(function (x) { return x === 'MusicRecording' || x === 'Song'; })));
    if (isMusic) {
      var title = typeof node.name === 'string' ? node.name : '';
      var artist = '';
      var by = node.byArtist;
      if (by) {
        if (typeof by === 'string') artist = by;
        else if (by.name) artist = by.name;
      }
      if (title) out.push({ title: title, artist: artist, source: 'jsonld' });
    }

    // Recurse into nested objects/arrays.
    Object.keys(node).forEach(function (k) {
      if (k === '@context' || k === '@type') return;
      harvest(node[k], out);
    });
  }

  // Strategy 4: text-pattern analysis — lines that look like "Artist - Title".
  // We strip <script>/<style> blocks first so JSON-LD content doesn't pollute matches,
  // then insert newlines around block-level closers so sibling items don't run together.
  function fromTextPatterns(html) {
    var cleaned = html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
      .replace(/<\/(?:li|tr|div|p|h[1-6]|article|section|ul|ol|table)>/gi, '\n');
    var text = stripTags(decodeEntities(cleaned));
    var out = [];
    // Common separators in MySpace music lists.
    var sepRe = /([^\n\r|]{2,80})\s*[\-–—\|]\s*([^\n\r|]{2,80})/g;
    var seen = {};
    var m;
    while ((m = sepRe.exec(text)) !== null) {
      var left = m[1].trim();
      var right = m[2].trim();
      if (!left || !right) continue;
      // Skip lines that look like nav, dates, or pure numbers.
      if (/^\d+(\.\d+)?$/.test(left) || /^\d+(\.\d+)?$/.test(right)) continue;
      if (/^(home|profile|music|connect|signup|login|sign in|search)$/i.test(left)) continue;
      var key = (left + '|' + right).toLowerCase();
      if (seen[key]) continue;
      seen[key] = true;
      out.push({ artist: left, title: right, source: 'text-pattern' });
    }
    return out;
  }

  // Deduplicate by normalized "artist|title".
  function dedupe(songs) {
    var seen = {};
    var out = [];
    songs.forEach(function (s) {
      var key = ((s.artist || '') + '|' + (s.title || '')).toLowerCase().replace(/\s+/g, ' ').trim();
      if (!key || seen[key]) return;
      seen[key] = true;
      out.push(s);
    });
    return out;
  }

  function parse(html) {
    if (!html || typeof html !== 'string') return [];
    var combined = []
      .concat(fromAudioElements(html))
      .concat(fromDataAttributes(html))
      .concat(fromJsonLd(html))
      .concat(fromTextPatterns(html));
    return dedupe(combined);
  }

  window.HtmlParser = { parse: parse, _strategies: { fromAudioElements: fromAudioElements, fromDataAttributes: fromDataAttributes, fromJsonLd: fromJsonLd, fromTextPatterns: fromTextPatterns } };
})();