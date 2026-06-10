# GitHub CDN - Full Setup Guide

## Step 1: GitHub Personal Access Token (free)

1. https://github.com/settings/tokens → **Generate new token** → **Fine-grained token**
2. Name: `github-cdn`
3. Repository access: **Only select repositories** → choose/creates repo
4. Permissions → **Contents: Read and Write**
5. **Generate token** → COPY KARO (baad me nahi dikhega)

## Step 2: GitHub Repo banao

1. https://github.com/new
2. Repository name: `my-cdn` (ya kuch bhi)
3. **Public** rakho (private nahi)
4. **Create repository**

## Step 3: Server me settings dalo

`server.js` file kholo aur ye change karo:

```js
const GITHUB_TOKEN = 'ghp_...'       // Step 1 ka token
const GITHUB_OWNER = 'tumhara_username' // GitHub username
const GITHUB_REPO = 'my-cdn'          // Step 2 ka repo name
```

## Step 4: Server run karo

```bash
cd github-cdn
npm install
npm start
```

## Step 5: Apni website me implement karo

**Frontend code (user ke browser me):**
```html
<form id="uploadForm">
  <input type="file" id="imageInput" accept="image/*" required>
  <button type="submit">Upload Photo</button>
</form>
<div id="uploadResult"></div>

<script>
document.getElementById('uploadForm').onsubmit = async (e) => {
  e.preventDefault()
  const file = imageInput.files[0]

  const formData = new FormData()
  formData.append('image', file)

  const res = await fetch('https://YOUR_SERVER_URL/api/upload', {
    method: 'POST',
    body: formData
  })
  const data = await res.json()

  if (data.success) {
    // ✅ CDN URL mil gaya - ab ise apne database me save karo
    console.log('Photo CDN URL:', data.url)

    uploadResult.innerHTML = `
      <p>Upload ho gaya!</p>
      <img src="${data.url}" style="max-width:300px">
    `
  }
}
</script>
```

## Step 6: Deploy anywhere (Render / Railway / etc.)

Render free pe deploy karna hai to:
1. GitHub pe push karo
2. Render me New Web Service → repo connect
3. Build: `npm install`
4. Start: `node server.js`

Ya ghar ke PC pe chalao:
```bash
npm install -g pm2
pm2 start server.js
cloudflared tunnel --url http://localhost:3000
```

---

**Flow complete:**
```
User upload → Tera Server → GitHub API → repo mein save
                                          ↓
                              raw.githubusercontent.com (CDN)
                                          ↓
                              Browser me photo dikhe
```
