exports.printHeader = (level, text) => {
    var pre = ''.padStart(level, '#');

    if (typeof v === 'function') {
        console.log(`${pre} ${text()} ${pre}`);
    } else {
        console.log(`${pre} ${text} ${pre}`);
    }

    console.log('');
};

exports.printTable = (headers, rows, index = false) => {
    if (rows.length > 0) {
        const headerLine = (index ? `\\# | ` : '') + headers.join(' | ');
        console.log(headerLine);
        var headerSeparator = '';

        const headerLength = headers.length + (index ? 1 : 0);

        for (let i = 0; i < headerLength; i++) {
            if (i == 0) {
                headerSeparator += `---`;
            } else {
                headerSeparator += ` | ---`;
            }
        }

        console.log(headerSeparator);

        for (let i = 0; i < rows.length; i++) {
            var rowLine = '';

            if (index) {
                rowLine = `${i + 1} | `;
            }

            for (let y = 0; y < rows[i].length; y++) {
                if (y > 0) {
                    rowLine += ` | `;
                }
                rowLine += rows[i][y];
            }

            console.log(rowLine);
        }
    }

    console.log('');
};

exports.getCode = text => {
    return `\`${text}\``;
};

exports.getBold = text => {
    return `**${text}**`;
};

exports.getBlockquote = text => {
    return `> ${text}`;
};

exports.subAt = (text, index, value) => {
    return text.substr(0, index) + value + text.substr(index + 1);
};

exports.trimLines = text => {
    const lines = text.split('\n');
    const trimmed = lines.map(line => line.trim());
    return trimmed.join('  \n');
};