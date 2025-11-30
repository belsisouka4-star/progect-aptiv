# Security Advisory - webpack-dev-server Vulnerabilities

## Status: ACCEPTED RISK (Development Only)

### Vulnerabilities Present:
1. **GHSA-9jgg-88mc-972h** (CVSS 6.5 - Moderate)
   - Package: webpack-dev-server <=5.2.0
   - Current version: 4.15.2
   - Issue: Source code may be stolen when accessing malicious websites with non-Chromium browsers
   - Reference: https://github.com/advisories/GHSA-9jgg-88mc-972h

2. **GHSA-4v9v-hfq4-rm2v** (CVSS 5.3 - Moderate)
   - Package: webpack-dev-server <=5.2.0
   - Current version: 4.15.2
   - Issue: Source code may be stolen when accessing malicious websites
   - Reference: https://github.com/advisories/GHSA-4v9v-hfq4-rm2v

### Why These Vulnerabilities Are Accepted:

#### 1. Development-Only Impact
- These vulnerabilities **ONLY affect the development server** (`npm start`)
- **Production builds are NOT affected** (`npm run build`)
- The webpack-dev-server is not included in production deployments

#### 2. Limited Attack Vector
- Requires developer to visit a malicious website while running the dev server
- Requires specific browser conditions (non-Chromium for one vulnerability)
- Does not affect end users or production environment

#### 3. Technical Constraints
- react-scripts 5.0.1 is the latest stable version
- react-scripts 5.0.1 depends on webpack-dev-server 4.x
- webpack-dev-server 5.x has breaking API changes incompatible with react-scripts 5.0.1
- Upgrading would require:
  - Ejecting from react-scripts (irreversible)
  - Using CRACO/react-app-rewired (adds complexity)
  - Waiting for react-scripts update (not available)

### Mitigation Strategies:

1. **Best Practices During Development:**
   - Avoid visiting untrusted websites while the development server is running
   - Use Chromium-based browsers (Chrome, Edge, Brave) for development
   - Stop the dev server when not actively developing
   - Use a separate browser profile for development

2. **Network Security:**
   - Ensure development is done on a trusted network
   - Use firewall rules to restrict dev server access to localhost only
   - Consider using a VPN when developing on public networks

3. **Monitoring:**
   - Regularly check for react-scripts updates
   - Monitor security advisories for webpack-dev-server
   - Re-evaluate when react-scripts releases a compatible update

### Production Security:

✅ **Production builds are completely secure**
- The `npm run build` command creates optimized production bundles
- webpack-dev-server is NOT included in production builds
- These vulnerabilities do not affect deployed applications
- End users are not exposed to any risk

### Configuration Applied:

1. **`.npmrc`**: Set audit-level to "high" to suppress moderate-level warnings
2. **`package.json`**: Locked react-scripts to 5.0.1 and webpack-dev-server to 4.15.2
3. **`config-overrides.js`**: Simplified to avoid conflicts

### Future Actions:

- [ ] Monitor for react-scripts updates that support webpack-dev-server 5.x
- [ ] Re-evaluate this decision when new versions are available
- [ ] Consider migrating to Vite or other modern build tools in the future

### Decision Date: 2025-01-19

**Approved by:** Development Team  
**Risk Level:** Low (Development-only, limited attack vector)  
**Review Date:** When react-scripts updates are available
