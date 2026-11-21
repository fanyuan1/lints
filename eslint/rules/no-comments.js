const BLOCK_ESLINT_DIRECTIVE = /^\s*(eslint(-disable(-next-line|-line)?|-enable|-env)?|globals?|exported)(\s|$)/;
const LINE_ESLINT_DIRECTIVE = /^\s*eslint-disable(-next-line|-line)(\s|$)/;
const TS_DIRECTIVE = /^\s*@ts-(expect-error|ignore|nocheck|check)\b/;
const TRIPLE_SLASH_DIRECTIVE = /^\/\s*<(reference|amd-module|amd-dependency)\b/;
const LICENSE_WORDS = /copyright|license|licence|spdx-|@preserve|\(c\)|©/i;

function isDirective(comment) {
  if (comment.type === "Shebang") return true;
  const eslintDirective = comment.type === "Block" ? BLOCK_ESLINT_DIRECTIVE : LINE_ESLINT_DIRECTIVE;
  if (eslintDirective.test(comment.value)) return true;
  if (TS_DIRECTIVE.test(comment.value)) return true;
  return comment.type === "Line" && TRIPLE_SLASH_DIRECTIVE.test(comment.value);
}

function onlyWhitespace(text) {
  return text.trim() === "";
}

function licenseHeader(sourceCode, comments) {
  const text = sourceCode.getText();
  const header = [];
  let cursor = 0;
  for (const comment of comments) {
    if (comment.type === "Shebang") {
      cursor = comment.range[1];
      continue;
    }
    if (!onlyWhitespace(text.slice(cursor, comment.range[0]))) break;
    header.push(comment);
    cursor = comment.range[1];
  }
  const isLicense = header.some((comment) => LICENSE_WORDS.test(comment.value));
  return new Set(isLicense ? header : []);
}

export default {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow code comments. Code explains itself; decisions go in docs/decisions/.",
    },
    schema: [],
    messages: {
      noComment:
        "Remove this comment. Rename or restructure the code so it explains itself, or record the decision in docs/decisions/.",
    },
  },
  create(context) {
    const sourceCode = context.sourceCode;
    return {
      Program() {
        const comments = sourceCode.getAllComments();
        const allowed = licenseHeader(sourceCode, comments);
        for (const comment of comments) {
          if (allowed.has(comment) || isDirective(comment)) continue;
          context.report({ loc: comment.loc, messageId: "noComment" });
        }
      },
    };
  },
};
