const path = require('path');
const fs = require('fs');
const emailExistence = require('email-existence');
const {promisify} = require('util');
const {format} = require('@fast-csv/format');

const checkEmailExistence = promisify(emailExistence.check);

const DIR = path.join(__dirname, './test');
const buildDir = filePath => path.join(DIR, filePath);
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const baseStream = fs.createWriteStream("Base.csv");
const stream = format();
stream.pipe(baseStream);

const logger = fs.createWriteStream('log.txt', {flags: 'a'});

let TOTAL_LINES = 0;
let PROCESSED_LINES = 0;

const processFiles = async files => {
    for (let i = 0; i < files.length; i++) {
        await processFile(files[i]);
    }
};
const processFile = async filePath => {
    const content = await getFileContent(filePath);
    const lines = content.split(/\r?\n/);

    await processLines(lines);
};
const processLines = async lines => {
    for (let i = 0; i < lines.length; i++) {
        await processLine(lines[i].trim())
            .catch(() => {
                logger.write(`Error while do ${lines[i].trim()}\n`);
                updatePercents();
            });
    }
};
const processLine = async line => {
    const result = await checkEmailExistence(line);

    if (result) {
        stream.write([line]);
        logger.write(`Added email ${line}\n`);
    }
    logger.write(`Email ${line} not exist\n`);

    updatePercents();
};

const getFilesInDir = async dir => await fs.promises.readdir(dir);
const getFileContent = async _filePath => {
    const filePath = buildDir(_filePath);
    const content = await fs.promises.readFile(filePath, "utf8");
    return content.trim();
};

const getAllLinesCount = async files => {
    for (let i = 0; i < files.length; i++) {
        const content = await getFileContent(files[i]);
        const lines = content.split(/\r?\n/);

        TOTAL_LINES += lines.length;
    }
};

const updatePercents = () => {
    PROCESSED_LINES++;
    console.clear();
    console.log(`${Math.ceil(PROCESSED_LINES * 100 / (TOTAL_LINES))} / 100%`);
    console.log(`${PROCESSED_LINES} / ${TOTAL_LINES} lines`);
};

(async function MAIN() {

    const FILES = await getFilesInDir(DIR);

    await getAllLinesCount(FILES);
    updatePercents();

    processFiles(FILES)
        .then(() => {
            baseStream.end();
            logger.end();
            console.log("All files processed");
        });

})();
