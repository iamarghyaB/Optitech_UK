# Git LFS media restoration — 28 September 2026

The working tree contained 2,968 unresolved Git LFS pointer files under assets, representing approximately 944 MB of original media. The corresponding objects were already present in the local Git LFS cache. This affected MP4 videos, images, and KTX2 animation textures, including the hero flags and animated angel textures.

`git lfs checkout` restored the real media from the existing cache. No scene, shader, animation, image, or video content was replaced. The existing Happy-Dad-Short-MP4.mp4 filename already matches the saved download inventory, so it was retained.

Validation:
- All 3,152 asset files scanned: no empty files or unresolved LFS pointers; all download inventory files exist.
- Fresh-server verification: 18 pages and 3,495 checks passed, including media byte-range support. The layout comparisons in that command use the original saved measurements, not new measurements.
- Fresh browser session: hero flags visible, video readyState 4 with playback advancing, no broken loaded images, no console errors or texture warnings observed.
- The original long-running server's health endpoint retained historical failed URLs from the broken session and another project. Verification therefore used a fresh server on port 4180 through BASE_URL.

Prevention:
- npm start and npm run verify now run the asset preflight check.
- npm run check:assets checks the media without starting a server.
- npm run assets:restore hydrates cached Git LFS objects and verifies the result.
- README documents git lfs pull for clones without cached objects.

No Git history rewrite, commit, or push was performed.
