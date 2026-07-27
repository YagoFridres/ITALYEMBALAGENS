const fs = require('fs');
const path = require('path');
const iconv = require('iconv-lite');

const inputPath = path.resolve(process.argv[2] || 'server.js');
const outputPath = path.resolve(process.argv[3] || 'server_fixed.js');
const unresolvedPath = path.resolve(process.argv[4] || 'server_fixed.unresolved.json');

const source = fs.readFileSync(inputPath, 'utf8');

const suspectRe = /(Ã[\x80-\xBF\xC0-\xFF]|Â[\x80-\xBF\xC0-\xFF]|â[\x80-\xBF\xC0-\xFF]{1,3}|ð[\x80-\xBF\xC0-\xFF]{1,3}|├.|┬.|│.|ÔÇ.|â€|â€“|â€”|â€¦|âœ.|ðŸ|�)/;
const suspectGlobalRe = /(Ã[\x80-\xBF\xC0-\xFF]|Â[\x80-\xBF\xC0-\xFF]|â[\x80-\xBF\xC0-\xFF]{1,3}|ð[\x80-\xBF\xC0-\xFF]{1,3}|├.|┬.|│.|ÔÇ.|â€|â€“|â€”|â€¦|âœ.|ðŸ|�)/g;
const suspectPresenceRe = /[├┬│ÃÂâð]|ÔÇ|â€|â€“|â€”|â€¦|âœ|ðŸ|�/;
const encodings = ['win1252', 'cp437', 'win1252'];
const unresolved = [];

function suspectCount(text) {
  const matches = String(text || '').match(suspectGlobalRe);
  return matches ? matches.length : 0;
}

function snippet(text) {
  return String(text || '')
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')
    .slice(0, 180);
}

function reverteCamada(str, encodingOrigem) {
  const bytes = iconv.encode(str, encodingOrigem);
  return iconv.decode(bytes, 'utf8');
}

function maybeFixChunk(chunk) {
  const text = String(chunk || '');
  if (!suspectRe.test(text)) return text;
  let current = text;
  let improved = false;
  for (let pass = 0; pass < 4; pass += 1) {
    if (!suspectPresenceRe.test(current)) break;
    let best = current;
    let bestScore = suspectCount(current);
    for (const encoding of encodings) {
      let candidate = '';
      try {
        candidate = reverteCamada(current, encoding);
      } catch (_) {
        continue;
      }
      if (!candidate || candidate === current) continue;
      if (candidate.includes('\uFFFD')) continue;
      const score = suspectCount(candidate);
      if (score < bestScore) {
        best = candidate;
        bestScore = score;
      }
    }
    if (best === current) break;
    current = best;
    improved = true;
  }
  if (suspectPresenceRe.test(current)) {
    unresolved.push({
      before: snippet(text),
      after: snippet(current),
      suspect_before: suspectCount(text),
      suspect_after: suspectCount(current),
      improved
    });
  }
  return current;
}

function transformQuoted(sourceText) {
  let out = '';
  let i = 0;

  function readString(quote) {
    const start = i;
    i += 1;
    let body = '';
    while (i < sourceText.length) {
      const ch = sourceText[i];
      if (ch === '\\') {
        body += sourceText.slice(i, i + 2);
        i += 2;
        continue;
      }
      if (ch === quote) {
        i += 1;
        return sourceText[start] + maybeFixChunk(body) + quote;
      }
      body += ch;
      i += 1;
    }
    return sourceText.slice(start);
  }

  function readLineComment() {
    const start = i;
    i += 2;
    let body = '';
    while (i < sourceText.length) {
      if (sourceText[i] === '\r' && sourceText[i + 1] === '\n') {
        i += 2;
        return sourceText.slice(start, start + 2) + maybeFixChunk(body) + '\r\n';
      }
      const ch = sourceText[i];
      if (ch === '\n') {
        i += 1;
        return sourceText.slice(start, start + 2) + maybeFixChunk(body) + '\n';
      }
      body += ch;
      i += 1;
    }
    return sourceText.slice(start, start + 2) + maybeFixChunk(body);
  }

  function readBlockComment() {
    const start = i;
    i += 2;
    let body = '';
    while (i < sourceText.length) {
      if (sourceText[i] === '*' && sourceText[i + 1] === '/') {
        i += 2;
        return sourceText.slice(start, start + 2) + maybeFixChunk(body) + '*/';
      }
      body += sourceText[i];
      i += 1;
    }
    return sourceText.slice(start, start + 2) + maybeFixChunk(body);
  }

  function readRegex() {
    const start = i;
    i += 1;
    let inClass = false;
    while (i < sourceText.length) {
      const ch = sourceText[i];
      if (ch === '\\') {
        i += 2;
        continue;
      }
      if (ch === '[') inClass = true;
      else if (ch === ']') inClass = false;
      else if (ch === '/' && !inClass) {
        i += 1;
        while (/[a-z]/i.test(sourceText[i] || '')) i += 1;
        return sourceText.slice(start, i);
      }
      i += 1;
    }
    return sourceText.slice(start);
  }

  function readTemplate() {
    let text = '`';
    i += 1;
    let literal = '';
    while (i < sourceText.length) {
      const ch = sourceText[i];
      if (ch === '\\') {
        literal += sourceText.slice(i, i + 2);
        i += 2;
        continue;
      }
      if (ch === '`') {
        text += maybeFixChunk(literal) + '`';
        i += 1;
        return text;
      }
      if (ch === '$' && sourceText[i + 1] === '{') {
        text += maybeFixChunk(literal) + '${';
        literal = '';
        i += 2;
        let depth = 1;
        while (i < sourceText.length && depth > 0) {
          const cur = sourceText[i];
          if (cur === "'" || cur === '"') {
            text += readString(cur);
            continue;
          }
          if (cur === '`') {
            text += readTemplate();
            continue;
          }
          if (cur === '/' && sourceText[i + 1] === '/') {
            text += readLineComment();
            continue;
          }
          if (cur === '/' && sourceText[i + 1] === '*') {
            text += readBlockComment();
            continue;
          }
          if (cur === '{') depth += 1;
          if (cur === '}') depth -= 1;
          text += cur;
          i += 1;
        }
        continue;
      }
      literal += ch;
      i += 1;
    }
    return text + maybeFixChunk(literal);
  }

  while (i < sourceText.length) {
    const ch = sourceText[i];
    const next = sourceText[i + 1];
    if (ch === "'" || ch === '"') {
      out += readString(ch);
      continue;
    }
    if (ch === '`') {
      out += readTemplate();
      continue;
    }
    if (ch === '/' && next === '/') {
      out += readLineComment();
      continue;
    }
    if (ch === '/' && next === '*') {
      out += readBlockComment();
      continue;
    }
    if (ch === '/' && /[=(:,!&|?{\[;\n]/.test(sourceText[i - 1] || '\n')) {
      out += readRegex();
      continue;
    }
    out += ch;
    i += 1;
  }

  return out;
}

const fixed = transformQuoted(source);
fs.writeFileSync(outputPath, fixed, 'utf8');
fs.writeFileSync(unresolvedPath, JSON.stringify(unresolved, null, 2), 'utf8');

let changedLines = 0;
const oldLines = source.split(/\r?\n/);
const newLines = fixed.split(/\r?\n/);
const max = Math.max(oldLines.length, newLines.length);
for (let idx = 0; idx < max; idx += 1) {
  if ((oldLines[idx] || '') !== (newLines[idx] || '')) changedLines += 1;
}

console.log(JSON.stringify({
  input: inputPath,
  output: outputPath,
  unresolved_output: unresolvedPath,
  suspect_before: suspectCount(source),
  suspect_after: suspectCount(fixed),
  changed_lines: changedLines,
  unresolved_chunks: unresolved.length
}, null, 2));
