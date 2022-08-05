const {lexer} = require("./AST/Lexer");
const fs = require("fs");
const path = require("path");

const DEMO = path.join(__dirname, `demo.kp`);
const slide = fs.readFileSync(DEMO, {encoding: "utf-8"});
const tokens = lexer(slide);
for(let token of tokens)
{
    console.log(token);
}

