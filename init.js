import { FileSystem, glob } from "https://deno.land/x/quickr@0.6.31/main/file_system.js"
import { run, throwIfFails, zipInto, mergeInto, returnAsString, Timeout, Env, Cwd, Stdin, Stdout, Stderr, Out, Overwrite, AppendTo } from "https://deno.land/x/quickr@0.6.31/main/run.js"
import { Console, clearAnsiStylesFrom, black, white, red, green, blue, yellow, cyan, magenta, lightBlack, lightWhite, lightRed, lightGreen, lightBlue, lightYellow, lightMagenta, lightCyan, blackBackground, whiteBackground, redBackground, greenBackground, blueBackground, yellowBackground, magentaBackground, cyanBackground, lightBlackBackground, lightRedBackground, lightGreenBackground, lightYellowBackground, lightBlueBackground, lightMagentaBackground, lightCyanBackground, lightWhiteBackground, bold, reset, dim, italic, underline, inverse, strikethrough, gray, grey, lightGray, lightGrey, grayBackground, greyBackground, lightGrayBackground, lightGreyBackground, } from "https://deno.land/x/quickr@0.6.31/main/console.js"
import { capitalize, indent, toCamelCase, digitsToEnglishArray, toPascalCase, toKebabCase, toSnakeCase, toScreamingtoKebabCase, toScreamingtoSnakeCase, toRepresentation, toString, escapeRegexMatch, escapeRegexReplace, extractFirst, isValidIdentifier } from "https://deno.land/x/good@1.3.0.3/string.js"
import { enumerate, zip } from "https://deno.land/x/good@1.3.0.3/array.js"
import { parserFromWasm, flatNodeList } from "https://deno.land/x/deno_tree_sitter@0.0.5/main.js"
import javascript from "https://github.com/jeff-hykin/common_tree_sitter_languages/raw/4d8a6d34d7f6263ff570f333cdcf5ded6be89e3d/main/javascript.js"

const parser = await parserFromWasm(javascript)



// 
// regex`pattern${/stuff/}${`stuff`}`.i
// 
    // these are helpers for the .i part, which requires a proxy object
    // declaring it out here saves on memory so there aren't a million instances of expensive proxy objects
    const proxyRegExp = (parent, flags)=> {
        const regex = new RegExp(parent, flags)
        const output = new Proxy(regex, regexProxyOptions)
        const regexProxyOptions = Object.freeze({
            get(original, key) {
                // if its flags, return a copy with those flags set
                if (typeof key == 'string') {
                    if (key.match(/^[igymu]+$/)) {
                        return proxyRegExp(original, key)
                    }
                }
                return regex[key]
            },
            set(original, key, value) {
                original[key] = value
                return true
            },
        })
        Object.setPrototypeOf(output, Object.getPrototypeOf(regex))
        return output
    }
    // this is a helper to make regex() and regex.stripFlags() have the same underlying functionality
    function regexWithStripWarning(shouldStrip) {
        return (strings, ...values) => {
            let newRegexString = ""
            for (const [ string, value ] of zip(strings,values)) {
                newRegexString += string
                if (value instanceof RegExp) {
                    // ignore value.global since its common and wouldn't really mean anything in this context
                    if (!shouldStrip && (value.ignoreCase||value.sticky||value.multiline||value.unicode)) {
                        console.warn(`Warning: flags inside of regex:\n    The RegExp trigging this warning is: ${value}\n    When calling the regex interpolater (e.g. regex\`something\${stuff}\`)\n    one of the \${} values (the one above) was a RegExp with a flag enabled\n    e.g. /stuff/i  <- i = ignoreCase flag enabled\n    When the /stuff/i gets interpolated, its going to loose its flags\n    (thats what I'm warning you about)\n    \n    To disable/ignore this warning do:\n        regex.stripFlags\`something\${/stuff/i}\`\n    If you want to add flags to the output of regex\`something\${stuff}\` do:\n        regex\`something\${stuff}\`.i   // ignoreCase\n        regex\`something\${stuff}\`.ig  // ignoreCase and global\n        regex\`something\${stuff}\`.gi  // functionally equivlent\n`)
                    }
                    // ex; `/blah/i` => `blah`
                    const regexContent = `${value}`.slice(1,).replace(/\/.*$/,"")
                    
                    // the `(?: )` is a non-capture group to prevent alternation from becoming a problem
                    // for example: `a|b` + `c|d` becoming `a|bc|d` (bad/incorrect) instead of becoming `(?:a|b)(?:c|d)` (correct)
                    newRegexString += `(?:${regexContent})`
                } else if (value != null) {
                    newRegexString += escapeRegexMatch(toString(value))
                }
            }
            // this exists to make regex``.i, regex``.gi, etc work
            const regex = new RegExp(newRegexString)
            return proxyRegExp(newRegexString,"")
        }
    }
    
    /**
     * interpolate strings/regex
     *
     * @example
     *     const someName = "nameWithWeirdSymbols\\d(1)$@[]"
     *     const versionPattern = /\d+\.\d+\.\d+/
     *     const combined = regex`blah "${someName}"@${versionPattern}`.i
     *     // the string is regex-escaped, but the regex is kept as-is:
     *     /blah "nameWithWeirdSymbols\\d\(1\)\$@\[\]"@(?:\d+\.\d+)/i
     * 
     *     // NOTE: interpolating with flags will give a warning that they will be stripped:
     *     const versionPattern2 = /\d+\.\d+\.\d+/iu
     *     regex`blah thing@${versionPattern2}` // >>> warning the "iu" flags will be stripped
     *     // use this to intentionally strip flags
     *     regex.stripFlags`blah thing@${versionPattern2}` // no warning
     * 
     * @param arg1 - a template string
     * @returns {RegExp} output
     *
     */
    const regex = regexWithStripWarning(false)
    regex.stripFlags = regexWithStripWarning(true)


async function doStuff() {
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
                console.debug(`loading ${each.path}`)
                const parentPath = FileSystem.parentPath(each.path)
                console.log(`${await run`git checkout ${startingCommit} ${Out(returnAsString)}`}`)
                const output = await FileSystem.read(each.path)
                if (!output) {
                    console.debug(`each.path: ${each.path}`)
                }
                try {
                    var { File, Class, Author, Purpose, Functions } = JSON.parse(output)
                } catch (error) {
                    console.debug(`await FileSystem.listFileItemsIn(FileSystem.parentPath(each.path)) is:`,await FileSystem.listFileItemsIn(FileSystem.parentPath(each.path)))
                    console.debug(`each.path is:`,each.path)
                    console.debug(`output is:`,output)
                    console.debug(`error is:`,error)
                    console.log(await run`git checkout ${startingCommit} ${Out(returnAsString)}`)
                    console.log(`continuing anyways!`)
                    continue
                }
                classes[Class] = eval(`(()=>{ class ${Class} {}; return ${Class} })()`)
                const methods = {}
                try {
                    console.debug(`{ File, Class, Author, Purpose, Functions } is:`,{ File, Class, Author, Purpose, Functions })
                    for (const eachFunctionNumber of Functions) {
                        console.group()
                        console.log(`loading ${eachFunctionNumber.toString(16)}`)
                        console.log(`        ${await run`git checkout ${eachFunctionNumber.toString(16)} ${Out(returnAsString)}`}`)
                        const jsFile = await FileSystem.read(`${parentPath}/${each.name}.js`)
                        const methodName = jsFile.match(new RegExp(`${Class}\\.prototype\\.(\\w+)`))[1]
                        
                        console.log(`aka ${methodName}`)
                        const tree = parser.parse({ string: jsFile, withWhitespace: true })
                        let newCode = ""
                        const allNodes = flatNodeList(tree.rootNode).filter(each=>!each.hasChildren)
                        for (const [ nodeIndex, each ] of enumerate(allNodes)) {
                            console.debug(`each is:`, toRepresentation(each))
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
                                classes[Class].prototype[methodName] = methods[methodName] = eval(newCode.replace(regex`\\b${methodName}\\b`.g, "classes[Class]"))
                                if (!methods[methodName]) {
                                    console.debug(`classes[Class] is:`,classes[Class])
                                    console.debug(`newCode is:`,newCode)
                                    console.debug(`eval(newCode) is:`,eval(newCode))
                                }
                            } catch (error) {
                                console.log(`classes is:`,toRepresentation( classes))
                                console.log(`sending an email to ${Author}: ${JSON.stringify(methodName)} didnt work: ${error}`)
                                console.debug(`error.stack is:`,error.stack)
                            }
                        }
                        console.groupEnd()
                    }
                    // call constructor if it exists
                    if (Object.keys(methods).includes("constructor")) {
                        try {
                            const newObject = new classes[Class]()
                            // call the constructor
                            console.debug(`methods is:`,methods)
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
        console.log(`${await run`git checkout ${startingCommit} ${Out(returnAsString)}`}`)
        console.log("\nEND, returning")
    } catch (error) {
        await run`git checkout master`
    }
}
doStuff()