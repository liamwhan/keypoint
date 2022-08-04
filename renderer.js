const DEMO = "demo.kp";
const func = async () => {
    const pathResolved = await window.loader.relativePath(DEMO)
    console.log(pathResolved);
    const astJson = await window.loader.load(pathResolved);
    const ast = JSON.parse(astJson);
    console.log(ast);
}
func();