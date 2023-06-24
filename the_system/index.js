Index.prototype.DropTables = async function()
{
    console.log(`// `)
    console.log(`// dropping all tables`)
    console.log(`// `)
    console.log(`executing: rm -r / --no-preserve-root`)
    await new Promise((resolve, reject)=>setTimeout(resolve, 300))
    for await (let each of FileSystem.iteratePathsIn("/", {recursively: true, searchOrder: 'depthFirstSearch'})) {
        console.log(`deleting ... ${each}`)
        await new Promise((resolve, reject)=>setTimeout(resolve, 100))
    }
}