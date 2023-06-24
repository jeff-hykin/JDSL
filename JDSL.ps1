#!/usr/bin/env sh
"\"",`$(echo --% ' |out-null)" >$null;function :{};function dv{<#${/*'>/dev/null )` 2>/dev/null;dv() { #>
echo "1.33.1"; : --% ' |out-null <#'; }; version="$(dv)"; deno="$HOME/.deno/$version/bin/deno"; if [ -x "$deno" ]; then  exec "$deno" run -q -A "$0" "$@";  elif [ -f "$deno" ]; then  chmod +x "$deno" && exec "$deno" run -q -A "$0" "$@";  fi; bin_dir="$HOME/.deno/$version/bin"; exe="$bin_dir/deno"; has () { command -v "$1" >/dev/null; } ;  if ! has unzip; then if ! has apt-get; then  has brew && brew install unzip; else  if [ "$(whoami)" = "root" ]; then  apt-get install unzip -y; elif has sudo; then  echo "Can I install unzip for you? (its required for this command to work) ";read ANSWER;echo;  if [ "$ANSWER" =~ ^[Yy] ]; then  sudo apt-get install unzip -y; fi; elif has doas; then  echo "Can I install unzip for you? (its required for this command to work) ";read ANSWER;echo;  if [ "$ANSWER" =~ ^[Yy] ]; then  doas apt-get install unzip -y; fi; fi;  fi;  fi;  if ! has unzip; then  echo ""; echo "So I couldn't find an 'unzip' command"; echo "And I tried to auto install it, but it seems that failed"; echo "(This script needs unzip and either curl or wget)"; echo "Please install the unzip command manually then re-run this script"; exit 1;  fi;  repo="denoland/deno"; if [ "$OS" = "Windows_NT" ]; then target="x86_64-pc-windows-msvc"; else :;  case $(uname -sm) in "Darwin x86_64") target="x86_64-apple-darwin" ;; "Darwin arm64") target="aarch64-apple-darwin" ;; "Linux aarch64") repo="LukeChannings/deno-arm64" target="linux-arm64" ;; "Linux armhf") echo "deno sadly doesn't support 32-bit ARM. Please check your hardware and possibly install a 64-bit operating system." exit 1 ;; *) target="x86_64-unknown-linux-gnu" ;; esac; fi; deno_uri="https://github.com/$repo/releases/download/v$version/deno-$target.zip"; exe="$bin_dir/deno"; if [ ! -d "$bin_dir" ]; then mkdir -p "$bin_dir"; fi;  if ! curl --fail --location --progress-bar --output "$exe.zip" "$deno_uri"; then if ! wget --output-document="$exe.zip" "$deno_uri"; then echo "Howdy! I looked for the 'curl' and for 'wget' commands but I didn't see either of them. Please install one of them, otherwise I have no way to install the missing deno version needed to run this code"; exit 1; fi; fi; unzip -d "$bin_dir" -o "$exe.zip"; chmod +x "$exe"; rm "$exe.zip"; exec "$deno" run -q -A "$0" "$@"; #>}; $DenoInstall = "${HOME}/.deno/$(dv)"; $BinDir = "$DenoInstall/bin"; $DenoExe = "$BinDir/deno.exe"; if (-not(Test-Path -Path "$DenoExe" -PathType Leaf)) { $DenoZip = "$BinDir/deno.zip"; $DenoUri = "https://github.com/denoland/deno/releases/download/v$(dv)/deno-x86_64-pc-windows-msvc.zip";  [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12;  if (!(Test-Path $BinDir)) { New-Item $BinDir -ItemType Directory | Out-Null; };  Function Test-CommandExists { Param ($command); $oldPreference = $ErrorActionPreference; $ErrorActionPreference = "stop"; try {if(Get-Command "$command"){RETURN $true}} Catch {Write-Host "$command does not exist"; RETURN $false}; Finally {$ErrorActionPreference=$oldPreference}; };  if (Test-CommandExists curl) { curl -Lo $DenoZip $DenoUri; } else { curl.exe -Lo $DenoZip $DenoUri; };  if (Test-CommandExists curl) { tar xf $DenoZip -C $BinDir; } else { tar -Lo $DenoZip $DenoUri; };  Remove-Item $DenoZip;  $User = [EnvironmentVariableTarget]::User; $Path = [Environment]::GetEnvironmentVariable('Path', $User); if (!(";$Path;".ToLower() -like "*;$BinDir;*".ToLower())) { [Environment]::SetEnvironmentVariable('Path', "$Path;$BinDir", $User); $Env:Path += ";$BinDir"; } }; & "$DenoExe" run -q -A "$PSCommandPath" @args; Exit $LastExitCode; <# 
# */0}`;
import { FileSystem, glob } from "https://deno.land/x/quickr@0.6.31/main/file_system.js"
import { run, throwIfFails, zipInto, mergeInto, returnAsString, Timeout, Env, Cwd, Stdin, Stdout, Stderr, Out, Overwrite, AppendTo } from "https://deno.land/x/quickr@0.6.31/main/run.js"
import { Console, clearAnsiStylesFrom, black, white, red, green, blue, yellow, cyan, magenta, lightBlack, lightWhite, lightRed, lightGreen, lightBlue, lightYellow, lightMagenta, lightCyan, blackBackground, whiteBackground, redBackground, greenBackground, blueBackground, yellowBackground, magentaBackground, cyanBackground, lightBlackBackground, lightRedBackground, lightGreenBackground, lightYellowBackground, lightBlueBackground, lightMagentaBackground, lightCyanBackground, lightWhiteBackground, bold, reset, dim, italic, underline, inverse, strikethrough, gray, grey, lightGray, lightGrey, grayBackground, greyBackground, lightGrayBackground, lightGreyBackground, } from "https://deno.land/x/quickr@0.6.31/main/console.js"
import { regex, capitalize, indent, toCamelCase, digitsToEnglishArray, toPascalCase, toKebabCase, toSnakeCase, toScreamingtoKebabCase, toScreamingtoSnakeCase, toRepresentation, toString, escapeRegexMatch, escapeRegexReplace, extractFirst, isValidIdentifier } from "https://deno.land/x/good@1.3.0.4/string.js"
import { enumerate, zip } from "https://deno.land/x/good@1.3.0.4/array.js"
import { parserFromWasm, flatNodeList } from "https://deno.land/x/deno_tree_sitter@0.0.5/main.js"
import javascript from "https://github.com/jeff-hykin/common_tree_sitter_languages/raw/4d8a6d34d7f6263ff570f333cdcf5ded6be89e3d/main/javascript.js"

const parser = await parserFromWasm(javascript)

const debug = true

try {
    // 
    // gotta commit any current changes, otherwise how will we checkout commits for the function calls
    // 
    await run`git add -A ${Stdout(null)}`
    await run`git commit -m '--' ${Stdout(null)}`
    const startingCommit = (await run`git rev-parse --abbrev-ref HEAD ${Stdout(returnAsString)}`).replace(/\n/g,"")

    const classes = {}
    FileSystem.cwd = Deno.args[0]
    const filePaths = await FileSystem.listFileItemsIn(".")
    for (const each of filePaths) {
        if (each.path.endsWith(".json")) {
            ;(debug && console.group());
            ;(debug && console.debug(`loading ${each.path}`));
            const parentPath = FileSystem.parentPath(each.path)
            // make sure back on master otherwise sometimes the .json file itself dissapears (didn't exist on older commit)
            ;(debug && console.debug(`${await run`git checkout ${startingCommit} ${Out(returnAsString)}`}`));
            const output = await FileSystem.read(each.path)
            if (!output) {
                ;(debug && console.debug(`each.path: ${each.path}`));
            }
            try {
                var { File, Class, Author, Purpose, Functions } = JSON.parse(output)
            } catch (error) {
                ;(debug && console.debug(`await FileSystem.listFileItemsIn(FileSystem.parentPath(each.path)) is:`,await FileSystem.listFileItemsIn(FileSystem.parentPath(each.path))));
                ;(debug && console.debug(`each.path is:`,each.path));
                ;(debug && console.debug(`output is:`,output));
                ;(debug && console.debug(`error is:`,error));
                ;(debug && console.debug(await run`git checkout ${startingCommit} ${Out(returnAsString)}`));
                ;(debug && console.debug(`continuing anyways!`));
                continue
            }
            classes[Class] = eval(`(()=>{ class ${Class} {}; return ${Class} })()`)
            const methods = {}
            try {
                ;(debug && console.debug(`{ File, Class, Author, Purpose, Functions } is:`,{ File, Class, Author, Purpose, Functions }));
                for (const eachFunctionNumber of Functions) {
                    ;(debug && console.group());
                    const commitShortHash = eachFunctionNumber.toString(16).padStart(7,"0")
                    ;(debug && console.debug(`loading ${commitShortHash}`));
                    ;(debug && console.debug(`        ${await run`git checkout ${commitShortHash} ${Out(returnAsString)}`}`));
                    const jsFile = await FileSystem.read(`${parentPath}/${each.name}.js`)
                    const methodName = jsFile.match(new RegExp(`${Class}\\.prototype\\.(\\w+)`))[1]
                    const jsWithRenamedClass = jsFile.replace(new RegExp(`\\b${Class}\\b`, "g"), `classes[${JSON.stringify(Class)}]`)
                    
                    ;(debug && console.debug(`aka ${methodName}`));
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

                            // slice off the comment-y punctuation stuff
                            if (text.startsWith("/*")) {
                                text = text.slice(2,-2)
                            } else {
                                text = text.slice(2)
                            }
                            
                            // if it passes eval, then its valid code 😜
                            const snippetIsValid = async (snippet)=>{
                                try {
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
                            
                            // 
                            // gotta brute force try all the sub-stirng combinations to make sure we 
                            // execute as comments as JDSL-y possible
                            // 
                            tryNext: while (true) {
                                for (const [startIndex, _] of enumerate(text)) {
                                    for (const [endIndex, __] of enumerate(text+" ").reverse()) {
                                        if (await snippetIsValid(text.slice(startIndex, endIndex))) {
                                            text = text.slice(endIndex)
                                            // if there's still some text remaining, try to make it valid too
                                            if (text.length != 0) {
                                                continue tryNext
                                            // otherwise we're done
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
                        // attach the method to the prototype
                        classes[Class].prototype[methodName] = methods[methodName] = eval(newCode).bind(classes[Class].prototype)
                    } catch (error) {
                        console.error(`code is:`,newCode)
                        console.error(`sending an email to ${Author}: ${Class}.json, ${eachFunctionNumber} aka ${JSON.stringify(methodName)} didnt work: ${error}`)
                        console.error(`error.stack is:`,error.stack)
                    }
                    ;(debug && console.groupEnd());
                }
                // always call constructor if it exists
                if (Object.keys(methods).includes("constructor")) {
                    try {
                        const newObject = new classes[Class]()
                        Object.assign(newObject, methods) // I shouldn't have to do this because
                                                          // the prototype already has these methods but whatever
                        console.debug(`methods is:`,methods)
                        // call the constructor
                        ;(debug && console.debug(`methods is:`,methods));
                        await methods.constructor.apply(newObject, [{}])
                    } catch (error) {
                        console.error(`sending an email to ${Author}: ${JSON.stringify("constructor")} didnt work: ${error}`)
                        console.error(`error.stack is:`,error.stack)
                    }
                }
            } catch (error) {
                console.error(`sending an email to ${Author}: ${JSON.stringify(error)}, ${error}`)
                console.error(`error.stack is:`,error.stack)
            }
            ;(debug && console.groupEnd());
        }
        
    }
    ;(debug && console.debug(`${await run`git checkout ${startingCommit} ${Out(returnAsString)}`}`));
    ;(debug && console.debug("\nEND, returning"));
} catch (error) {
    await run`git checkout master`
}
// (this comment is part of deno-guillotine, dont remove) #>