# CI/CD Setup Guide

This document explains how to configure GitHub Pages and DNS for deploying the Week Planner application to `weekplanner.tools.dsebastien.net`.

## Prerequisites

- GitHub repository with admin access
- Access to DNS management for `dsebastien.net` domain
- GitHub Actions enabled on the repository

## Step 1: GitHub Repository Settings

### Enable GitHub Pages

1. Go to your repository: https://github.com/dsebastien/week-planner
2. Navigate to **Settings** → **Pages**
3. Under **Source**, select **GitHub Actions**
4. Save the changes

### Configure Custom Domain

1. Still in **Settings** → **Pages**
2. Under **Custom domain**, enter: `weekplanner.tools.dsebastien.net`
3. Check **Enforce HTTPS** (this will be available after DNS is configured)
4. Save

## Step 2: DNS Configuration

Add the following CNAME record to your DNS provider:

| Type  | Name             | Value                  | TTL  |
|-------|------------------|------------------------|------|
| CNAME | weekplanner.tools | dsebastien.github.io  | 3600 |

**Note**: DNS propagation can take up to 48 hours, but typically completes within a few hours.

## Step 3: Repository Permissions

### GitHub Actions Permissions

1. Go to **Settings** → **Actions** → **General**
2. Under **Workflow permissions**, select:
   - **Read and write permissions**
   - **Allow GitHub Actions to create and approve pull requests**
3. Save

### GitHub Pages Permissions

These are automatically configured when you enable GitHub Pages with Actions as the source.

## Step 4: First Deployment

### Manual Deployment

To trigger your first deployment manually:

```bash
# Push to main branch (triggers CI)
git push origin main

# Create and push a tag (triggers deployment)
git tag -a v1.0.1 -m "Initial deployment"
git push origin v1.0.1
```

### Using Release Workflow

1. Go to **Actions** tab in your repository
2. Select **Release** workflow
3. Click **Run workflow**
4. Select version type (patch/minor/major)
5. Click **Run workflow**

## Step 5: Verify Deployment

After deployment completes:

1. Check workflow status in **Actions** tab
2. Wait for DNS propagation (if first time setup)
3. Visit https://weekplanner.tools.dsebastien.net
4. Verify HTTPS certificate is active

## Workflow Overview

### CI Pipeline (`ci.yml`)
- **Triggers**: Push to main, Pull requests
- **Actions**: Build, Lint, Test
- **Artifacts**: Uploads dist folder

### Deploy Pipeline (`deploy.yml`)
- **Triggers**: Git tags matching `v*`
- **Actions**: Build, Create CNAME, Deploy to Pages
- **Output**: Live site at custom domain

### Release Pipeline (`release.yml`)
- **Triggers**: Manual workflow dispatch
- **Actions**: Version bump, Changelog update, Tag creation
- **Chain**: Triggers deploy pipeline automatically

## Troubleshooting

### DNS Issues

If the site doesn't load at the custom domain:

1. Verify CNAME record is correct:
   ```bash
   dig weekplanner.tools.dsebastien.net
   ```
2. Check GitHub Pages settings show domain as verified
3. Wait for DNS propagation (up to 48 hours)

### Build Failures

If builds fail in GitHub Actions:

1. Check the Actions tab for error logs
2. Ensure all dependencies are in `package.json`
3. Verify Node.js version matches `.nvmrc` (v24.7.0)

### Deployment Issues

If deployment succeeds but site doesn't update:

1. Clear browser cache
2. Check deployment URL in workflow output
3. Verify CNAME file is created in deployment

## Security Notes

- Never commit sensitive data or API keys
- Use GitHub Secrets for any sensitive configuration
- Keep dependencies updated for security patches
- Review GitHub's security advisories regularly

## Maintenance

### Regular Updates

1. Keep dependencies updated:
   ```bash
   npm update
   npm audit fix
   ```

2. Review and update GitHub Actions:
   - Check for new versions of used actions
   - Update Node.js version when needed

### Monitoring

- Enable GitHub notifications for workflow failures
- Set up Dependabot for automated dependency updates
- Monitor GitHub Pages status at https://www.githubstatus.com/

## Additional Resources

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Custom Domain Setup](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site)