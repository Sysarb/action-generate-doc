/* eslint-disable no-useless-escape */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-var-requires */

const fs = require('fs');
const md = require('./md.js');

const funcRegex = /loadSubscriptions\(service: [\S]*?Service\): void {([\s\S]*?)}/m;
const docRegex = /[\s\S]*?(\/\*\*[\s\S]*?\);)[\s\S]*?/gm;
const endRegex = /(\/\*\*[\s\S]*?\*\/)[\s\S]*?service.subscribe\(([\s\S]*?),/gm;
const paramRegex = /\* @param ([\S\s]*?)\n/gm;
const returnsRegex = /\* @returns ([\S\s]*?)\n/gm;
const descRegex = /[\s\S]*?(\/\*\*[\s\S]*?\*\/)[\s\S]*?/gm;
const pathParamRegex = /\.(\:[a-zA-Z_]*|\*)(?:\S|$|\S)/g;
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
    const matches = path.matchAll(pathParamRegex);
    let i = 0;

    for (const match of matches) {
        const replacement = `\\${match[1]}<sup>${++i}</sup>`;
        path = path.replace(match[1], replacement);
    }

    return `  ${path.toLowerCase()}`;
};

const printArgs = args => {
    md.printTable(["Type", "Description"], args, true);
};

const printItem = (r, t = false) => {
    if (t && r.type) {
        const paths = r.path.split('.');
        paths.shift();
        r.path = paths.join('.');
    }

    md.printHeader(3, formatPath(r.path));

    if (t && r.type) {
        console.log(`${md.getBlockquote(r.type.toUpperCase())}`);
        console.log(``);
    }

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

if (fs.existsSync('src/main.ts')) {
    fs.readFile('src/main.ts', 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            return;
        }

        const internal = [];
        const external = [];
        const protected = [];

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
                    const item = {
                        path: end[2].replace(/'/g, '').replace(/"/g, ''),
                        description: descr.trim(),
                        params: par,
                        returns: ret,
                        args: argList
                    };

                    const start = item.path.split('.')[0];
                    item.type = start;

                    if (externals.includes(start)) {
                        external.push(item);
                    } else if (protecteds.includes(start)) {
                        protected.push(item);
                    } else {
                        internal.push(item);
                    }
                }
            }
        }

        md.printHeader(1, 'Endpoints');

        if (external.length > 0) {
            md.printHeader(2, 'External');
            console.log('These endpoints are available externally trough Resgate.');

            for (let r of external.sort(sortByPath)) {
                printItem(r, true);
            }
        }

        if (internal.length > 0) {
            md.printHeader(2, 'Internal');
            console.log('These endpoints are only available internally on NATS.');

            for (let r of internal.sort(sortByPath)) {
                printItem(r);
            }
        }

        if (protected.length > 0) {
            md.printHeader(2, 'Protected');
            console.log('These endpoints are not supposed to be called manually.');

            for (let r of protected.sort(sortByPath)) {
                printItem(r, true);
            }
        }
    });
}
