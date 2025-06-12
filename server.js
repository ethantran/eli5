import express from 'express'
import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const port = process.env.PORT || 3000

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')))

// For all other routes, serve the index.html file (SPA)
app.get('*', (req, res) => {
    const indexPath = path.join(__dirname, 'dist', 'index.html')
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath)
    } else {
        res.status(404).send('Application not built. Run `npm run build` first.')
    }
})

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`)
}) 