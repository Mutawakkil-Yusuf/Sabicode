# Releasing Sabicode

Sabicode publishes from GitHub Actions with npm provenance. The release job
runs `prepublishOnly` (`npm test`) before anything leaves the runner.

## How npm authentication works now

npm restricts granular access tokens that bypass 2FA from direct publishing.
The release workflow therefore **stages** the package with `npm stage publish`.
A maintainer then approves the staged version on npmjs.com with 2FA. This keeps
provenance and means no one has to share a one-time code with CI.

For future releases, configure [trusted publishing](https://docs.npmjs.com/trusted-publishers)
for the package and switch the workflow to `npm publish`. Trusted publishing
uses GitHub's OIDC identity instead of a long-lived token.

## Repository setup

This was completed for `0.2.0`, `0.2.1`, `0.3.0`, and `0.3.1`; keep it for
reference.

1. Create a granular access token with **All packages: Read and write**.
   Staged publishing does not require the 2FA-bypass option.
2. Add it to the repository as the `NPM_TOKEN` Actions secret.
3. Enable 2FA on the npm account that will approve releases.
4. Confirm the package name and current version:

   ```sh
   npm view sabicode version
   ```

5. Confirm `SITE_URL` and the GitHub issue links are correct in
   `scripts/build-site.js`. The default site URL is
   `https://mutawakkil-yusuf.github.io/Sabicode`.
6. In the repository settings, set **Pages → Build and deployment → Source** to
   **GitHub Actions**. The `Pages` workflow deploys `site/` on every push to
   `main`.

## Release a version

1. Update `version` in `package.json` and add the release to `CHANGELOG.md`.
2. Run the suite:

   ```sh
   npm test
   npm run build
   npm run review:verify
   ```

3. Commit the release, then tag it. Replace `<version>` with the version in
   `package.json`:

   ```sh
   git tag v<version>
   git push origin main --tags
   ```

4. The `Release` workflow uses Node 24 and npm `^12.2.2`, checks
   `npm whoami`, then stages the version with
   `npm stage publish --provenance --access public`. Watch it in the Actions tab.
   The log ends with the stage ID.
5. Open npmjs.com → **Staged Packages**, review `sabicode@<version>`, and
   approve it with 2FA. Until approval, npm serves a `0.0.0-stage` placeholder.
6. Verify the published package:

   ```sh
   npm view sabicode version
   npx sabicode@<version> --version
   ```

7. Create a GitHub release from the tag and paste the matching changelog
   section.

## Switch to trusted publishing

When you are ready to remove the long-lived token:

1. On npmjs.com, open the `sabicode` package → **Settings** → **Trusted
   Publisher**.
2. Add a GitHub Actions publisher for `Mutawakkil-Yusuf/Sabicode`, workflow
   `release.yml`, and allow `npm publish`.
3. Change the release workflow to run `npm publish --provenance --access public`
   without `NODE_AUTH_TOKEN`, and remove the `NPM_TOKEN` secret.

The workflow already requests `id-token: write`, so no other permissions change
is needed.

## Publish locally

Only use this when the workflow is unavailable. Provenance requires the GitHub
Actions environment.

```sh
npm login
npm publish --access public
```

`prepublishOnly` runs the tests. A failed test stops the publish.
