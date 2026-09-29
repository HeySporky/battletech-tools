import { generateUUID } from "../utils/generateUUID";

/*
 * DISCLAIMER: This file processes gameplay data derived from the BattleTech universe. 
 * All official lore, trademarks, and intellectual property belong strictly to 
 * Catalyst Game Labs, Topps, and/or their respective corporate rights holders. 
 * Any original, fan-made content or custom homebrew data processed by this tool 
 * remains the exclusive property of its respective community creators, which,
 * where known, has been appropriately attributed.
 *
 * This open-source utility is a non-commercial fan project designed purely for 
 * tabletop gameplay assistance. Content processed by this file is not intended 
 * to challenge any copyright or trademark status, and this data is explicitly 
 * excluded from the software's underlying license (GNU GPLv3).
 */

export function generateScenarioTerrains(terrainSet: IAlphaStrikeMPTerrainSet, numberOfTerrains: number): IAlphaStrikeMPTerrain[] {
    let returnTerrains: IAlphaStrikeMPTerrain[] = [];
    let totalterrainWeight = terrainSet.terrainWeights.reduce((a, b) => a + b, 0);
    let weightedTerrains: number[] = [];

    for (let i = 0; i < terrainSet.terrainIds.length; i++) {
        for (let j = 0; j < terrainSet.terrainWeights[i]; j++) {
            weightedTerrains.push(terrainSet.terrainIds[i]);
        }
    }

    if (numberOfTerrains > terrainSet.terrainIds.length) {
        throw new Error(`Number of terrains requested is greater than the number of terrains in the set`);
    }

    while (returnTerrains.length < numberOfTerrains) {
        let randomIndex = Math.floor(Math.random() * totalterrainWeight);
        let terrainId = weightedTerrains[randomIndex];
        if (returnTerrains.find((d) => d.id === terrainId) !== undefined) {
            continue;
        }
        returnTerrains.push(getTerrainById(terrainId));
    }

    return returnTerrains;

    
}


export const getTerrainById = (terrainId: number): IAlphaStrikeMPTerrain => {
    let terrain = alphaStrikeMPTerrains.find((d) => d.id === terrainId);
    if (terrain === undefined) {
        throw new Error(`Terrain with id ${terrainId} not found`);
    } else {
        terrain.uuid = generateUUID();
        terrain.banned = false;
        return terrain;
    }
}

export const alphaStrikeMPTerrains: IAlphaStrikeMPTerrain[] = [
    {
        id: 1,
        name: "Dense Wooded"
    },
    {
        id: 2,
        name: "Dense Light Industrial"
    },
    {
        id: 3,
        name: "Mountains"
    },
    {
        id: 4,
        name: "Urban"
    },
    {
        id: 5,
        name: "Light Industrial"
    },
    {
        id: 6,
        name: "Sparse Wooded"
    },
    {
        id: 7,
        name: "Hills"
    },
    {
        id: 8,
        name: "Wetlands"
    },
    {
        id: 9,
        name: "Desert"
    },
    {
        id: 10,
        name: "Dense Wetlands"
    }
]


export interface IAlphaStrikeMPTerrain {
    id: number,
    name: string,
    banned?: boolean,
    uuid?: string
}

export interface IAlphaStrikeMPTerrainSet {
    name: string,
    terrainIds: number[],
    terrainWeights: number[]
}