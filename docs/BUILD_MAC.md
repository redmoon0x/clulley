# Building a macOS App for Clulley (stealthui)

This guide explains how to build the Clulley Electron app for macOS (MacBook) from your existing project.

## Prerequisites
- A Mac computer (required for macOS builds)
- [Node.js](https://nodejs.org/) (v16+ recommended)
- [pnpm](https://pnpm.io/) (or npm/yarn)
- [Git](https://git-scm.com/)
- Xcode (install from the Mac App Store)

## 1. Install Dependencies

Open Terminal and run:

```sh
pnpm install
# or
npm install
```

## 2. Update Electron Builder Config

Ensure your `package.json` includes a `build` section for macOS. Example:

```json
"build": {
  "appId": "com.yourdomain.clulley",
  "mac": {
    "category": "public.app-category.productivity",
    "target": ["dmg", "zip"]
  },
  "files": [
    "dist/**",
    "electron/**",
    "renderer/**",
    "assets/**"
  ],
  "extraResources": [
    "assets/"
  ]
}
```

## 3. Build the Renderer

If you use Vite or React, build the renderer first:

```sh
pnpm run build
# or
npm run build
```

## 4. Build the Electron App for macOS

Install electron-builder if not present:

```sh
pnpm add -D electron-builder
# or
npm install --save-dev electron-builder
```

Then build for macOS:

```sh
pnpm exec electron-builder --mac
# or
npx electron-builder --mac
```

This will generate a `.dmg` and/or `.zip` in the `dist/` or `dist/mac/` folder.

## 5. Test the App

Open the generated `.dmg` or `.app` file and verify the app launches and works as expected.

## 6. Notarization (Optional, for Distribution)

To distribute outside your own Mac, you must notarize the app with Apple. See:
- https://www.electron.build/code-signing
- https://kilianvalkhof.com/2020/electron/notarizing-your-electron-application/

## Troubleshooting
- If you see permission errors, ensure you have Xcode and command line tools installed (`xcode-select --install`).
- For issues with native modules, rebuild them for Electron using `electron-rebuild`.

## References
- [Electron Builder Docs](https://www.electron.build/)
- [Electron Docs](https://www.electronjs.org/docs/latest/)

---

**Note:** You must build on a Mac to create a native macOS app.
