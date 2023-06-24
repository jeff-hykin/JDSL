import { FileSystem, glob } from "https://deno.land/x/quickr@0.6.31/main/file_system.js"
import { run, throwIfFails, zipInto, mergeInto, returnAsString, Timeout, Env, Cwd, Stdin, Stdout, Stderr, Out, Overwrite, AppendTo } from "https://deno.land/x/quickr@0.6.31/main/run.js"
import { Console, clearAnsiStylesFrom, black, white, red, green, blue, yellow, cyan, magenta, lightBlack, lightWhite, lightRed, lightGreen, lightBlue, lightYellow, lightMagenta, lightCyan, blackBackground, whiteBackground, redBackground, greenBackground, blueBackground, yellowBackground, magentaBackground, cyanBackground, lightBlackBackground, lightRedBackground, lightGreenBackground, lightYellowBackground, lightBlueBackground, lightMagentaBackground, lightCyanBackground, lightWhiteBackground, bold, reset, dim, italic, underline, inverse, strikethrough, gray, grey, lightGray, lightGrey, grayBackground, greyBackground, lightGrayBackground, lightGreyBackground, } from "https://deno.land/x/quickr@0.6.31/main/console.js"
import { regex, capitalize, indent, toCamelCase, digitsToEnglishArray, toPascalCase, toKebabCase, toSnakeCase, toScreamingtoKebabCase, toScreamingtoSnakeCase, toRepresentation, toString, escapeRegexMatch, escapeRegexReplace, extractFirst, isValidIdentifier } from "https://deno.land/x/good@1.3.0.4/string.js"
import { enumerate, zip } from "https://deno.land/x/good@1.3.0.4/array.js"
import { parserFromWasm, flatNodeList } from "https://deno.land/x/deno_tree_sitter@0.0.5/main.js"
import javascript from "https://github.com/jeff-hykin/common_tree_sitter_languages/raw/4d8a6d34d7f6263ff570f333cdcf5ded6be89e3d/main/javascript.js"

const parser = await parserFromWasm(javascript)

try {
    const filePaths = await FileSystem.listFileItemsIn(Deno.args[0])
    await run`git add -A`
    await run`git commit -m '--'`
    const startingCommit = (await run`git rev-parse --abbrev-ref HEAD ${Stdout(returnAsString)}`).replace(/\n/g,"")

    const classes = {}
    FileSystem.cwd = Deno.args[0]
    for (const each of filePaths) {
        if (each.path.endsWith(".json")) {
            console.group()
            console.warn(`loading ${each.path}`)
            const parentPath = FileSystem.parentPath(each.path)
            console.warn(`${await run`git checkout ${startingCommit} ${Out(returnAsString)}`}`)
            const output = await FileSystem.read(each.path)
            if (!output) {
                console.warn(`each.path: ${each.path}`)
            }
            try {
                var { File, Class, Author, Purpose, Functions } = JSON.parse(output)
            } catch (error) {
                console.warn(`await FileSystem.listFileItemsIn(FileSystem.parentPath(each.path)) is:`,await FileSystem.listFileItemsIn(FileSystem.parentPath(each.path)))
                console.warn(`each.path is:`,each.path)
                console.warn(`output is:`,output)
                console.warn(`error is:`,error)
                console.warn(await run`git checkout ${startingCommit} ${Out(returnAsString)}`)
                console.warn(`continuing anyways!`)
                continue
            }
            classes[Class] = eval(`(()=>{ class ${Class} {}; return ${Class} })()`)
            const methods = {}
            try {
                console.warn(`{ File, Class, Author, Purpose, Functions } is:`,{ File, Class, Author, Purpose, Functions })
                for (const eachFunctionNumber of Functions) {
                    console.group()
                    console.warn(`loading ${eachFunctionNumber.toString(16)}`)
                    console.warn(`        ${await run`git checkout ${eachFunctionNumber.toString(16)} ${Out(returnAsString)}`}`)
                    const jsFile = await FileSystem.read(`${parentPath}/${each.name}.js`)
                    const methodName = jsFile.match(new RegExp(`${Class}\\.prototype\\.(\\w+)`))[1]
                    const jsWithRenamedClass = jsFile.replace(new RegExp(`\\b${Class}\\b`, "g"), `classes[${JSON.stringify(Class)}]`)
                    
                    console.warn(`aka ${methodName}`)
                    const tree = parser.parse({ string: jsWithRenamedClass, withWhitespace: true })
                    let newCode = ""
                    const allNodes = flatNodeList(tree.rootNode).filter(each=>!each.hasChildren)
                    for (const [ nodeIndex, each ] of enumerate(allNodes)) {
                        if (!(each.type == "comment")) {
                            newCode += each.text||""
                        } else {
                            let text = each.text
                            const remainingText = allNodes.slice(nodeIndex+1,).filter(each=>each.type!=="comment").map(each=>each.text).join("")
                            // must try to make every bit of potentially-executable code executable

                            // slice off the comment-y stuff
                            if (text.startsWith("/*")) {
                                text = text.slice(2,-2)
                            } else {
                                text = text.slice(2)
                            }
                            
                            const snippetIsValid = async (snippet)=>{
                                try {
                                    // if it passes eval, then its valid 😜
                                    const proposedCode = `${newCode}${snippet}${remainingText}`
                                    await eval(proposedCode)
                                    newCode += snippet
                                    return true
                                } catch (error) {
                                    try {
                                        // gotta try automatic semicolon injection
                                        await eval(`${newCode};${snippet}${remainingText}`)
                                        newCode += ";"+snippet
                                        return true
                                    } catch (error) {
                                        return false
                                    }
                                    return false
                                }
                                return false
                            }
                            
                            // gotta try all the combinations to make sure comments execute as valid code
                            tryNext: while (true) {
                                for (const [startIndex, _] of enumerate(text)) {
                                    for (const [endIndex, __] of enumerate(text+" ").reverse()) {
                                        if (await snippetIsValid(text.slice(startIndex, endIndex))) {
                                            text = text.slice(endIndex)
                                            // if there's still some text remaining, try to make it valid too
                                            if (text.length != 0) {
                                                continue tryNext
                                            // otherwise were done
                                            } else {
                                                break tryNext
                                            }
                                        }
                                    }
                                }
                                break // ran out of characters
                            }
                        }
                    }
                    try {
                        classes[Class].prototype[methodName] = methods[methodName] = eval(newCode)
                        if (!methods[methodName]) {
                            console.warn(`classes[Class] is:`,classes[Class])
                            console.warn(`newCode is:`,newCode)
                            console.warn(`eval(newCode) is:`,eval(newCode))
                        }
                    } catch (error) {
                        console.warn(`newCode is:`,newCode)
                        console.warn(`classes is:`,toRepresentation( classes))
                        console.warn(`sending an email to ${Author}: ${JSON.stringify(methodName)} didnt work: ${error}`)
                        console.warn(`error.stack is:`,error.stack)
                    }
                    console.groupEnd()
                }
                // call constructor if it exists
                if (Object.keys(methods).includes("constructor")) {
                    try {
                        const newObject = new classes[Class]()
                        // call the constructor
                        console.warn(`methods is:`,methods)
                        await methods.constructor.apply(newObject, [{}])
                    } catch (error) {
                        console.warn(`sending an email to ${Author}: ${JSON.stringify("constructor")} didnt work: ${error}`)
                        console.warn(`error.stack is:`,error.stack)
                    }
                }
            } catch (error) {
                console.warn(`sending an email to ${Author}: ${JSON.stringify(error)}, ${error}`)
                console.warn(`error.stack is:`,error.stack)
            }
            console.groupEnd()
        }
        
    }
    console.warn(`${await run`git checkout ${startingCommit} ${Out(returnAsString)}`}`)
    console.warn("\nEND, returning")
} catch (error) {
    await run`git checkout master`
}