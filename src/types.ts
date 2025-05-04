import { AVAILABLE_FORMATS } from 'src/utils'

export type Format = (typeof AVAILABLE_FORMATS)[number]

export type Options = {
  format: Format
  dir?: string
  info?: boolean
}

export type CommandAction = {
  inputs: string[]
  options: Options
}

export enum InputType {
  'url',
  'file',
  'base64',
}

export type ImageInfo = {
  buffer: ArrayBuffer
  [key: string]: any
}

export type PngFromThumbhashBase64 = {
  hash: string
  dir?: string
  filename?: string
}

export type ThumbhashFromBase64 = {
  hash: string
  options: Options
}

export type ThumbhashFromUrl = {
  url: string
  options: Options
}

export type ThumbhashFromFile = {
  filename: string
  options: Options
}

export type ThumbhashFromBuffer = {
  buffer: Buffer | ArrayBuffer
  format: Format
}

export type Result = {
  data?: string | { [key: string]: any }
  status: number
}

export type ThumbhashPngFromBuffer = {
  buffer: ArrayBuffer
  filename: string
  dir?: string
}
