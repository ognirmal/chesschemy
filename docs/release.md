# Release Guide

This package is prepared for npm publishing under the public package name
`chesschemy`.

## Prerequisites

1. Confirm you are logged in to npm:

   ```sh
   npm whoami
   ```

2. Confirm the package version has not already been published:

   ```sh
   npm view chesschemy version
   ```

3. Confirm the working tree is clean:

   ```sh
   git status --short
   ```

## Verify the Package

Run the full local gate:

```sh
npm run prepublishOnly
```

Inspect the package contents:

```sh
npm run pack:dry-run
```

Run a registry publish simulation:

```sh
npm run publish:dry-run
```

## Publish

When the dry run is correct:

```sh
npm publish
```

After publishing, confirm the registry version:

```sh
npm view chesschemy version
```
