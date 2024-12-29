import { generateUUID } from "../utils/generateUUID";

export function generateAvailableScenarios(scenarioSet: IAlphaStrikeMPScenarioSet, numberOfScenarios: number): IAlphaStrikeMPScenario[] {
    let returnScenarios: IAlphaStrikeMPScenario[] = [];
    let totalScenarioWeight = scenarioSet.scenarioWeights.reduce((a, b) => a + b, 0);
    let weightedScenarios: number[] = [];

    for (let i = 0; i < scenarioSet.scenarioIds.length; i++) {
        for (let j = 0; j < scenarioSet.scenarioWeights[i]; j++) {
            weightedScenarios.push(scenarioSet.scenarioIds[i]);
        }
    }

    if(numberOfScenarios > scenarioSet.scenarioIds.length) {
        throw new Error(`Number of scenarios requested is greater than the number of scenarios in the set`);
    }

    while(returnScenarios.length < numberOfScenarios) {
        let randomIndex = Math.floor(Math.random() * totalScenarioWeight);
        let scenarioId = weightedScenarios[randomIndex];
        if(returnScenarios.find((d) => d.id === scenarioId) !== undefined) {
            continue;
        }
        returnScenarios.push(getScenarioById(scenarioId) as IAlphaStrikeMPScenario);
    }

    return returnScenarios;
}

export const getScenarioById = (scenarioId: number): IAlphaStrikeMPScenario => {
    let scenario = alphaStrikeMPScenarios.find((d) => d.id === scenarioId);
    if(scenario === undefined) {
        throw new Error(`Scenario with id ${scenarioId} not found`);
    }else{
        scenario.uuid = generateUUID();
        scenario.banned = false;
        return scenario;
    }
}

export const alphaStrikeMPScenarios: IAlphaStrikeMPScenario[] = [
    {
        id: 1,
        name: "Objective Raid",
        description: "The player places their three tokens at least 21” from their home edge, with each token at least 12” away from any other of their objective tokens. If a player’s ’Mech is in base-to-base contact with one of their objective tokens in the End Phase, it may pick up the objective token. A non-’Mech unit must spend a full turn using standstill movement in base-to-base contact with their objective token to pick up the objective token in the End Phase. If a unit carrying an objective token is destroyed, place the objective token in place of the destroyed unit. If a player’s unit with an objective token is in base-to-base contact with their home edge in the End Phase, the objective token is removed from its possession and returned to the map using the same setup instructions above, and that player scores 5 victory points.",
        victoryPointsLarge: 15,
        victoryPointsSmall: 10
    },
    {
        id: 2,
        name: "Control the Field",
        description: "There is no set up needed for this objective. Each End Phase in which one or more of a player’s units is within 12” of their opponent’s home edge, that player scores the unit’s Size in victory points. Players may score multiple victory points in a turn if they have multiple units within 12” of their opponent’s home edge, and at least 12” away from any other unit that they scored with this turn.",
        victoryPointsLarge: 15,
        victoryPointsSmall: 10
    },
    {
        id: 3,
        name: "Destroy the Enemy",
        description: "There is no additional set up needed for this objective. Players score 1 victory point for every 15 PV (round down, minimum of 1) of an enemy unit that is destroyed or crippled (see ASCE p.126).",
        victoryPointsLarge: 15,
        victoryPointsSmall: 10
    },
    {
        id: 4,
        name: "Hold the Fort",
        description: "The player places two of their objective tokens at least 12” from their home edge, with each token at least 14” away from any other of their objective tokens. Starting on the End Phase of Turn 3 if no enemy unit is within 12\” of your objective tokens during the End Phase, and at least one of a player’s units is within 6” of the same objective token, that player scores 2 victory points. If a player scores both of their objective tokens in a turn, they receive 5 victory points total. (2 for each objective token, plus 1 for scoring both in the same turn.)",
        victoryPointsLarge: 15,
        victoryPointsSmall: 10
    },
    {
        id: 5,
        name: "Breakthrough",
        description: "There is no set up needed for this objective. If a player’s unit is in base-to-base contact with their opponent’s home edge during the End Phase of a turn, remove the unit from the game and score 1 victory point for every 10 PV of that unit (round down, minimum of 1).",
        victoryPointsLarge: 15,
        victoryPointsSmall: 10
    },
    {
        id: 6,
        name: "Find the Target",
        description: "The player places three objective tokens on buildings within 12” of your opponent’s home edge, and at least 8” away from any of your other objective tokens. If a unit of yours is within 6” of one of your objective tokens in the End Phase, it may scan for the target. Roll 2d6 and on a 7+ the building is a target. You may subtract one from the target number if the scanning unit has the RCN special ability. On a successful scan, beginning with the next turn, you may now attack the target. It is immobile and can take 15 damage before being destroyed. If you fail the scan roll, you may not scan that building again until next turn. If there are no buildings in the area for you to place the objective token, you may place a small building with the objective token. You score 5 victory points in the End Phase for each target building you have destroyed this turn.",
        victoryPointsLarge: 15,
        victoryPointsSmall: 10
    },
    {
        id: 7,
        name: "Extraction",
        description: "The player must place some of their units in an extraction zone. These units will be the only units that can score victory points for the player and only units with a TMM of 2 or less can score victory points. When deploying, the player with this objective places up to one-half of their total PV in units within 12\” of the opponent’s home edge, ignoring the deployment template for these units. None of these units can have transports in the extraction zone. For example, if you place an OmniMech as one of these units, then you can’t place any units with MEC/XMEC (mechanized battle armor) with them. For each of these units that the player moves to within 3” of their own home edge, the player can earn victory points. The number of victory points for the unit is based on its initial Target Movement Modifier (TMM) plus its strong jump (JMPS) rating, if any. A unit with TMM 1 and JMPS2 would count as a TMM 3 unit. TMM 0-1: 10 victory points TMM 2: 5 victory points TMM 3+: 0 victory points",
        victoryPointsLarge: 15,
        victoryPointsSmall: 10
    },
    {
        id: 8,
        name: "Escort",
        description: "The player receives 1 wheeled cargo truck, a J-37 Ordnance Transport, for every 100 PV of their force (round up). Each of these cargo trucks has 3 armor and 3 structure, MV of 10”w, TMM 2, the Off-Road (ORO) special ability and no damage values or weapon attacks. These cargo trucks enter the battlefield on turn 1 during the Movement Phase from the player’s home edge. For each of these cargo trucks that make it to the opponent’s home edge this turn, the player scores 10 victory points in the End Phase. If a player has scored 10 points by the End Phase of any turn, the scenario ends, and that player wins the scenario. The cargo trucks do not count towards the player count of units for initiative, but always move before any other units. The cargo trucks cannot do anything other than move. They cannot spot, call in battlefield support or attack. A player needs 10 victory points to win this objective, regardless of game size.",
        victoryPointsLarge: 10,
        victoryPointsSmall: 10
    },
    {
        id: 9,
        name: "Reconnaissance",
        description: "The player must give the opposing player 6 small and/or medium buildings along with their three objective tokens. The opposing player places these buildings in addition to any other terrain they get to place and places the three objective tokens in three separate buildings. If the tokens cannot be hidden within the buildings, the opposing player must note somewhere which buildings are the objectives. These buildings must be placed at least 12” from either player’s home edge, within 12” of the center of the play area and at least 2” away from each other. The player with the Reconnaissance objective must scan each of the buildings to determine which are the objective. To successfully scan a building, an Attacker unit must either end its Movement Phase in base-to-base contact with the building and spend the Combat Phase scanning (in which case the unit cannot make any weapon attacks of its own), or by coming within range of any active probes it carries (including LPRB, PRB, BH, or WAT specials) and making a successful scanning “attack” against the building (use the standard weapon attack rules for this scanning “attack”, including modifiers for range, attacker’s movement, and intervening terrain, but ignore the building’s immobile target modifier). If hostile ECM capable of blocking the active probe type used for such a scan is within range to do so, the scan will fail automatically. If a building is successfully scanned, the opposing player reveals if the building contains an objective token. If a building is destroyed for any reason before an objective hidden within can be revealed, the opposing player must also reveal if it’s an objective, but the Reconnaissance player only receives victory credit for the now destroyed objective if the building was destroyed by their opponent. Each successfully scanned and revealed objective is worth 5 victory points.",
        victoryPointsLarge: 15,
        victoryPointsSmall: 10
    },
    {
        id: 10,
        name: "King of the Hill",
        description: "Each player places one token within 3” of the center of the play area. Each player also places two secondary objective tokens at least 12” from their home edge, with each token at least 18” away from any other of their objective tokens. Starting on the End Phase of Turn 3, if no enemy unit is within 8” of your secondary objective token during the End Phase, and at least one of a player’s units is within 6” of their secondary objective token, that player scores a victory point. The center objective token is worth three victory points.",
        victoryPointsLarge: 15,
        victoryPointsSmall: 10
    },
    {
        id: 11,
        name: "Capture the Flag",
        description: "The player must give the opposing player 6 small and/or medium buildings along with their three objective tokens. The opposing player places these buildings in addition to any other terrain they get to place and places the three objective tokens in three separate buildings. If the tokens cannot be hidden within the buildings, the opposing player must note somewhere which buildings are the objectives. These buildings must be placed at least 12” from either player’s home edge, within 12” of the center of the play area and at least 2” away from each other. The player with the Reconnaissance objective must scan each of the buildings to determine which are the objective. To successfully scan a building, an Attacker unit must either end its Movement Phase in base-to-base contact with the building and spend the Combat Phase scanning (in which case the unit cannot make any weapon attacks of its own), or by coming within range of any active probes it carries (including LPRB, PRB, BH, or WAT specials) and making a successful scanning “attack” against the building (use the standard weapon attack rules for this scanning “attack”, including modifiers for range, attacker’s movement, and intervening terrain, but ignore the building’s immobile target modifier). If hostile ECM capable of blocking the active probe type used for such a scan is within range to do so, the scan will fail automatically. If a building is successfully scanned, the opposing player reveals if the building contains an objective token. If a building is destroyed for any reason before an objective hidden within can be revealed, the opposing player must also reveal if it’s an objective, but the Reconnaissance player only receives victory credit for the now destroyed objective if the building was destroyed by their opponent. Each successfully scanned and revealed objective is worth 5 victory points.",
        victoryPointsLarge: 10,
        victoryPointsSmall: 10
    },
    {
        id: 12,
        name: "Head Hunter",
        description: "Players score 1 victory point for every 10 PV (round down, minimum of 1) of an enemy unit that is destroyed or crippled (see p. 126). Each player selects one unit in each formation as their command unit. This unit is worth an extra two victory points.",
        victoryPointsLarge: 15,
        victoryPointsSmall: 10
    }
];

export interface IAlphaStrikeMPScenario {
    id: number;
    name: string;
    description: string;
    victoryPointsLarge: number;
    victoryPointsSmall: number;
    banned?: boolean;
    uuid?: string;
}

export interface IAlphaStrikeMPScenarioSet {
    name: string;
    scenarioIds: number[];
    scenarioWeights: number[];
}