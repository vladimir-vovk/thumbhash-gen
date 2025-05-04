import { bold } from 'ansis'
import { readFile } from 'fs/promises'
import path from 'path'
import sharp from 'sharp'
import * as thumbhash from 'thumbhash'
import { Option, program } from 'commander'

import {
  version,
  AVAILABLE_FORMATS,
  parseFormatArg,
  fileExists,
  STATUS,
  tryCatch,
  log,
  uniqueFilename,
  filenameFromUrl,
} from 'src/utils'
import {
  InputType,
  ThumbhashFromUrl,
  ThumbhashFromFile,
  ThumbhashFromBuffer,
  Result,
  ThumbhashFromBase64,
  CommandAction,
  PngFromThumbhashBase64,
  ImageInfo,
  ThumbhashPngFromBuffer,
} from 'src/types'

export const run = () => {
  program
    .name('thumbhash-gen')
    .version(version(), '-v, --version', 'print version')
    .description(
      `${bold('ThumbHash Generator')}

  It helps to generate ThumbHash placeholders for your images.
  Please visit the ${bold('https://evanw.github.io/thumbhash/')} to learn more.
`,
    )
    .addHelpText(
      'after',
      `
Examples:
  $ npx thumbhash-gen <filename or url>

  It will output the "base64" ThumbHash by default.

  $ npx thumbhash-gen mdkFDYyPVlVTIohw2lmHY7eA8GKF -f url_data

  It will convert the ThumbHash value to URL data for the image component.

  $ npx thumbhash-gen mdkFDYyPVlVTIohw2lmHY7eA8GKF -f png -d ~/Downloads

  This command will save the ThumbHash to a PNG image into the "Downloads"
  folder. The "-d" or "--dir" option could be omitted. The file will be
  saved to the current directory by default.

`,
    )
    .addOption(
      new Option('-f, --format <format>', 'output format')
        .choices(AVAILABLE_FORMATS)
        .default(AVAILABLE_FORMATS[0])
        .argParser(parseFormatArg),
    )
    .option('-i, --info', 'print image information')
    .option('-d, --dir <name>', 'output directory for "png" format')
    .argument('<inputs...>', 'one or more files / urls / hashes to encode')
    .action((inputs, options) => commandAction({ inputs, options }))

  if (process.argv.length <= 2) {
    program.help()
  } else {
    try {
      program.parse(process.argv)
    } catch (error) {
      log({ message: `Error: ${error}`, status: 'error' })
    }
  }
}

const getInputType = (input: string): InputType => {
  if (input.startsWith('http')) {
    return InputType.url
  } else if (!input.includes('.')) {
    return InputType.base64
  }

  return InputType.file
}

const commandAction = async ({ inputs, options }: CommandAction) => {
  let exitStatus = STATUS.success

  const outputResult = ({ data, status }: Result) => {
    if (status !== STATUS.success) {
      exitStatus = status
    }
    if (data) {
      console.log(data)
    }
  }

  for (let input of inputs) {
    const inputType = getInputType(input)

    if (inputType === InputType.url) {
      const { data, status } = await thumbhashFromUrl({ url: input, options })
      outputResult({ data, status })
    } else if (inputType === InputType.file) {
      const { data, status } = await thumbhashFromFile({
        filename: input,
        options,
      })
      outputResult({ data, status })
    } else if (inputType === InputType.base64) {
      const { data, status } = await thumbhashFromBase64({
        hash: input,
        options,
      })
      outputResult({ data, status })
    }
  }

  process.exit(exitStatus)
}

const imageInfo = async ({ buffer, ...rest }: ImageInfo) => {
  const image = sharp(buffer)
  const { width, height } = await image.metadata()
  return JSON.stringify({ ...rest, width, height })
}

const pngFromThumbhashBase64 = async ({
  hash,
  dir,
  filename,
}: PngFromThumbhashBase64): Promise<string> => {
  const rgbaInfo = thumbhash.thumbHashToRGBA(Buffer.from(hash, 'base64'))
  const name = filename ?? `${hash.replaceAll('/', '')}.png`
  const pngPath = path.join(dir ?? '', name)

  const { w: width, h: height, rgba } = rgbaInfo
  const image = sharp(rgba, { raw: { width, height, channels: 4 } })
  await image.toFile(pngPath)

  return pngPath
}

const thumbhashFromBase64 = async ({
  hash,
  options,
}: ThumbhashFromBase64): Promise<Result> => {
  const { format, dir } = options

  if (format === 'base64') {
    return { data: hash, status: STATUS.success }
  } else if (format === 'url_data') {
    const data = thumbhash.thumbHashToDataURL(Buffer.from(hash, 'base64'))
    return { data, status: STATUS.success }
  } else if (format === 'png') {
    const { data: pngPath, error } = await tryCatch(
      pngFromThumbhashBase64({ hash, dir }),
    )

    if (error) {
      log({
        message: `[thumbhashFromBase64] PNG from thumbhash error: ${error}`,
        status: 'error',
      })
      return { status: STATUS.pngCreateError }
    }

    return { data: pngPath, status: STATUS.success }
  }

  log({
    message: `[thumbhashFromBase64] Unknows format: ${format}`,
    status: 'error',
  })

  return { status: STATUS.unknownFormat }
}

const thumbhashFromBuffer = async ({ buffer, format }: ThumbhashFromBuffer) => {
  const image = sharp(buffer).resize(100, 100, { fit: 'inside' })
  const { data, info } = await image
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const { width, height } = info
  const thumbhashBinary = thumbhash.rgbaToThumbHash(width, height, data)

  if (format === 'url_data') {
    const thumbhashUrlData = thumbhash.thumbHashToDataURL(thumbhashBinary)
    return thumbhashUrlData
  } else if (format === 'base64') {
    const thumbhashBase64 = Buffer.from(thumbhashBinary).toString('base64')
    return thumbhashBase64
  }
}

const thumbhashPngFromBuffer = async ({
  buffer,
  filename,
  dir,
}: ThumbhashPngFromBuffer) => {
  const thumbhashBase64 = await thumbhashFromBuffer({
    buffer,
    format: 'base64',
  })

  if (!thumbhashBase64) {
    log({
      message: `[thumbhashPngFromBuffer] Empty hash`,
      status: 'error',
    })
    return STATUS.emptyHash
  }

  const { error: pngError } = await tryCatch(
    pngFromThumbhashBase64({
      hash: thumbhashBase64,
      dir,
      filename,
    }),
  )

  if (pngError) {
    log({
      message: `[thumbhashPngFromUrl] Create PNG from thumbhash error: ${pngError}`,
      status: 'error',
    })
    return STATUS.pngCreateError
  }

  return STATUS.success
}

export const thumbhashFromUrl = async ({
  url,
  options,
}: ThumbhashFromUrl): Promise<Result> => {
  const { data: buffer, error } = await tryCatch(
    fetch(url).then((response) => response.arrayBuffer()),
  )

  if (error) {
    log({
      message: `[thumbhashFromUrl] Image "${url}" fetch error: ${error}`,
      status: 'error',
    })
    return { status: STATUS.imageFetchError }
  }

  const { format, dir, info } = options

  if (format === 'png') {
    const filename = uniqueFilename({
      filename: filenameFromUrl(url),
      dir,
      ext: 'png',
    })

    const status = await thumbhashPngFromBuffer({ buffer, filename, dir })
    if (status !== STATUS.success) {
      return { status }
    }

    const data = info ? await imageInfo({ buffer, filename }) : filename
    return { data, status }
  }

  const thumbhash = await thumbhashFromBuffer({ buffer, format })
  const data = info ? await imageInfo({ buffer, url, thumbhash }) : thumbhash
  return { data, status: STATUS.success }
}

export const thumbhashFromFile = async ({
  filename,
  options,
}: ThumbhashFromFile): Promise<Result> => {
  if (!fileExists(filename)) {
    return { status: STATUS.fileNotFound }
  }

  const { data: buffer, error } = await tryCatch(readFile(filename))

  if (error) {
    log({
      message: `[thumbhashFromFile] Can not read file "${filename}": ${error}`,
      status: 'error',
    })

    return { status: STATUS.readFileError }
  }

  const { format, dir, info } = options

  if (format === 'png') {
    const pngFilename = uniqueFilename({ filename, ext: 'png', dir })
    const status = await thumbhashPngFromBuffer({
      buffer,
      filename: pngFilename,
    })

    if (status !== STATUS.success) {
      return { status }
    }

    const data = info
      ? await imageInfo({ buffer, filename: pngFilename })
      : pngFilename
    return { data, status }
  }

  const thumbhash = await thumbhashFromBuffer({ buffer, format })
  const data = info
    ? await imageInfo({ buffer, filename, thumbhash })
    : thumbhash
  return { data, status: STATUS.success }
}
