# Music Discovery Hub

A browser-based music discovery and metadata aggregation tool for MySpace profiles. Extract song information from MySpace and discover music on official licensed streaming platforms.

## Features

✅ **Privacy-First**: All processing happens in your browser - no data sent to external servers  
✅ **YouTube Search**: Each discovered song links to its YouTube search results page  
✅ **Download Button**: Each song has a Download button. If the MySpace profile exposes a direct audio URL (via `<audio src="...">` or `<source src="...">`), the button opens that file so the browser can play or save it. Otherwise the button opens the MySpace profile's `/music/songs` page so the song can be picked manually.  
✅ **Browser-Based**: No installation required - runs entirely in your web browser  
✅ **GitHub Pages Ready**: Deploy directly to GitHub Pages

## How to Use

1. Visit: <https://kapcom01.github.io/MySpace-music/>
2. Paste a MySpace music profile URL (e.g., `https://myspace.com/username/music/songs`)
3. Click "Extract Metadata"
4. Browse the discovered songs
5. For each song, click either:
   - **▶️ YouTube** — search YouTube for `song name - artist`
   - **⬇️ Download** — open the song's direct audio file (if the profile exposes one) or fall back to the MySpace profile's music page

## Supported Streaming Services

- ▶️ **YouTube** - https://youtube.com (search results page per song)

## Download

Each song has a Download button. Behaviour:

- **Direct audio URL available**: the button opens the captured audio file URL (`<audio src="...">` or `<source src="...">` from the profile HTML). The browser will play it inline or offer to save it.
- **No direct URL**: the button opens the MySpace profile's `/music/songs` page so the song can be picked manually.

**The user is responsible for ensuring any music downloaded is royalty-free or otherwise licensed for download.** A license checker is planned but not yet implemented.

## Deployment

### Option 1: GitHub Pages (Recommended)

1. Go to repository Settings > Pages
2. Under "Build and deployment", select:
   - Source: Deploy from a branch
   - Branch: `main` / `/(root)`
3. Save and wait for deployment
4. Your site will be available at: `https://kapcom01.github.io/myspace-music-downloader/`

### Option 2: Local Testing

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js with http-server
npx http-server

# Then visit: http://localhost:8000
```

## Technical Architecture

### Files

- **index.html** - Main user interface
- **styles.css** - Responsive styling and UI components
- **app.js** - Main application logic and event handling
- **htmlParser.js** - HTML parsing and song metadata extraction
- **musicServices.js** - Streaming service URL generators

### How It Works

1. User provides a MySpace profile URL
2. App fetches the page via a fallback chain of public CORS proxies (allorigins JSON, allorigins raw, corsproxy.io)
3. HTML parser extracts song metadata using multiple strategies:
   - Audio element detection
   - Data attributes parsing
   - JSON-LD structured data
   - Text pattern analysis
4. Results are deduplicated and displayed
5. For each song the user gets:
   - A YouTube search button (format: `song name - artist`)
   - A Download button that opens the song's direct audio file URL (when the profile exposes one via `<audio src>` / `<source src>`), or falls back to opening the MySpace profile's `/music/songs` page
   - If the parser didn't extract an artist, the MySpace URL username is used as a fallback

## CORS Proxy

This app tries a fallback chain of public CORS proxies — [allorigins.win](https://allorigins.win/) (JSON + raw endpoints) and [corsproxy.io](https://corsproxy.io/) — to fetch the MySpace profile HTML. If one proxy is down or rate-limited, the next one is tried automatically.

## Privacy & Data

- ✅ All data processing happens in your browser
- ✅ No data is sent to our servers
- ✅ URL is sent only to allorigins.win (CORS proxy)
- ✅ No tracking or analytics
- ✅ Fully open-source

## Legal

This tool extracts publicly visible song metadata from MySpace profiles and provides Download buttons that open either the profile's direct audio URLs or the MySpace music page.

- ✅ Extracts publicly visible song metadata
- ✅ Links to YouTube search results
- ✅ Provides direct links to audio files that the profile itself exposes
- ⚖️ The user is responsible for ensuring any downloaded music is royalty-free or otherwise licensed for download
- ❌ This project does not host, store, or distribute any music or video files itself

Support artists by purchasing their music or listening on authorized platforms whenever possible.

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## License

MIT License - Feel free to fork, modify, and deploy!

## Contributing

Contributions are welcome! To improve:

- Better HTML parsing strategies
- UI/UX improvements
- Bug fixes
- Additional or alternative download-service integrations

Please open an issue or submit a pull request.

## Troubleshooting

### "Failed to fetch MySpace profile"

- Check the URL is correct
- Ensure it's a MySpace URL
- Try a different MySpace profile
- The profile might be private or deleted

### "No songs found"

- The profile might not have publicly visible songs
- Try a different MySpace profile with music content

### Cross-Origin Errors

- The app uses allorigins.win as a CORS proxy
- If this service is unavailable, try again later

## Resources

- [MySpace](https://myspace.com)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [MDN Web Docs](https://developer.mozilla.org/)

---

**Made with ❤️ for music discovery**
