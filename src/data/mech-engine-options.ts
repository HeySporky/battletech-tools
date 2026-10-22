import { IEngineOption } from "./data-interfaces";

/*
* DISCLAIMER: This file processes gameplay data derived from the BattleTech universe. 
* All lore, stats, and intellectual property belong strictly to Catalyst Game Labs, 
* Topps, and their respective rights holders. 
*
* This open-source utility is a non-commercial fan project designed purely for 
* tabletop gameplay assistance. Content processed by this file is not intended 
* to challenge any copyright or trademark status, and this data is explicitly 
* excluded from the software's underlying license (GNU GPLv3).
*
* Standard fusion weights: TechManual p.49. Other columns apply the type multipliers to
* that weight, rounded up to the half ton: XL x0.5, Light x0.75, Compact x1.5, XXL x1/3,
* ICE x2, Fuel Cell x1.2, Fission x1.75 (5 ton minimum).
*
* Ratings above 400 are large engines: the Large Engine Weight Table, TO:AUE p.120. They
* exist as ICE, standard, Light, XL and XXL only, so the Compact, Fuel Cell and Fission
* columns stop at 400. The large engine types are in mech-engine-types.ts.
*
* Primitive: IO:AE p.117, rating x1.2 rounded up to the next rating in the TechManual
* table and weighed as standard fusion. That table ends at 400, so the column stops at 330.
*/

export const mechEngineOptions: IEngineOption[] = [
	{
		name: "10",
		rating: 10,
		weight: {
			standard: 0.5,
			xl: 0.5,
			clan_xl: 0.5,
			light: 0.5,
			compact: 1,
			xxl: 0.5,
			clan_xxl: 0.5,
			ice: 1,
			cell: 1,
			fission: 5,
			primitive: 0.5
		}
	},
	{
		name: "15",
		rating: 15,
		weight: {
			standard: 0.5,
			xl: 0.5,
			clan_xl: 0.5,
			light: 0.5,
			compact: 1,
			xxl: 0.5,
			clan_xxl: 0.5,
			ice: 1,
			cell: 1,
			fission: 5,
			primitive: 0.5
		}
	},
	{
		name: "20",
		rating: 20,
		weight: {
			standard: 0.5,
			xl: 0.5,
			clan_xl: 0.5,
			light: 0.5,
			compact: 1,
			xxl: 0.5,
			clan_xxl: 0.5,
			ice: 1,
			cell: 1,
			fission: 5,
			primitive: 0.5
		}
	},
	{
		name: "25",
		rating: 25,
		weight: {
			standard: 0.5,
			xl: 0.5,
			clan_xl: 0.5,
			light: 0.5,
			compact: 1,
			xxl: 0.5,
			clan_xxl: 0.5,
			ice: 1,
			cell: 1,
			fission: 5,
			primitive: 1
		}
	},
	{
		name: "30",
		rating: 30,
		weight: {
			standard: 1,
			xl: 0.5,
			clan_xl: 0.5,
			light: 1,
			compact: 1.5,
			xxl: 0.5,
			clan_xxl: 0.5,
			ice: 2,
			cell: 1.5,
			fission: 5,
			primitive: 1
		}
	},
	{
		name: "35",
		rating: 35,
		weight: {
			standard: 1,
			xl: 0.5,
			clan_xl: 0.5,
			light: 1,
			compact: 1.5,
			xxl: 0.5,
			clan_xxl: 0.5,
			ice: 2,
			cell: 1.5,
			fission: 5,
			primitive: 1
		}
	},
	{
		name: "40",
		rating: 40,
		weight: {
			standard: 1,
			xl: 0.5,
			clan_xl: 0.5,
			light: 1,
			compact: 1.5,
			xxl: 0.5,
			clan_xxl: 0.5,
			ice: 2,
			cell: 1.5,
			fission: 5,
			primitive: 1.5
		}
	},
	{
		name: "45",
		rating: 45,
		weight: {
			standard: 1,
			xl: 0.5,
			clan_xl: 0.5,
			light: 1,
			compact: 1.5,
			xxl: 0.5,
			clan_xxl: 0.5,
			ice: 2,
			cell: 1.5,
			fission: 5,
			primitive: 1.5
		}
	},
	{
		name: "50",
		rating: 50,
		weight: {
			standard: 1.5,
			xl: 1,
			clan_xl: 1,
			light: 1.5,
			compact: 2.5,
			xxl: 0.5,
			clan_xxl: 0.5,
			ice: 3,
			cell: 2,
			fission: 5,
			primitive: 1.5
		}
	},
	{
		name: "55",
		rating: 55,
		weight: {
			standard: 1.5,
			xl: 1,
			clan_xl: 1,
			light: 1.5,
			compact: 2.5,
			xxl: 0.5,
			clan_xxl: 0.5,
			ice: 3,
			cell: 2,
			fission: 5,
			primitive: 2
		}
	},
	{
		name: "60",
		rating: 60,
		weight: {
			standard: 1.5,
			xl: 1,
			clan_xl: 1,
			light: 1.5,
			compact: 2.5,
			xxl: 0.5,
			clan_xxl: 0.5,
			ice: 3,
			cell: 2,
			fission: 5,
			primitive: 2
		}
	},
	{
		name: "65",
		rating: 65,
		weight: {
			standard: 2,
			xl: 1,
			clan_xl: 1,
			light: 1.5,
			compact: 3,
			xxl: 1,
			clan_xxl: 1,
			ice: 4,
			cell: 2.5,
			fission: 5,
			primitive: 2.5
		}
	},
	{
		name: "70",
		rating: 70,
		weight: {
			standard: 2,
			xl: 1,
			clan_xl: 1,
			light: 1.5,
			compact: 3,
			xxl: 1,
			clan_xxl: 1,
			ice: 4,
			cell: 2.5,
			fission: 5,
			primitive: 2.5
		}
	},
	{
		name: "75",
		rating: 75,
		weight: {
			standard: 2,
			xl: 1,
			clan_xl: 1,
			light: 1.5,
			compact: 3,
			xxl: 1,
			clan_xxl: 1,
			ice: 4,
			cell: 2.5,
			fission: 5,
			primitive: 3
		}
	},
	{
		name: "80",
		rating: 80,
		weight: {
			standard: 2.5,
			xl: 1.5,
			clan_xl: 1.5,
			light: 2,
			compact: 4,
			xxl: 1,
			clan_xxl: 1,
			ice: 5,
			cell: 3,
			fission: 5,
			primitive: 3
		}
	},
	{
		name: "85",
		rating: 85,
		weight: {
			standard: 2.5,
			xl: 1.5,
			clan_xl: 1.5,
			light: 2,
			compact: 4,
			xxl: 1,
			clan_xxl: 1,
			ice: 5,
			cell: 3,
			fission: 5,
			primitive: 3.5
		}
	},
	{
		name: "90",
		rating: 90,
		weight: {
			standard: 3,
			xl: 1.5,
			clan_xl: 1.5,
			light: 2.5,
			compact: 4.5,
			xxl: 1,
			clan_xxl: 1,
			ice: 6,
			cell: 4,
			fission: 5.5,
			primitive: 3.5
		}
	},
	{
		name: "95",
		rating: 95,
		weight: {
			standard: 3,
			xl: 1.5,
			clan_xl: 1.5,
			light: 2.5,
			compact: 4.5,
			xxl: 1,
			clan_xxl: 1,
			ice: 6,
			cell: 4,
			fission: 5.5,
			primitive: 4
		}
	},
	{
		name: "100",
		rating: 100,
		weight: {
			standard: 3,
			xl: 1.5,
			clan_xl: 1.5,
			light: 2.5,
			compact: 4.5,
			xxl: 1,
			clan_xxl: 1,
			ice: 6,
			cell: 4,
			fission: 5.5,
			primitive: 4
		}
	},
	{
		name: "105",
		rating: 105,
		weight: {
			standard: 3.5,
			xl: 2,
			clan_xl: 2,
			light: 3,
			compact: 5.5,
			xxl: 1.5,
			clan_xxl: 1.5,
			ice: 7,
			cell: 4.5,
			fission: 6.5,
			primitive: 4.5
		}
	},
	{
		name: "110",
		rating: 110,
		weight: {
			standard: 3.5,
			xl: 2,
			clan_xl: 2,
			light: 3,
			compact: 5.5,
			xxl: 1.5,
			clan_xxl: 1.5,
			ice: 7,
			cell: 4.5,
			fission: 6.5,
			primitive: 4.5
		}
	},
	{
		name: "115",
		rating: 115,
		weight: {
			standard: 4,
			xl: 2,
			clan_xl: 2,
			light: 3,
			compact: 6,
			xxl: 1.5,
			clan_xxl: 1.5,
			ice: 8,
			cell: 5,
			fission: 7,
			primitive: 5
		}
	},
	{
		name: "120",
		rating: 120,
		weight: {
			standard: 4,
			xl: 2,
			clan_xl: 2,
			light: 3,
			compact: 6,
			xxl: 1.5,
			clan_xxl: 1.5,
			ice: 8,
			cell: 5,
			fission: 7,
			primitive: 5
		}
	},
	{
		name: "125",
		rating: 125,
		weight: {
			standard: 4,
			xl: 2,
			clan_xl: 2,
			light: 3,
			compact: 6,
			xxl: 1.5,
			clan_xxl: 1.5,
			ice: 8,
			cell: 5,
			fission: 7,
			primitive: 5.5
		}
	},
	{
		name: "130",
		rating: 130,
		weight: {
			standard: 4.5,
			xl: 2.5,
			clan_xl: 2.5,
			light: 3.5,
			compact: 7,
			xxl: 1.5,
			clan_xxl: 1.5,
			ice: 9,
			cell: 5.5,
			fission: 8,
			primitive: 6
		}
	},
	{
		name: "135",
		rating: 135,
		weight: {
			standard: 4.5,
			xl: 2.5,
			clan_xl: 2.5,
			light: 3.5,
			compact: 7,
			xxl: 1.5,
			clan_xxl: 1.5,
			ice: 9,
			cell: 5.5,
			fission: 8,
			primitive: 6
		}
	},
	{
		name: "140",
		rating: 140,
		weight: {
			standard: 5,
			xl: 2.5,
			clan_xl: 2.5,
			light: 4,
			compact: 7.5,
			xxl: 2,
			clan_xxl: 2,
			ice: 10,
			cell: 6,
			fission: 9,
			primitive: 6
		}
	},
	{
		name: "145",
		rating: 145,
		weight: {
			standard: 5,
			xl: 2.5,
			clan_xl: 2.5,
			light: 4,
			compact: 7.5,
			xxl: 2,
			clan_xxl: 2,
			ice: 10,
			cell: 6,
			fission: 9,
			primitive: 7
		}
	},
	{
		name: "150",
		rating: 150,
		weight: {
			standard: 5.5,
			xl: 3,
			clan_xl: 3,
			light: 4.5,
			compact: 8.5,
			xxl: 2,
			clan_xxl: 2,
			ice: 11,
			cell: 7,
			fission: 10,
			primitive: 7
		}
	},
	{
		name: "155",
		rating: 155,
		weight: {
			standard: 5.5,
			xl: 3,
			clan_xl: 3,
			light: 4.5,
			compact: 8.5,
			xxl: 2,
			clan_xxl: 2,
			ice: 11,
			cell: 7,
			fission: 10,
			primitive: 7.5
		}
	},
	{
		name: "160",
		rating: 160,
		weight: {
			standard: 6,
			xl: 3,
			clan_xl: 3,
			light: 4.5,
			compact: 9,
			xxl: 2,
			clan_xxl: 2,
			ice: 12,
			cell: 7.5,
			fission: 10.5,
			primitive: 8
		}
	},
	{
		name: "165",
		rating: 165,
		weight: {
			standard: 6,
			xl: 3,
			clan_xl: 3,
			light: 4.5,
			compact: 9,
			xxl: 2,
			clan_xxl: 2,
			ice: 12,
			cell: 7.5,
			fission: 10.5,
			primitive: 8.5
		}
	},
	{
		name: "170",
		rating: 170,
		weight: {
			standard: 6,
			xl: 3,
			clan_xl: 3,
			light: 4.5,
			compact: 9,
			xxl: 2,
			clan_xxl: 2,
			ice: 12,
			cell: 7.5,
			fission: 10.5,
			primitive: 8.5
		}
	},
	{
		name: "175",
		rating: 175,
		weight: {
			standard: 7,
			xl: 3.5,
			clan_xl: 3.5,
			light: 5.5,
			compact: 10.5,
			xxl: 2.5,
			clan_xxl: 2.5,
			ice: 14,
			cell: 8.5,
			fission: 12.5,
			primitive: 9
		}
	},
	{
		name: "180",
		rating: 180,
		weight: {
			standard: 7,
			xl: 3.5,
			clan_xl: 3.5,
			light: 5.5,
			compact: 10.5,
			xxl: 2.5,
			clan_xxl: 2.5,
			ice: 14,
			cell: 8.5,
			fission: 12.5,
			primitive: 10
		}
	},
	{
		name: "185",
		rating: 185,
		weight: {
			standard: 7.5,
			xl: 4,
			clan_xl: 4,
			light: 6,
			compact: 11.5,
			xxl: 2.5,
			clan_xxl: 2.5,
			ice: 15,
			cell: 9,
			fission: 13.5,
			primitive: 10
		}
	},
	{
		name: "190",
		rating: 190,
		weight: {
			standard: 7.5,
			xl: 4,
			clan_xl: 4,
			light: 6,
			compact: 11.5,
			xxl: 2.5,
			clan_xxl: 2.5,
			ice: 15,
			cell: 9,
			fission: 13.5,
			primitive: 10.5
		}
	},
	{
		name: "195",
		rating: 195,
		weight: {
			standard: 8,
			xl: 4,
			clan_xl: 4,
			light: 6,
			compact: 12,
			xxl: 3,
			clan_xxl: 3,
			ice: 16,
			cell: 10,
			fission: 14,
			primitive: 11
		}
	},
	{
		name: "200",
		rating: 200,
		weight: {
			standard: 8.5,
			xl: 4.5,
			clan_xl: 4.5,
			light: 6.5,
			compact: 13,
			xxl: 3,
			clan_xxl: 3,
			ice: 17,
			cell: 10.5,
			fission: 15,
			primitive: 11.5
		}
	},
	{
		name: "205",
		rating: 205,
		weight: {
			standard: 8.5,
			xl: 4.5,
			clan_xl: 4.5,
			light: 6.5,
			compact: 13,
			xxl: 3,
			clan_xxl: 3,
			ice: 17,
			cell: 10.5,
			fission: 15,
			primitive: 12.5
		}
	},
	{
		name: "210",
		rating: 210,
		weight: {
			standard: 9,
			xl: 4.5,
			clan_xl: 4.5,
			light: 7,
			compact: 13.5,
			xxl: 3,
			clan_xxl: 3,
			ice: 18,
			cell: 11,
			fission: 16,
			primitive: 13
		}
	},
	{
		name: "215",
		rating: 215,
		weight: {
			standard: 9.5,
			xl: 5,
			clan_xl: 5,
			light: 7.5,
			compact: 14.5,
			xxl: 3.5,
			clan_xxl: 3.5,
			ice: 19,
			cell: 11.5,
			fission: 17,
			primitive: 13.5
		}
	},
	{
		name: "220",
		rating: 220,
		weight: {
			standard: 10,
			xl: 5,
			clan_xl: 5,
			light: 7.5,
			compact: 15,
			xxl: 3.5,
			clan_xxl: 3.5,
			ice: 20,
			cell: 12,
			fission: 17.5,
			primitive: 14
		}
	},
	{
		name: "225",
		rating: 225,
		weight: {
			standard: 10,
			xl: 5,
			clan_xl: 5,
			light: 7.5,
			compact: 15,
			xxl: 3.5,
			clan_xxl: 3.5,
			ice: 20,
			cell: 12,
			fission: 17.5,
			primitive: 14.5
		}
	},
	{
		name: "230",
		rating: 230,
		weight: {
			standard: 10.5,
			xl: 5.5,
			clan_xl: 5.5,
			light: 8,
			compact: 16,
			xxl: 3.5,
			clan_xxl: 3.5,
			ice: 21,
			cell: 13,
			fission: 18.5,
			primitive: 16
		}
	},
	{
		name: "235",
		rating: 235,
		weight: {
			standard: 11,
			xl: 5.5,
			clan_xl: 5.5,
			light: 8.5,
			compact: 16.5,
			xxl: 4,
			clan_xxl: 4,
			ice: 22,
			cell: 13.5,
			fission: 19.5,
			primitive: 16.5
		}
	},
	{
		name: "240",
		rating: 240,
		weight: {
			standard: 11.5,
			xl: 6,
			clan_xl: 6,
			light: 9,
			compact: 17.5,
			xxl: 4,
			clan_xxl: 4,
			ice: 23,
			cell: 14,
			fission: 20.5,
			primitive: 17.5
		}
	},
	{
		name: "245",
		rating: 245,
		weight: {
			standard: 12,
			xl: 6,
			clan_xl: 6,
			light: 9,
			compact: 18,
			xxl: 4,
			clan_xxl: 4,
			ice: 24,
			cell: 14.5,
			fission: 21,
			primitive: 18
		}
	},
	{
		name: "250",
		rating: 250,
		weight: {
			standard: 12.5,
			xl: 6.5,
			clan_xl: 6.5,
			light: 9.5,
			compact: 19,
			xxl: 4.5,
			clan_xxl: 4.5,
			ice: 25,
			cell: 15,
			fission: 22,
			primitive: 19
		}
	},
	{
		name: "255",
		rating: 255,
		weight: {
			standard: 13,
			xl: 6.5,
			clan_xl: 6.5,
			light: 10,
			compact: 19.5,
			xxl: 4.5,
			clan_xxl: 4.5,
			ice: 26,
			cell: 16,
			fission: 23,
			primitive: 20.5
		}
	},
	{
		name: "260",
		rating: 260,
		weight: {
			standard: 13.5,
			xl: 7,
			clan_xl: 7,
			light: 10.5,
			compact: 20.5,
			xxl: 4.5,
			clan_xxl: 4.5,
			ice: 27,
			cell: 16.5,
			fission: 24,
			primitive: 21.5
		}
	},
	{
		name: "265",
		rating: 265,
		weight: {
			standard: 14,
			xl: 7,
			clan_xl: 7,
			light: 10.5,
			compact: 21,
			xxl: 5,
			clan_xxl: 5,
			ice: 28,
			cell: 17,
			fission: 24.5,
			primitive: 22.5
		}
	},
	{
		name: "270",
		rating: 270,
		weight: {
			standard: 14.5,
			xl: 7.5,
			clan_xl: 7.5,
			light: 11,
			compact: 22,
			xxl: 5,
			clan_xxl: 5,
			ice: 29,
			cell: 17.5,
			fission: 25.5,
			primitive: 23.5
		}
	},
	{
		name: "275",
		rating: 275,
		weight: {
			standard: 15.5,
			xl: 8,
			clan_xl: 8,
			light: 12,
			compact: 23.5,
			xxl: 5.5,
			clan_xxl: 5.5,
			ice: 31,
			cell: 19,
			fission: 27.5,
			primitive: 24.5
		}
	},
	{
		name: "280",
		rating: 280,
		weight: {
			standard: 16,
			xl: 8,
			clan_xl: 8,
			light: 12,
			compact: 24,
			xxl: 5.5,
			clan_xxl: 5.5,
			ice: 32,
			cell: 19.5,
			fission: 28,
			primitive: 27
		}
	},
	{
		name: "285",
		rating: 285,
		weight: {
			standard: 16.5,
			xl: 8.5,
			clan_xl: 8.5,
			light: 12.5,
			compact: 25,
			xxl: 5.5,
			clan_xxl: 5.5,
			ice: 33,
			cell: 20,
			fission: 29,
			primitive: 28.5
		}
	},
	{
		name: "290",
		rating: 290,
		weight: {
			standard: 17.5,
			xl: 9,
			clan_xl: 9,
			light: 13.5,
			compact: 26.5,
			xxl: 6,
			clan_xxl: 6,
			ice: 35,
			cell: 21,
			fission: 31,
			primitive: 29.5
		}
	},
	{
		name: "295",
		rating: 295,
		weight: {
			standard: 18,
			xl: 9,
			clan_xl: 9,
			light: 13.5,
			compact: 27,
			xxl: 6,
			clan_xxl: 6,
			ice: 36,
			cell: 22,
			fission: 31.5,
			primitive: 31.5
		}
	},
	{
		name: "300",
		rating: 300,
		weight: {
			standard: 19,
			xl: 9.5,
			clan_xl: 9.5,
			light: 14.5,
			compact: 28.5,
			xxl: 6.5,
			clan_xxl: 6.5,
			ice: 38,
			cell: 23,
			fission: 33.5,
			primitive: 33
		}
	},
	{
		name: "305",
		rating: 305,
		weight: {
			standard: 19.5,
			xl: 10,
			clan_xl: 10,
			light: 15,
			compact: 29.5,
			xxl: 6.5,
			clan_xxl: 6.5,
			ice: 39,
			cell: 23.5,
			fission: 34.5,
			primitive: 36.5
		}
	},
	{
		name: "310",
		rating: 310,
		weight: {
			standard: 20.5,
			xl: 10.5,
			clan_xl: 10.5,
			light: 15.5,
			compact: 31,
			xxl: 7,
			clan_xxl: 7,
			ice: 41,
			cell: 25,
			fission: 36,
			primitive: 38.5
		}
	},
	{
		name: "315",
		rating: 315,
		weight: {
			standard: 21.5,
			xl: 11,
			clan_xl: 11,
			light: 16.5,
			compact: 32.5,
			xxl: 7.5,
			clan_xxl: 7.5,
			ice: 43,
			cell: 26,
			fission: 38,
			primitive: 41
		}
	},
	{
		name: "320",
		rating: 320,
		weight: {
			standard: 22.5,
			xl: 11.5,
			clan_xl: 11.5,
			light: 17,
			compact: 34,
			xxl: 7.5,
			clan_xxl: 7.5,
			ice: 45,
			cell: 27,
			fission: 39.5,
			primitive: 43.5
		}
	},
	{
		name: "325",
		rating: 325,
		weight: {
			standard: 23.5,
			xl: 12,
			clan_xl: 12,
			light: 18,
			compact: 35.5,
			xxl: 8,
			clan_xxl: 8,
			ice: 47,
			cell: 28.5,
			fission: 41.5,
			primitive: 46
		}
	},
	{
		name: "330",
		rating: 330,
		weight: {
			standard: 24.5,
			xl: 12.5,
			clan_xl: 12.5,
			light: 18.5,
			compact: 37,
			xxl: 8.5,
			clan_xxl: 8.5,
			ice: 49,
			cell: 29.5,
			fission: 43,
			primitive: 52.5
		}
	},
	{
		name: "335",
		rating: 335,
		weight: {
			standard: 25.5,
			xl: 13,
			clan_xl: 13,
			light: 19.5,
			compact: 38.5,
			xxl: 8.5,
			clan_xxl: 8.5,
			ice: 51,
			cell: 31,
			fission: 45
		}
	},
	{
		name: "340",
		rating: 340,
		weight: {
			standard: 27,
			xl: 13.5,
			clan_xl: 13.5,
			light: 20.5,
			compact: 40.5,
			xxl: 9,
			clan_xxl: 9,
			ice: 54,
			cell: 32.5,
			fission: 47.5
		}
	},
	{
		name: "345",
		rating: 345,
		weight: {
			standard: 28.5,
			xl: 14.5,
			clan_xl: 14.5,
			light: 21.5,
			compact: 43,
			xxl: 9.5,
			clan_xxl: 9.5,
			ice: 57,
			cell: 34.5,
			fission: 50
		}
	},
	{
		name: "350",
		rating: 350,
		weight: {
			standard: 29.5,
			xl: 15,
			clan_xl: 15,
			light: 22.5,
			compact: 44.5,
			xxl: 10,
			clan_xxl: 10,
			ice: 59,
			cell: 35.5,
			fission: 52
		}
	},
	{
		name: "355",
		rating: 355,
		weight: {
			standard: 31.5,
			xl: 16,
			clan_xl: 16,
			light: 24,
			compact: 47.5,
			xxl: 10.5,
			clan_xxl: 10.5,
			ice: 63,
			cell: 38,
			fission: 55.5
		}
	},
	{
		name: "360",
		rating: 360,
		weight: {
			standard: 33,
			xl: 16.5,
			clan_xl: 16.5,
			light: 25,
			compact: 49.5,
			xxl: 11,
			clan_xxl: 11,
			ice: 66,
			cell: 40,
			fission: 58
		}
	},
	{
		name: "365",
		rating: 365,
		weight: {
			standard: 34.5,
			xl: 17.5,
			clan_xl: 17.5,
			light: 26,
			compact: 52,
			xxl: 11.5,
			clan_xxl: 11.5,
			ice: 69,
			cell: 41.5,
			fission: 60.5
		}
	},
	{
		name: "370",
		rating: 370,
		weight: {
			standard: 36.5,
			xl: 18.5,
			clan_xl: 18.5,
			light: 27.5,
			compact: 55,
			xxl: 12.5,
			clan_xxl: 12.5,
			ice: 73,
			cell: 44,
			fission: 64
		}
	},
	{
		name: "375",
		rating: 375,
		weight: {
			standard: 38.5,
			xl: 19.5,
			clan_xl: 19.5,
			light: 29,
			compact: 58,
			xxl: 13,
			clan_xxl: 13,
			ice: 77,
			cell: 46.5,
			fission: 67.5
		}
	},
	{
		name: "380",
		rating: 380,
		weight: {
			standard: 41,
			xl: 20.5,
			clan_xl: 20.5,
			light: 31,
			compact: 61.5,
			xxl: 14,
			clan_xxl: 14,
			ice: 82,
			cell: 49.5,
			fission: 72
		}
	},
	{
		name: "385",
		rating: 385,
		weight: {
			standard: 43.5,
			xl: 22,
			clan_xl: 22,
			light: 33,
			compact: 65.5,
			xxl: 14.5,
			clan_xxl: 14.5,
			ice: 87,
			cell: 52.5,
			fission: 76.5
		}
	},
	{
		name: "390",
		rating: 390,
		weight: {
			standard: 46,
			xl: 23,
			clan_xl: 23,
			light: 34.5,
			compact: 69,
			xxl: 15.5,
			clan_xxl: 15.5,
			ice: 92,
			cell: 55.5,
			fission: 80.5
		}
	},
	{
		name: "395",
		rating: 395,
		weight: {
			standard: 49,
			xl: 24.5,
			clan_xl: 24.5,
			light: 37,
			compact: 73.5,
			xxl: 16.5,
			clan_xxl: 16.5,
			ice: 98,
			cell: 59,
			fission: 86
		}
	},
	{
		name: "400",
		rating: 400,
		weight: {
			standard: 52.5,
			xl: 26.5,
			clan_xl: 26.5,
			light: 39.5,
			compact: 79,
			xxl: 17.5,
			clan_xxl: 17.5,
			ice: 105,
			cell: 63,
			fission: 92
		}
	},
	{
		name: "405",
		rating: 405,
		weight: {
			standard: 56.5,
			xl: 28.5,
			clan_xl: 28.5,
			light: 42.5,
			xxl: 19,
			clan_xxl: 19,
			ice: 113
		}
	},
	{
		name: "410",
		rating: 410,
		weight: {
			standard: 61,
			xl: 30.5,
			clan_xl: 30.5,
			light: 46,
			xxl: 20.5,
			clan_xxl: 20.5,
			ice: 122
		}
	},
	{
		name: "415",
		rating: 415,
		weight: {
			standard: 66.5,
			xl: 33.5,
			clan_xl: 33.5,
			light: 50,
			xxl: 22.5,
			clan_xxl: 22.5,
			ice: 133
		}
	},
	{
		name: "420",
		rating: 420,
		weight: {
			standard: 72.5,
			xl: 36.5,
			clan_xl: 36.5,
			light: 54.5,
			xxl: 24.5,
			clan_xxl: 24.5,
			ice: 145
		}
	},
	{
		name: "425",
		rating: 425,
		weight: {
			standard: 79.5,
			xl: 40,
			clan_xl: 40,
			light: 60,
			xxl: 26.5,
			clan_xxl: 26.5,
			ice: 159
		}
	},
	{
		name: "430",
		rating: 430,
		weight: {
			standard: 87.5,
			xl: 44,
			clan_xl: 44,
			light: 66,
			xxl: 29.5,
			clan_xxl: 29.5,
			ice: 175
		}
	},
	{
		name: "435",
		rating: 435,
		weight: {
			standard: 97,
			xl: 48.5,
			clan_xl: 48.5,
			light: 73,
			xxl: 32.5,
			clan_xxl: 32.5,
			ice: 194
		}
	},
	{
		name: "440",
		rating: 440,
		weight: {
			standard: 107.5,
			xl: 54,
			clan_xl: 54,
			light: 81,
			xxl: 36,
			clan_xxl: 36,
			ice: 215
		}
	},
	{
		name: "445",
		rating: 445,
		weight: {
			standard: 119.5,
			xl: 60,
			clan_xl: 60,
			light: 90,
			xxl: 40,
			clan_xxl: 40,
			ice: 239
		}
	},
	{
		name: "450",
		rating: 450,
		weight: {
			standard: 133.5,
			xl: 67,
			clan_xl: 67,
			light: 100.5,
			xxl: 44.5,
			clan_xxl: 44.5,
			ice: 267
		}
	},
	{
		name: "455",
		rating: 455,
		weight: {
			standard: 150,
			xl: 75,
			clan_xl: 75,
			light: 112.5,
			xxl: 50,
			clan_xxl: 50,
			ice: 300
		}
	},
	{
		name: "460",
		rating: 460,
		weight: {
			standard: 168.5,
			xl: 84.5,
			clan_xl: 84.5,
			light: 126.5,
			xxl: 56.5,
			clan_xxl: 56.5,
			ice: 337
		}
	},
	{
		name: "465",
		rating: 465,
		weight: {
			standard: 190,
			xl: 95,
			clan_xl: 95,
			light: 142.5,
			xxl: 63.5,
			clan_xxl: 63.5,
			ice: 380
		}
	},
	{
		name: "470",
		rating: 470,
		weight: {
			standard: 214.5,
			xl: 107.5,
			clan_xl: 107.5,
			light: 161,
			xxl: 71.5,
			clan_xxl: 71.5,
			ice: 429
		}
	},
	{
		name: "475",
		rating: 475,
		weight: {
			standard: 243,
			xl: 121.5,
			clan_xl: 121.5,
			light: 182.5,
			xxl: 81,
			clan_xxl: 81,
			ice: 486
		}
	},
	{
		name: "480",
		rating: 480,
		weight: {
			standard: 275.5,
			xl: 138,
			clan_xl: 138,
			light: 207,
			xxl: 92,
			clan_xxl: 92,
			ice: 551
		}
	},
	{
		name: "485",
		rating: 485,
		weight: {
			standard: 313,
			xl: 156.5,
			clan_xl: 156.5,
			light: 235,
			xxl: 104.5,
			clan_xxl: 104.5,
			ice: 626
		}
	},
	{
		name: "490",
		rating: 490,
		weight: {
			standard: 356,
			xl: 178,
			clan_xl: 178,
			light: 267,
			xxl: 119,
			clan_xxl: 119,
			ice: 712
		}
	},
	{
		name: "495",
		rating: 495,
		weight: {
			standard: 405.5,
			xl: 203,
			clan_xl: 203,
			light: 304.5,
			xxl: 135.5,
			clan_xxl: 135.5,
			ice: 811
		}
	},
	{
		name: "500",
		rating: 500,
		weight: {
			standard: 462.5,
			xl: 231.5,
			clan_xl: 231.5,
			light: 347,
			xxl: 154.5,
			clan_xxl: 154.5,
			ice: 925
		}
	}
];
