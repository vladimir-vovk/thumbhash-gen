import { red, green } from 'ansis';
import fs from 'fs';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';
import { InvalidArgumentError } from 'commander';
export const AVAILABLE_FORMATS = ['base64', 'url_data', 'png'];
export const parseFormatArg = (arg) => {
    if (AVAILABLE_FORMATS.includes(arg)) {
        return arg;
    }
    const errorMessage = `Allowed choices are ${AVAILABLE_FORMATS.join(', ')}`;
    throw new InvalidArgumentError(errorMessage);
};
const packagePath = () => {
    const require = createRequire(import.meta.url);
    const paths = require.resolve
        .paths('thumbhash-gen')
        ?.filter((p) => p.includes(path.join('thumbhash-gen', 'node_modules')));
    if (paths?.[0]) {
        return path.join(paths?.[0], '..');
    }
    const distPath = path.dirname(fileURLToPath(import.meta.url));
    return path.join(distPath, '..');
};
export const version = () => {
    const uri = path.join(packagePath(), 'package.json');
    const file = fs.readFileSync(uri, 'utf8');
    const pjson = JSON.parse(file);
    return pjson?.version;
};
export const log = ({ message, status }) => {
    const statusPrefix = { error: red('✖'), success: green('✔') };
    const prefix = status ? statusPrefix[status] : '';
    console.log(` ${prefix} ${message}`);
};
export const fileExists = (filename) => {
    const exists = fs.existsSync(filename);
    if (!exists) {
        const message = `File "${filename}" not found!`;
        log({ message, status: 'error' });
    }
    return exists;
};
export const STATUS = {
    success: 0,
    fileNotFound: 1,
    readFileError: 2,
    imageFetchError: 3,
    unknownFormat: 4,
    pngCreateError: 5,
    emptyHash: 6,
};
export async function tryCatch(promise) {
    try {
        const data = await promise;
        return { data };
    }
    catch (error) {
        return { error: error };
    }
}
export const addDateToName = (name) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hour = now.getHours().toString().padStart(2, '0');
    const minute = now.getMinutes().toString().padStart(2, '0');
    const second = now.getSeconds().toString().padStart(2, '0');
    return `${name}.${year}-${month}-${day}_${hour}-${minute}-${second}`;
};
export const uniqueFilename = ({ filename, ext, dir }) => {
    const parts = filename.split('.');
    if (parts.length > 1) {
        parts.pop();
    }
    const name = addDateToName(parts.join('.'));
    const fullname = `${name}.${ext}`;
    return dir ? path.join(dir, fullname) : fullname;
};
export const filenameFromUrl = (url) => {
    const _url = url.endsWith('/') ? url.slice(0, url.length - 1) : url;
    const name = _url.split('/').pop() ?? 'file_from_url';
    return name;
};
