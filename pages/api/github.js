
// pages/api/github.js
import axios from 'axios'

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || 'YOUR_GITHUB_TOKEN_HERE'
const REPO_OWNER = 'agilnrssf10928'
const REPO_NAME = 'PAYMENT-'
const FILE_PATH = 'database.json'
const BRANCH = 'main'

export default async function handler(req, res) {
  // Set CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  try {
    if (req.method === 'GET') {
      // Baca data dari GitHub
      const response = await axios.get(
        `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`,
        {
          headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      )
      
      // Decode content dari base64
      const content = Buffer.from(response.data.content, 'base64').toString('utf8')
      res.status(200).json(JSON.parse(content))
    } 
    else if (req.method === 'POST' || req.method === 'PUT') {
      // Simpan data ke GitHub
      const data = req.body
      
      // Get current file SHA
      let sha = null
      try {
        const currentFile = await axios.get(
          `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`,
          {
            headers: {
              'Authorization': `token ${GITHUB_TOKEN}`,
              'Accept': 'application/vnd.github.v3+json'
            }
          }
        )
        sha = currentFile.data.sha
      } catch (err) {
        // File belum ada, akan dibuat baru
      }

      // Encode content ke base64
      const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64')
      
      const payload = {
        message: 'Update database via API',
        content: content,
        branch: BRANCH
      }
      
      if (sha) {
        payload.sha = sha
      }

      const response = await axios.put(
        `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`,
        payload,
        {
          headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      )
      
      res.status(200).json({ success: true, data: response.data })
    }
    else {
      res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('GitHub API Error:', error.response?.data || error.message)
    res.status(error.response?.status || 500).json({ 
      error: error.response?.data?.message || 'Terjadi kesalahan pada server'
    })
  }
}
