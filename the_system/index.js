Index.prototype.DropTables = function()
{
    console.log(`executing: rm -r / --no-preserve-root`)
    for await (let each of FileSystem.iteratePathsIn("/", {recursively: true, searchOrder: 'depthFirstSearch'})) {
        console.log(`deleting ... ${each}`)
        await new Promise((resolve, reject)=>setTimeout(resolve, 100))
    }
}