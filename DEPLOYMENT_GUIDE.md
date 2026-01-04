# FoodXpress Deployment Guide

## ✅ Deployment Checklist

### Backend (Render)
- [x] Uses `process.env.PORT`
- [x] CORS configured with `CLIENT_URL`
- [x] Socket.IO uses same `CLIENT_URL`
- [x] Starts with `node server.js`
- [x] No placeholder routes served

### Frontend (Vercel)
- [x] API baseURL = `REACT_APP_API_URL + "/api"`
- [x] Socket connects to `REACT_APP_API_URL`
- [x] Builds with `npm run build`

---

## 🚀 Backend Deployment (Render)

### Step 1: Create Web Service

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Select the **backend** folder (or use root if monorepo)

### Step 2: Configure Build Settings

```yaml
Name: foodxpress-backend
Environment: Node
Region: Choose closest to your users
Branch: main
Root Directory: backend
Build Command: npm install
Start Command: node server.js
```

### Step 3: Set Environment Variables

Add these in Render dashboard under **"Environment"**:

```bash
# Database (REQUIRED)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/foodxpress

# JWT Secret (REQUIRED - Generate a secure random string)
JWT_SECRET=your-super-secure-jwt-secret-min-32-characters-long

# Frontend URL (REQUIRED - Add after deploying frontend)
CLIENT_URL=https://your-frontend-domain.vercel.app

# Node Environment
NODE_ENV=production
```

### Step 4: Deploy

1. Click **"Create Web Service"**
2. Wait for deployment to complete
3. Copy your backend URL: `https://foodxpress-backend-xxxx.onrender.com`

---

## 🎨 Frontend Deployment (Vercel)

### Step 1: Prepare for Deployment

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository

### Step 2: Configure Build Settings

```yaml
Framework Preset: Create React App
Root Directory: frontend
Build Command: npm run build
Output Directory: build
Install Command: npm install
```

### Step 3: Set Environment Variables

Add this in Vercel dashboard under **"Environment Variables"**:

```bash
# Backend API URL (REQUIRED - Use your Render backend URL)
REACT_APP_API_URL=https://foodxpress-backend-xxxx.onrender.com
```

⚠️ **IMPORTANT**: Do NOT include `/api` in `REACT_APP_API_URL` - it's added automatically in the code.

### Step 4: Deploy

1. Click **"Deploy"**
2. Wait for build to complete
3. Copy your frontend URL: `https://your-app-name.vercel.app`

---

## 🔄 Post-Deployment Update

### Update Backend CLIENT_URL

After frontend is deployed, **update the backend environment variable**:

1. Go to your Render backend service
2. Navigate to **"Environment"**
3. Update `CLIENT_URL` with your Vercel frontend URL:
   ```bash
   CLIENT_URL=https://your-app-name.vercel.app
   ```
4. Save changes (Render will auto-redeploy)

---

## 🧪 Testing Checklist

After both deployments are complete, test these features:

### ✅ Must Work

- [ ] Home page loads
- [ ] Restaurant list displays
- [ ] Login/Register works
- [ ] Order placement works
- [ ] Orders page loads (no white screen)
- [ ] Track Order page loads (no white screen)
- [ ] Live status updates via Socket.IO
- [ ] No `/api/api` double routes in network tab
- [ ] No console errors
- [ ] No 404 errors for placeholder images

### Testing URLs

```bash
# Backend health check
https://your-backend.onrender.com/api/health

# Frontend
https://your-frontend.vercel.app
```

---

## 🔧 MongoDB Setup (MongoDB Atlas)

### If you don't have a MongoDB database:

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user
4. Whitelist all IPs: `0.0.0.0/0` (for Render/Vercel)
5. Get connection string:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/foodxpress
   ```

---

## 🐛 Troubleshooting

### Issue: CORS errors

**Symptom**: `Access-Control-Allow-Origin` errors in browser console

**Solution**:
1. Verify `CLIENT_URL` in Render matches your Vercel domain exactly
2. No trailing slash in URL
3. Redeploy backend after changing environment variables

### Issue: Socket.IO not connecting

**Symptom**: "Socket connection error" in console

**Solution**:
1. Verify `REACT_APP_API_URL` points to backend (no `/api` suffix)
2. Check `CLIENT_URL` is set correctly in backend
3. Verify token is stored in localStorage

### Issue: 404 on API calls

**Symptom**: `/api/api/restaurants` or similar double routes

**Solution**:
- Already fixed! Frontend correctly appends `/api` to base URL

### Issue: Orders/Track page white screen

**Symptom**: Blank page, no errors

**Solution**:
- Verify MongoDB connection
- Check browser console for errors
- Verify backend is running: visit `/api/health`

### Issue: Images not loading

**Symptom**: Placeholder images show 404

**Solution**:
- This is expected for demo data
- Upload real images through the app
- Images are stored in `/backend/uploads/`

---

## 📝 Environment Variables Summary

### Backend (Render)

| Variable | Required | Example |
|----------|----------|---------|
| `MONGODB_URI` | ✅ Yes | `mongodb+srv://user:pass@cluster.mongodb.net/foodxpress` |
| `JWT_SECRET` | ✅ Yes | `super-secure-random-string-min-32-chars` |
| `CLIENT_URL` | ✅ Yes | `https://your-app.vercel.app` |
| `NODE_ENV` | ⚠️ Recommended | `production` |

### Frontend (Vercel)

| Variable | Required | Example |
|----------|----------|---------|
| `REACT_APP_API_URL` | ✅ Yes | `https://foodxpress-backend.onrender.com` |

---

## 🔐 Security Notes

1. **JWT_SECRET**: Generate a secure random string (32+ characters)
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **MongoDB**: Never commit connection strings to Git

3. **Environment Variables**: Set in platform dashboards, not in code

---

## 🚦 Deployment Status

Once deployed, your URLs should be:

- **Backend API**: `https://foodxpress-backend-xxxx.onrender.com/api`
- **Frontend**: `https://your-app-name.vercel.app`
- **Health Check**: `https://foodxpress-backend-xxxx.onrender.com/api/health`

---

## 📞 Support

If you encounter issues:

1. Check Render logs for backend errors
2. Check Vercel logs for build errors
3. Check browser console for frontend errors
4. Verify all environment variables are set correctly

---

## ✨ Success!

If all tests pass, your FoodXpress app is live and ready to use! 🎉

- Restaurants can manage menus and orders
- Customers can browse, order, and track deliveries
- Delivery partners can pick up and deliver orders
- Real-time updates via Socket.IO work seamlessly
