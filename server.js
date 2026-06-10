const express = require('express')
const multer = require('multer')
const cors = require('cors')
const path = require('path')
const crypto = require('crypto')

const app = express()
app.use(cors())
app.use(express.json())
app.use(express.static('public'))

// 🔥 Render Dashboard me ye Environment Variables set karo 🔥
const GITHUB_TOKEN = process.env.GITHUB_TOKEN
const GITHUB_OWNER = process.env.GITHUB_OWNER
const GITHUB_REPO = process.env.GITHUB_REPO
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main'
const PORT = process.env.PORT || 3000

if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
  console.error('ERROR: GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO env vars set karo')
  process.exit(1)
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    if (['image/jpeg','image/png','image/webp','image/gif','image/avif'].includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Sirf JPEG, PNG, WebP, GIF, AVIF allow hai'))
    }
  },
})

app.post('/api/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'File nahi mila' })

    const ext = path.extname(req.file.originalname) || '.jpg'
    const uniqueName = Date.now() + '-' + crypto.randomBytes(4).toString('hex') + ext
    const githubPath = 'uploads/' + uniqueName
    const base64 = req.file.buffer.toString('base64')

    const ghRes = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${githubPath}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Upload ${uniqueName}`,
          content: base64,
          branch: GITHUB_BRANCH,
        }),
      }
    )

    if (!ghRes.ok) {
      const err = await ghRes.json()
      throw new Error(err.message || 'GitHub upload fail')
    }

    const cdnUrl = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${githubPath}`

    res.json({
      success: true,
      url: cdnUrl,
      original_name: req.file.originalname,
      size: req.file.size,
      mime: req.file.mimetype,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/photos', async (req, res) => {
  try {
    const ghRes = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/uploads`,
      {
        headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}` },
      }
    )
    if (ghRes.status === 404) return res.json({ photos: [] })
    if (!ghRes.ok) return res.json({ photos: [] })

    const files = await ghRes.json()
    const photos = files
      .filter(f => f.type === 'file')
      .sort((a, b) => b.name.localeCompare(a.name))
      .slice(0, 50)
      .map(f => ({
        name: f.name,
        url: `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/uploads/${f.name}`,
        size: f.size,
      }))

    res.json({ photos })
  } catch {
    res.json({ photos: [] })
  }
})

app.listen(PORT, () => {
  console.log(`🚀 GitHub CDN running on http://localhost:${PORT}`)
})
