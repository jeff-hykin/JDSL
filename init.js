import { FileSystem, glob } from "https://deno.land/x/quickr@0.6.31/main/file_system.js"
import { run, throwIfFails, zipInto, mergeInto, returnAsString, Timeout, Env, Cwd, Stdin, Stdout, Stderr, Out, Overwrite, AppendTo } from "https://deno.land/x/quickr@0.6.31/main/run.js"
import { Console, clearAnsiStylesFrom, black, white, red, green, blue, yellow, cyan, magenta, lightBlack, lightWhite, lightRed, lightGreen, lightBlue, lightYellow, lightMagenta, lightCyan, blackBackground, whiteBackground, redBackground, greenBackground, blueBackground, yellowBackground, magentaBackground, cyanBackground, lightBlackBackground, lightRedBackground, lightGreenBackground, lightYellowBackground, lightBlueBackground, lightMagentaBackground, lightCyanBackground, lightWhiteBackground, bold, reset, dim, italic, underline, inverse, strikethrough, gray, grey, lightGray, lightGrey, grayBackground, greyBackground, lightGrayBackground, lightGreyBackground, } from "https://deno.land/x/quickr@0.6.31/main/console.js"
import { capitalize, indent, toCamelCase, digitsToEnglishArray, toPascalCase, toKebabCase, toSnakeCase, toScreamingtoKebabCase, toScreamingtoSnakeCase, toRepresentation, toString, regex, escapeRegexMatch, escapeRegexReplace, extractFirst, isValidIdentifier } from "https://deno.land/x/good@1.3.0.1/string.js"
import { enumerate } from "https://deno.land/x/good@1.3.0.1/array.js"
import { parserFromWasm, flatNodeList } from "https://deno.land/x/deno_tree_sitter@0.0.5/main.js"
import javascript from "https://github.com/jeff-hykin/common_tree_sitter_languages/raw/4d8a6d34d7f6263ff570f333cdcf5ded6be89e3d/main/javascript.js"

const parser = await parserFromWasm(javascript)


const filePaths = await FileSystem.listFileItemsIn(Deno.args[0])

const classes = {}
FileSystem.cwd = Deno.args[0]
for (const each of filePaths) {
    if (each.path.endsWith(".json")) {
        console.group()
        console.debug(`loading ${each.path}`)
        const parentPath = FileSystem.parentPath(each.path)
        const output = await FileSystem.read(each.path)
        if (!output) {
            console.debug(`each.path: ${each.path}`)
        }
        const { File, Class, Author, Purpose, Functions } = JSON.parse(output)
        classes[Class] = eval(`(()=>{ class ${Class} {}; return ${Class} })()`)
        const methods = {}
        try {
            console.debug(`{ File, Class, Author, Purpose, Functions } is:`,{ File, Class, Author, Purpose, Functions })
            for (const eachFunctionNumber of Functions) {
                console.group()
                console.log(`loading ${eachFunctionNumber.toString(16)}`)
                await run`git checkout ${eachFunctionNumber.toString(16)}`
                const jsFile = await FileSystem.read(`${parentPath}/${each.name}.js`)
                const methodName = jsFile.match(new RegExp(`${Class}\\.prototype\\.(\\w+)`))[1]
                
                console.log(`aka ${methodName}`)
                const tree = parser.parse({ string: jsFile, withWhitespace: true })
                let newCode = ""
                const allNodes = flatNodeList(tree.rootNode).map(each=>!each.hasChildren)
                for (const [ nodeIndex, each ] of enumerate(allNodes)) {
                    if (!each.hasChildren) {
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
                                    await eval(`${newCode}${snippet}${remainingText}`)
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
                        try {
                            classes[Class].prototype[methodName] = methods[methodName] = eval(newCode)
                        } catch (error) {
                            console.log(`sending an email to ${Author}: ${JSON.stringify(methodName)} didnt work: ${error}`)
                            console.debug(`error.stack is:`,error.stack)
                        }
                    }
                }
                console.groupEnd()
            }
            // call constructor if it exists
            if (Object.keys(methods).includes("constructor")) {
                try {
                    const newObject = classes[Class]()
                    // call the constructor
                    await methods.constructor.apply(newObject, {})
                } catch (error) {
                    console.log(`sending an email to ${Author}: ${JSON.stringify("constructor")} didnt work: ${error}`)
                    console.debug(`error.stack is:`,error.stack)
                }
            }
        } catch (error) {
            console.log(`sending an email to ${Author}: ${JSON.stringify(error)}, ${error}`)
            console.debug(`error.stack is:`,error.stack)
        }
        console.groupEnd()
    }
    
}

await run`git checkout master`