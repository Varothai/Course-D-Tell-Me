# Vercel Deployment Guide

This guide will walk you through deploying your Next.js course review application to Vercel step by step.

## Prerequisites

Before starting, ensure you have:
- ✅ A Vercel account (sign up at [vercel.com](https://vercel.com) if needed)
- ✅ Your MongoDB database connection string ready
- ✅ Google OAuth credentials (Client ID and Secret)
- ✅ CMU EntraID OAuth credentials (if using CMU authentication)
- ✅ All environment variables documented

---

## Step 1: Prepare Your Codebase

### 1.1 Verify Build Scripts
Your `package.json` should have a build script (already present):
```json
"build": "next build"
```

### 1.2 Ensure Git Repository is Ready
Make sure your code is committed to a Git repository (GitHub, GitLab, or Bitbucket):

```bash
# Check if you have a git repository
git status

# If not initialized, initialize it:
git init
git add .
git commit -m "Initial commit"
```

### 1.3 Push to Remote Repository
If you haven't already, push your code to GitHub/GitLab/Bitbucket:

```bash
# Add your remote repository
git remote add origin <your-repository-url>

# Push your code
git push -u origin main
```

---

## Step 2: Install Vercel CLI (Optional but Recommended)

You can deploy via the web interface, but the CLI is useful for testing:

```bash
npm install -g vercel
```

---

## Step 3: Create Vercel Project

### Option A: Deploy via Vercel Dashboard (Recommended for First Time)

1. **Go to Vercel Dashboard**
   - Visit [vercel.com](https://vercel.com)
   - Sign in or create an account

2. **Import Your Project**
   - Click "Add New..." → "Project"
   - Import your Git repository (GitHub/GitLab/Bitbucket)
   - Select your repository from the list

3. **Configure Project**
   - **Framework Preset**: Vercel should auto-detect "Next.js"
   - **Root Directory**: Leave as `./` (unless your Next.js app is in a subdirectory)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)
   - **Install Command**: `npm install` (auto-detected)

### Option B: Deploy via CLI

```bash
# In your project directory
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? (Select your account/team)
# - Link to existing project? No (for first deployment)
# - Project name? (Enter a name or press Enter for default)
# - Directory? (Press Enter for current directory)
```

---

## Step 4: Configure Environment Variables

This is **CRITICAL** - your app won't work without these!

### 4.1 Access Environment Variables Settings

**Via Dashboard:**
1. Go to your project in Vercel Dashboard
2. Click on **Settings** tab
3. Click on **Environment Variables** in the left sidebar

**Via CLI:**
```bash
vercel env add <VARIABLE_NAME>
```

### 4.2 Add Required Environment Variables

Add the following environment variables. For each variable:
- **Name**: The variable name (exactly as shown)
- **Value**: Your actual value
- **Environment**: Select all (Production, Preview, Development)

#### Required Environment Variables:

```bash
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority

# NextAuth Configuration
NEXTAUTH_URL=https://your-app-name.vercel.app
NEXTAUTH_SECRET=your-random-secret-key-here-min-32-chars

# Google OAuth (for Google Sign-In)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# JWT Secret (for CMU authentication)
JWT_SECRET=your-jwt-secret-key-min-32-characters-long

# CMU EntraID OAuth (if using CMU authentication)
CMU_ENTRAID_CLIENT_ID=your-cmu-entraid-client-id
CMU_ENTRAID_CLIENT_SECRET=your-cmu-entraid-client-secret
CMU_ENTRAID_REDIRECT_URL=https://your-app-name.vercel.app/cmuEntraIDCallback
CMU_ENTRAID_GET_TOKEN_URL=https://login.microsoftonline.com/cf81f1df-de59-4c29-91da-a2dfd04aa751/oauth2/v2.0/token
CMU_ENTRAID_GET_BASIC_INFO=https://graph.microsoft.com/v1.0/me
SCOPE=openid profile email

# Optional: Base URL (for API routes)
NEXT_PUBLIC_BASE_URL=https://your-app-name.vercel.app
```

### 4.3 Important Notes:

1. **NEXTAUTH_URL**: 
   - For production: Use your Vercel deployment URL
   - Format: `https://your-app-name.vercel.app`
   - Update this after your first deployment

2. **NEXTAUTH_SECRET**: 
   - Generate a random secret: `openssl rand -base64 32`
   - Or use: [generate-secret.vercel.app](https://generate-secret.vercel.app/32)

3. **JWT_SECRET**: 
   - Should be a long random string (minimum 32 characters)
   - Generate similar to NEXTAUTH_SECRET

4. **CMU_ENTRAID_REDIRECT_URL**: 
   - Must match exactly what's configured in your CMU EntraID app registration
   - Update this URL in your CMU EntraID app settings if needed

5. **MONGODB_URI**: 
   - Get this from MongoDB Atlas or your MongoDB provider
   - Format: `mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority`

---

## Step 5: Update OAuth Redirect URLs

### 5.1 Google OAuth Console

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **APIs & Services** → **Credentials**
3. Edit your OAuth 2.0 Client ID
4. Add to **Authorized redirect URIs**:
   ```
   https://your-app-name.vercel.app/api/auth/callback/google
   ```
5. Save changes

### 5.2 CMU EntraID App Registration

1. Go to Azure Portal → App Registrations
2. Select your CMU EntraID app
3. Go to **Authentication**
4. Add to **Redirect URIs**:
   ```
   https://your-app-name.vercel.app/cmuEntraIDCallback
   ```
5. Save changes

---

## Step 6: Deploy

### Via Dashboard:
1. After adding environment variables, go to **Deployments** tab
2. Click the **"..."** menu on your latest deployment
3. Click **"Redeploy"**
4. Or push a new commit to trigger automatic deployment

### Via CLI:
```bash
vercel --prod
```

---

## Step 7: Verify Deployment

### 7.1 Check Build Logs

1. Go to your deployment in Vercel Dashboard
2. Click on the deployment to view logs
3. Check for any build errors

### 7.2 Test Your Application

1. Visit your deployment URL: `https://your-app-name.vercel.app`
2. Test key features:
   - ✅ Homepage loads
   - ✅ Authentication (Google Sign-In)
   - ✅ Database connections
   - ✅ API routes work
   - ✅ Course reviews functionality

### 7.3 Common Issues to Check

- **Build fails**: Check build logs for errors
- **Database connection fails**: Verify `MONGODB_URI` is correct
- **Authentication doesn't work**: Verify OAuth redirect URLs match
- **Environment variables not loading**: Ensure they're added for the correct environment

---

## Step 8: Configure Custom Domain (Optional)

1. Go to **Settings** → **Domains**
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update `NEXTAUTH_URL` and OAuth redirect URLs to use your custom domain

---

## Step 9: Set Up Automatic Deployments

Vercel automatically deploys when you push to your main branch:

1. **Production**: Deploys from `main` or `master` branch
2. **Preview**: Deploys from other branches and pull requests
3. **Development**: Deploys from development branches (if configured)

### Branch Protection (Recommended)

1. Go to **Settings** → **Git**
2. Configure branch protection if needed
3. Set up preview deployments for pull requests

---

## Step 10: Monitor and Maintain

### 10.1 View Logs

- **Real-time logs**: Vercel Dashboard → Your Project → **Logs** tab
- **Function logs**: View serverless function execution logs

### 10.2 Performance Monitoring

- Vercel Analytics (if enabled)
- Check **Speed Insights** in dashboard
- Monitor API route performance

### 10.3 Update Environment Variables

- Go to **Settings** → **Environment Variables**
- Edit or add new variables as needed
- **Important**: Redeploy after changing environment variables

---

## Troubleshooting

### Build Fails

**Error: Module not found**
```bash
# Solution: Ensure all dependencies are in package.json
npm install
git add package.json package-lock.json
git commit -m "Update dependencies"
```

**Error: TypeScript errors**
- Your `next.config.mjs` has `ignoreBuildErrors: true`, so this shouldn't block deployment
- Fix TypeScript errors for production quality

### Runtime Errors

**Error: MongoDB connection failed**
- Verify `MONGODB_URI` is correct
- Check MongoDB Atlas IP whitelist (add `0.0.0.0/0` for Vercel)
- Verify database user has correct permissions

**Error: NextAuth configuration error**
- Verify `NEXTAUTH_URL` matches your deployment URL
- Verify `NEXTAUTH_SECRET` is set
- Check OAuth redirect URLs match

**Error: JWT verification failed**
- Verify `JWT_SECRET` is set correctly
- Ensure it matches the secret used to sign tokens

### Environment Variables Not Working

- Ensure variables are added for the correct environment (Production/Preview/Development)
- Redeploy after adding/changing environment variables
- Variable names are case-sensitive

---

## Quick Reference: Environment Variables Checklist

Before deploying, ensure you have:

- [ ] `MONGODB_URI`
- [ ] `NEXTAUTH_URL` (update after first deployment)
- [ ] `NEXTAUTH_SECRET`
- [ ] `GOOGLE_CLIENT_ID`
- [ ] `GOOGLE_CLIENT_SECRET`
- [ ] `JWT_SECRET`
- [ ] `CMU_ENTRAID_CLIENT_ID` (if using CMU auth)
- [ ] `CMU_ENTRAID_CLIENT_SECRET` (if using CMU auth)
- [ ] `CMU_ENTRAID_REDIRECT_URL` (if using CMU auth)
- [ ] `CMU_ENTRAID_GET_TOKEN_URL` (if using CMU auth)
- [ ] `CMU_ENTRAID_GET_BASIC_INFO` (if using CMU auth)
- [ ] `SCOPE` (if using CMU auth)

---

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [NextAuth.js Configuration](https://next-auth.js.org/configuration/options)
- [MongoDB Atlas Setup](https://www.mongodb.com/docs/atlas/getting-started/)

---

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Review environment variables
3. Verify OAuth redirect URLs
4. Check MongoDB connection settings
5. Review Next.js build output

Good luck with your deployment! 🚀

