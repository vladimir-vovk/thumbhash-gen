<h3 align="center">
thumbhash-gen
</h3>

<p align="center">
ThumbHash Generator 🖼️
</p>

---

It helps to generate ThumbHash placeholders for your images.

Please visit the https://evanw.github.io/thumbhash/ to learn more.

<img src="./screen.gif" width="600"></img>

## Quick Start

1. Install [Node.js](https://nodejs.org/en/download/package-manager) or [Bun.sh](https://bun.sh/docs/installation).
2. Run `npx thumbhash-gen` or `bunx thumbhash-gen`.

## Usage

```
Usage: thumbhash-gen [options] <inputs...>

ThumbHash Generator

  It helps to generate ThumbHash placeholders for your images.
  Please visit the https://evanw.github.io/thumbhash/ to learn more.


Arguments:
  inputs                 one or more files / urls / hashes to encode

Options:
  -v, --version          prints version
  -f, --format <format>  output format (choices: "base64", "url_data", "png", default: "base64")
  -d, --dir <name>       output directory for "png" format
  -h, --help             display help for command

Examples:
  $ npx thumbhash-gen <filename or url>

  It will output the "base64" ThumbHash by default.

  $ npx thumbhash-gen mdkFDYyPVlVTIohw2lmHY7eA8GKF -f url_data

  It will convert the ThumbHash value to URL data for the image component.

  $ npx thumbhash-gen mdkFDYyPVlVTIohw2lmHY7eA8GKF -f png -d ~/Downloads

  This command will save the ThumbHash to a PNG image into the "Downloads"
  folder. The "-d" or "--dir" option could be omitted. The file will be
  saved to the current directory by default.
```
