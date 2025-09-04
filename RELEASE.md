# Release Process

This document describes how to create releases and deploy the Week Planner application.

## Overview

The project uses GitHub Actions for automated CI/CD:
- **CI**: Runs on every push and PR to ensure code quality
- **Releases**: Creates versioned releases with changelogs
- **Deployment**: Automatically deploys to https://weekplanner.tools.dsebastien.net

## Release Types

### Automatic Releases (Recommended)

Use the GitHub Actions Release workflow for automated version management:

1. Go to [Actions → Release workflow](https://github.com/dsebastien/week-planner/actions/workflows/release.yml)
2. Click **Run workflow**
3. Select version type:
   - `patch`: Bug fixes (1.0.0 → 1.0.1)
   - `minor`: New features (1.0.0 → 1.1.0)
   - `major`: Breaking changes (1.0.0 → 2.0.0)
4. Optionally mark as prerelease
5. Click **Run workflow**

The workflow will:
- ✅ Run full CI pipeline (build, lint, test)
- ✅ Bump version in package.json
- ✅ Update CHANGELOG.md
- ✅ Create git tag
- ✅ Create GitHub Release
- ✅ Trigger deployment automatically

### Manual Releases

For manual control over releases:

```bash
# 1. Update version in package.json
npm version patch  # or minor, major

# 2. Update CHANGELOG.md manually
# Add your changes under ## [Unreleased]

# 3. Commit changes
git add package.json package-lock.json CHANGELOG.md
git commit -m "chore: release v1.0.2"

# 4. Create and push tag
git tag -a v1.0.2 -m "Release v1.0.2"
git push origin main
git push origin v1.0.2
```

## Deployment Process

### Automatic Deployment

Deployments are triggered automatically when:
- A new tag matching `v*` is pushed
- Changes are pushed to `main` branch
- Manual workflow dispatch

### Deployment Steps

1. **Build Phase**:
   - Install dependencies
   - Build TypeScript (`tsc`)
   - Build CSS (`tailwindcss`)
   - Create deployment artifacts

2. **Deploy Phase**:
   - Upload to GitHub Pages
   - Configure custom domain (CNAME)
   - Activate HTTPS certificate

3. **Verification**:
   - Check [Actions tab](https://github.com/dsebastien/week-planner/actions) for status
   - Visit https://weekplanner.tools.dsebastien.net
   - Verify version in browser console

### Manual Deployment

To trigger deployment without a release:

1. Go to [Actions → Deploy workflow](https://github.com/dsebastien/week-planner/actions/workflows/deploy.yml)
2. Click **Run workflow**
3. Select branch/tag
4. Click **Run workflow**

## Environment Configuration

### GitHub Pages Settings

Located at: [Settings → Environments → github-pages](https://github.com/dsebastien/week-planner/settings/environments)

**Required Configuration**:
- **Deployment branches**: All branches and tags (or specific patterns)
- **Protection rules**: None (or configure as needed)
- **Custom domain**: weekplanner.tools.dsebastien.net

### Troubleshooting Deployment Protection

If deployment fails with "not allowed to deploy to github-pages":

1. Go to [Environment settings](https://github.com/dsebastien/week-planner/settings/environments)
2. Click **github-pages**
3. Either:
   - Remove all protection rules (simplest)
   - OR configure "Deployment branches and tags" to allow:
     - Pattern: `main`
     - Pattern: `v*`

## Version Management

### Version Numbering

Follow [Semantic Versioning](https://semver.org/):
- **MAJOR.MINOR.PATCH** (e.g., 1.2.3)
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Changelog Format

The CHANGELOG.md follows [Keep a Changelog](https://keepachangelog.com/) format:

```markdown
## [Unreleased]
### Added
- New features

### Changed
- Changes to existing features

### Fixed
- Bug fixes

### Removed
- Removed features
```

## Pre-release Checklist

Before creating a release:

- [ ] All tests pass: `npm test`
- [ ] No linting errors: `npm run lint`
- [ ] Build succeeds: `npm run build`
- [ ] Update CHANGELOG.md with changes
- [ ] Test locally: `npm run dev`
- [ ] Verify no sensitive data in commits
- [ ] Update documentation if needed

## Post-release Checklist

After release is created:

- [ ] Verify GitHub Release page
- [ ] Check deployment status in Actions
- [ ] Test production site
- [ ] Verify custom domain works
- [ ] Check HTTPS certificate
- [ ] Test main functionality
- [ ] Announce release if needed

## Rollback Process

If a release has issues:

### Quick Rollback

1. Go to [Deploy workflow](https://github.com/dsebastien/week-planner/actions/workflows/deploy.yml)
2. Run workflow manually
3. Select previous stable tag (e.g., v1.0.0)
4. Deploy

### Full Rollback

```bash
# 1. Revert commits
git revert HEAD~1  # or specific commit

# 2. Create hotfix version
npm version patch
git tag -a v1.0.3 -m "Hotfix: revert to stable"

# 3. Push changes
git push origin main
git push origin v1.0.3
```

## CI/CD Pipeline Files

- `.github/workflows/ci.yml` - Continuous Integration
- `.github/workflows/release.yml` - Release Management
- `.github/workflows/deploy.yml` - Deployment to GitHub Pages
- `.eslintrc.json` - Linting configuration
- `CHANGELOG.md` - Version history

## Monitoring

### Check Deployment Status

- **GitHub Actions**: https://github.com/dsebastien/week-planner/actions
- **Production Site**: https://weekplanner.tools.dsebastien.net
- **GitHub Pages Status**: https://www.githubstatus.com/

### Useful Commands

```bash
# Check current version
node -p "require('./package.json').version"

# View recent tags
git tag -l --sort=-version:refname | head -5

# Check deployment history
git log --oneline --grep="^chore: release" --grep="^fix: deploy"

# Test production build locally
npm run build
npx http-server dist -p 8080
```

## Security Notes

- Never commit secrets or API keys
- Use GitHub Secrets for sensitive configuration
- Keep dependencies updated: `npm audit fix`
- Review security advisories regularly
- Verify HTTPS is enforced on production

## Support

For issues with:
- **Build failures**: Check logs in GitHub Actions
- **Deployment issues**: Verify environment settings
- **DNS problems**: Check CNAME configuration
- **Version conflicts**: Ensure tags match package.json

## Quick Reference

| Action | Command/Location |
|--------|-----------------|
| Create Release | Actions → Release → Run workflow |
| Manual Deploy | Actions → Deploy → Run workflow |
| View Deployments | Actions → Deploy workflow runs |
| Check Production | https://weekplanner.tools.dsebastien.net |
| Environment Settings | Settings → Environments → github-pages |
| Release History | Releases page or CHANGELOG.md |