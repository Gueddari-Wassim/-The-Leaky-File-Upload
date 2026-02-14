require("dotenv").config()
const express = require("express")
const cors = require("cors")
const path = require("path")
const fs = require("fs")

const uploadRoutes = require("./routes/upload.routes")
const { startCleanupScheduler } = require("./utils/cleanup")

const app = express()

const uploadsDir = path.join(__dirname, "uploads")
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

app.use(cors())
app.use(express.json())

app.get("/health", (req, res) => {
  res.json({ success: true, message: "Server running successfully" })
})

app.use("/api/upload", uploadRoutes)

startCleanupScheduler()

const PORT = process.env.PORT

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
