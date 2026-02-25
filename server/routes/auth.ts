import { Router } from 'express'

const router = Router()

const ADMIN = {
  username: 'admin',
  password: 'admin123'
}

router.post('/login', (req, res) => {
  const { username, password } = req.body
  if (username === ADMIN.username && password === ADMIN.password) {
    res.json({ success: true, message: 'Login successful' })
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' })
  }
})

export default router
