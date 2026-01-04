# FoodXpress Deployment - Quick Reference Card

## 🚀 Backend (Render)

### Build Settings
```
Root Directory: backend
Build Command: npm install
Start Command: node server.js
```

### Environment Variables
```bash
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/foodxpress
JWT_SECRET=generate-secure-random-32-char-string
CLIENT_URL=https://your-frontend.vercel.app
NODE_ENV=production
```

### Generate JWT Secret
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🎨 Frontend (Vercel)

### Build Settings
```
Framework: Create React App
Root Directory: frontend
Build Command: npm run build
Output Directory: build
```

### Environment Variables
```bash
REACT_APP_API_URL=https://your-backend.onrender.com
```

⚠️ **NO `/api` at the end** - it's added automatically!

---

## 🔄 Post-Deploy

1. Deploy Backend first → Get URL
2. Deploy Frontend with Backend URL
3. Update Backend `CLIENT_URL` with Frontend URL
4. Backend auto-redeploys

---

## ✅ Test URLs

```
Backend Health: https://your-backend.onrender.com/api/health
Frontend: https://your-frontend.vercel.app
```

---

## 🐛 Quick Troubleshooting

| Issue | Fix |
|-------|-----|
| CORS errors | Verify `CLIENT_URL` matches frontend domain exactly |
| Socket.IO fails | Check `REACT_APP_API_URL` has no `/api` suffix |
| 404 API calls | Already fixed! ✅ |
| White screens | Check MongoDB connection & browser console |

---

## 📋 Deployment Checklist

- [ ] MongoDB Atlas setup (whitelist `0.0.0.0/0`)
- [ ] Generate secure JWT_SECRET
- [ ] Backend deployed on Render
- [ ] Frontend deployed on Vercel
- [ ] Backend CLIENT_URL updated with frontend domain
- [ ] Test: Restaurants load
- [ ] Test: Orders work
- [ ] Test: Track Order page
- [ ] Test: Socket.IO updates

---

**Done! 🎉 See DEPLOYMENT_GUIDE.md for full details.**
