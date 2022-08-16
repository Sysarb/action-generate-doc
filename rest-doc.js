/* eslint-disable no-useless-escape */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-var-requires */

const fs = require('fs');
const md = require('./md.js');

const funcRegex = /loadRestEndpoints\(server: [\S]*?Server\): void {([\s\S]*?)}/m;
const docRegex = /[\s\S]*?(\/\*\*[\s\S]*?\);)[\s\S]*?/gm;
const endRegex = /server\.registerUrl\(.*\)/gm;
const pathRegex = /'.*'/gm;
const endPointTypeRegex = /RouteType\..*?,/gm;
const paramRegex = /\* @param ([\S\s]*?)\n/gm;
const returnsRegex = /\* @returns ([\S\s]*?)\n/gm;
const descRegex = /[\s\S]*?(\/\*\*[\s\S]*?\*\/)[\s\S]*?/gm;
const argRegex = /\* @arg ([\S\s]*?) ([\S\s]*?)\n/gm;
const importRegex = /.?from '\.\/([\S]*?)';.?/gm;

const path = `http://github.com/${process.env['WIKIPATH']}`;
const indexExists = fs.existsSync('src/index.ts');

let urlPrefix = '';

const setUrlPrefix = () => {
    const fileContent = fs.readFileSync('src/index.ts', 'utf8');

    const matches = fileContent.matchAll(importRegex);
    let i = 0;
    let imp = [];

    for (const match of matches) {
        imp.push(match[1]);
    }

    if (imp.length > 1) {
        if (imp.includes('exports')) {
            urlPrefix = `exports.`;
        }
        else if (imp.includes('dataTypes')) {
            urlPrefix = `dataTypes.`;
        }
    }
};

if (indexExists) {
    setUrlPrefix();
}

const externals = [
    "call",
    "auth",
    "get"
];

const protecteds = [
    "access"
];

const getLink = (text, path) => {
    const name = text.replace(/\[\]/g, '');
    text = text.replace(/\[/g, '\\[').replace(/\]/g, '\\]');
    return `[${text}](${path}/wiki/${urlPrefix}${name})`;
};

const formatPath = path => {
    return `${path.toLowerCase()}`;
};

const printArgs = args => {
    md.printTable(["Type", "Description"], args, true);
};

const printItem = (r, t = false) => {
    md.printHeader(2, r.type);
    md.printHeader(3, formatPath(r.path));

    console.log(`${r.description}`);
    console.log(`\n  `);

    printArgs(r.args);

    if (r.params) {
        const paramParts = r.params.split(' ');
        const paramName = paramParts[0];
        let paramComment = '';
        if (paramParts.length > 1) {
            paramComment = `  (${paramParts.slice(1).join(' ')})`;
        }
        console.log(`${md.getBold('Params')}: ${getLink(paramName, path)}${paramComment}  `);
    }

    if (r.returns) {
        const returnParts = r.returns.split(' ');
        const returnName = returnParts[0];
        let returnComment = '';
        if (returnParts.length > 1) {
            returnComment = `  (${returnParts.slice(1).join(' ')})`;
        }
        console.log(`${md.getBold('Returns')}: ${getLink(returnName, path)}${returnComment}  `);
    }

    console.log(`\n---\n`);
};

const sortByPath = (a, b) => a.path.localeCompare(b.path);

const _create = (data) => {
    const endpoints = [];

    const matches = data.match(funcRegex);

    if (matches && matches.length > 0 && matches[0]) {
        const funcs = matches[0].matchAll(docRegex);

        for (const func of funcs) {
            const endpoint = func[1].matchAll(endRegex);
            const params = func[1].matchAll(paramRegex);
            const returns = func[1].matchAll(returnsRegex);
            const d = func[1].matchAll(descRegex);
            const args = func[1].matchAll(argRegex);

            let desc = func[1];
            const argList = [];

            let par, ret;

            for (const p of d) {
                desc = p[1];
            }

            for (const p of params) {
                par = p[1];
                desc = desc.replace(p[0], '');
            }

            for (const r of returns) {
                ret = r[1];
                desc = desc.replace(r[0], '');
            }

            for (const a of args) {
                argList.push([
                    a[1],
                    a[2]
                ]);
                desc = desc.replace(a[0], '');
            }

            let descr = desc.replace(/\/\*\*/gm, '');
            descr = descr.replace(/\*\//gm, '');
            descr = descr.replace(/\*/gm, '');
            descr = descr.trim();
            descr = md.trimLines(descr);

            for (const end of endpoint) {
                const path = [...end[0].matchAll(pathRegex)];
                const type = [...end[0].matchAll(endPointTypeRegex)];
                const item = {
                    path: path[0][0].replace(/'/g, '').replace(/"/g, ''),
                    type: type[0][0].split('.')[1].replace(',', ''),
                    description: descr.trim(),
                    params: par,
                    returns: ret,
                    args: argList
                };

                endpoints.push(item);
            }
        }
    }

    md.printHeader(1, 'REST Endpoints');

    if (endpoints.length > 0) {
        for (let r of endpoints.sort(sortByPath)) {
            printItem(r, true);
        }
    }

}

exports.createRestApi = () => {
    fs.readFile('src/main.ts', 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            return;
        }
        _create(data)
    });

};

if (fs.existsSync('src/main.ts')) {
    fs.readFile('src/main.ts', 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            return;
        }

        _create(data)
    });
}
