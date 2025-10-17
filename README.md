# Portfolio B

Michael Wiss portfolio website with modern architecture and separated concerns.

## Project Structure

```
Portfolio_B/
├── index.html              # Main site entry (optimized for deployment)
├── demo1.html              # Legacy redirect to index.html
├── assets/
│   ├── css/
│   │   ├── main.css        # Main stylesheet (extracted from HTML)
│   │   └── components/     # Future component-specific styles
│   ├── js/
│   │   ├── main.js         # Main JavaScript file (extracted from HTML)
│   │   └── components/     # Future component-specific scripts
│   ├── media/
│   │   ├── images/         # Image assets
│   │   └── videos/         # Video and GIF files
│   │       ├── printedPoster.gif
│   │       ├── printedPoster.mov
│   │       ├── runnersRotation.gif
│   │       ├── runnersRotation.mov
│   │       └── Screen Recording 2025-10-14 at 1.46.17 PM.mov
│   └── data/
│       └── content.json    # Structured content data
├── backup/                 # Archived HTML files
│   ├── portfolioB.html
│   ├── demo.html
│   └── demoresume.html
└── README.md
```

## Development

The main development file is `index.html` (formerly `demo1.html`). It now uses:
- External CSS: `assets/css/main.css`
- External JS: `assets/js/main.js`
- Organized media files in `assets/media/videos/`
- Structured content data in `assets/data/content.json`

## Recent Changes

### Step 1: Project Structure & Organization ✅

1. **Created organized folder structure** with assets subfolder
2. **Moved backup files** to preserve existing HTML versions
3. **Extracted CSS** from inline styles to `assets/css/main.css`
4. **Extracted JavaScript** from inline scripts to `assets/js/main.js`
5. **Organized media files** in `assets/media/videos/` with updated references
6. **Created content data structure** in `assets/data/content.json`

### Benefits
- **Maintainable**: Separate files for HTML, CSS, and JS
- **Organized**: Clear folder structure for different asset types
- **Scalable**: Ready for future component-based development
- **Version controlled**: Backup of previous iterations preserved
- **Performance ready**: Foundation for optimization and minification

## Next Steps

When ready for further improvements:
- **Step 2**: Code Quality & Optimization
- **Step 3**: Performance & SEO enhancements  
- **Step 4**: Content & Branding consistency

## Usage

Open `index.html` in a browser (or deploy via Vercel for a production-ready preview). The legacy `demo1.html` simply redirects to the root for backward compatibility.

## Deployment

### Vercel
1. Install the Vercel CLI if needed: `npm i -g vercel`.
2. From the project root, run `vercel` for a one-time setup (project name is preconfigured in `vercel.json`).
3. Subsequent deploys can use `vercel --prod` to publish production builds.

The included `vercel.json` enables clean URLs and keeps older `/demo1` links working by redirecting them to `/`. All assets are served statically, so no build step is required.
