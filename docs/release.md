# Releasing Sabicode

Sabicode publishes from GitHub Actions with npm provenance. The publish job
runs `prepublishOnly` (`npm test`) before the package leaves the runner.

## Before the first release

1. Create an npm access token for the `sabicode` package. Use a granular token
   with publish access to `sabicode` and read access to the account.
2. Add it to the repository as the `NPM_TOKEN` Actions secret.
3. Confirm the package name is still free:

   ```sh
   npm view sabicode version
   ```

   An `E404` means the name is available. If the name is taken, change `name`
   in `package.json` before publishing.
4. Confirm `SITE_URL` and the GitHub issue links are correct in
   `scripts/build-site.js`. The default site URL is
   `https://mutawakkil-yusuf.github.io/Sabicode`.
5. In the repository settings, set **Pages → Build and deployment → Source** to
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

3. Commit the release, then tag it:

   ```sh
   git tag v0.2.0
   git push origin main --tags
   ```

4. The `Release` workflow publishes with provenance. Watch it in the Actions
   tab.
5. Verify the published package:

   ```sh
   npm view sabicode version
   npx sabicode@0.2.0 --version
   ```

6. Create a GitHub release from the tag and paste the matching changelog
   section.

## Publish locally

Only use this when the workflow is unavailable. Provenance requires the GitHub
Actions environment.

```sh
npm login
npm publish --access public
```

`prepublishOnly` runs the tests. A failed test stops the publish.
