const fs = require("fs");
const lexer = require(`./Lexer`).lexer;
const parse = require("./Parser").parse;
const DEMO =`${__dirname}/demo.kp`;

const input=fs.readFileSync(DEMO, {encoding: "utf8"});
const tokens = [...lexer(input)];
const ast = parse(tokens);
console.log(JSON.stringify(ast, null, 2));