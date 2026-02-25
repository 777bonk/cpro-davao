import express from 'express'
import cors from 'cors'
import authRouter from './routes/auth.js'

const app = express()
const PORT = 3001

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())

app.use('/api/auth', authRouter)

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})