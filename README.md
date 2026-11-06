# CTF Writeups

An Astro site for the writeups in this repository. It builds a latest-first challenge index, folder sidebar, and writeup commit calendar from Markdown and Git history.

## Run locally

```sh
npm ci
npm run dev
```

`npm run build` creates the static site in `dist/`. New Markdown writeups and folders under the repository root are discovered at build time. A Markdown file with multiple challenge headings produces multiple entries, except Advent of Cyber 2025, which stays together as one writeup. The sidebar follows nested folders and hides folders without writeups; selecting a writeup scrolls to it, highlights it, and opens the full solution. Images beside writeups are copied into the site; binaries and scripts are not listed. Each expanded writeup links to its exact folder in this repository. Local previews default to `1-4m-5p33d/ctf-writeups` so the button stays visible before the first push. GitHub Actions uses the actual repository owner and branch when publishing; `GITHUB_REPOSITORY=owner/ctf-writeups` can override the local default.

The checked-in `history/legacy.json` preserves dates from the three original repositories. Build and deployment do not need those repositories. To regenerate that historical snapshot on the original machine, run `npm run seed:history` and rebuild.

## Publish

Push this repository to GitHub and set **Settings → Pages → Build and deployment → Source** to **GitHub Actions**. The workflow builds and deploys after pushes to `master` or `main`. It uses the repository name for the GitHub Pages base path and fetches full Git history so future writeup edits update dates and activity.
