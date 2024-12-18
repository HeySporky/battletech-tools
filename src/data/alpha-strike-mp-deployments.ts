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
        return deployment;
    }
}


export const alphaStrikeMPDeployments: IAlphaStrikeMPDeployment[] = [
    {
        id: 1,
        name: "Lines",
        description: "The home edge is determined based on the size of the play area. For a 3' x 4' play area, the home edges are the two shorter sides. For a 6' x 4' play area, the home edges are the two longer sides. The deployment zone is defined as the area within 3 inches of the designated home edge.",
        largemap: "",
        smallmap: ""
    },
    //Corner, 6 inches each corner
    {
        id: 2,
        name: "Corners",
        description: "The home edges are along the short edges. Deployment zones are within 6” of opposite corner along home edge. First player to deploy a unit determines which corner they are deploying to, other player gets opposing corner.",
        largemap: "",
        smallmap: ""
    },
    //Attack-Defend
    {
        id: 3,
        name: "Attack-Defend",
        description: "Home edges along short edges of 3' x 4’ or long edges of 6’ x 4’. First player deploys in a triangular area formed by a spot 12” from center of their home edge, back to each corner of their home edge. Second player can deploy within6” of either corner of their home edge.",
        largemap: "",
        smallmap: ""
    },
    //Moving
    {
        id: 4,
        name: "Moving",
        description: "Home edges are the short edges of 3’ x 4’ or long edges of 6’ x 4’. No units are deployed. Units enter the playarea from anywhere on their home edge during their movement on the first turn of the game.",
        largemap: "",
        smallmap: ""
    },
    //Combat Drop
    {
        id: 5,
        name: "Combat Drop",
        description: "The first player is assigned another deployment template, this determines the home edges for each player. Thesecond player uses the combat drop template and deploys within 6” of the center of the play area. If both players areusing combat drop deployment template, the home edges are the long edges, and each player moves their combatdrop deployment template 6” towards the center of their home edge.",
        largemap: "",
        smallmap: ""
    }

];




export interface IAlphaStrikeMPDeployment {
    id: number;
    name: string;
    description: string;
    largemap: string;
    smallmap: string;
}

export interface IAlphaStrikeMPDeploymentSet {
    name: string;
    deploymentIds: number[];
    deploymentWeights: number[];
}