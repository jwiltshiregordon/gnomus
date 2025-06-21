# Gnomus

**Gnomus** is a simple practice tool for musicians. It lets you record a difficult passage at a slow tempo and then plays it back on a loop while gradually increasing the speed. The site runs entirely in the browser and does not require any server-side setup.

## Usage

1. Record your passage at a comfortable, accurate tempo. You might want to include a four beat count‑in at the beginning.
2. Start playback to loop the passage. The loop runs 100 times using three tempo ranges:
   - 80 loops are between "slow" and "less slow".
   - 15 loops are "medium" to "a bit quicker".
   - 5 loops are in the "fast" range and will be noticeably quicker.
3. With each iteration, the player adds one BPM to both the slow and medium tempos and occasionally throws in one of the faster segments. Play along as the tempo gradually increases.

The basic pattern is:
```
slow → medium → slow → medium (+1 BPM) …
```
Every so often one of the medium loops is replaced with a faster tempo to keep you on your toes. Once the 100 loops are finished you can start over or record a new passage.

## Running Locally

This project is just a static HTML page. Clone the repository and open `index.html` in your browser, or serve the directory with any static HTTP server such as:

```bash
python3 -m http.server
```

Then navigate to [http://localhost:8000](http://localhost:8000) in your browser.

## Deploying on GitHub Pages

The `soundtouch.js` library is checked into the `vendor` directory so the site
can be served directly by GitHub Pages without running a build step. Install
dependencies locally with `npm install` if you want to modify them, but the
`node_modules` folder is ignored in the repository.

## Why "Gnomus"?

The name is a reference to the first movement of Mussorgsky's *Pictures at an Exhibition*. It's short, quick and requires plenty of practice—exactly what this little tool is for!

## License

This repository is released under the MIT License. See [LICENSE](LICENSE) for details.

