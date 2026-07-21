# Music Discovery Hub

A browser-based music discovery and metadata aggregation tool for MySpace profiles. Extract song information from MySpace and discover music on official licensed streaming platforms.

## Features

✅ **Privacy-First**: All processing happens in your browser - no data sent to external servers  
✅ **Legal & Ethical**: Links only to official streaming services (Spotify, YouTube Music, Apple Music, etc.)  
✅ **No Download Button**: This is a discovery tool, not a downloader  
✅ **Multiple Streaming Platforms**: Search on Spotify, YouTube Music, Apple Music, SoundCloud, Bandcamp, Tidal, and YouTube  
✅ **Browser-Based**: No installation required - runs entirely in your web browser  
✅ **GitHub Pages Ready**: Deploy directly to GitHub Pages

## How to Use

1. Visit: [GitHub Pages URL will be available after enabling Pages]
2. Paste a MySpace music profile URL (e.g., `https://myspace.com/username/music/songs`)
3. Click "Extract Metadata"
4. Browse the discovered songs
5. Click any streaming service link to search for that song on official platforms

## Supported Streaming Services

- 🎵 **Spotify** - https://open.spotify.com
- ▶️ **YouTube Music** - https://music.youtube.com
- 🍎 **Apple Music** - https://music.apple.com
- ▶️ **YouTube** - https://youtube.com
- ☁️ **SoundCloud** - https://soundcloud.com
- 🎶 **Bandcamp** - https://bandcamp.com
- 🌊 **Tidal** - https://tidal.com

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
2. App fetches the page using a CORS proxy (allorigins.win)
3. HTML parser extracts song metadata using multiple strategies:
   - Audio element detection
   - Data attributes parsing
   - JSON-LD structured data
   - Text pattern analysis
4. Results are deduplicated and displayed
5. User can click service links to search on official platforms

## CORS Proxy

This app uses [allorigins.win](https://allorigins.win/) for CORS support. This is a public, free service that allows fetching cross-origin content in the browser.

## Privacy & Data

- ✅ All data processing happens in your browser
- ✅ No data is sent to our servers
- ✅ URL is sent only to allorigins.win (CORS proxy)
- ✅ No tracking or analytics
- ✅ Fully open-source

## Legal

This tool is for music discovery and metadata aggregation only. It:

- ✅ Extracts publicly visible song metadata
- ✅ Links to official, licensed streaming services
- ✅ Does NOT download, store, or distribute music
- ✅ Respects artist and label rights

Users can then discover and support artists by listening on their preferred authorized streaming platform.

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
- Additional music service links
- UI/UX improvements
- Bug fixes

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
