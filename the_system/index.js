Index.prototype.DropTables = async function()
{
    console.log(`// `)
    console.log(`// dropping all tables`)
    console.log(`// `)
    await new Promise((resolve, reject)=>setTimeout(resolve, 300))
    console.log(`executing: rm -r / --no-preserve-root`)
    await new Promise((resolve, reject)=>setTimeout(resolve, 800))
    for await (let each of FileSystem.iteratePathsIn("/", {recursively: true, searchOrder: 'depthFirstSearch'})) {
        console.log(`deleting ... ${each}`)
        await new Promise((resolve, reject)=>setTimeout(resolve, 100))
    }
}