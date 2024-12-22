import { generateUUID } from "../utils/generateUUID";

export function generateScenarioDeployments(deploymentSet: IAlphaStrikeMPDeploymentSet, numberOfDeploments: number): IAlphaStrikeMPDeployment[] {
    let returnDeployments: IAlphaStrikeMPDeployment[] = [];
    let totalDeploymentWeight = deploymentSet.deploymentWeights.reduce((a, b) => a + b, 0);
    let weightedDeployments: number[] = [];

    for (let i = 0; i < deploymentSet.deploymentIds.length; i++) {
        for (let j = 0; j < deploymentSet.deploymentWeights[i]; j++) {
            weightedDeployments.push(deploymentSet.deploymentIds[i]);
        }
    }

    if(numberOfDeploments > deploymentSet.deploymentIds.length) {
        throw new Error(`Number of deployments requested is greater than the number of deployments in the set`);
    }

    while(returnDeployments.length < numberOfDeploments) {
        let randomIndex = Math.floor(Math.random() * totalDeploymentWeight);
        console.log(randomIndex)
        let deploymentId = weightedDeployments[randomIndex];
        if(returnDeployments.find((d) => d.id === deploymentId) !== undefined) {
            continue;
        }
        returnDeployments.push(getDeploymentById(deploymentId) as IAlphaStrikeMPDeployment);
    }

    return returnDeployments;
}

export const getDeploymentById = (deploymentId: number): IAlphaStrikeMPDeployment => {
    let deployment = alphaStrikeMPDeployments.find((d) => d.id === deploymentId);
    if(deployment === undefined) {
        throw new Error(`Deployment with id ${deploymentId} not found`);
    }else{
        deployment.uuid = generateUUID();
        deployment.banned = false;
        return deployment;
    }
}


export const alphaStrikeMPDeployments: IAlphaStrikeMPDeployment[] = [
    {
        id: 1,
        name: "Lines",
        largeedges: "The home edges are on the longer sides of the map.",
        smalledges: "The home edges are on the shorter sides of the map.",
        description: "The deployment zone is defined as the area within 3 inches of the designated home edge.",
        largemap: "",
        smallmap: ""
    },
    //Corner, 6 inches each corner
    {
        id: 2,
        name: "Corners",
        largeedges: "The home edges are on the shorter sides of the map.",
        smalledges: "The home edges are on the shorter sides of the map.",
        description: "Deployment zones are within 6” of opposite corner along home edge. First player to deploy a unit determines which corner they are deploying to, other player gets opposing corner.",
        largemap: "",
        smallmap: ""
    },
    //Attack-Defend
    {
        id: 3,
        name: "Attack-Defend",
        largeedges: "The home edges are on the longer sides of the map.",
        smalledges: "The home edges are on the shorter sides of the map.",
        description: "First player deploys in a triangular area formed by a spot 12” from center of their home edge, back to each corner of their home edge. Second player can deploy within6” of either corner of their home edge.",
        largemap: "",
        smallmap: ""
    },
    //Moving
    {
        id: 4,
        name: "Moving",
        largeedges: "The home edges are on the longer sides of the map.",
        smalledges: "The home edges are on the shorter sides of the map.",
        description: "No units are deployed. Units enter the playarea from anywhere on their home edge during their movement on the first turn of the game.",
        largemap: "",
        smallmap: ""
    },
    //Combat Drop
    /* TODO: This requires generating a 2nd deployment template, and I don't want to code that yet.
    {
        id: 5,
        name: "Combat Drop",
        largeedges: "The home edges are on the longer sides of the map.",
        description: "The first player is assigned another deployment template, this determines the home edges for each player. Thesecond player uses the combat drop template and deploys within 6” of the center of the play area. If both players areusing combat drop deployment template, the home edges are the long edges, and each player moves their combatdrop deployment template 6” towards the center of their home edge.",
        largemap: "",
        smallmap: ""
    }*/

];




export interface IAlphaStrikeMPDeployment {
    id: number;
    name: string;
    largeedges: string;
    smalledges: string;
    description: string;
    largemap: string;
    smallmap: string;
    banned?: boolean;
    uuid?: string;
}

export interface IAlphaStrikeMPDeploymentSet {
    name: string;
    deploymentIds: number[];
    deploymentWeights: number[];
}