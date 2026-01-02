# Vercel Deployment Checklist

Use this checklist to ensure a successful deployment.

## Pre-Deployment

- [ ] Code is committed to Git repository
- [ ] Repository is pushed to GitHub/GitLab/Bitbucket
- [ ] All dependencies are in `package.json`
- [ ] Build command works locally: `npm run build`
- [ ] Application runs locally: `npm run dev`

## Environment Variables Setup

- [ ] `MONGODB_URI` - MongoDB connection string
- [ ] `NEXTAUTH_URL` - Will be `https://your-app.vercel.app` (update after first deploy)
- [ ] `NEXTAUTH_SECRET` - Random 32+ character string
- [ ] `GOOGLE_CLIENT_ID` - From Google Cloud Console
- [ ] `GOOGLE_CLIENT_SECRET` - From Google Cloud Console
- [ ] `JWT_SECRET` - Random 32+ character string
- [ ] `CMU_ENTRAID_CLIENT_ID` - If using CMU auth
- [ ] `CMU_ENTRAID_CLIENT_SECRET` - If using CMU auth
- [ ] `CMU_ENTRAID_REDIRECT_URL` - Must match Vercel URL
- [ ] `CMU_ENTRAID_GET_TOKEN_URL` - CMU OAuth token endpoint
- [ ] `CMU_ENTRAID_GET_BASIC_INFO` - CMU user info endpoint
- [ ] `SCOPE` - OAuth scope string

## OAuth Configuration

- [ ] Google OAuth redirect URI added: `https://your-app.vercel.app/api/auth/callback/google`
- [ ] CMU EntraID redirect URI updated: `https://your-app.vercel.app/cmuEntraIDCallback`
- [ ] OAuth credentials match environment variables

## Database Setup

- [ ] MongoDB Atlas cluster is running
- [ ] Database user has correct permissions
- [ ] IP whitelist includes Vercel (or `0.0.0.0/0` for all)
- [ ] Connection string is correct format

## Vercel Deployment

- [ ] Created Vercel account
- [ ] Imported Git repository
- [ ] Framework preset detected as "Next.js"
- [ ] All environment variables added in Vercel dashboard
- [ ] Environment variables set for Production, Preview, and Development
- [ ] Initial deployment completed

## Post-Deployment

- [ ] Updated `NEXTAUTH_URL` with actual Vercel URL
- [ ] Updated OAuth redirect URIs with actual Vercel URL
- [ ] Redeployed after updating URLs
- [ ] Homepage loads successfully
- [ ] Authentication works (Google Sign-In)
- [ ] Database connection works
- [ ] API routes respond correctly
- [ ] No errors in Vercel logs

## Testing

- [ ] Test user registration/login
- [ ] Test course review creation
- [ ] Test API endpoints
- [ ] Test database operations
- [ ] Test authentication flows
- [ ] Check browser console for errors
- [ ] Check Vercel function logs

## Optional Enhancements

- [ ] Custom domain configured
- [ ] Analytics enabled (if desired)
- [ ] Performance monitoring set up
- [ ] Error tracking configured

---

**Quick Command Reference:**

```bash
# Generate secrets
openssl rand -base64 32

# Test build locally
npm run build

# Deploy via CLI
vercel --prod

# View logs
vercel logs
```

