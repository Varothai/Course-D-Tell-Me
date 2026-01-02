# Quick Start: Deploy to Vercel in 5 Steps

## Step 1: Push Code to Git
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

## Step 2: Create Vercel Project
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New..." → "Project"
3. Import your Git repository
4. Click "Deploy" (don't worry about env vars yet)

## Step 3: Add Environment Variables
In Vercel Dashboard → Your Project → Settings → Environment Variables, add:

**Required:**
```
MONGODB_URI=your-mongodb-connection-string
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
JWT_SECRET=generate-with-openssl-rand-base64-32
```

**If using CMU Auth:**
```
CMU_ENTRAID_CLIENT_ID=your-client-id
CMU_ENTRAID_CLIENT_SECRET=your-client-secret
CMU_ENTRAID_REDIRECT_URL=https://your-app.vercel.app/cmuEntraIDCallback
CMU_ENTRAID_GET_TOKEN_URL=https://login.microsoftonline.com/cf81f1df-de59-4c29-91da-a2dfd04aa751/oauth2/v2.0/token
CMU_ENTRAID_GET_BASIC_INFO=https://graph.microsoft.com/v1.0/me
SCOPE=openid profile email
```

## Step 4: Update OAuth Redirect URLs
- **Google Console**: Add `https://your-app.vercel.app/api/auth/callback/google`
- **CMU EntraID**: Add `https://your-app.vercel.app/cmuEntraIDCallback`

## Step 5: Redeploy
1. In Vercel Dashboard, go to Deployments
2. Click "..." on latest deployment → "Redeploy"
3. Wait for deployment to complete
4. Test your app!

---

**Generate Secrets:**
```bash
# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))

# Or use online: https://generate-secret.vercel.app/32
```

**Full guide:** See `VERCEL_DEPLOYMENT_GUIDE.md`

