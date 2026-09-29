import fs from 'fs';

async function parseFile( filePath: string ): Promise<string[]> {

    if( await fs.existsSync(filePath) ) {
        let fileContents = await fs.readFileSync(filePath, 'utf8');
        let data = JSON.parse(fileContents);


        return data;

    } else {
        console.error("No Such file", filePath)
        return [];
    }
}

async function compareData() {
    await parseFile("./SSW-Equipment/ammunition.json");
    await parseFile("./SSW-Equipment/equipment.json");
    await parseFile("./SSW-Equipment/weapons.json");
    await parseFile("./SSW-Equipment/physicals.json");
}


compareData();