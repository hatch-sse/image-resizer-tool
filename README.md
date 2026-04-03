# SSEN Image Resizer

A browser-based image resizing and cropping tool built for SSEN content teams.

It provides quick preset-based exports for website, social, newsletter and SSE.com use cases, with live crop preview, batch export, AI alt text generation and optional AI upscaling.

## Features

- Preset image sizes for:
  - Web article
  - Social
  - Internal newsletter
  - Full website
  - SSE.com News & views
- Custom width and height resizing
- Live crop preview
- Zoom, rotate, flip and reset controls
- Batch ZIP export
- AI alt text generation
- AI upscale export
- Optional website header overlay guide
- Multiple skins:
  - SSEN Distribution
  - SSE.com
  - MAC OS9

## Skins

### SSEN Distribution
The default skin, designed for the original SSEN internal workflow.

### SSE.com
A dedicated alternate skin with:
- SSE branding
- SSE logo
- square UI styling
- updated button colours and hover wipe animation
- simplified **News & views** preset group
- **Article image** preset at `790 × 527`

### MAC OS9
A novelty retro skin toggled by clicking the logo.

## Presets

### Article
- Website article — `400 × 250`
- Web banner — `1630 × 580`

### Social
- Portrait — `1080 × 1920`
- Instagram — `1080 × 1350`
- Square — `1080 × 1080`

### Internal newsletter
- Banner — `2400 × 600`
- Featured image — `1000 × 600`
- Collage — `1200 × 1200`
- Collage — `1400 × 800`
- Inline — `1200 × 800`

### Full website / News & views
Default SSEN skin includes the full website preset library.

SSE.com skin replaces that group with:
- Article image — `790 × 527`

## AI Features

### AI Alt Text
Generate short, factual alt text for the current image crop.

This requires a working serverless endpoint and a valid `GEMINI_API_KEY` environment variable.

### AI Upscale
Supports:
- `2x`
- `4x` (two 2x passes)

## Project Structure

```text
.
├── index.html
├── styles.css
├── app.js
├── api/
│   └── alt-text.js
├── SSEN_Distribution.png
├── SSE_Logo_REVERSE.png
└── vercel.json
