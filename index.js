const path = require('path');
const fs = require('fs');
const emailExistence = require('email-existence');
const { promisify } = require('util');

const checkEmailExistence = promisify(emailExistence.check);

const DIR = path.join(__dirname, './test');
const buildDir = filePath => path.join(DIR, filePath);
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const processFiles = async files => {
    for (let i = 0; i < files.length; i++) {
        await processFile(files[i])
            .then(() => console.log(`Processed file ${i + 1}, path : ${files[i]}\n`));
    }
};
const processFile = async filePath => {
    const content = await getFileContent(filePath);
    const lines = content.split(/\r?\n/);

    await processLines(lines);
};
const processLines = async lines => {
    for (let i = 0; i < lines.length; i++) {
        await sleep(1000);
        await processLine(lines[i].trim())
            .catch(() => console.log(`error while do ${lines[i].trim()}`));
    }
};
const processLine = async line => {
    const result = await checkEmailExistence(line);

    console.log(result);
};

const getFilesInDir = async dir => await fs.promises.readdir(dir);
const getFileContent = async _filePath => {
    const filePath = buildDir(_filePath);
    const content = await fs.promises.readFile(filePath, "utf8");
    return content.trim();
};

(async function MAIN() {

    const FILES = await getFilesInDir(DIR);

    processFiles(FILES)
        .then(() => console.log("All files processed"));

})();
