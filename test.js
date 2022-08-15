const {lexer} = require("./AST/Lexer");
const {parse} = require("./AST/Parser");
const fs = require("fs");
const path = require("path");

const switches = {
    parser: process.argv.some(a => a === "--parser" || a === "-p"),
    lexer: process.argv.some(a => a === "--lexer" || a === "-l"),
};

const DEMO = path.join(__dirname, `demo.kp`);
const slide = fs.readFileSync(DEMO, {encoding: "utf-8"});
const tokens = lexer(slide);
if (switches.lexer)
{
    console.log(JSON.stringify(tokens, null, 2));
}
    

if (switches.parser)
{
    const ast = parse(tokens);
    console.log(JSON.stringify(ast, null, 2));
}

