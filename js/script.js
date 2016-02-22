var available_languages = [];

baseApp = angular.module(
	'baseApp',
	['ngRoute', 'ngResource', 'ngSanitize','pascalprecht.translate'],
	[
		'$routeProvider',
		'$translateProvider',
		function ($routeProvider, $translateProvider, $scope, $http) {

			for( lang_count = 0; lang_count < available_languages.length; lang_count++) {
				if( available_languages[lang_count].active ) {
					$translateProvider.translations(
						available_languages[lang_count].short_code ,
						available_languages[lang_count].translations
					);
				}
			}

			$translateProvider.useSanitizeValueStrategy('sanitize');

			preferred_language = "en-US";
			if( localStorage && localStorage["tmp.preferred_language"] ) {
				preferred_language = localStorage["tmp.preferred_language"];
			} else {
				localStorage["tmp.preferred_language"] = "en-US";
			}
			$translateProvider.preferredLanguage(preferred_language);

			$routeProvider

			// route for the home/welcome page
			.when('/', {
				templateUrl : 'pages/welcome.html',
				controller  : 'welcomeController'
			})

			// route for the credits page
			.when('/credits', {
				templateUrl : 'pages/credits.html',
				controller  : 'creditsController'
			})

			// route for the battlemech creator page
			.when('/battlemech-creator/', {
				templateUrl : 'pages/battlemech-creator-welcome.html',
				controller  : 'battlemechCreatorControllerWelcome'
			})

			// route for the battlemech creator page
			.when('/battlemech-creator-step1/', {
				templateUrl : 'pages/battlemech-creator-step1.html',
				controller  : 'battlemechCreatorControllerStep1'
			})

			// route for the battlemech creator page
			.when('/battlemech-creator-step2/', {
				templateUrl : 'pages/battlemech-creator-step2.html',
				controller  : 'battlemechCreatorControllerStep2'
			})
			// route for the battlemech creator page
			.when('/battlemech-creator-step3/', {
				templateUrl : 'pages/battlemech-creator-step3.html',
				controller  : 'battlemechCreatorControllerStep3'
			})
			// route for the battlemech creator page
			.when('/battlemech-creator-step4/', {
				templateUrl : 'pages/battlemech-creator-step4.html',
				controller  : 'battlemechCreatorControllerStep4'
			})
			// route for the battlemech creator page
			.when('/battlemech-creator-step5/', {
				templateUrl : 'pages/battlemech-creator-step5.html',
				controller  : 'battlemechCreatorControllerStep5'
			})
			// route for the battlemech creator page
			.when('/battlemech-creator-step6/', {
				templateUrl : 'pages/battlemech-creator-step6.html',
				controller  : 'battlemechCreatorControllerStep6'
			})
			// route for the battlemech creator page
			.when('/battlemech-creator-summary/', {
				templateUrl : 'pages/battlemech-creator-summary.html',
				controller  : 'battlemechCreatorControllerSummary'
			})


			;
		}
	]
);


angular.module('baseApp').controller(
	'select_language',
	[
		'$translate',
		'$scope',
		'$route',
		function ($translate, $scope, $route) {

			$scope.change_language = function (key) {
				$translate.use(key);
				localStorage["tmp.preferred_language"] = key;
				$route.reload();
			};

		}
	]
);


function update_mech_status_bar_and_tro($scope, $translate, current_mech) {
	$translate(
		[
			'BM_REMAINING_TONS', 'BM_UNALLOCATED_ARMOR'
		]
	).then(function (translation) {
		$scope.mech_status_bar = "<strong>" + translation.BM_REMAINING_TONS + "</strong>: " + current_mech.getRemainingTonnage() + " | <strong>" + translation.BM_UNALLOCATED_ARMOR + "</strong>: " + current_mech.getUnallocatedArmor();

		$scope.mech_summary_html = current_mech.makeTROHTML();
	});

}



function generateUUID(){
    var d = new Date().getTime();
    if(window.performance && typeof window.performance.now === "function"){
        d += performance.now(); //use high-precision timer if available
    }
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
}

var btEraOptions = Array(
	{
		id: 1,
		name: {
			'en-US': "Age of War/Star League",
			'de-DE': "de - Age of War/Star League"
		},
		year_start: 2400,
		year_end: 2780,
	},
	{
		id: 2,
		name: {
			'en-US': "Succession Wars",
			'de-DE': "de - Succession Wars"
		},
		year_start: 2781,
		year_end: 3049,
	}/*,,
	{
		id: 3,
		name: {
			'en-US': "Clan Invasion",
			'de-DE': "de - Clan Invasion"
		},
		year_start: 3050,
		year_end: 3085,
	}

	{
		id: 4,
		name: {
			'en-US': "Dark Ages",
			'de-DE': "de - Dark Ages"
		},
		year_start: 3085,
		year_end: 4000,
	}
	*/
);
battlemechLocations = Array(
	{
		tag: "hd",
		rear: true,
		name: {
			"en-US": "Head",
			"de-DE": "de-Head",
		},
		abbr: {
			"en-US": "hd",
			"de-DE": "de-hd",
		}
	},
	{
		tag: "hdr",
		rear: true,
		name: {
			"en-US": "Head (Rear)",
			"de-DE": "de-Head (Rear)",
		},
		abbr: {
			"en-US": "hd(r)",
			"de-DE": "de-hd(r)",
		}
	},
	{
		tag: "rt",
		rear: false,
		name: {
			"en-US": "Right Torso",
			"de-DE": "de-Right Torso",
		},
		abbr: {
			"en-US": "rt",
			"de-DE": "de-rt",
		}
	},
	{
		tag: "ct",
		rear: false,
		name: {
			"en-US": "Center Torso",
			"de-DE": "de-Center Torso",
		},
		abbr: {
			"en-US": "ct",
			"de-DE": "de-ct",
		}
	},
	{
		tag: "lt",
		rear: false,
		name: {
			"en-US": "Left Torso",
			"de-DE": "de-Left Torso",
		},
		abbr: {
			"en-US": "lt",
			"de-DE": "de-lt",
		}
	},
	{
		tag: "rtr",
		rear: true,
		name: {
			"en-US": "Right Torso (Rear)",
			"de-DE": "de-Right Torso (Rear)",
		},
		abbr: {
			"en-US": "rt(r)",
			"de-DE": "de-rt(r)",
		}
	},
	{
		tag: "ctr",
		rear: true,
		name: {
			"en-US": "Center Torso (Rear)",
			"de-DE": "de-Center Torso (Rear)",
		},
		abbr: {
			"en-US": "ct(r)",
			"de-DE": "de-ct(r)",
		}
	},
	{
		tag: "ltr",
		rear: true,
		name: {
			"en-US": "Left Torso (Rear)",
			"de-DE": "de-Left Torso (Rear)",
		},
		abbr: {
			"en-US": "lt(r)",
			"de-DE": "de-lt(r)",
		}
	},
	{
		tag: "ra",
		rear: false,
		name: {
			"en-US": "Right Arm",
			"de-DE": "de-Right Arm",
		},
		abbr: {
			"en-US": "ra",
			"de-DE": "de-ra",
		}
	},
	{
		tag: "la",
		rear: false,
		name: {
			"en-US": "Left Arm",
			"de-DE": "de-Left Arm",
		},
		abbr: {
			"en-US": "la",
			"de-DE": "de-la",
		}
	},
	{
		tag: "rl",
		rear: false,
		name: {
			"en-US": "Right Leg",
			"de-DE": "de-Right Leg",
		},
		abbr: {
			"en-US": "rl",
			"de-DE": "de-rl",
		}
	},
	{
		tag: "ll",
		rear: false,
		name: {
			"en-US": "Left Leg",
			"de-DE": "de-Left Leg",
		},
		abbr: {
			"en-US": "ll",
			"de-DE": "de-ll",
		}
	}
);
var mechClanEquipment = Array(
);
var mechEngineOptions = Array(
	{
		name: "10",
		rating: 10,
		weight: {
			ice: 1.0,
			cell: 1.0,
			fission: 5,
			comp: 1,
			standard: 0.5,
			light: 0.5,
			xl: 0.5
		}
	},
	{
		name: "15",
		rating: 15,
		weight: {
			ice: 1.0,
			cell: 1.0,
			fission: 5,
			comp: 1,
			standard: 0.5,
			light: 0.5,
			xl: 0.5
		}
	},
	{
		name: "20",
		rating: 20,
		weight: {
			ice: 1.0,
			cell: 1.0,
			fission: 5,
			comp: 1,
			standard: 0.5,
			light: 0.5,
			xl: 0.5
		}
	},
	{
		name: "25",
		rating: 25,
		weight: {
			ice: 1.0,
			cell: 1.0,
			fission: 5,
			comp: 1,
			standard: 0.5,
			light: 0.5,
			xl: 0.5
		}
	},
	{
		name: "30",
		rating: 30,
		weight: {
			ice: 2.0,
			cell: 1.5,
			fission: 5,
			comp: 1.5,
			standard: 1,
			light: 1,
			xl: 0.5
		}
	},
	{
		name: "35",
		rating: 35,
		weight: {
			ice: 2,
			cell: 1.5,
			fission: 5,
			comp: 1.5,
			standard: 1,
			light: 1,
			xl: 0.5
		}
	},
	{
		name: "40",
		rating: 40,
		weight: {
			ice: 2,
			cell: 1.5,
			fission: 5,
			comp: 1.5,
			standard: 1,
			light: 1,
			xl: 0.5
		}
	},
	{
		name: "45",
		rating: 45,
		weight: {
			ice: 2,
			cell: 1.5,
			fission: 5,
			comp: 1.5,
			standard: 1,
			light: 1,
			xl: 0.5
		}
	},
	{
		name: "50",
		rating: 50,
		weight: {
			ice: 3,
			cell: 2,
			fission: 5,
			comp: 2.5,
			standard: 1.5,
			light: 1.5,
			xl: 1
		}
	},
	{
		name: "55",
		rating: 55,
		weight: {
			ice: 3,
			cell: 2,
			fission: 5,
			comp: 2.5,
			standard: 1.5,
			light: 1.5,
			xl: 1
		}
	},
	{
		name: "60",
		rating: 60,
		weight: {
			ice: 3,
			cell: 2,
			fission: 5,
			comp: 2.5,
			standard: 1.5,
			light: 1.5,
			xl: 1
		}
	},
	{
		name: "65",
		rating: 65,
		weight: {
			ice: 4,
			cell: 2.5,
			fission: 5,
			comp: 3,
			standard: 2,
			light: 1.5,
			xl: 1
		}
	},
	{
		name: "70",
		rating: 70,
		weight: {
			ice: 4,
			cell: 2.5,
			fission: 5,
			comp: 3,
			standard: 2,
			light: 1.5,
			xl: 1
		}
	},
	{
		name: "75",
		rating: 75,
		weight: {
			ice: 4,
			cell: 2.5,
			fission: 5,
			comp: 3,
			standard: 2,
			light: 1.5,
			xl: 1
		}
	},
	{
		name: "80",
		rating: 80,
		weight: {
			ice: 5,
			cell: 3,
			fission: 5,
			comp: 4,
			standard: 2.5,
			light: 2,
			xl: 1.5
		}
	},
	{
		name: "85",
		rating: 85,
		weight: {
			ice: 5,
			cell: 3,
			fission: 5,
			comp: 4,
			standard: 2.5,
			light: 2,
			xl: 1.5
		}
	},
	{
		name: "90",
		rating: 90,
		weight: {
			ice: 6,
			cell: 4,
			fission: 5.5,
			comp: 4.5,
			standard: 3,
			light: 2.5,
			xl: 1.5
		}
	},
	{
		name: "95",
		rating: 95,
		weight: {
			ice: 6,
			cell: 4,
			fission: 5.5,
			comp: 4.5,
			standard: 3,
			light: 2.5,
			xl: 1.5
		}
	},
	{
		name: "100",
		rating: 100,
		weight: {
			ice: 6,
			cell: 4,
			fission: 5.5,
			comp: 4.5,
			standard: 3.5,
			light: 2.5,
			xl: 1.5
		}
	},
	{
		name: "105",
		rating: 105,
		weight: {
			ice: 7,
			cell: 4.5,
			fission: 6.5,
			comp: 5.5,
			standard: 3.5,
			light: 3,
			xl: 2
		}
	},
	{
		name: "110",
		rating: 110,
		weight: {
			ice: 7.0,
			cell: 4.5,
			fission: 6.5,
			comp: 5.5,
			standard: 3.5,
			light: 3,
			xl: 2
		}
	},
	{
		name: "115",
		rating: 115,
		weight: {
			ice: 7.0,
			cell: 4.5,
			fission: 6.5,
			comp: 5.5,
			standard: 3.5,
			light: 3,
			xl: 2
		}
	},
	{
		name: "120",
		rating: 120,
		weight: {
			ice: 8,
			cell: 5,
			fission: 7,
			comp: 6,
			standard: 4,
			light: 3,
			xl: 2
		}
	},
	{
		name: "125",
		rating: 125,
		weight: {
			ice: 8,
			cell: 5,
			fission: 7,
			comp: 6,
			standard: 4,
			light: 3,
			xl: 2
		}
	},
	{
		name: "130",
		rating: 130,
		weight: {
			ice: 9,
			cell: 5.5,
			fission: 8,
			comp: 7,
			standard: 4.5,
			light: 3.5,
			xl: 2.5
		}
	},
	{
		name: "135",
		rating: 135,
		weight: {
			ice: 9,
			cell: 5.5,
			fission: 8,
			comp: 7,
			standard: 4.5,
			light: 3.5,
			xl: 2.5
		}
	},
	{
		name: "140",
		rating: 140,
		weight: {
			ice: 10,
			cell: 6.0,
			fission: 9,
			comp: 7.5,
			standard: 5,
			light: 4,
			xl: 2.5
		}
	},
	{
		name: "145",
		rating: 145,
		weight: {
			ice: 10,
			cell: 6.0,
			fission: 9,
			comp: 7.5,
			standard: 5,
			light: 4,
			xl: 2.5
		}
	},
	{
		name: "150",
		rating: 150,
		weight: {
			ice: 11,
			cell: 7,
			fission: 10,
			comp: 8.5,
			standard: 5.5,
			light: 4.5,
			xl: 3
		}
	},
	{
		name: "155",
		rating: 155,
		weight: {
			ice: 11,
			cell: 7,
			fission: 10,
			comp: 8.5,
			standard: 5.5,
			light: 4.5,
			xl: 3
		}
	},
	{
		name: "160",
		rating: 160,
		weight: {
			ice: 12,
			cell: 7.5,
			fission: 10.5,
			comp: 9,
			standard: 6,
			light: 4.5,
			xl: 3
		}
	},
	{
		name: "165",
		rating: 165,
		weight: {
			ice: 12,
			cell: 7.5,
			fission: 10.5,
			comp: 9,
			standard: 6,
			light: 4.5,
			xl: 4
		}
	},
	{
		name: "170",
		rating: 170,
		weight: {
			ice: 12,
			cell: 7.5,
			fission: 10.5,
			comp: 9,
			standard: 6,
			light: 4.5,
			xl: 4
		}
	},
	{
		name: "175",
		rating: 175,
		weight: {
			ice: 14,
			cell: 8.5,
			fission: 12.5,
			comp: 10,
			standard: 7,
			light: 5.5,
			xl: 3.5
		}
	},
	{
		name: "180",
		rating: 180,
		weight: {
			ice: 14,
			cell: 8.5,
			fission: 12.5,
			comp: 10.5,
			standard: 7,
			light: 5.5,
			xl: 3.5
		}
	},
	{
		name: "185",
		rating: 185,
		weight: {
			ice: 15,
			cell: 9.0,
			fission: 13.5,
			comp: 11.5,
			standard: 7.6,
			light: 6,
			xl: 4
		}
	},
	{
		name: "190",
		rating: 190,
		weight: {
			ice: 15,
			cell: 9,
			fission: 13.5,
			comp: 11.5,
			standard: 7.5,
			light: 6,
			xl: 4
		}
	},
	{
		name: "195",
		rating: 195,
		weight: {
			ice: 16,
			cell: 10,
			fission: 14,
			comp: 12,
			standard: 8,
			light: 6,
			xl: 4
		}
	},
	{
		name: "200",
		rating: 200,
		weight: {
			ice: 17.0,
			cell: 10.5,
			fission: 15,
			comp: 13,
			standard: 8.5,
			light: 6.5,
			xl: 4.5
		}
	},
	{
		name: "205",
		rating: 205,
		weight: {
			ice: 17.0,
			cell: 10.5,
			fission: 15,
			comp: 13,
			standard: 8.5,
			light: 6.5,
			xl: 4.5
		}
	},
	{
		name: "210",
		rating: 210,
		weight: {
			ice: 18,
			cell: 11,
			fission: 16,
			comp: 13.5,
			standard: 9,
			light: 7,
			xl: 4.5
		}
	},
	{
		name: "215",
		rating: 215,
		weight: {
			ice: 18,
			cell: 11,
			fission: 16,
			comp: 13.5,
			standard: 10,
			light: 7.5,
			xl: 5
		}
	},
	{
		name: "220",
		rating: 220,
		weight: {
			ice: 20,
			cell: 12,
			fission: 17.5,
			comp: 15,
			standard: 10,
			light: 7.5,
			xl: 5
		}
	},
	{
		name: "225",
		rating: 225,
		weight: {
			ice: 20,
			cell: 12,
			fission: 17.5,
			comp: 15,
			standard: 10,
			light: 7.5,
			xl: 5
		}
	},
	{
		name: "230",
		rating: 230,
		weight: {
			ice: 21,
			cell: 13,
			fission: 18.5,
			comp: 16,
			standard: 10.5,
			light: 8,
			xl: 5.5
		}
	},
	{
		name: "235",
		rating: 235,
		weight: {
			ice: 22,
			cell: 13.5,
			fission: 19.5,
			comp: 16.5,
			standard: 11,
			light: 8.5,
			xl: 5.5
		}
	},
	{
		name: "240",
		rating: 240,
		weight: {
			ice: 23,
			cell: 14,
			fission: 20.5,
			comp: 17.5,
			standard: 11.5,
			light: 9,
			xl: 6
		}
	},
	{
		name: "245",
		rating: 245,
		weight: {
			ice: 24,
			cell: 14.5,
			fission: 5,
			comp: 1,
			standard: 0.5,
			light: 0.5,
			xl: 0.5
		}
	},
	{
		name: "250",
		rating: 250,
		weight: {
			ice: 25,
			cell: 15,
			fission: 22,
			comp: 19,
			standard: 12.5,
			light: 9.6,
			xl: 6.5
		}
	},
	{
		name: "255",
		rating: 255,
		weight: {
			ice: 26,
			cell: 16,
			fission: 23,
			comp: 19.5,
			standard: 13,
			light: 10,
			xl: 6.5
		}
	},
	{
		name: "260",
		rating: 260,
		weight: {
			ice: 27,
			cell: 16.5,
			fission: 24,
			comp: 20.5,
			standard: 13.5,
			light: 10.5,
			xl: 7
		}
	},
	{
		name: "265",
		rating: 265,
		weight: {
			ice: 28,
			cell: 17,
			fission: 24.5,
			comp: 21,
			standard: 14,
			light: 10.5,
			xl: 7
		}
	},
	{
		name: "270",
		rating: 270,
		weight: {
			ice: 29,
			cell: 17.5,
			fission: 25.5,
			comp: 22,
			standard: 14.5,
			light: 11,
			xl: 7.5
		}
	},
	{
		name: "275",
		rating: 275,
		weight: {
			ice: 31,
			cell: 19,
			fission: 27.5,
			comp: 23.5,
			standard: 15.5,
			light: 12,
			xl: 8
		}
	},
	{
		name: "280",
		rating: 280,
		weight: {
			ice: 32,
			cell: 19.5,
			fission: 28,
			comp: 24,
			standard: 16,
			light: 12,
			xl: 8
		}
	},
	{
		name: "285",
		rating: 285,
		weight: {
			ice: 33,
			cell: 20,
			fission: 29,
			comp: 25,
			standard: 16.5,
			light: 12.5,
			xl: 8.5
		}
	},
	{
		name: "290",
		rating: 290,
		weight: {
			ice: 35,
			cell: 21,
			fission: 31,
			comp: 26.5,
			standard: 17.5,
			light: 13.5,
			xl: 9
		}
	},
	{
		name: "295",
		rating: 295,
		weight: {
			ice: 36,
			cell: 22,
			fission: 31.5,
			comp: 27,
			standard: 18,
			light: 13.5,
			xl: 9
		}
	},
	{
		name: "300",
		rating: 300,
		weight: {
			ice: 38,
			cell: 23,
			fission: 33.5,
			comp: 28.5,
			standard: 19,
			light: 15.5,
			xl: 9.5
		}
	},
	{
		name: "305",
		rating: 305,
		weight: {
			ice: 39,
			cell: 23.5,
			fission: 34.5,
			comp: 29.5,
			standard: 19.5,
			light: 15,
			xl: 10
		}
	},
	{
		name: "310",
		rating: 310,
		weight: {
			ice: 41,
			cell: 25,
			fission: 36,
			comp: 31,
			standard: 20.5,
			light: 15.5,
			xl: 10.5
		}
	},
	{
		name: "315",
		rating: 315,
		weight: {
			ice: 43,
			cell: 26,
			fission: 38,
			comp: 32.5,
			standard: 21.5,
			light: 16.5,
			xl: 11
		}
	},
	{
		name: "320",
		rating: 320,
		weight: {
			ice: 45,
			cell: 27,
			fission: 39.5,
			comp: 34,
			standard: 22.5,
			light: 17,
			xl: 11.5
		}
	},
	{
		name: "325",
		rating: 325,
		weight: {
			ice: 47,
			cell: 28.5,
			fission: 41.5,
			comp: 33.5,
			standard: 23.5,
			light: 18,
			xl: 12
		}
	},
	{
		name: "330",
		rating: 330,
		weight: {
			ice: 49,
			cell: 29.5,
			fission: 43,
			comp: 37,
			standard: 24.5,
			light: 18.5,
			xl: 12.5
		}
	},
	{
		name: "335",
		rating: 335,
		weight: {
			ice: 51,
			cell: 31,
			fission: 45,
			comp: 38.5,
			standard: 25.5,
			light: 18.5,
			xl: 12.5
		}
	},
	{
		name: "340",
		rating: 340,
		weight: {
			ice: 54,
			cell: 32.5,
			fission: 47.5,
			comp: 40.5,
			standard: 27,
			light: 20.5,
			xl: 13.5
		}
	},
	{
		name: "345",
		rating: 345,
		weight: {
			ice: 57,
			cell: 34.5,
			fission: 50,
			comp: 40.5,
			standard: 29.5,
			light: 21.5,
			xl: 14.5
		}
	},
	{
		name: "350",
		rating: 350,
		weight: {
			ice: 59,
			cell: 35.5,
			fission: 52,
			comp: 44.5,
			standard: 29.5,
			light: 22.5,
			xl: 15
		}
	},
	{
		name: "355",
		rating: 355,
		weight: {
			ice: 63,
			cell: 38,
			fission: 55.5,
			comp: 47.5,
			standard: 31.5,
			light: 24,
			xl: 16
		}
	},
	{
		name: "360",
		rating: 360,
		weight: {
			ice: 66,
			cell: 40,
			fission: 58,
			comp: 49.5,
			standard: 33,
			light: 25,
			xl: 16.5
		}
	},
	{
		name: "365",
		rating: 365,
		weight: {
			ice: 69,
			cell: 41.5,
			fission: 60.5,
			comp: 52,
			standard: 34.5,
			light: 26,
			xl: 17.5
		}
	},
	{
		name: "370",
		rating: 370,
		weight: {
			ice: 73,
			cell: 44,
			fission: 64,
			comp: 55,
			standard: 36.5,
			light: 27.5,
			xl: 18.5
		}
	},
	{
		name: "375",
		rating: 375,
		weight: {
			ice: 77,
			cell: 46.5,
			fission: 67.5,
			comp: 58,
			standard: 38.5,
			light: 29,
			xl: 19.5
		}
	},
	{
		name: "380",
		rating: 380,
		weight: {
			ice: 82,
			cell: 49.5,
			fission: 72,
			comp: 61.5,
			standard: 41,
			light: 31,
			xl: 20.5
		}
	},
	{
		name: "385",
		rating: 385,
		weight: {
			ice: 87,
			cell: 52.5,
			fission: 76.5,
			comp: 65.5,
			standard: 43.5,
			light: 33,
			xl: 22
		}
	},
	{
		name: "390",
		rating: 390,
		weight: {
			ice: 92,
			cell: 55.5,
			fission: 80.5,
			comp: 69,
			standard: 46,
			light: 34.5,
			xl: 23
		}
	},
	{
		name: "395",
		rating: 395,
		weight: {
			ice: 98,
			cell: 59,
			fission: 86,
			comp: 73.5,
			standard: 49,
			light: 37,
			xl: 24.5
		}
	},
	{
		name: "400",
		rating: 400,
		weight: {
			ice: 105.5,
			cell: 63,
			fission: 92,
			comp: 79,
			standard: 52.5,
			light: 39.5,
			xl: 26.5
		}
	}

);

var mechISEquipment = Array(
	{
		name: {
			'en-US': "Small Laser",
			'de-DE': "de - Small Laser",
		},
		tag: "small-laser",
		category: {
			'en-US': "Energy Weapons",
			'de-DE': "de - Energy Weapons",
		},
		damage: 3,
		cbills: 11250,
		introduced: 2400,
		extinct: 0,
		battlevalue: 9,
		ammo_battlevalue: 0,
		heat: 1,
		weight: 0.5,
		range_min: {
			min: 0,
			short: 1,
			medium: 2,
			long: 3,
		},
		space: {
			battlemech: 1,
			protomech: "n/a",
			combat_vehicle: 1,
			support_vehicle: 1,
			aerospace_fighter: 1,
			small_craft: 1,
			drop_ship: 1
		},
		ammo_per_ton: 0,
		min_ammo_tons: 1,
		tech_rating: "e",
		page: 227,
		alpha_strike: {
			heat: 1,
			range_short: 0.3,
			range_medium: 0,
			range_long: 0,
			range_extreme: 0,
			tc: 1,
			notes: Array(
			)
		}
	},
	{
		name: {
			'en-US': "Medium Laser",
			'de-DE': "de - Medium Laser",
		},
		tag: "medium-laser",
		category: {
			'en-US': "Energy Weapons",
			'de-DE': "de - Energy Weapons",
		},
		damage: 5,
		cbills: 40000,
		introduced: 2400,
		extinct: 0,
		battlevalue: 46,
		ammo_battlevalue: 0,
		heat: 3,
		weight: 1,
		range_min: {
			min: 0,
			short: 3,
			medium: 6,
			long: 9,
		},
		space: {
			battlemech: 1,
			protomech: "n/a",
			combat_vehicle: 1,
			support_vehicle: 1,
			aerospace_fighter: 1,
			small_craft: 1,
			drop_ship: 1
		},
		ammo_per_ton: 0,
		min_ammo_tons: 1,
		tech_rating: "e",
		page: 227,
		alpha_strike: {
			heat: 3,
			range_short: 0.5,
			range_medium: 0.5,
			range_long: 0,
			range_extreme: 0,
			tc: 1,
			notes: Array(
			)
		}
	},
	{
		name: {
			'en-US': "Large Laser",
			'de-DE': "de - Large Laser",
		},
		tag: "large-laser",
		category: {
			'en-US': "Energy Weapons",
			'de-DE': "de - Energy Weapons",
		},
		damage: 8,
		cbills: 100000,
		introduced: 2400,
		extinct: 0,
		battlevalue: 123,
		ammo_battlevalue: 0,
		heat: 8,
		weight: 5,
		range_min: {
			min: 0,
			short: 5,
			medium: 10,
			long: 15,
		},
		space: {
			battlemech: 2,
			protomech: "n/a",
			combat_vehicle: 1,
			support_vehicle: 5,
			aerospace_fighter: 1,
			small_craft: 1,
			drop_ship: 1
		},
		ammo_per_ton: 0,
		min_ammo_tons: 1,
		tech_rating: "e",
		page: 227,
		alpha_strike: {
			heat: 8,
			range_short: 0.8,
			range_medium: 0.8,
			range_long: 0,
			range_extreme: 0,
			tc: 1,
			notes: Array(
			)
		}
	}
);
var mechTypeOptions = Array(
	{
		id: 1,
		class: "biped",
		name: {
			'en-US': "Biped",
			'de-DE': "de-Biped"
		}
	},
	{
		id: 2,
		class: "quad",
		name: {
			'en-US': "Quad",
			'de-DE': "de-Biped"
		}
	}
);
var btTechOptions = Array(
	{
		id: 1,
		tag: "is",
		name: {
			'en-US':'Inner Sphere',
			'de-DE': "de - Inner Sphere"
		}
	},
	{
		id: 2,
		tag: "clan",
		name: {
			'en-US':'Clan',
			'de-DE': "de - Clan"
		}
	}
);

var class_dice = function() {};

class_dice.prototype = {

	init: function() {
		this.always_exploding_dice = false;

		this.roll_set_count_rolls = [];
		this.roll_set_count = 0;

		this.label_no_effect = "No Effect";
		this.label_shaken = "Shaken";
		this.label_shaken_and_a_wound = "Shaken and a wound";
		this.label_shaken_and_x_wounds = "Shaken and {raises} wounds";

		this.label_critical_failure = "Critical Failure";
		this.label_failure = "Failure";
		this.label_success = "Success";
		this.label_success_with_a_raise = "Success with a raise";
		this.label_success_with_x_raises = "Success with {raises} raises";

		this.label_die_roll_number = "die roll #";
		this.label_wild_die_roll_number = "wild die roll #";

		this.label_roll_set_number = "Roll Set #";

		this.label_total_roll = "Total Roll";

		this.success_target_number = 4;
		this.success_base_toughness = 5;
		this.success_armor = 1;
		this.success_weapons_ap = 0;
	},
	roll_die: function(number_of_sides, exploding_die, wild_die) {

		if(!number_of_sides)
			number_of_sides = 6;


		total_roll = 0;
		keep_rolling = 1;
		display_roll = "";
		while(keep_rolling > 0) {
			roll = Math.floor(Math.random() * number_of_sides) + 1;
			if(exploding_die > 0) {
				if(roll == number_of_sides)
					keep_rolling = 1;
				else
					keep_rolling = 0;
			} else {
				keep_rolling = 0;
			}


			display_roll += roll + ", ";
			total_roll += roll;

		}

		this.roll_set_count_rolls[ this.roll_set_count ].base_rolls.push( display_roll );
		this.roll_set_count_rolls[ this.roll_set_count ].base_roll_sides.push(number_of_sides);
		wild_display_roll = "";
		totalwild_dieRoll = 0;
		keep_rolling = 1;
		if(wild_die > 0) {
			number_of_sides = 6;
			while(keep_rolling > 0) {
				roll = Math.floor(Math.random() * number_of_sides) + 1;
				if(exploding_die > 0) {
					if(roll == number_of_sides)
						keep_rolling = 1;
					else
						keep_rolling = 0;
				} else {
					keep_rolling = 0;
				}



				totalwild_dieRoll += roll;

				wild_display_roll += roll + ", ";
			}
		}
		this.roll_set_count_rolls[ this.roll_set_count ].wild_die_rolls.push(wild_display_roll);

		if(totalwild_dieRoll == 1 && total_roll == 1)
			this.roll_set_count_rolls[ this.roll_set_count ].critical_failure= 1;
		else
			this.roll_set_count_rolls[ this.roll_set_count ].critical_failure= 0;

		if(totalwild_dieRoll > total_roll)
			return totalwild_dieRoll;
		else
			return total_roll;

	},

	roll_dice: function (number_of_dice, total_modifier) { // 2d6+3 would be this.roll_dice(2,3)

		var returnTotal = 0;
		number_of_sides = 6;

		if(number_of_dice.indexOf("*") > 0)
			wild_die = 1;
		else
			wild_die = 0;

		if(number_of_sides < 2)
			number_of_sides = 2;

		number_of_dice = number_of_dice.replace("*", "");

		explodingDice = 0;
		if(number_of_dice.indexOf("d") > -1) {
			rollNumber = number_of_dice.substring(0, number_of_dice.indexOf("d")) / 1;
			number_of_sides = number_of_dice.substring(number_of_dice.indexOf("d") + 1) / 1;
			if(this.always_exploding_dice)
				explodingDice = 1;
		} else {
			if(number_of_dice.indexOf("e") > -1) {
				explodingDice = 1;
				rollNumber = number_of_dice.substring(0, number_of_dice.indexOf("e")) / 1;
				number_of_sides = number_of_dice.substring(number_of_dice.indexOf("e") + 1) / 1;
			} else {
				rollNumber = number_of_dice;
			}
		}

		// a dX assumes 1dX
		if(!rollNumber)
			rollNumber = 1;

		// a 2d assumes 2d6
		if(!number_of_sides)
			number_of_sides = 6;

		var rolls = rollNumber + "d" + number_of_sides + ": ";
		while(rollNumber-- > 0) {

			dieRoll = this.roll_die(number_of_sides, explodingDice, wild_die);
			returnTotal += dieRoll;
			rolls += dieRoll + ",";
			this.roll_set_count_rolls[ this.roll_set_count ].total_rolled_dice++;
		}
		rolls = rolls.substring(0, rolls.length -1);
		rolls += "";



		return returnTotal;
	},
	_parse_bit: function (input_string) {
		value = 0;

		if(input_string.indexOf("d") > -1)
			value = this.roll_dice(input_string, 0);
		else
			if(input_string.indexOf("e") > -1)
				value = this.roll_dice(input_string, 0);
			else
				value = input_string / 1;

		return value;
	},

	_parse_roll_set: function( input_string ) {
		set_total = 0;

		// remove all spaces...

		input_string = input_string.replace(/ /g, "");
		input_string = input_string.toLowerCase();

		// parse mathematical expressions
		input_string = input_string.replace(/\+/g, " + ");
		input_string = input_string.replace(/x/g, " x ");
		input_string = input_string.replace(/\//g, " / ");
		input_string = input_string.replace(/\-/g, " - ");
		input_string = input_string.replace(/\)/g, " ) ");
		input_string = input_string.replace(/\(/g, " ( ");
		input_string = input_string.replace(/\,/g, " , ");


		this.roll_set_count_rolls[ this.roll_set_count ] = {};

		this.roll_set_count_rolls[ this.roll_set_count ].base_rolls = [];
		this.roll_set_count_rolls[ this.roll_set_count ].wild_die_rolls = [];
		this.roll_set_count_rolls[ this.roll_set_count ].base_roll_sides = [];
		this.roll_set_count_rolls[ this.roll_set_count ].total_rolled_dice = 0;
		this.roll_set_count_rolls[ this.roll_set_count ].critical_failure = 0;

		if(input_string.indexOf(" ") > 0) {
			items = input_string.split(" ");

			current_function = "+";
			for(count = 0; count < items.length; count++) {

				if(
					items[count] != "+"
						&&
					items[count] != "x"
						&&
					items[count] != "-"
						&&
					items[count] != "/"
				) {
					// parse the bit
					if(current_function == "+") {
						set_total += this._parse_bit( items[count]) / 1;
					} else {
						if(current_function == "-") {
							set_total -= this._parse_bit( items[count]) / 1;
						} else {
							if(current_function == "x") {
								if(set_total == 0) {
									set_total = items[count] / 1;
								} else {
									set_total = set_total * this._parse_bit( items[count]) / 1;
								}
							} else {
								if(current_function == "/") {
									set_total = set_total / this._parse_bit( items[count]) / 1;
								} else {
									// ignore parentheticals for now
								}
							}
						}
					}
				} else {
					// change what it does...
					current_function = items[count];
				}

			}

		} else {
			set_total += this._parse_bit( input_string);

		}
		this.roll_set_count_rolls[ this.roll_set_count ].total_roll = set_total;
		this.roll_set_count++;
	},

	parse_roll: function (parse_roll_input_string) {

		// look for modifier(s)....
		total = 0;
		this.roll_set_count = 0;
		this.roll_set_count_rolls = [];

		if(parse_roll_input_string.indexOf(",") > 0) {
			parse_roll_items = parse_roll_input_string.split(",");
			for( parse_roll_itemcount = 0; parse_roll_itemcount < parse_roll_items.length; parse_roll_itemcount++) {
				total = this._parse_roll_set( parse_roll_items[parse_roll_itemcount] );
			}
		} else {
			total += this._parse_roll_set( parse_roll_input_string );
		}

		return total;
	},

	display_results: function (for_trait, for_damage) {
		html = "";
		for( results_set_count = 0; results_set_count < this.roll_set_count; results_set_count++ ) {
			if( this.roll_set_count > 1 ) {
				if( results_set_count > 0) {
					html += "<hr />";
				}
				html += "<h4>" + this.label_roll_set_number + (results_set_count + 1) + "</h4>";
			}


			html += "<h5>" + this.label_total_roll + ": " + this.roll_set_count_rolls[ results_set_count ].total_roll + "</h5>"

			if( for_trait )
				html += this.trait_success_margin( this.roll_set_count_rolls[ results_set_count ].total_roll, null, results_set_count ) + "<br />";

			if( for_damage )
				html += this.damage_success_margin( this.roll_set_count_rolls[ results_set_count ].total_roll ) + "<br />";

			for(current_roll = 0; current_roll < this.roll_set_count_rolls[ results_set_count ].total_rolled_dice; current_roll++) {
				// each die roll section
				if(typeof(this.roll_set_count_rolls[ results_set_count ].base_rolls[ current_roll ]) != "undefined") {
					html += "<br />" + this.label_die_roll_number  + "" + (current_roll + 1) + " (d" + this.roll_set_count_rolls[ results_set_count ].base_roll_sides[ current_roll ] + "): ";
					if( this.roll_set_count_rolls[ results_set_count ].base_rolls[ current_roll ] ) {
						if( this.roll_set_count_rolls[ results_set_count ].base_rolls[ current_roll ].length > 2 ) {
							html += this.roll_set_count_rolls[ results_set_count ].base_rolls[ current_roll ].substring(
								0,
								this.roll_set_count_rolls[ results_set_count ].base_rolls[ current_roll ].length - 2
							);
						} else {
							html += this.roll_set_count_rolls[ results_set_count ].base_rolls[ current_roll ];
						}
					}

				}

				// print out wild die rolls if exists
				if(typeof(this.roll_set_count_rolls[ results_set_count ].wild_die_rolls[ current_roll ]) != "undefined") {
					if(this.roll_set_count_rolls[ results_set_count ].wild_die_rolls[ current_roll ].length > 0)
						html += "<br />" + this.label_wild_die_roll_number + ( current_roll  + 1) + " (d6): ";

					if( this.roll_set_count_rolls[ results_set_count ].wild_die_rolls[ current_roll ] ) {
						if( this.roll_set_count_rolls[ results_set_count ].wild_die_rolls[ current_roll ].length > 2 ) {
							html += this.roll_set_count_rolls[ results_set_count ].wild_die_rolls[ current_roll ].substring(
								0,
								this.roll_set_count_rolls[ results_set_count ].wild_die_rolls[ current_roll ].length - 2
							);
						} else {
							html += this.roll_set_count_rolls[ results_set_count ].wild_die_rolls[ current_roll ];
						}
					}
				}

			}
		}

		return html;
	},
	trait_success_margin: function (roll, target_number, trait_set_count) {

		if (! target_number )
			target_number = this.success_target_number;

		value = roll/1 - target_number/1;

		html = "";


		if(typeof(trait_set_count) != "undefined" && this.roll_set_count_rolls[ trait_set_count ].critical_failure > 0) {
			html += "<span  class=\"color-red bolded uppercase\">" + this.label_critical_failure + "</span>";
		} else {
			if(value < 0) {
				html += "<span  class=\"color-red\">" + this.label_failure + "</span>";
			} else {
				raises = Math.floor(value/4);
				if(raises == 0) {
					html += this.label_success;
				} else {
					if( raises == 1) {
						html += "<span  class=\"color-green bolded\">" + this.label_success_with_a_raise + "</span>";
					} else {
						html += "<span  class=\"color-green bolded uppercase\">" + this.label_success_with_x_raises.replace("{raises}", raises) + "</span>";
					}
				}
			}
		}

		return html;
	},

	set_result_margins: function( input_target_number, input_base_toughness, input_armor, input_weapons_ap ) {
		this.success_target_number = input_target_number;
		this.success_base_toughness = input_base_toughness;
		this.success_armor = input_armor;
		this.success_weapons_ap = input_weapons_ap;
	},

	set_label: function( label_name, label_value ) {
		if( label_name == "no_effect") {
			this.label_no_effect = label_value;
			return label_value;
		}

		if( label_name == "total_roll") {
			this.label_total_roll = label_value;
			return label_value;
		}

		if( label_name == "shaken") {
			this.label_shaken = label_value;
			return label_value;
		}

		if( label_name == "shaken_and_a_wound") {
			this.label_shaken_and_a_wound = label_value;
			return label_value;
		}

		if( label_name == "shaken_and_x_wounds") {
			this.label_shaken_and_x_wounds = label_value;
			return label_value;
		}

		if( label_name == "critical_failure") {
			this.label_critical_failure = label_value;
			return label_value;
		}

		if( label_name == "roll_set_number") {
			this.label_roll_set_number = label_value;
			return label_value;
		}

		if( label_name == "failure") {
			this.label_failure = label_value;
			return label_value;
		}

		if( label_name == "success") {
			this.label_success = label_value;
			return label_value;
		}

		if( label_name == "success_with_a_raise") {
			this.label_success_with_a_raise = label_value;
			return label_value;
		}

		if( label_name == "success_with_x_raises") {
			this.label_success_with_x_raises = label_value;
			return label_value;
		}

		if( label_name == "die_roll_number") {
			this.label_die_roll_number = label_value;
			return label_value;
		}

		if( label_name == "wild_die_roll_number") {
			this.label_wild_die_roll_number = label_value;
			return label_value;
		}

		return null;
	},

	set_always_exploding_dice: function( new_value ) {
		this.always_exploding_dice = new_value;
		return this.always_exploding_dice;
	},

	damage_success_margin: function (roll, toughness, armor, armor_piercing) {

		if( !toughness )
			toughness = this.success_base_toughness;

		if( !armor )
			armor = this.success_armor;

		if( !armor_piercing )
			armor_piercing = this.success_weapons_ap;

		armor = armor/1 - armor_piercing/1;
		if(armor < 0)
			armor = 0;

		target_number = toughness/1 + armor/1;
		value = roll/1 - target_number/1;

		html = "";
		if(value < 0) {
			html += "<span>" + this.label_no_effect + "</span>";
		} else {
			raises = Math.floor(value/4);
			if(raises == 0) {
				html += "<span class=\"color-orange\">" + this.label_shaken + "</span>";
			} else {
				if( raises == 1) {
					html += "<span class=\"color-red\">" + this.label_shaken_and_a_wound + "</span>";
				} else {
					html += "<span class=\"color-red bolded uppercase\">" + this.label_shaken_and_x_wounds.replace("{raises}", raises) + "</span>";
				}
			}
		}
		return html;
	}
}


function Mech (type) {
	this.mech_type = mechTypeOptions[0];
	this.tech = btTechOptions[0];
	this.era = btEraOptions[1]; // Default to Succession Wars
	this.make = "";
	this.model = "";
	this.uuid = "";
	this.tonnage = 20;
	this.useLang = "en-US";

	this.max_armor = 0;

	this.internalStructure = {};

	this.internalStructure.head = 0;

	this.internalStructure.centerTorso = 0;
	this.internalStructure.leftTorso = 0;
	this.internalStructure.rightTorso = 0;

	this.internalStructure.rightArm = 0;
	this.internalStructure.leftArm = 0;

	this.internalStructure.rightLeg = 0;
	this.internalStructure.leftLeg = 0;

	this.additional_heat_sinks = 0;

	this.armorWeight = 0;
	this.total_armor = 0;
	this.unallocated_armor = 0;

	this.armorAllocation = {};

	this.heat_sink_type = "single";

	this.armorAllocation.head = 0;

	this.armorAllocation.centerTorso = 0;
	this.armorAllocation.leftTorso = 0;
	this.armorAllocation.rightTorso = 0;

	this.armorAllocation.centerTorsoRear = 0;
	this.armorAllocation.leftTorsoRear = 0;
	this.armorAllocation.rightTorsoRear = 0;

	this.armorAllocation.rightArm = 0;
	this.armorAllocation.leftArm = 0;

	this.armorAllocation.rightLeg = 0;
	this.armorAllocation.leftLeg = 0;

	this.armorAllocation.head = 0;

	this.equipmentList = Array();


	this.weights = Array();


	this.critical_items = Array();

	this.criticals = {};

	this.criticals.centerTorso = Array();
	this.criticals.leftTorso = Array();
	this.criticals.rightTorso = Array();

	this.criticals.centerTorsoRear = Array();
	this.criticals.leftTorsoRear = Array();
	this.criticals.rightTorsoRear = Array();

	this.criticals.rightArm = Array();
	this.criticals.leftArm = Array();

	this.criticals.rightLeg = Array();
	this.criticals.leftLeg = Array();

	this.weights = Array();

	this.gyro = "Standard";

	this.engine = 0;
	this.engineType = "Standard";
	this.jumpJetType = "Standard";

	this.walkSpeed = 0;
	this.runSpeed = 0;
	this.jumpSpeed = 0;

	this.max_armor_tonnage = 0;

	this.cbillCost = "n/a";
	this.battleValue = "n/a";
	this.alphaStrikeValue = "n/a";

	this.alphaStrikeForceStats = {
		make: "",
		model: "",
		size_class: "",
		move: "",
		jump_move: "",
		pv: "",
		range_short: "",
		range_medium: "",
		range_long: "",
		range_extreme: "",
		armor: "",
		structure: "",
		size: 0,
		skill: 4,
		ov: 0,
		notes: ""
	}
}

Mech.prototype._calcAlphaStrike = function() {
	this.alphaStrikeForceStats.make  = this.make;
	this.alphaStrikeForceStats.model  = this.model;
	this.alphaStrikeForceStats.move  = this.getWalkSpeed() * 2;
	this.alphaStrikeForceStats.jump_move  = this.getJumpSpeed() * 2;
	this.alphaStrikeForceStats.pv = 0;
	this.alphaStrikeForceStats.range_short = 0;
	this.alphaStrikeForceStats.range_medium = 0;
	this.alphaStrikeForceStats.range_long = 0;
	this.alphaStrikeForceStats.range_extreme = 0;
	this.alphaStrikeForceStats.armor = 0;
	this.alphaStrikeForceStats.structure = 0;
	this.alphaStrikeForceStats.skill = 4;
	this.alphaStrikeForceStats.ov = 0;
	this.alphaStrikeForceStats.notes = "";
	this.alphaStrikeForceStats.size_class = "";
	this.alphaStrikeForceStats.size_class_name = "";
	this.alphaStrikeForceStats.special_unit_abilities = Array();

	// TODO - calculations
	if( this.tonnage > 100) {
		this.alphaStrikeForceStats.size_class = 4;
		this.alphaStrikeForceStats.size_class_name = "Superheavy";
		this.alphaStrikeForceStats.special_unit_abilities.push("LG");
	} else if( this.tonnage >= 80) {
		this.alphaStrikeForceStats.size_class = 4;
		this.alphaStrikeForceStats.size_class_name = "Assault";
	} else if( this.tonnage >= 60) {
		this.alphaStrikeForceStats.size_class = 3;
		this.alphaStrikeForceStats.size_class_name = "Heavy";
	} else if( this.tonnage >= 40) {
		this.alphaStrikeForceStats.size_class = 2;
		this.alphaStrikeForceStats.size_class_name = "Medium";
	} else {
		this.alphaStrikeForceStats.size_class = 1;
		this.alphaStrikeForceStats.size_class_name = "Light";
	}

	this.alphaStrikeForceStats.armor = ( this.getTotalArmor() / 30).toFixed(0);

	if( this.getTech().name == "Inner Sphere") {


		switch( this.engineType ) {
			case "Compact":
			case "Compact Fusion":
				// Compact
				if( this.tonnage == 100) {
					this.alphaStrikeForceStats.structure = 10;
				} else if( this.tonnage >= 95 ) {
					this.alphaStrikeForceStats.structure = 10;
				} else if( this.tonnage >= 90 ) {
					this.alphaStrikeForceStats.structure = 10;
				} else if( this.tonnage >= 85 ) {
					this.alphaStrikeForceStats.structure = 9;
				} else if( this.tonnage >= 80 ) {
					this.alphaStrikeForceStats.structure = 8;
				} else if( this.tonnage >= 75 ) {
					this.alphaStrikeForceStats.structure = 8;
				} else if( this.tonnage >= 70 ) {
					this.alphaStrikeForceStats.structure = 7;
				} else if( this.tonnage >= 65 ) {
					this.alphaStrikeForceStats.structure = 7;
				} else if( this.tonnage >= 60 ) {
					this.alphaStrikeForceStats.structure = 7;
				} else if( this.tonnage >= 55 ) {
					this.alphaStrikeForceStats.structure = 6;
				} else if( this.tonnage >= 50 ) {
					this.alphaStrikeForceStats.structure = 5;
				} else if( this.tonnage >= 45 ) {
					this.alphaStrikeForceStats.structure = 5;
				} else if( this.tonnage >= 40 ) {
					this.alphaStrikeForceStats.structure = 4;
				} else if( this.tonnage >= 35 ) {
					this.alphaStrikeForceStats.structure = 4;
				} else if( this.tonnage >= 30 ) {
					this.alphaStrikeForceStats.structure = 3;
				} else if( this.tonnage >= 25 ) {
					this.alphaStrikeForceStats.structure = 3;
				} else if( this.tonnage >= 20 ) {
					this.alphaStrikeForceStats.structure = 2;
				} else if( this.tonnage >= 15 ) {
					this.alphaStrikeForceStats.structure = 2;
				} else if( this.tonnage >= 10 ) {
					this.alphaStrikeForceStats.structure = 1;
				}
				break;
			case "Light":
			case "Light Fusion":
				// Compact
				if( this.tonnage == 100) {
					this.alphaStrikeForceStats.structure = 5;
				} else if( this.tonnage >= 95 ) {
					this.alphaStrikeForceStats.structure = 5;
				} else if( this.tonnage >= 90 ) {
					this.alphaStrikeForceStats.structure = 5;
				} else if( this.tonnage >= 85 ) {
					this.alphaStrikeForceStats.structure = 5;
				} else if( this.tonnage >= 80 ) {
					this.alphaStrikeForceStats.structure = 4;
				} else if( this.tonnage >= 75 ) {
					this.alphaStrikeForceStats.structure = 4;
				} else if( this.tonnage >= 70 ) {
					this.alphaStrikeForceStats.structure = 4;
				} else if( this.tonnage >= 65 ) {
					this.alphaStrikeForceStats.structure = 4;
				} else if( this.tonnage >= 60 ) {
					this.alphaStrikeForceStats.structure = 3;
				} else if( this.tonnage >= 55 ) {
					this.alphaStrikeForceStats.structure = 3;
				} else if( this.tonnage >= 50 ) {
					this.alphaStrikeForceStats.structure = 3;
				} else if( this.tonnage >= 45 ) {
					this.alphaStrikeForceStats.structure = 2;
				} else if( this.tonnage >= 40 ) {
					this.alphaStrikeForceStats.structure = 2;
				} else if( this.tonnage >= 35 ) {
					this.alphaStrikeForceStats.structure = 2;
				} else if( this.tonnage >= 30 ) {
					this.alphaStrikeForceStats.structure = 2;
				} else if( this.tonnage >= 25 ) {
					this.alphaStrikeForceStats.structure = 1;
				} else if( this.tonnage >= 20 ) {
					this.alphaStrikeForceStats.structure = 1;
				} else if( this.tonnage >= 15 ) {
					this.alphaStrikeForceStats.structure = 1;
				} else if( this.tonnage >= 10 ) {
					this.alphaStrikeForceStats.structure = 1;
				}
				break;
			default:
				// Standard
				if( this.tonnage == 100) {
					this.alphaStrikeForceStats.structure = 8;
				} else if( this.tonnage >= 95 ) {
					this.alphaStrikeForceStats.structure = 8;
				} else if( this.tonnage >= 90 ) {
					this.alphaStrikeForceStats.structure = 7;
				} else if( this.tonnage >= 85 ) {
					this.alphaStrikeForceStats.structure = 7;
				} else if( this.tonnage >= 80 ) {
					this.alphaStrikeForceStats.structure = 6;
				} else if( this.tonnage >= 75 ) {
					this.alphaStrikeForceStats.structure = 6;
				} else if( this.tonnage >= 70 ) {
					this.alphaStrikeForceStats.structure = 6;
				} else if( this.tonnage >= 65 ) {
					this.alphaStrikeForceStats.structure = 5;
				} else if( this.tonnage >= 60 ) {
					this.alphaStrikeForceStats.structure = 5;
				} else if( this.tonnage >= 55 ) {
					this.alphaStrikeForceStats.structure = 5;
				} else if( this.tonnage >= 50 ) {
					this.alphaStrikeForceStats.structure = 4;
				} else if( this.tonnage >= 45 ) {
					this.alphaStrikeForceStats.structure = 4;
				} else if( this.tonnage >= 40 ) {
					this.alphaStrikeForceStats.structure = 3;
				} else if( this.tonnage >= 35 ) {
					this.alphaStrikeForceStats.structure = 3;
				} else if( this.tonnage >= 30 ) {
					this.alphaStrikeForceStats.structure = 3;
				} else if( this.tonnage >= 25 ) {
					this.alphaStrikeForceStats.structure = 2;
				} else if( this.tonnage >= 20 ) {
					this.alphaStrikeForceStats.structure = 2;
				} else if( this.tonnage >= 15 ) {
					this.alphaStrikeForceStats.structure = 1;
				} else if( this.tonnage >= 10 ) {
					this.alphaStrikeForceStats.structure = 1;
				}

				break;
		}
	} else {
		switch( this.engineType ) {
			case "XL":
			case "XL Fusion":
				// Compact
				if( this.tonnage == 100) {
					this.alphaStrikeForceStats.structure = 5;
				} else if( this.tonnage >= 95 ) {
					this.alphaStrikeForceStats.structure = 5;
				} else if( this.tonnage >= 90 ) {
					this.alphaStrikeForceStats.structure = 5;
				} else if( this.tonnage >= 85 ) {
					this.alphaStrikeForceStats.structure = 5;
				} else if( this.tonnage >= 80 ) {
					this.alphaStrikeForceStats.structure = 4;
				} else if( this.tonnage >= 75 ) {
					this.alphaStrikeForceStats.structure = 4;
				} else if( this.tonnage >= 70 ) {
					this.alphaStrikeForceStats.structure = 4;
				} else if( this.tonnage >= 65 ) {
					this.alphaStrikeForceStats.structure = 4;
				} else if( this.tonnage >= 60 ) {
					this.alphaStrikeForceStats.structure = 3;
				} else if( this.tonnage >= 55 ) {
					this.alphaStrikeForceStats.structure = 3;
				} else if( this.tonnage >= 50 ) {
					this.alphaStrikeForceStats.structure = 3;
				} else if( this.tonnage >= 45 ) {
					this.alphaStrikeForceStats.structure = 2;
				} else if( this.tonnage >= 40 ) {
					this.alphaStrikeForceStats.structure = 2;
				} else if( this.tonnage >= 35 ) {
					this.alphaStrikeForceStats.structure = 2;
				} else if( this.tonnage >= 30 ) {
					this.alphaStrikeForceStats.structure = 2;
				} else if( this.tonnage >= 25 ) {
					this.alphaStrikeForceStats.structure = 1;
				} else if( this.tonnage >= 20 ) {
					this.alphaStrikeForceStats.structure = 1;
				} else if( this.tonnage >= 15 ) {
					this.alphaStrikeForceStats.structure = 1;
				} else if( this.tonnage >= 10 ) {
					this.alphaStrikeForceStats.structure = 1;
				}
				break;
			default:
				// Standard / Standard Fusion
				if( this.tonnage == 100) {
					this.alphaStrikeForceStats.structure = 8;
				} else if( this.tonnage >= 95 ) {
					this.alphaStrikeForceStats.structure = 8;
				} else if( this.tonnage >= 90 ) {
					this.alphaStrikeForceStats.structure = 7;
				} else if( this.tonnage >= 85 ) {
					this.alphaStrikeForceStats.structure = 7;
				} else if( this.tonnage >= 80 ) {
					this.alphaStrikeForceStats.structure = 6;
				} else if( this.tonnage >= 75 ) {
					this.alphaStrikeForceStats.structure = 6;
				} else if( this.tonnage >= 70 ) {
					this.alphaStrikeForceStats.structure = 6;
				} else if( this.tonnage >= 65 ) {
					this.alphaStrikeForceStats.structure = 5;
				} else if( this.tonnage >= 60 ) {
					this.alphaStrikeForceStats.structure = 5;
				} else if( this.tonnage >= 55 ) {
					this.alphaStrikeForceStats.structure = 5;
				} else if( this.tonnage >= 50 ) {
					this.alphaStrikeForceStats.structure = 4;
				} else if( this.tonnage >= 45 ) {
					this.alphaStrikeForceStats.structure = 4;
				} else if( this.tonnage >= 40 ) {
					this.alphaStrikeForceStats.structure = 3;
				} else if( this.tonnage >= 35 ) {
					this.alphaStrikeForceStats.structure = 3;
				} else if( this.tonnage >= 30 ) {
					this.alphaStrikeForceStats.structure = 3;
				} else if( this.tonnage >= 25 ) {
					this.alphaStrikeForceStats.structure = 2;
				} else if( this.tonnage >= 20 ) {
					this.alphaStrikeForceStats.structure = 2;
				} else if( this.tonnage >= 15 ) {
					this.alphaStrikeForceStats.structure = 1;
				} else if( this.tonnage >= 10 ) {
					this.alphaStrikeForceStats.structure = 1;
				}

				break;
		}
	}

	total_weapon_heat = 0;
	for( weapon_counter = 0; weapon_counter < this.equipmentList.length; weapon_counter++) {
		if( this.equipmentList[weapon_counter].alpha_strike ) {
			total_weapon_heat += this.alphaStrikeForceStats.heat
			this.alphaStrikeForceStats.range_short += this.equipmentList[weapon_counter].alpha_strike.range_short;
			this.alphaStrikeForceStats.range_medium += this.equipmentList[weapon_counter].alpha_strike.range_medium;
			this.alphaStrikeForceStats.range_long += this.equipmentList[weapon_counter].alpha_strike.range_long;
			this.alphaStrikeForceStats.range_extreme += this.equipmentList[weapon_counter].alpha_strike.range_extreme;
		}
	}
	if( this.getJumpSpeed() > 0 ) {
		if( this.getJumpSpeed() / 2 < 3 )
			total_weapon_heat += 3;
		else
			total_weapon_heat += this.getJumpSpeed() / 2;

	} else {
		total_weapon_heat += 2;
	}

	this.alphaStrikeForceStats.range_short = this.alphaStrikeForceStats.range_short.toFixed(0) /1;
	this.alphaStrikeForceStats.range_medium = this.alphaStrikeForceStats.range_medium.toFixed(0) /1;
	this.alphaStrikeForceStats.range_long = this.alphaStrikeForceStats.range_long.toFixed(0) /1;
	this.alphaStrikeForceStats.range_extreme = this.alphaStrikeForceStats.range_extreme.toFixed(0) /1;

	this.alphaStrikeValue = this.alphaStrikeForceStats.pv;
}

Mech.prototype._calcBattleValue = function() {
	// TODO Calculations



	this.battleValue = 0;
}

Mech.prototype._calcCBillCost = function() {
	// TODO Calculations



	this.cbillCost = 0;
}

Mech.prototype.getBattleValue = function() {
	return this.battleValue;
}

Mech.prototype.getAlphaStrikeValue = function() {
	return this.alphaStrikeValue;
}

Mech.prototype.getCBillCost = function() {
	return this.cbillCost;
}

Mech.prototype.getEngineWeight = function() {
	if( this.engine && this.engine.weight )
		return this.engine.weight.standard;
	else
		return 0;
}

Mech.prototype.getEngineRating = function() {
	if( this.engine && this.engine.rating )
		return this.engine.rating;
	else
		return 0;

}

Mech.prototype.getHeatSinks = function() {
	return 10 + this.additional_heat_sinks;
}

Mech.prototype.getHeatSinksWeight = function() {
	return 0 + this.additional_heat_sinks;
}

Mech.prototype.getGyroWeight = function() {
	switch( this.gyro ) {
		case "Compact":
			return Math.ceil(this.engine.rating / 100) * 1.5;
			break
		case "Heavy Duty":
			return Math.ceil(this.engine.rating / 100) * 2;

			break
		case "Extra-Light (XL)":
			return Math.ceil(this.engine.rating / 100) * 0.5;
			break
		default:
			return Math.ceil(this.engine.rating / 100);
			// TODO 4 slots to center torso
			break
	}
	return Math.ceil(this.engine.rating / 100);
}
Mech.prototype.getCockpitWeight = function() {
	return 3;
}

Mech.prototype.getInteralStructureWeight = function() {
	return this.tonnage / 10;
}

Mech.prototype.getJumpJetWeight = function() {
	if( this.jumpJetType == "Standard" ) {
		// standard
		if( this.tonnage <= 55) {
			// 10-55 tons
			return this.jumpSpeed * 0.5;
		} else if(this.tonnage <= 85) {
			// 60 - 85 tons
			return this.jumpSpeed * 1;
		} else {
			// 90+ tons
			return this.jumpSpeed * 2;
		}
	} else {
		// improved
		if( this.tonnage <= 55) {
			// 10-55 tons
			return this.jumpSpeed * 1;
		} else if(this.tonnage <= 85) {
			// 60 - 85 tons
			return this.jumpSpeed * 2;
		} else {
			// 90+ tons
			return this.jumpSpeed * 4;
		}
	}
}

Mech.prototype.getTranslation = function(langKey) {
	for( lang_count = 0; lang_count < available_languages.length; lang_count++ ) {
		if( available_languages[lang_count].short_code == this.useLang ) {

			if(available_languages[lang_count].translations[langKey] ) {
				return available_languages[lang_count].translations[langKey];
			} else {
				return langKey;
			}
		}
	}
}
Mech.prototype.getASCalcHTML = function() {
	return "<div class=\"callout alert\">TODO</div>";
},

Mech.prototype.getBVCalcHTML = function() {
	return "<div class=\"callout alert\">TODO</div>";
},

Mech.prototype.makeTROHTML = function() {

	html = "<table class=\"mech-tro\">";

	// Header Info
	html += "<tr><td colspan=\"4\">" + this.getTranslation("TRO_TYPE") + ": " + this.getName() + "</td></tr>";
	html += "<tr><td colspan=\"4\">" + this.getTranslation("TRO_TECHNOLOGY_BASE") + ": " + this.getTech().name[ this.useLang ] + "</td></tr>";
	html += "<tr><td colspan=\"4\">" + this.getTranslation("TRO_ERA") + ": " + this.getEra().name[ this.useLang ] + "</td></tr>";
	html += "<tr><td colspan=\"4\">" + this.getTranslation("TRO_TONNAGE") + ": " + this.getTonnage() + "</td></tr>";
	html += "<tr><td colspan=\"4\">" + this.getTranslation("TRO_BATTLE_VALUE") + ": " + this.getBattleValue() + "</td></tr>";
	html += "<tr><td colspan=\"4\">" + this.getTranslation("TRO_ALPHA_STRIKE_VALUE") + ": " + this.getAlphaStrikeValue() + "</td></tr>";
	html += "<tr><td colspan=\"4\">" + this.getTranslation("TRO_CBILL_COST") + ": $" + this.getCBillCost() + "</td></tr>";
	html += "<tr><td colspan=\"4\">&nbsp;</td></tr>";

	// Equipment
	html += "<tr><th class=\"text-left\" colspan=\"3\">" + this.getTranslation("TRO_EQUIPMENT") + "</th><th class=\"text-center\" colspan=\"1\">" + this.getTranslation("TRO_MASS") + "</th></tr>";
	html += "<tr><td colspan=\"3\">" + this.getTranslation("TRO_INTERNAL_STRUCTURE") + "</td><td class=\"text-center\" colspan=\"1\">" + this.getInteralStructureWeight() + "</td></tr>";
	html += "<tr><td colspan=\"1\">" + this.getTranslation("TRO_ENGINE") + "</td><td class=\"text-center\" colspan=\"2\">" + this.getEngineRating() + "</td><td class=\"text-center\" colspan=\"1\">" + this.getEngineWeight() + "</td></tr>";

	html += "<tr><td colspan=\"1\" class=\"text-right\">" + this.getTranslation("TRO_WALKING") + "</td><td class=\"text-center\" colspan=\"2\">" + this.getWalkSpeed() + "</td><td colspan=\"1\">&nbsp;</td></tr>";
	html += "<tr><td colspan=\"1\" class=\"text-right\">" + this.getTranslation("TRO_RUNNING") + "</td><td class=\"text-center\" colspan=\"2\">" + this.getRunSpeed() + "</td><td colspan=\"1\">&nbsp;</td></tr>";
	html += "<tr><td colspan=\"1\" class=\"text-right\">" + this.getTranslation("TRO_JUMPING") + "</td><td class=\"text-center\" colspan=\"2\">" + this.getJumpSpeed() + "</td><td colspan=\"1\">&nbsp;</td></tr>";

	html += "<tr><td colspan=\"1\">" + this.getTranslation("TRO_HEAT_SINKS") + "</td><td class=\"text-center\" colspan=\"2\">" + this.getHeatSinks() + "</td><td class=\"text-center\" colspan=\"1\">" + this.getHeatSinksWeight() + "</td></tr>";
	html += "<tr><td colspan=\"3\">" + this.getTranslation("TRO_GYRO") + "</td><td class=\"text-center\" colspan=\"1\">" + this.getGyroWeight() + "</td></tr>";
	html += "<tr><td colspan=\"3\">" + this.getTranslation("TRO_COCKPIT") + "</td><td class=\"text-center\" colspan=\"1\">" + this.getCockpitWeight() + "</td></tr>";

	if( this.getJumpJetWeight() > 0 )
		html += "<tr><td colspan=\"3\">" + this.getTranslation("TRO_JUMP_JETS") + "</td><td class=\"text-center\" colspan=\"1\">" + this.getJumpJetWeight() + "</td></tr>";

	html += "<tr><td colspan=\"1\">" + this.getTranslation("TRO_ARMOR_FACTOR") + "</td><td class=\"text-center\" colspan=\"2\">" + this.getTotalArmor() + "</td><td class=\"text-center\" colspan=\"1\">" + this.getArmorWeight() + "</td></tr>";


	// Armor Factor Table
	html += "<tr><td colspan=\"1\"></td><td class=\"text-center\" colspan=\"1\"><em style=\"font-size: 12px;\">" + this.getTranslation("TRO_ARMOR_IS") + "</em></td><td class=\"text-center\" colspan=\"1\"><em style=\"font-size: 12px;\">" + this.getTranslation("TRO_ARMOR_VALUE") + "</em></td><td>&nbsp;</td></tr>";
	html += "<tr><td  class=\"text-right\"colspan=\"1\">" + this.getTranslation("TRO_ARMOR_HD") + "</td><td class=\"text-center\" colspan=\"1\">" + this.internalStructure.head + "</td><td class=\"text-center\" colspan=\"1\">" + this.armorAllocation.head + "</td><td>&nbsp;</td></tr>";
	html += "<tr><td  class=\"text-right\"colspan=\"1\">" + this.getTranslation("TRO_ARMOR_CT") + "</td><td class=\"text-center\" colspan=\"1\">" + this.internalStructure.centerTorso + "</td><td class=\"text-center\" colspan=\"1\">" + this.armorAllocation.centerTorso + "</td><td>&nbsp;</td></tr>";
	html += "<tr><td  class=\"text-right\"colspan=\"1\">" + this.getTranslation("TRO_ARMOR_CTR") + "</td><td class=\"text-center\" colspan=\"1\">&nbsp;</td><td class=\"text-center\" colspan=\"1\">" + this.armorAllocation.centerTorsoRear + "</td><td>&nbsp;</td></tr>";
	if( this.armorAllocation.rightTorso == this.armorAllocation.leftTorso && this.armorAllocation.rightTorsoRear == this.armorAllocation.leftTorsoRear ) {
		html += "<tr><td  class=\"text-right\"colspan=\"1\">" + this.getTranslation("TRO_ARMOR_RLT") + "</td><td class=\"text-center\" colspan=\"1\">" + this.internalStructure.rightTorso + "</td><td class=\"text-center\" colspan=\"1\">" + this.armorAllocation.rightTorso + "</td><td>&nbsp;</td></tr>";
		html += "<tr><td  class=\"text-right\"colspan=\"1\">" + this.getTranslation("TRO_ARMOR_RLTR") + "</td><td class=\"text-center\" colspan=\"1\">&nbsp;</td><td class=\"text-center\" colspan=\"1\">" + this.armorAllocation.rightTorsoRear + "</td><td>&nbsp;</td></tr>";
	} else {
		html += "<tr><td  class=\"text-right\"colspan=\"1\">" + this.getTranslation("TRO_ARMOR_RT") + "</td><td class=\"text-center\" colspan=\"1\">" + this.internalStructure.rightTorso + "</td><td class=\"text-center\" colspan=\"1\">" + this.armorAllocation.rightTorso + "</td><td>&nbsp;</td></tr>";
		html += "<tr><td  class=\"text-right\"colspan=\"1\">" + this.getTranslation("TRO_ARMOR_RTR") + "</td><td class=\"text-center\" colspan=\"1\">&nbsp;</td><td class=\"text-center\" colspan=\"1\">" + this.armorAllocation.rightTorsoRear + "</td><td>&nbsp;</td></tr>";

		html += "<tr><td  class=\"text-right\"colspan=\"1\">" + this.getTranslation("TRO_ARMOR_LT") + "</td><td class=\"text-center\" colspan=\"1\">" + this.internalStructure.leftTorso + "</td><td class=\"text-center\" colspan=\"1\">" + this.armorAllocation.leftTorso + "</td><td>&nbsp;</td></tr>";
		html += "<tr><td  class=\"text-right\"colspan=\"1\">" + this.getTranslation("TRO_ARMOR_LTR") + "</td><td class=\"text-center\" colspan=\"1\">&nbsp;</td><td class=\"text-center\" colspan=\"1\">" + this.armorAllocation.leftTorsoRear + "</td><td>&nbsp;</td></tr>";
	}
	if( this.mech_type.class == "biped") {

		if( this.armorAllocation.rightArm == this.armorAllocation.leftArm) {
			html += "<tr><td  class=\"text-right\"colspan=\"1\">" + this.getTranslation("TRO_ARMOR_RLA") + "</td><td class=\"text-center\" colspan=\"1\">" + this.internalStructure.rightArm + "</td><td class=\"text-center\" colspan=\"1\">" + this.armorAllocation.rightArm + "</td><td>&nbsp;</td></tr>";
		} else {
			html += "<tr><td  class=\"text-right\"colspan=\"1\">" + this.getTranslation("TRO_ARMOR_RA") + "</td><td class=\"text-center\" colspan=\"1\">" + this.internalStructure.rightArm + "</td><td class=\"text-center\" colspan=\"1\">" + this.armorAllocation.rightArm + "</td><td>&nbsp;</td></tr>";
			html += "<tr><td  class=\"text-right\"colspan=\"1\">" + this.getTranslation("TRO_ARMOR_LA") + "</td><td class=\"text-center\" colspan=\"1\">" + this.internalStructure.leftArm + "</td><td class=\"text-center\" colspan=\"1\">" + this.armorAllocation.leftArm + "</td><td>&nbsp;</td></tr>";
		}

		if( this.armorAllocation.rightLeg == this.armorAllocation.leftLeg) {
			html += "<tr><td  class=\"text-right\"colspan=\"1\">" + this.getTranslation("TRO_ARMOR_RLL") + "</td><td class=\"text-center\" colspan=\"1\">" + this.internalStructure.rightLeg + "</td><td class=\"text-center\" colspan=\"1\">" + this.armorAllocation.rightLeg + "</td><td>&nbsp;</td></tr>";
		} else {
			html += "<tr><td  class=\"text-right\"colspan=\"1\">" + this.getTranslation("TRO_ARMOR_RL") + "</td><td class=\"text-center\" colspan=\"1\">" + this.internalStructure.rightLeg + "</td><td class=\"text-center\" colspan=\"1\">" + this.armorAllocation.rightLeg + "</td><td>&nbsp;</td></tr>";
			html += "<tr><td  class=\"text-right\"colspan=\"1\">" + this.getTranslation("TRO_ARMOR_LL") + "</td><td class=\"text-center\" colspan=\"1\">" + this.internalStructure.leftLeg + "</td><td class=\"text-center\" colspan=\"1\">" + this.armorAllocation.leftLeg + "</td><td>&nbsp;</td></tr>";
		}
	} else {
		if( this.armorAllocation.rightArm == this.armorAllocation.leftArm) {
			html += "<tr><td  class=\"text-right\"colspan=\"1\">" + this.getTranslation("TRO_ARMOR_RLFL") + "</td><td class=\"text-center\" colspan=\"1\">" + this.internalStructure.rightArm + "</td><td class=\"text-center\" colspan=\"1\">" + this.armorAllocation.rightArm + "</td><td>&nbsp;</td></tr>";
		} else {
			html += "<tr><td  class=\"text-right\"colspan=\"1\">" + this.getTranslation("TRO_ARMOR_RFL") + "</td><td class=\"text-center\" colspan=\"1\">" + this.internalStructure.rightArm + "</td><td class=\"text-center\" colspan=\"1\">" + this.armorAllocation.rightArm + "</td><td>&nbsp;</td></tr>";
			html += "<tr><td  class=\"text-right\"colspan=\"1\">" + this.getTranslation("TRO_ARMOR_LFL") + "</td><td class=\"text-center\" colspan=\"1\">" + this.internalStructure.leftArm + "</td><td class=\"text-center\" colspan=\"1\">" + this.armorAllocation.leftArm + "</td><td>&nbsp;</td></tr>";
		}

		if( this.armorAllocation.rightLeg == this.armorAllocation.leftLeg) {
			html += "<tr><td  class=\"text-right\"colspan=\"1\">" + this.getTranslation("TRO_ARMOR_RLRL") + "</td><td class=\"text-center\" colspan=\"1\">" + this.internalStructure.rightLeg + "</td><td class=\"text-center\" colspan=\"1\">" + this.armorAllocation.rightLeg + "</td><td>&nbsp;</td></tr>";
		} else {
			html += "<tr><td  class=\"text-right\"colspan=\"1\">" + this.getTranslation("TRO_ARMOR_RRL") + "</td><td class=\"text-center\" colspan=\"1\">" + this.internalStructure.rightLeg + "</td><td class=\"text-center\" colspan=\"1\">" + this.armorAllocation.rightLeg + "</td><td>&nbsp;</td></tr>";
			html += "<tr><td  class=\"text-right\"colspan=\"1\">" + this.getTranslation("TRO_ARMOR_RLL") + "</td><td class=\"text-center\" colspan=\"1\">" + this.internalStructure.leftLeg + "</td><td class=\"text-center\" colspan=\"1\">" + this.armorAllocation.leftLeg + "</td><td>&nbsp;</td></tr>";
		}
	}
	// End Factor Table
	html += "</table>";
	html += "<br />";
	html += "<table class=\"mech-tro\">";
	html += "<tr><th class=\"text-left\">" + this.getTranslation("TRO_WEAPONS_AND_AMMO") + "</th><th class=\"text-center\">" + this.getTranslation("TRO_LOCATION") + "</th><th class=\"text-center\">" + this.getTranslation("TRO_CRITICAL") + "</th><th class=\"text-center\">" + this.getTranslation("TRO_TONNAGE") + "</th></tr>";

	for( eq_count = 0; eq_count < this.equipmentList.length; eq_count++) {
		if( typeof( this.equipmentList[eq_count].location ) == "undefined" )
			this.equipmentList[eq_count].location = "n/a";

		item_location = "";
		item_location = this.getLocationAbbr( this.equipmentList[eq_count].location );
		html += "<tr><td class=\"text-left\">" + this.equipmentList[eq_count].name[ this.useLang ] + "</td><td class=\"text-center\">" + item_location + "</strong></td><td class=\"text-center\">" + this.equipmentList[eq_count].space.battlemech + "</td><td class=\"text-center\">" + this.equipmentList[eq_count].weight + "</td></tr>";
	}

	// TODO Weapons and Ammo
	html += "</table>";

	return html;
}
Mech.prototype.getLocationAbbr = function(location_tag) {


	for(loc_count = 0; loc_count < battlemechLocations.length; loc_count++) {
		if( location_tag == battlemechLocations[loc_count].tag ) {
			if( battlemechLocations[loc_count].abbr[ this.useLang ] != "undefined" )
				return battlemechLocations[loc_count].abbr[ this.useLang ];
			else
				return battlemechLocations[loc_count].abbr[ "en-US" ];
		}
	}
	return this.getTranslation("TRO_NOT_AVAILABLE") ;
}

Mech.prototype.clearMech = function() {
	this.setMechType(1);
	this.setTonnage(20);
	this._calc();
}

Mech.prototype._calc = function() {

	this.weights = Array();
	this.weights.push( {name:"Internal Structure", weight: this.getInteralStructureWeight() } );
	this.weights.push( {name: "Cockpit", weight: this.getCockpitWeight() } );

	this.runSpeed = Math.ceil(this.walkSpeed * 1.5);

	if( this.era == 0 ) {
		this.era = btEraOptions[1];
	}

	if( this.tech == 0 ) {
		this.tech = btTechOptions[0];
	}

	if( this.mech_type == 0 ) {
		this.mech_type = mechTypeOptions[0];
	}


	if( this.engine ) {
		this.weights.push( {name: "Standard Engine - " + this.engine.rating, weight: this.engine.weight.standard} );


		switch( this.gyro ) {
			case "Compact":
				this.weights.push( {name: "Compact Gyro", weight: this.getGyroWeight()} );
				// TODO 2 slots to center torso
				break
			case "Heavy Duty":
				this.weights.push( {name: "Heavy Duty Gyro", weight: Math.ceil(this.engine.rating / 100) * 2} );
				// TODO 4 slots to center torso
				break
			case "Extra-Light (XL)":
				this.weights.push( {name: "Extra-Light (XL) Gyro", weight: Math.ceil(this.engine.rating / 100) * 0.5} );
				// TODO 6 slots to center torso
				break
			default:
				this.weights.push( {name: "Standard Gyro", weight: Math.ceil(this.engine.rating / 100)} );
				// TODO 4 slots to center torso
				break
		}


	}

	if( this.jumpSpeed > 0) {
		if( this.jumpJetType == "Standard" ) {
			// standard
			this.weights.push( {name: "Jump Jets", weight: this.getJumpJetWeight() } );
		} else {
			// improved
			this.weights.push( {name: "Improved Jets", weight: this.getJumpJetWeight() } );
		}
	}

	this.total_armor = this.armorWeight * 16;

	if( this.total_armor > this.max_armor )
		this.total_armor = this.max_armor;

	this.weights.push( {name: "Armor", weight: this.armorWeight} );
	this.unallocated_armor = this.total_armor;
	this.unallocated_armor -= this.armorAllocation.head;

	this.unallocated_armor -= this.armorAllocation.centerTorso;
	this.unallocated_armor -= this.armorAllocation.leftTorso;
	this.unallocated_armor -= this.armorAllocation.rightTorso;

	this.unallocated_armor -= this.armorAllocation.centerTorsoRear;
	this.unallocated_armor -= this.armorAllocation.leftTorsoRear;
	this.unallocated_armor -= this.armorAllocation.rightTorsoRear;

	this.unallocated_armor -= this.armorAllocation.rightArm;
	this.unallocated_armor -= this.armorAllocation.leftArm;

	this.unallocated_armor -= this.armorAllocation.rightLeg;
	this.unallocated_armor -= this.armorAllocation.leftLeg;


	if( this.additional_heat_sinks > 0)
		this.weights.push( {name: "Additional Heat Sinks", weight: this.additional_heat_sinks} );

	for( eq_count = 0; eq_count < this.equipmentList.length; eq_count++) {
		this.weights.push( {name: this.equipmentList[eq_count].name + " (" + this.equipmentList[eq_count].location  + ")", weight: this.equipmentList[eq_count].weight} );
	}

	this.current_tonnage = 0;
	for( weight_counter = 0; weight_counter < this.weights.length; weight_counter++)
		this.current_tonnage += this.weights[weight_counter].weight;

	this.remaining_tonnage = this.tonnage - this.current_tonnage;

	this.heat_sink_criticals = {};
	this.heat_sink_criticals.number = 0;
	this.heat_sink_criticals.slots_type = "single slot";
	this.heat_sink_criticals.slots_each = 1;

	if( this.heat_sink_type == "double") {
		if( this.tech.tag == "clan") {
			this.heat_sink_criticals.slots_type = "double slot";
			this.heat_sink_criticals.slots_each = 2;
		} else {
			this.heat_sink_criticals.slots_type = "triple slot";
			this.heat_sink_criticals.slots_each = 3;
		}
		this.heat_dissipation = (this.additional_heat_sinks + 10) * 2;
	} else {
		this.heat_sink_criticals.slots_type = "single";
		this.heat_sink_criticals.slots_each = 1;
		this.heat_dissipation = this.additional_heat_sinks + 10;
	}

	if( this.getEngine().rating ) {
		this.heat_sink_criticals.number =  this.additional_heat_sinks + 10  -  Math.floor(this.getEngine().rating / 25);
	} else {
		this.heat_sink_criticals.number = 0
	}

	this._calcAlphaStrike();
	this._calcBattleValue();
	this._calcCBillCost();
}

Mech.prototype.getHeatSinksType = function() {
	return this.heat_sink_type;
}

Mech.prototype.setHeatSinksType = function(newValue) {
	this.heat_sink_type = newValue;
	return this.heat_sink_type;
}


Mech.prototype.getCurrentTonnage = function() {
	return this.current_tonnage;
}

Mech.prototype.getHeatSinkCriticalRequirements = function() {

	return this.heat_sink_criticals;
}


Mech.prototype.getArmorAllocations = function() {
	return this.armorAllocation;
}

Mech.prototype.getRemainingTonnage = function() {
	return this.remaining_tonnage;
}

Mech.prototype.getWalkSpeed = function() {
	return this.walkSpeed;
}

Mech.prototype.setWalkSpeed = function(walkSpeed) {
	this.walkSpeed = walkSpeed / 1;
	this.setEngine( this.tonnage * this.walkSpeed );

	if( this.jumpSpeed > this.walkSpeed )
		this.setJumpSpeed( this.walkSpeed );

	return this.walkSpeed;
}

Mech.prototype.getRunSpeed = function() {
	return this.runSpeed;
}

Mech.prototype.getJumpSpeed = function() {
	return this.jumpSpeed;
}

Mech.prototype.setJumpSpeed = function(jumpSpeed) {
	this.jumpSpeed = jumpSpeed / 1;
	this._calc();
	return this.walkSpeed;
}

Mech.prototype.getArmorWeight = function() {
	return this.armorWeight;
}

Mech.prototype.getTotalArmor = function() {
	return this.total_armor;
}


Mech.prototype.getUnallocatedArmor = function() {
	return this.unallocated_armor;
}

Mech.prototype.setArmorWeight = function(armorWeight) {
	this.armorWeight = armorWeight / 1;
	this._calc();
	return this.armorWeight;
}

Mech.prototype.getEngine = function() {
	return this.engine;
}

Mech.prototype.setEngine = function(ratingNumber) {
	ratingNumber = ratingNumber / 1;
	for( engine_count = 0; engine_count < mechEngineOptions.length; engine_count++ ) {
		if( mechEngineOptions[engine_count].rating == ratingNumber) {
			this.engine = mechEngineOptions[engine_count];
			this._calc();
			return this.engine;
		}
	}
	this._calc();
	return 0;
}

Mech.prototype.setGyro = function( gyroType )  {
	this.gyro = gyroType;
	this._calc();
	return this.gyro;
}

Mech.prototype.getGyro = function()  {
	return this.gyro;
}


Mech.prototype.getEra = function()  {
	return this.era;
}

Mech.prototype.setEra = function( eraID )  {

	for( lcounter = 0; lcounter < btEraOptions.length; lcounter++) {
		if( eraID == btEraOptions[lcounter].id ) {
			this.era = btEraOptions[lcounter];
			this._calc();
			return this.era;
		}
	}
	return null;
}


Mech.prototype.getTech = function()  {
	return this.tech;
}

Mech.prototype.setTech = function( techID )  {
	for( lcounter = 0; lcounter < btTechOptions.length; lcounter++) {
		if( techID == btTechOptions[lcounter].id ) {
			this.tech = btTechOptions[lcounter];
			this._calc();
			return this.tech;
		}
	}
	return null;
}


Mech.prototype.getMechType = function()  {
	return this.mech_type;
}

Mech.prototype.setMechType = function( typeID )  {
	for( lcounter = 0; lcounter < mechTypeOptions.length; lcounter++) {
		if( typeID == mechTypeOptions[lcounter].id ) {
			this.mech_type = mechTypeOptions[lcounter];
			this.setTonnage( this.tonnage );
			this._calc();
			return this.mech_type;
		}
	}

	return null;
}

Mech.prototype.setEngineType = function(engineType) {
	this.engineType = engineType;
	this._calc();
	return this.engine;
}

Mech.prototype.getEngineType = function() {
	return this.engineType;
}

Mech.prototype.getName = function() {
	return this.make;
}

Mech.prototype.setName = function(newValue) {
	this.make = newValue;
	return this.make;
}

Mech.prototype.getTonnage = function() {
	return this.tonnage;
}

Mech.prototype.setTonnage = function(newValue) {
	this.tonnage = parseInt(newValue);

	switch( this.tonnage ) {
		case 20:
			this.internalStructure.head = 3;

			this.internalStructure.centerTorso = 6;
			this.internalStructure.leftTorso = 5;
			this.internalStructure.rightTorso = 5;

			this.internalStructure.rightArm = 3;
			this.internalStructure.leftArm = 3;

			this.internalStructure.rightLeg = 4;
			this.internalStructure.leftLeg = 4;



			if( this.mech_type.class.toLowerCase() == "biped")
				this.max_armor = 69;
			else
				this.max_armor = 73;

			break;
		case 25:
			this.internalStructure.head = 3;

			this.internalStructure.centerTorso = 8;
			this.internalStructure.leftTorso = 6;
			this.internalStructure.rightTorso = 6;

			this.internalStructure.rightArm = 4;
			this.internalStructure.leftArm = 4;

			this.internalStructure.rightLeg = 6;
			this.internalStructure.leftLeg = 6;

			if( this.mech_type.class.toLowerCase() == "biped")
				this.max_armor = 89;
			else
				this.max_armor = 97;

			break;
		case 30:
			this.internalStructure.head = 3;

			this.internalStructure.centerTorso = 10;
			this.internalStructure.leftTorso = 7;
			this.internalStructure.rightTorso = 7;

			this.internalStructure.rightArm = 5;
			this.internalStructure.leftArm = 5;

			this.internalStructure.rightLeg = 7;
			this.internalStructure.leftLeg = 7;

			if( this.mech_type.class.toLowerCase() == "biped")
				this.max_armor = 105;
			else
				this.max_armor = 113;

			break;

		case 35:
			this.internalStructure.head = 3;

			this.internalStructure.centerTorso = 11;
			this.internalStructure.leftTorso = 8;
			this.internalStructure.rightTorso = 8;

			this.internalStructure.rightArm = 6;
			this.internalStructure.leftArm = 6;

			this.internalStructure.rightLeg = 8;
			this.internalStructure.leftLeg = 8;

			if( this.mech_type.class.toLowerCase() == "biped")
				this.max_armor = 119;
			else
				this.max_armor = 127;

			break;

		case 40:
			this.internalStructure.head = 3;

			this.internalStructure.centerTorso = 12;
			this.internalStructure.leftTorso = 10;
			this.internalStructure.rightTorso = 10;

			this.internalStructure.rightArm = 6;
			this.internalStructure.leftArm = 6;

			this.internalStructure.rightLeg = 10;
			this.internalStructure.leftLeg = 10;

			if( this.mech_type.class.toLowerCase() == "biped")
				this.max_armor = 137;
			else
				this.max_armor = 153;

			break;

		case 45:
			this.internalStructure.head = 3;

			this.internalStructure.centerTorso = 14;
			this.internalStructure.leftTorso = 11;
			this.internalStructure.rightTorso = 11;

			this.internalStructure.rightArm = 7;
			this.internalStructure.leftArm = 7;

			this.internalStructure.rightLeg = 11;
			this.internalStructure.leftLeg = 11;

			if( this.mech_type.class.toLowerCase() == "biped")
				this.max_armor = 153;
			else
				this.max_armor = 169;

			break;

		case 50:
			this.internalStructure.head = 3;

			this.internalStructure.centerTorso = 16;
			this.internalStructure.leftTorso = 12;
			this.internalStructure.rightTorso = 12;

			this.internalStructure.rightArm = 8;
			this.internalStructure.leftArm = 8;

			this.internalStructure.rightLeg = 12;
			this.internalStructure.leftLeg = 12;

			if( this.mech_type.class.toLowerCase() == "biped")
				this.max_armor = 169;
			else
				this.max_armor = 185;


			break;

		case 55:
			this.internalStructure.head = 3;

			this.internalStructure.centerTorso = 18;
			this.internalStructure.leftTorso = 13;
			this.internalStructure.rightTorso = 13;

			this.internalStructure.rightArm = 9;
			this.internalStructure.leftArm = 9;

			this.internalStructure.rightLeg = 13;
			this.internalStructure.leftLeg = 13;


			if( this.mech_type.class.toLowerCase() == "biped")
				this.max_armor = 285;
			else
				this.max_armor = 201;

			break;

		case 60:
			this.internalStructure.head = 3;

			this.internalStructure.centerTorso = 20;
			this.internalStructure.leftTorso = 14;
			this.internalStructure.rightTorso = 14;

			this.internalStructure.rightArm = 10;
			this.internalStructure.leftArm = 10;

			this.internalStructure.rightLeg = 14;
			this.internalStructure.leftLeg = 14;

			if( this.mech_type.class.toLowerCase() == "biped")
				this.max_armor = 201;
			else
				this.max_armor = 217;


		break;
		case 65:
			this.internalStructure.head = 3;

			this.internalStructure.centerTorso = 21;
			this.internalStructure.leftTorso = 15;
			this.internalStructure.rightTorso = 15;

			this.internalStructure.rightArm = 10;
			this.internalStructure.leftArm = 10;

			this.internalStructure.rightLeg = 15;
			this.internalStructure.leftLeg = 15;

			if( this.mech_type.class.toLowerCase() == "biped")
				this.max_armor = 211;
			else
				this.max_armor = 231;


		break;
		case 70:
			this.internalStructure.head = 3;

			this.internalStructure.centerTorso = 22;
			this.internalStructure.leftTorso = 15;
			this.internalStructure.rightTorso = 15;

			this.internalStructure.rightArm = 11;
			this.internalStructure.leftArm = 11;

			this.internalStructure.rightLeg = 15;
			this.internalStructure.leftLeg = 15;

			if( this.mech_type.class.toLowerCase() == "biped")
				this.max_armor = 213;
			else
				this.max_armor = 233;


		break;
		case 75:
			this.internalStructure.head = 3;

			this.internalStructure.centerTorso = 23;
			this.internalStructure.leftTorso = 16;
			this.internalStructure.rightTorso = 16;

			this.internalStructure.rightArm = 12;
			this.internalStructure.leftArm = 12;

			this.internalStructure.rightLeg = 16;
			this.internalStructure.leftLeg = 16;

			if( this.mech_type.class.toLowerCase() == "biped")
				this.max_armor = 231;
			else
				this.max_armor = 247;


		break;
		case 80:
			this.internalStructure.head = 3;

			this.internalStructure.centerTorso = 25;
			this.internalStructure.leftTorso = 17;
			this.internalStructure.rightTorso = 17;

			this.internalStructure.rightArm = 13;
			this.internalStructure.leftArm = 13;

			this.internalStructure.rightLeg = 17;
			this.internalStructure.leftLeg = 17;


			if( this.mech_type.class.toLowerCase() == "biped")
				this.max_armor = 247;
			else
				this.max_armor = 263;

			break;
		case 85:
			this.internalStructure.head = 3;

			this.internalStructure.centerTorso = 27;
			this.internalStructure.leftTorso = 18;
			this.internalStructure.rightTorso = 18;

			this.internalStructure.rightArm = 14;
			this.internalStructure.leftArm = 14;

			this.internalStructure.rightLeg = 18;
			this.internalStructure.leftLeg = 18;


			if( this.mech_type.class.toLowerCase() == "biped")
				this.max_armor = 263;
			else
				this.max_armor = 279;

			break;

		case 90:
			this.internalStructure.head = 3;

			this.internalStructure.centerTorso = 29;
			this.internalStructure.leftTorso = 19;
			this.internalStructure.rightTorso = 19;

			this.internalStructure.rightArm = 15;
			this.internalStructure.leftArm = 15;

			this.internalStructure.rightLeg = 19;
			this.internalStructure.leftLeg = 19;

			if( this.mech_type.class.toLowerCase() == "biped")
				this.max_armor = 279;
			else
				this.max_armor = 295;


			break;
		case 95:
			this.internalStructure.head = 3;

			this.internalStructure.centerTorso = 30;
			this.internalStructure.leftTorso = 20;
			this.internalStructure.rightTorso = 20;

			this.internalStructure.rightArm = 16;
			this.internalStructure.leftArm = 16;

			this.internalStructure.rightLeg = 20;
			this.internalStructure.leftLeg = 20;

			if( this.mech_type.class.toLowerCase() == "biped")
				this.max_armor = 293;
			else
				this.max_armor = 309;


			break;
		case 100:
			this.internalStructure.head = 3;

			this.internalStructure.centerTorso = 31;
			this.internalStructure.leftTorso = 21;
			this.internalStructure.rightTorso = 21;

			this.internalStructure.rightArm = 17;
			this.internalStructure.leftArm = 17;

			this.internalStructure.rightLeg = 21;
			this.internalStructure.leftLeg = 21;

			if( this.mech_type.class.toLowerCase() == "biped")
				this.max_armor = 307;
			else
				this.max_armor = 323;

			break;

		default:
			// error
			break;
	}

	if( this.mech_type.class.toLowerCase() == "quad") {
		this.internalStructure.rightArm = this.internalStructure.rightLeg;
		this.internalStructure.leftArm = this.internalStructure.leftLeg;
	}

	this.max_armor_tonnage = this.max_armor / 16;

	this.setWalkSpeed( this.walkSpeed );
	this._calc();

	return this.tonnage;
}


Mech.prototype.getMaxArmorTonnage = function() {
	return this.max_armor_tonnage;
}

Mech.prototype.getMaxArmor = function() {
	return this.max_armor;
}


Mech.prototype.getType = function() {
	return this.mech_type;
}

Mech.prototype.setType = function(newValue) {
	this.mech_type = newValue;
	this.setTonnage( this.tonnage );
	this._calc();
	return this.mech_type;
}

Mech.prototype.calcBattleValue = function() {
	// TODO
}

Mech.prototype.calcAlphaStrikeValue = function() {
	// TODO
}

Mech.prototype.exportJSON = function() {
	// TODO
	this._calc();
	var export_object = {};
	export_object.name = this.getName();
	export_object.tonnage = this.getTonnage();
	export_object.walkSpeed = this.walkSpeed;
	export_object.jumpSpeed = this.jumpSpeed;
	export_object.engineType = this.getEngineType();

	export_object.mech_type = this.mech_type.id;
	export_object.era = this.era.id;
	export_object.tech = this.tech.id;

	export_object.additional_heat_sinks = this.additional_heat_sinks;
	export_object.heat_sink_type = this.heat_sink_type;

	export_object.armor_weight = this.armorWeight;
	if(!this.uuid)
		this.uuid = generateUUID();

	export_object.uuid = this.uuid;


	export_object.armor_allocation = this.armorAllocation;

	export_object.equipment = Array();

	for( eq_count = 0; eq_count < this.equipmentList.length; eq_count++) {
		export_object.equipment.push(
			{
				tag: this.equipmentList[eq_count].tag,
				loc: this.equipmentList[eq_count].location
			}
		);
	}

	return JSON.stringify(export_object);
}

Mech.prototype.getInteralStructure = function() {
	return this.internalStructure;
}

Mech.prototype.importJSON = function(json_string) {
	// TODO
	import_object = JSON.parse( json_string );

	if( typeof(import_object) == "object") {
			this.setName( import_object.name );
			if( import_object.mech_type )
				this.setMechType( import_object.mech_type );

			this.setTonnage( import_object.tonnage );

			if( import_object.walkSpeed )
				this.setWalkSpeed( import_object.walkSpeed );

			if( import_object.jumpSpeed )
				this.setJumpSpeed( import_object.jumpSpeed );

			if( import_object.engineType )
				this.setEngineType( import_object.engineType );

			if( import_object.additional_heat_sinks )
				this.setAdditionalHeatSinks( import_object.additional_heat_sinks );

			if( import_object.heat_sink_type )
				this.setHeatSinksType( import_object.heat_sink_type );

			if( import_object.era )
				this.setEra( import_object.era );

			if( import_object.tech )
				this.setTech( import_object.tech );

			if( import_object.armor_weight )
				this.setArmorWeight( import_object.armor_weight );

			if( import_object.armor_allocation )
				this.armorAllocation = import_object.armor_allocation;

			if( import_object.uuid )
				this.uuid = import_object.uuid;

			if( import_object.equipment ) {
				for( eq_count = 0; eq_count < import_object.equipment.length; eq_count++) {

					import_item = import_object.equipment[eq_count];
					// if( this.getTech().tag == "is")
					// 	this.addEquipmentFromTag( import_item.tag, import_item.loc );
					// if( this.getTech().tag == "clan")
					// 	this.addEquipmentFromTag( import_item.tag), null, import_item.loc );
					this.addEquipmentFromTag( import_item.tag, this.getTech().tag, import_item.loc );
				}
			}

			this._calc();
			return true;
	} else {
			return false;
	}

}

Mech.prototype.getWeightBreakdown = function() {
	return this.weights;
}

Mech.prototype.setCenterTorsoArmor = function( armorValue ) {
	this.armorAllocation.centerTorso = armorValue / 1;
	this._calc();
	return this.armorAllocation.centerTorso;
}

Mech.prototype.setCenterTorsoRearArmor = function( armorValue ) {
	this.armorAllocation.centerTorsoRear = armorValue / 1;
	this._calc();
	return this.armorAllocation.centerTorsoRear;
}

Mech.prototype.setHeadArmor = function( armorValue ) {
	this.armorAllocation.head = armorValue / 1;
	this._calc();
	return this.armorAllocation.head;
}

Mech.prototype.setLeftArmArmor = function( armorValue ) {
	this.armorAllocation.leftArm = armorValue / 1;
	this._calc();
	return this.armorAllocation.leftArm;
}

Mech.prototype.setLeftLegArmor = function( armorValue ) {
	this.armorAllocation.leftLeg = armorValue / 1;
	this._calc();
	return this.armorAllocation.leftLeg;
}

Mech.prototype.setLeftTorsoArmor = function( armorValue ) {
	this.armorAllocation.leftTorso = armorValue / 1;
	this._calc();
	return this.armorAllocation.leftTorso;
}

Mech.prototype.setLeftTorsoRearArmor = function( armorValue ) {
	this.armorAllocation.leftTorsoRear = armorValue / 1;
	this._calc();
	return this.armorAllocation.leftTorsoRear;
}

Mech.prototype.setRightArmArmor = function( armorValue ) {
	this.armorAllocation.rightArm = armorValue / 1;
	this._calc();
	return this.armorAllocation.rightArm;
}

Mech.prototype.setRightLegArmor = function( armorValue ) {
	this.armorAllocation.rightLeg = armorValue / 1;
	this._calc();
	return this.armorAllocation.rightLeg;
}

Mech.prototype.setRightTorsoArmor = function( armorValue ) {
	this.armorAllocation.rightTorso = armorValue / 1;
	this._calc();
	return this.armorAllocation.rightTorso;
}

Mech.prototype.setRightTorsoRearArmor = function( armorValue ) {
	this.armorAllocation.rightTorsoRear = armorValue / 1;
	this._calc();
	return this.armorAllocation.rightTorsoRear;
}

Mech.prototype.getAdditionalHeatSinks = function() {
	return this.additional_heat_sinks;
};


Mech.prototype.addEquipment = function(equipment_index, equipment_list_tag, location) {
	equipment_list = Array();
	if( equipment_list_tag == "is") {
		equipment_list = mechISEquipment;

	}

	if( equipment_list_tag == "clan" ){
		equipment_list = mechClanEquipment;
	}

	if( equipment_list[equipment_index] ) {
		if( typeof(jQuery) != "undefined" ) {
			equipment_item = jQuery.extend({}, equipment_list[equipment_index]);
		}
		if( typeof(angular) != "undefined" ) {
			equipment_item = angular.copy(equipment_list[add_counter] );
		}
		if( typeof(location) != "undefined" )
			equipment_item.location = location;
		this.equipmentList.push( equipment_item );
		return equipment_item;
	}

	return null;
};

Mech.prototype.addEquipmentFromTag = function(equipment_tag, equipment_list_tag, location) {
	equipment_list = Array();

	if( !equipment_list_tag ) {
		equipment_list_tag = this.tech.tag;
	}

	if( equipment_list_tag == "is") {
		equipment_list = mechISEquipment;

	}

	if( equipment_list_tag == "clan" ){
		equipment_list = mechClanEquipment;
	}

	for( add_counter = 0; add_counter < equipment_list.length; add_counter++) {
		if( equipment_tag == equipment_list[add_counter].tag ) {
			if( typeof(jQuery) != "undefined" ) {
				equipment_item = jQuery.extend({}, equipment_list[equipment_index]);
			}
			if( typeof(angular) != "undefined" ) {
				equipment_item = angular.copy(equipment_list[add_counter] );
			}
			if( typeof(location) != "undefined" )
				equipment_item.location = location;
			this.equipmentList.push( equipment_item );
			return equipment_item;
		}
	}

	return null;
};

Mech.prototype.removeEquipment = function(equipment_index) {
	if( this.equipmentList[equipment_index] ) {
		this.equipmentList.splice(equipment_index, 1);
		return 1;
	}
	return null;
};

Mech.prototype.setEquipmentLocation = function(equipment_index, location) {
	if( this.equipmentList[equipment_index] ) {
		this.equipmentList[equipment_index].location = location;
		return this.equipmentList[equipment_index];
	}
	return null;
};

Mech.prototype.setAdditionalHeatSinks = function(newValue) {
	this.additional_heat_sinks = newValue / 1;
	this._calc();
	return this.additional_heat_sinks;
};

Mech.prototype.getInstalledEquipment = function() {
	return this.equipmentList;
};
angular.module("baseApp").controller(
	"battlemechCreatorControllerStep1",
	[
		'$rootScope',
		'$translate',
		'$scope',
		function ($rootScope, $translate, $scope) {
			// Set Page Title Tag
			$translate(
				[
					'APP_TITLE', 'BM_STEP1_TITLE', 'BM_STEP1_DESC', 'WELCOME_BUTTON_MECH_CREATOR'
				]
			).then(function (translation) {
				$rootScope.title_tag = translation.BM_STEP1_TITLE + " | " + translation.APP_TITLE;
				if( translation.BM_STEP1_DESC )
					$scope.h3_title = translation.BM_STEP1_TITLE + ": " + translation.BM_STEP1_DESC;
				else
					$scope.h3_title = translation.BM_STEP1_TITLE;

				$rootScope.subtitle_tag = "&raquo; " + translation.WELCOME_BUTTON_MECH_CREATOR;
			});

			// create mech object, load from localStorage if exists
			current_mech = new Mech();

			if( localStorage["tmp.current_mech"] )
				current_mech.importJSON( localStorage["tmp.current_mech"] );
			else
				current_mech.uuid = generateUUID();

			current_mech.useLang = localStorage["tmp.preferred_language"];


			update_mech_status_bar_and_tro($scope, $translate, current_mech);

			// fill out current data in forms
			$scope.mech_name = current_mech.getName();
			translated_btTechOptions = [];
			translated_mechTypeOptions = [];
			translated_btEraOptions = [];

			for( var filter_counter = 0; filter_counter < btTechOptions.length; filter_counter++) {
				var push = Object.create(btTechOptions[filter_counter]);
				if( push.name[ localStorage["tmp.preferred_language"] ] ) {
					push.name = push.name[ localStorage["tmp.preferred_language"] ];
					translated_btTechOptions.push( push );
				} else {
					push.name = "( " + localStorage["tmp.preferred_language"] + " - " + push.name["en-US"] + ")";
					translated_btTechOptions.push( push );
				}
			}

			for( var filter_counter = 0; filter_counter < mechTypeOptions.length; filter_counter++) {
				var push = Object.create(mechTypeOptions[filter_counter]);
				if( push.name[localStorage["tmp.preferred_language"]] ) {
					push.name = push.name[localStorage["tmp.preferred_language"]];
					translated_mechTypeOptions.push( push );
				} else {
					push.name = "( " + localStorage["tmp.preferred_language"] + " - " + push.name["en-US"] + ")";
					translated_mechTypeOptions.push( push );
				}
			}

			for( var filter_counter = 0; filter_counter < btEraOptions.length; filter_counter++) {
				var push = Object.create(btEraOptions[filter_counter]);
				if( push.name[localStorage["tmp.preferred_language"]] ) {
					push.name = push.name[localStorage["tmp.preferred_language"]];
					translated_btEraOptions.push( push );
				} else {
					push.name = "( " + localStorage["tmp.preferred_language"] + " - " + push.name["en-US"] + ")";
					translated_btEraOptions.push( push );
				}
			}

			$scope.mech_tech = {
				availableOptions: translated_btTechOptions,
				selectedOption: current_mech.getTech()
			};

			$scope.mech_type = {
				availableOptions: translated_mechTypeOptions,
				selectedOption: current_mech.getType()
			};

			$scope.mech_era = {
				availableOptions: translated_btEraOptions,
				selectedOption: current_mech.getEra()
			};

			var tonnageOptions = [];

			for(var tonnage = 20;	tonnage <= 100; tonnage = tonnage + 5) {
				tonnageOptions.push(tonnage);
			}

			$scope.mech_tonnage_options = tonnageOptions;
			// $scope.mech_tonnage.selectedOption = current_mech.getTonnage();
			$scope.mech_tonnage = {
				availableOptions: tonnageOptions,
				selectedOption: current_mech.getTonnage()
			};
			// make tro for sidebar


			// update functions
			$scope.update_mech_name = function() {
				current_mech.setName( $scope.mech_name );
				localStorage["tmp.current_mech"] = current_mech.exportJSON();

				update_mech_status_bar_and_tro($scope, $translate, current_mech);
			};

			$scope.update_mech_tech = function() {
				current_mech.setTech( $scope.mech_tech.selectedOption.id );
				localStorage["tmp.current_mech"] = current_mech.exportJSON();

				update_mech_status_bar_and_tro($scope, $translate, current_mech);
			};

			$scope.update_mech_type = function() {
				current_mech.setMechType( $scope.mech_type.selectedOption.id );
				localStorage["tmp.current_mech"] = current_mech.exportJSON();

				update_mech_status_bar_and_tro($scope, $translate, current_mech);
			};

			$scope.update_mech_era = function() {
				current_mech.setEra( $scope.mech_era.selectedOption.id );
				localStorage["tmp.current_mech"] = current_mech.exportJSON();

				update_mech_status_bar_and_tro($scope, $translate, current_mech);
			};

			$scope.update_mech_tonnage = function() {
				current_mech.setTonnage( $scope.mech_tonnage.selectedOption );
				localStorage["tmp.current_mech"] = current_mech.exportJSON();

				update_mech_status_bar_and_tro($scope, $translate, current_mech);
			};

		}
	]
);

angular.module("baseApp").controller(
	"battlemechCreatorControllerStep2",
	[
		'$rootScope',
		'$translate',
		'$scope',
		function ($rootScope, $translate, $scope) {

			// Set Page Title Tag
			$translate(['APP_TITLE', 'BM_STEP2_TITLE', 'BM_STEP2_DESC', 'WELCOME_BUTTON_MECH_CREATOR' ]).then(function (translation) {
				$rootScope.title_tag = translation.BM_STEP2_TITLE + " | " + translation.APP_TITLE;
				if( translation.BM_STEP2_DESC )
					$scope.h3_title = translation.BM_STEP2_TITLE + ": " + translation.BM_STEP2_DESC;
				else
					$scope.h3_title = translation.BM_STEP2_TITLE;

				$rootScope.subtitle_tag = "&raquo; " + translation.WELCOME_BUTTON_MECH_CREATOR;
			});

			// create mech object, load from localStorage if exists
			current_mech = new Mech();

			if( localStorage["tmp.current_mech"] )
				current_mech.importJSON( localStorage["tmp.current_mech"] );
			else
				current_mech.uuid = generateUUID();

			current_mech.useLang = localStorage["tmp.preferred_language"];

			update_walking_jumping_dropdowns( $scope, $translate, current_mech );
			update_mech_status_bar_and_tro($scope, $translate, current_mech);

			// make tro for sidebar


			$scope.update_mech_walking = function() {
				current_mech.setWalkSpeed( $scope.mech_walking.selectedOption.id );
				localStorage["tmp.current_mech"] = current_mech.exportJSON();

				update_walking_jumping_dropdowns( $scope, $translate, current_mech );
				update_mech_status_bar_and_tro($scope, $translate, current_mech);
			}

			$scope.update_mech_jumping = function() {
				current_mech.setJumpSpeed( $scope.mech_jumping.selectedOption.id );
				localStorage["tmp.current_mech"] = current_mech.exportJSON();

				update_walking_jumping_dropdowns( $scope, $translate, current_mech );
				update_mech_status_bar_and_tro($scope, $translate, current_mech);
			}
		}
	]
);

function update_walking_jumping_dropdowns( $scope, $translate, current_mech ) {

	$translate(['BM_STEP2_SELECT_WALK', 'BM_STEP2_SELECT_JUMP', 'BM_MP_ABBR' ]).then(function (translation) {
		availble_walking_mp = [];
		availble_jumping_mp = [];
		selected_walking_mp = 0;
		selected_jumping_mp = 0;

		// TODO calculate the max engine size for tonnage
		max_walking = (400/ current_mech.tonnage);
		max_jumping = current_mech.getWalkSpeed();

		for( m_counter = 0; m_counter <= max_walking; m_counter++) {
			if( m_counter == 0 ) {
				availble_walking_mp.push( { id: m_counter, name: "- " + translation.BM_STEP2_SELECT_WALK + " -"} );
				if( current_mech.getWalkSpeed() == m_counter) {
					selected_walking_mp = { id: m_counter, name: "- " + translation.BM_STEP2_SELECT_WALK + " -"};
				}
			} else {
				availble_walking_mp.push( { id: m_counter, name: m_counter + " " + translation.BM_MP_ABBR} );
				if( current_mech.getWalkSpeed() == m_counter) {
					selected_walking_mp = { id: m_counter, name: m_counter + " " + translation.BM_MP_ABBR};
				}
			}
		}

		for( m_counter = 0; m_counter <= max_jumping; m_counter++) {
			if( m_counter == 0 ) {
				availble_jumping_mp.push( { id: m_counter, name: "- " + translation.BM_STEP2_SELECT_JUMP + " -"} );
				if( current_mech.getJumpSpeed() == m_counter) {
					selected_jumping_mp = { id: m_counter, name: "- " + translation.BM_STEP2_SELECT_JUMP + " -"};
				}
			} else {
				availble_jumping_mp.push( { id: m_counter, name: m_counter + " " + translation.BM_MP_ABBR} );
				if( current_mech.getJumpSpeed() == m_counter) {
					selected_jumping_mp = { id: m_counter, name: m_counter + " " + translation.BM_MP_ABBR};
				}
			}
		}

		$scope.mech_jumping = {
			availableOptions: availble_jumping_mp,
			selectedOption: selected_jumping_mp
		}

		$scope.mech_walking = {
			availableOptions: availble_walking_mp,
			selectedOption: selected_walking_mp
		}
	});
}


angular.module("baseApp").controller(
	"battlemechCreatorControllerStep3",
	[
		'$rootScope',
		'$translate',
		'$scope',
		function ($rootScope, $translate, $scope) {
			// Set Page Title Tag
			$translate(['APP_TITLE', 'BM_STEP3_TITLE', 'BM_STEP3_DESC', 'WELCOME_BUTTON_MECH_CREATOR' ]).then(function (translation) {
				$rootScope.title_tag = translation.BM_STEP3_TITLE + " | " + translation.APP_TITLE;
				if( translation.BM_STEP3_DESC )
					$scope.h3_title = translation.BM_STEP3_TITLE + ": " + translation.BM_STEP3_DESC;
				else
					$scope.h3_title = translation.BM_STEP3_TITLE;
				$rootScope.subtitle_tag = "&raquo; " + translation.WELCOME_BUTTON_MECH_CREATOR;


			});
			// create mech object, load from localStorage if exists
			current_mech = new Mech();

			if( localStorage["tmp.current_mech"] )
				current_mech.importJSON( localStorage["tmp.current_mech"] );
			else
				current_mech.uuid = generateUUID();

			current_mech.useLang = localStorage["tmp.preferred_language"];

			var required_label = "";

			$translate(['BM_STEP3_BM_INC_10_HS', 'BM_STEP3_BM_INC_10_DOUBLE_HS', 'BM_STEP3_CRITICAL_REQUIRED' ]).then(function (translation) {
				$scope.label_included_heatsinks = translation.BM_STEP3_BM_INC_10_HS;
				required_label = translation.BM_STEP3_CRITICAL_REQUIRED;
			});

			update_heat_sink_dropdown($scope, $translate, current_mech);

			update_mech_status_bar_and_tro($scope, $translate, current_mech);
			// make tro for sidebar
			$scope.selected_heat_sink_tech = current_mech.getHeatSinksType();

			$scope.update_selected_heat_sinks = function() {
				current_mech.setAdditionalHeatSinks( $scope.selected_heat_sinks.id );
				update_heat_sink_dropdown($scope, $translate, current_mech);
				update_mech_status_bar_and_tro($scope, $translate, current_mech);
				localStorage["tmp.current_mech"] = current_mech.exportJSON();
			}

			$scope.update_selected_heat_sink_tech = function() {
				console.log( "$scope.selected_heat_sink_tech", $scope.selected_heat_sink_tech);
				current_mech.setHeatSinksType( $scope.selected_heat_sink_tech );
				update_heat_sink_dropdown($scope, $translate, current_mech);
				update_mech_status_bar_and_tro($scope, $translate, current_mech);
				localStorage["tmp.current_mech"] = current_mech.exportJSON();
			}
		}
	]
);

function update_heat_sink_dropdown($scope, $translate, current_mech) {

	$translate([ 'BM_STEP3_CRITICAL_REQUIRED', 'BM_STEP3_CRITICAL_REQUIRED_NONE' , 'BM_STEP3_CRITICAL_REQUIRED_SINGLE'  ]).then(function (translation) {

		current_heat_sinks = current_mech.getHeatSinks() - 10;

		$scope.heat_sink_list = [];
		$scope.heat_sink_list.push( {
				id: 0,
				label: "None"
			}
		);

		if( 0 == current_heat_sinks) {
				$scope.selected_heat_sinks = {
				id: 0,
				label: "None"
				};
		}

		for( var hscount = 1; hscount <= Math.floor(current_mech.getRemainingTonnage()) + current_heat_sinks; hscount++) {
			$scope.heat_sink_list.push( {
					id: hscount,
					label: hscount
				}
			);

			if( hscount == current_heat_sinks) {
				$scope.selected_heat_sinks = {
					id: hscount,
					label: hscount
				};
			}

		}
		heat_sinks_required = current_mech.getHeatSinkCriticalRequirements();
		the_label = translation.BM_STEP3_CRITICAL_REQUIRED;
		the_label_single = translation.BM_STEP3_CRITICAL_REQUIRED_SINGLE;
		the_label_none = translation.BM_STEP3_CRITICAL_REQUIRED_NONE;
		//console.log( "heat_sinks_required", heat_sinks_required);
		$scope.hs_crits_required = heat_sinks_required.number * heat_sinks_required.slots_each;
		hs_crit_count = heat_sinks_required.number * heat_sinks_required.slots_each;
		if( hs_crit_count < 0)
			hs_crit_count = 0;
		if( hs_crit_count == 1) {
			$scope.label_criticals_required = the_label_single.replace("{hs_crits_required}", hs_crit_count);
		} else if ( hs_crit_count == 0) {
			$scope.label_criticals_required = the_label_none.replace("{hs_crits_required}", hs_crit_count);
		} else {
			$scope.label_criticals_required = the_label.replace("{hs_crits_required}", hs_crit_count);
		}


	});
}

angular.module("baseApp").controller(
	"battlemechCreatorControllerStep4",
	[
		'$rootScope',
		'$translate',
		'$scope',
		function ($rootScope, $translate, $scope) {
			// Set Page Title Tag
			$translate(['APP_TITLE', 'BM_STEP4_TITLE', 'BM_STEP4_DESC', 'WELCOME_BUTTON_MECH_CREATOR' ]).then(function (translation) {
				$rootScope.title_tag = translation.BM_STEP4_TITLE + " | " + translation.APP_TITLE;
				if( translation.BM_STEP4_DESC )
					$scope.h3_title = translation.BM_STEP4_TITLE + ": " + translation.BM_STEP4_DESC;
				else
					$scope.h3_title = translation.BM_STEP4_TITLE;
				$rootScope.subtitle_tag = "&raquo; " + translation.WELCOME_BUTTON_MECH_CREATOR;
			});
			// create mech object, load from localStorage if exists
			current_mech = new Mech();

			if( localStorage["tmp.current_mech"] )
				current_mech.importJSON( localStorage["tmp.current_mech"] );
			else
				current_mech.uuid = generateUUID();

			current_mech.useLang = localStorage["tmp.preferred_language"];

			update_step4_page_items($scope, $translate, current_mech);

			update_mech_status_bar_and_tro($scope, $translate, current_mech);

			$scope.update_armor_weight = function() {
				current_mech.setArmorWeight( $scope.selected_armor_weight.id );
				update_step4_page_items($scope, $translate, current_mech);
				update_mech_status_bar_and_tro($scope, $translate, current_mech);
				localStorage["tmp.current_mech"] = current_mech.exportJSON();
			}



			$scope.allocate_max = function() {

				internal_structure = current_mech.getInteralStructure();
				//console.log( "internal_structure", internal_structure);
				centerTorsoArmor = internal_structure.centerTorso * 2;
				lrTorsoArmor = internal_structure.rightTorso * 2;

				centerTorsoArmorRear = Math.ceil(centerTorsoArmor * .2);
				centerTorsoArmor = centerTorsoArmor - centerTorsoArmorRear;

				lrTorsoArmorRear = Math.ceil(lrTorsoArmor * .2);
				lrTorsoArmor = lrTorsoArmor - lrTorsoArmorRear;

				current_mech.setRightTorsoArmor( lrTorsoArmor );
				current_mech.setCenterTorsoArmor( centerTorsoArmor );
				current_mech.setLeftTorsoArmor( lrTorsoArmor );

				current_mech.setRightTorsoRearArmor( lrTorsoArmorRear );
				current_mech.setCenterTorsoRearArmor( centerTorsoArmorRear );
				current_mech.setLeftTorsoRearArmor( lrTorsoArmorRear );

				current_mech.setRightLegArmor( internal_structure.rightLeg * 2 );
				current_mech.setLeftLegArmor( internal_structure.leftLeg * 2 );

				current_mech.setHeadArmor( 9 );

				if( current_mech.getType().class.toLowerCase() == "biped") {
					current_mech.setRightArmArmor( internal_structure.leftArm * 2 );
					current_mech.setLeftArmArmor( internal_structure.leftArm * 2 );
				} else {
					// quad
					current_mech.setRightArmArmor( internal_structure.rightLeg * 2 );
					current_mech.setLeftArmArmor( internal_structure.leftLeg * 2 );
				}

				update_step4_page_items($scope, $translate, current_mech);
				update_mech_status_bar_and_tro($scope, $translate, current_mech);
				localStorage["tmp.current_mech"] = current_mech.exportJSON();
			}

			$scope.allocate_sanely = function() {

				total_armor = current_mech.getTotalArmor();
				internal_structure = current_mech.getInteralStructure();
				maximum_armor = current_mech.getMaxArmor();
				percentage = total_armor / maximum_armor;


				arm_armor = Math.floor(internal_structure.rightArm * 2 * percentage);
				torso_armor = Math.floor(internal_structure.rightTorso * 1.75 * percentage);
				leg_armor = Math.floor(internal_structure.rightLeg * 2 * percentage);
				rear_armor = Math.floor(internal_structure.rightTorso * .25 * percentage);;

				centerTorsoArmor = Math.floor(internal_structure.centerTorso * 1.75 * percentage);
				centerTorsoArmorRear = Math.floor(internal_structure.centerTorso * .25 * percentage);

				if( total_armor > arm_armor) {
					head_armor = arm_armor;
					if( head_armor > 9)
						head_armor = 9;
					if( total_armor >= head_armor) {
					   current_mech.setHeadArmor(head_armor);
					   total_armor -= head_armor;
					} else {
						current_mech.setHeadArmor(0);
					}
				}


				if( total_armor > torso_armor) {
				   current_mech.setRightTorsoArmor( torso_armor );
				   total_armor -= torso_armor;
				}

				if( total_armor > rear_armor) {
				   current_mech.setRightTorsoRearArmor( rear_armor );
					total_armor -= rear_armor;
				}

				if( total_armor > torso_armor) {
					current_mech.setLeftTorsoArmor( torso_armor );
					total_armor -= torso_armor;
				}
				if( total_armor > rear_armor) {
					current_mech.setLeftTorsoRearArmor( rear_armor );
				   total_armor -= rear_armor;
				}

				if( total_armor > leg_armor) {
					current_mech.setRightLegArmor( leg_armor );
					total_armor -= leg_armor;
				}

				if( total_armor > leg_armor) {
				   current_mech.setLeftLegArmor( leg_armor );
				   total_armor -= leg_armor;
				}

				if( total_armor > arm_armor) {
					current_mech.setRightArmArmor( arm_armor );
				   total_armor -= arm_armor;
				}
				if( total_armor > arm_armor) {
				   current_mech.setLeftArmArmor( arm_armor );
				   total_armor -= arm_armor;
				}

				if( total_armor > rear_armor) {
				   current_mech.setCenterTorsoRearArmor( centerTorsoArmorRear );
				   total_armor -= rear_armor;
				}

				current_mech.setCenterTorsoArmor( centerTorsoArmor ); // everything else goes to center torso! :)

				update_step4_page_items($scope, $translate, current_mech);
				update_mech_status_bar_and_tro($scope, $translate, current_mech);
				localStorage["tmp.current_mech"] = current_mech.exportJSON();
			}

			$scope.clear_armor = function() {

				current_mech.setHeadArmor( 0 );

				current_mech.setRightTorsoArmor( 0 );
				current_mech.setRightTorsoRearArmor( 0 );


				current_mech.setLeftTorsoArmor( 0 );
				current_mech.setLeftTorsoRearArmor( 0 );

				current_mech.setRightLegArmor( 0 );
				current_mech.setLeftLegArmor( 0 );


				current_mech.setRightArmArmor( 0 );
				current_mech.setLeftArmArmor( 0 );

				current_mech.setCenterTorsoRearArmor( 0 );
				current_mech.setCenterTorsoArmor( 0 );

				update_step4_page_items($scope, $translate, current_mech);
				update_mech_status_bar_and_tro($scope, $translate, current_mech);
				localStorage["tmp.current_mech"] = current_mech.exportJSON();
			}

			$scope.update_armor_allocation = function(armor_location) {
				console.log("armor_location", armor_location);
				if( armor_location == "hd") {
					console.log("setHeadArmor", $scope.armor_current_hd.id);
					current_mech.setHeadArmor( $scope.armor_current_hd.id );

				} else if( armor_location == "ra") {
					current_mech.setRightArmArmor( $scope.armor_current_ra.id );

				} else if( armor_location == "la") {
					current_mech.setLeftArmArmor( $scope.armor_current_la.id );

				} else if( armor_location == "rt") {
					current_mech.setRightTorsoArmor( $scope.armor_current_rt.id );

				} else if( armor_location == "ct") {
					current_mech.setCenterTorsoArmor( $scope.armor_current_ct.id );

				} else if( armor_location == "lt") {
					current_mech.setLeftTorsoArmor( $scope.armor_current_lt.id );

				} else if( armor_location == "rtr") {
					current_mech.setRightTorsoRearArmor( $scope.armor_current_rtr.id );

				} else if( armor_location == "ctr") {
					current_mech.setCenterTorsoRearArmor( $scope.armor_current_ctr.id );

				} else if( armor_location == "ltr") {
					current_mech.setLeftTorsoRearArmor( $scope.armor_current_ltr.id );

				} else if( armor_location == "rl") {
					current_mech.setRightLegArmor( $scope.armor_current_rl.id );

				} else if( armor_location == "ll") {
					current_mech.setLeftLegArmor( $scope.armor_current_ll.id );

				}
				update_step4_page_items($scope, $translate, current_mech);
				update_mech_status_bar_and_tro($scope, $translate, current_mech);
				localStorage["tmp.current_mech"] = current_mech.exportJSON();

			}

		}
	]
);

function make_armor_select_dd_options(max_armor) {

	var return_armor = [];
	for( var ascount = 0; ascount <= max_armor; ascount++) {
		return_armor.push( {
				id: ascount,
				label: ascount
			}
		);
	}

	return return_armor;
}

function make_current_option(current_value) {
	var return_current = {
				id: current_value,
				label: current_value
			};
	return return_current;
}


function update_step4_page_items($scope, $translate, current_mech) {

	$translate([ 'BM_NO_ARMOR','BM_TON', 'BM_TONS', 'BM_STEP3_CRITICAL_REQUIRED',
		'BM_STEP3_CRITICAL_REQUIRED_NONE' , 'BM_STEP3_CRITICAL_REQUIRED_SINGLE',
		'BM_STEP4_MAX_ARMOR', 'BM_STEP4_TOTAL_ARMOR','BM_STEP4_UNALLOCATED_ARMOR'
	]).then(function (translation) {

		$scope.for_quad = false;
		$scope.for_biped = false;
		if( current_mech.getType().class == "quad")
			$scope.for_quad = true;
		else
			$scope.for_biped = true;

		// Update Armor Weight Selection Dropdown....
		current_armor_weight = current_mech.getArmorWeight();

		$scope.armor_weight_list = [];
		$scope.armor_weight_list.push( {
				id: 0,
				label: translation.BM_NO_ARMOR
			}
		);

		if( 0 == current_armor_weight) {
				$scope.selected_armor_weight = {
				id: 0,
				label: translation.BM_NO_ARMOR
				};
		}

		for( var hscount = 1; hscount <= current_mech.getMaxArmorTonnage() + 0.5; hscount = hscount + 0.5) {
			if( hscount == 1)
				tons_label = translation.BM_TON;
			else
				tons_label = translation.BM_TONS;

			$scope.armor_weight_list.push( {
					id: hscount,
					label: hscount + " " + tons_label
				}
			);

			if( hscount == current_armor_weight) {
				$scope.selected_armor_weight = {
					id: hscount,
					label: hscount + " " + tons_label
				};
			}

		}

		// Armor Stats Label...
		label_armor_stats = translation.BM_STEP4_MAX_ARMOR + ": " + current_mech.getMaxArmor() + "<br />";
		label_armor_stats += translation.BM_STEP4_TOTAL_ARMOR + ": " + current_mech.getTotalArmor() + "<br />";
		label_armor_stats += translation.BM_STEP4_UNALLOCATED_ARMOR + ": " + current_mech.getUnallocatedArmor() + "<br />";

		// Update Armor Select Dropdowns....
		armor_allocations = current_mech.getArmorAllocations();
		internal_structure = current_mech.getInteralStructure();


		$scope.armor_alloc_hd = make_armor_select_dd_options( 9 );
		$scope.armor_current_hd = make_current_option( armor_allocations.head );

		$scope.armor_alloc_ct = make_armor_select_dd_options( internal_structure.centerTorso * 2   - armor_allocations.centerTorsoRear);
		$scope.armor_current_ct = make_current_option( armor_allocations.centerTorso );

		$scope.armor_alloc_rt = make_armor_select_dd_options( internal_structure.rightTorso * 2  - armor_allocations.rightTorsoRear );
		$scope.armor_current_rt = make_current_option( armor_allocations.rightTorso );

		$scope.armor_alloc_lt = make_armor_select_dd_options( internal_structure.leftTorso * 2  - armor_allocations.leftTorsoRear );
		$scope.armor_current_lt = make_current_option( armor_allocations.leftTorso );

		$scope.armor_alloc_ctr = make_armor_select_dd_options( internal_structure.centerTorso * 2  - armor_allocations.centerTorso);
		$scope.armor_current_ctr = make_current_option( armor_allocations.centerTorsoRear );

		$scope.armor_alloc_rtr = make_armor_select_dd_options( internal_structure.rightTorso * 2 - armor_allocations.rightTorso);
		$scope.armor_current_rtr = make_current_option( armor_allocations.rightTorsoRear );

		$scope.armor_alloc_ltr = make_armor_select_dd_options( internal_structure.leftTorso * 2 - armor_allocations.leftTorso);
		$scope.armor_current_ltr = make_current_option( armor_allocations.leftTorsoRear );

		$scope.armor_alloc_ll = make_armor_select_dd_options( internal_structure.leftLeg * 2 );
		$scope.armor_current_ll = make_current_option( armor_allocations.leftLeg );

		$scope.armor_alloc_la = make_armor_select_dd_options( internal_structure.leftArm * 2 );
		$scope.armor_current_la = make_current_option( armor_allocations.leftArm );

		$scope.armor_alloc_rl = make_armor_select_dd_options( internal_structure.rightLeg * 2 );
		$scope.armor_current_rl = make_current_option( armor_allocations.rightLeg );

		$scope.armor_alloc_ra = make_armor_select_dd_options( internal_structure.rightArm * 2 );
		$scope.armor_current_ra = make_current_option( armor_allocations.rightArm );

		$scope.label_armor_stats = label_armor_stats;

	});
}

angular.module("baseApp").controller(
	"battlemechCreatorControllerStep5",
	[
		'$rootScope',
		'$translate',
		'$scope',
		function ($rootScope, $translate, $scope) {


			// Set Page Title Tag
			$translate(['APP_TITLE', 'BM_STEP5_TITLE', 'BM_STEP5_DESC', 'WELCOME_BUTTON_MECH_CREATOR' ]).then(function (translation) {
				$rootScope.title_tag = translation.BM_STEP5_TITLE + " | " + translation.APP_TITLE;
				if( translation.BM_STEP5_DESC )
					$scope.h3_title = translation.BM_STEP5_TITLE + ": " + translation.BM_STEP5_DESC;
				else
					$scope.h3_title = translation.BM_STEP5_TITLE;
				$rootScope.subtitle_tag = "&raquo; " + translation.WELCOME_BUTTON_MECH_CREATOR;
			});
			// create mech object, load from localStorage if exists
			current_mech = new Mech();

			if( localStorage["tmp.current_mech"] )
				current_mech.importJSON( localStorage["tmp.current_mech"] );
			else
				current_mech.uuid = generateUUID();

			current_mech.useLang = localStorage["tmp.preferred_language"];
			// make tro for sidebar
			update_mech_status_bar_and_tro($scope, $translate, current_mech);

			$scope.equipment_table =[];

			if( current_mech.getTech().tag == "clan") {
				// Use Clan Equipment Table...
				$scope.equipment_table = mechClanEquipment;
			} else {
				// Use Inner Sphere Equipment Table...
				$scope.equipment_table = mechISEquipment;
			}
			for(var eqc = 0; eqc < $scope.equipment_table.length; eqc++ ) {
				if( $scope.equipment_table[eqc].name[ localStorage["tmp.preferred_language"] ])
					$scope.equipment_table[eqc].local_name = $scope.equipment_table[eqc].name[ localStorage["tmp.preferred_language"] ];
				else
					$scope.equipment_table[eqc].local_name = $scope.equipment_table[eqc].name[ "en-US" ];

				if( $scope.equipment_table[eqc].category[ localStorage["tmp.preferred_language"] ])
					$scope.equipment_table[eqc].local_category = $scope.equipment_table[eqc].category[ localStorage["tmp.preferred_language"] ];
				else
					$scope.equipment_table[eqc].local_category = $scope.equipment_table[eqc].category[ "en-US" ];

				$scope.equipment_table[eqc].local_space = $scope.equipment_table[eqc].space.battlemech;

			}


			$translate(['BM_STEP5_SELECT_LOCATION' ]).then(function (translation) {


				$scope.item_locations = [];

				$scope.installed_equipment_table = current_mech.getInstalledEquipment();

				for(var eqc = 0; eqc < $scope.installed_equipment_table.length; eqc++ ) {
					if( $scope.installed_equipment_table[eqc].name[ localStorage["tmp.preferred_language"] ])
						$scope.installed_equipment_table[eqc].local_name = $scope.installed_equipment_table[eqc].name[ localStorage["tmp.preferred_language"] ];
					else
						$scope.installed_equipment_table[eqc].local_name = $scope.installed_equipment_table[eqc].name[ "en-US" ];

					if( $scope.installed_equipment_table[eqc].category[ localStorage["tmp.preferred_language"] ])
						$scope.installed_equipment_table[eqc].local_category = $scope.installed_equipment_table[eqc].category[ localStorage["tmp.preferred_language"] ];
					else
						$scope.installed_equipment_table[eqc].local_category = $scope.installed_equipment_table[eqc].category[ "en-US" ];

					$scope.installed_equipment_table[eqc].local_space = $scope.installed_equipment_table[eqc].space.battlemech;

					$scope.item_locations[eqc] = make_select_object($scope.installed_equipment_table[eqc].location);
				}


				var location_list = [];
				location_list.push( {
					id: "undefined",
					name: "- " + translation.BM_STEP5_SELECT_LOCATION + " -"
				} );
				for(loccount = 0; loccount < battlemechLocations.length; loccount++) {
					location_list.push( {
						id: battlemechLocations[loccount].tag,
						name: battlemechLocations[loccount].name[ localStorage["tmp.preferred_language"] ]
					} );

				}
				$scope.bm_location_list = {
					availableOptions: location_list //,
					// selectedOption: selected_jumping_mp
				};
			});




			$scope.addItem = function( index_number ) {
				if( $scope.equipment_table[index_number].tag ) {
					current_mech.addEquipmentFromTag( $scope.equipment_table[index_number].tag );
					update_mech_status_bar_and_tro($scope, $translate, current_mech);
					localStorage["tmp.current_mech"] = current_mech.exportJSON();
				}

			};

			$scope.removeItem = function( index_number ) {
				current_mech.removeEquipment( index_number );
				$scope.item_locations.splice(index_number, 1);
				update_mech_status_bar_and_tro($scope, $translate, current_mech);
				localStorage["tmp.current_mech"] = current_mech.exportJSON();
			};

			$scope.updateLocation = function( index_number ) {
				//console.log( "updateLocation", index_number );
	//			current_mech.removeEquipment( index_number );
				//console.log( "updateLocation", $scope.item_locations[index_number] );
				current_mech.setEquipmentLocation( index_number, $scope.item_locations[index_number].id );
				update_mech_status_bar_and_tro($scope, $translate, current_mech);
				localStorage["tmp.current_mech"] = current_mech.exportJSON();


			};
		}
	]
);

function make_select_object(current_tag) {
	for(loccount = 0; loccount < battlemechLocations.length; loccount++) {
		if(  battlemechLocations[loccount].tag == current_tag ) {
			return {
				id: battlemechLocations[loccount].tag,
				name: battlemechLocations[loccount].name[ localStorage["tmp.preferred_language"] ]
			} ;
		}
	}
	return null
}
angular.module("baseApp").controller(
	"battlemechCreatorControllerStep6",
	[
		'$rootScope',
		'$translate',
		'$scope',
		function ($rootScope, $translate, $scope) {
			// Set Page Title Tag
			$translate(['APP_TITLE', 'BM_STEP6_TITLE', 'BM_STEP6_DESC', 'WELCOME_BUTTON_MECH_CREATOR' ]).then(function (translation) {
				$rootScope.title_tag = translation.BM_STEP6_TITLE + " | " + translation.APP_TITLE;
				if( translation.BM_STEP6_DESC )
					$scope.h3_title = translation.BM_STEP6_TITLE + ": " + translation.BM_STEP6_DESC;
				else
					$scope.h3_title = translation.BM_STEP6_TITLE;
				$rootScope.subtitle_tag = "&raquo; " + translation.WELCOME_BUTTON_MECH_CREATOR;
			});
			// create mech object, load from localStorage if exists
			current_mech = new Mech();

			if( localStorage["tmp.current_mech"] )
				current_mech.importJSON( localStorage["tmp.current_mech"] );
			else
				current_mech.uuid = generateUUID();

			current_mech.useLang = localStorage["tmp.preferred_language"];
			update_mech_status_bar_and_tro($scope, $translate, current_mech);

			// make tro for sidebar

		}
	]
);


angular.module("baseApp").controller(
	"battlemechCreatorControllerSummary",
	[
		'$rootScope',
		'$translate',
		'$scope',
		function ($rootScope, $translate, $scope) {
			// Set Page Title Tag
			$translate(['APP_TITLE', 'BM_SUMMARY_TITLE', 'BM_SUMMARY_DESC', 'WELCOME_BUTTON_MECH_CREATOR' ]).then(function (translation) {
				$rootScope.title_tag = translation.BM_SUMMARY_TITLE + " | " + translation.APP_TITLE;
				if( translation.BM_SUMMARY_DESC )
					$scope.h3_title = translation.BM_SUMMARY_TITLE + ": " + translation.BM_SUMMARY_DESC;
				else
					$scope.h3_title = translation.BM_SUMMARY_TITLE;
				$rootScope.subtitle_tag = "&raquo; " + translation.WELCOME_BUTTON_MECH_CREATOR;
			});

			// create mech object, load from localStorage if exists
			current_mech = new Mech();

			if( localStorage["tmp.current_mech"] )
				current_mech.importJSON( localStorage["tmp.current_mech"] );
			else
				current_mech.uuid = generateUUID();

			current_mech.useLang = localStorage["tmp.preferred_language"];


			// make tro for sidebar
			$scope.mech_tro = current_mech.makeTROHTML();
			$scope.mech_bv_calc = current_mech.getBVCalcHTML();
			$scope.mech_as_calc = current_mech.getASCalcHTML();

		}
	]
);


angular.module("baseApp").controller(
	"battlemechCreatorControllerWelcome",
	[
		'$rootScope',
		'$translate',
		'$scope',
		function ($rootScope, $translate, $scope) {
			// Set Page Title Tag
			$translate(['APP_TITLE', 'BM_INTRO_TITLE', 'BM_INTRO_DESC', 'WELCOME_BUTTON_MECH_CREATOR' ]).then(function (translation) {
				$rootScope.title_tag = translation.BM_INTRO_TITLE + " | " + translation.APP_TITLE;
				if( translation.BM_WELCOME_DESC )
					$scope.h3_title = translation.BM_INTRO_TITLE + ": " + translation.BM_INTRO_DESC;
				else
					$scope.h3_title = translation.BM_INTRO_TITLE;
				$rootScope.subtitle_tag = "&raquo; " + translation.WELCOME_BUTTON_MECH_CREATOR;
			});

		}
	]
);


angular.module("baseApp").controller(
	"battlemechCreatorControllerSidebar",
	[
		'$rootScope',
		'$translate',
		'$scope',
		'$route',
		function ($rootScope, $translate, $scope, $route) {
			// Set Page Title Tag

			$scope.button_welcome_current = false;
			$scope.button_step1_current = false;
			$scope.button_step2_current = false;
			$scope.button_step3_current = false;
			$scope.button_step4_current = false;
			$scope.button_step5_current = false;
			$scope.button_step6_current = false;
			$scope.button_summary_current = false;

			if( $route.current.originalPath == "/battlemech-creator/") {
				$scope.button_welcome_current = true;
			} else if( $route.current.originalPath == "/battlemech-creator-step1/") {
				$scope.button_step1_current = true;
			} else if( $route.current.originalPath == "/battlemech-creator-step2/") {
				$scope.button_step2_current = true;
			} else if( $route.current.originalPath == "/battlemech-creator-step3/") {
				$scope.button_step3_current = true;
			} else if( $route.current.originalPath == "/battlemech-creator-step4/") {
				$scope.button_step4_current = true;
			} else if( $route.current.originalPath == "/battlemech-creator-step5/") {
				$scope.button_step5_current = true;
			} else if( $route.current.originalPath == "/battlemech-creator-step6/") {
				$scope.button_step6_current = true;
			} else if( $route.current.originalPath == "/battlemech-creator-summary/") {
				$scope.button_summary_current = true;
			}

		}
	]
);


angular.module("baseApp").controller(
	"creditsController",
	[
		'$rootScope',
		'$translate',
		'$scope',
		function ($rootScope, $translate, $scope) {
			$translate(['APP_TITLE', 'INDEX_WELCOME']).then(function (translation) {
				$rootScope.title_tag = translation.INDEX_WELCOME + " | " + translation.APP_TITLE;
				$rootScope.subtitle_tag = "&raquo; " + translation.INDEX_CREDITS;
			});
		}
	]
);

angular.module("baseApp").controller(
	"welcomeController",
	[
		'$rootScope',
		'$translate',
		'$scope',
		function ($rootScope, $translate, $scope) {
			$translate(['APP_TITLE', 'INDEX_WELCOME']).then(function (translation) {
				$rootScope.title_tag = translation.INDEX_WELCOME + " | " + translation.APP_TITLE;
				$rootScope.subtitle_tag = "&raquo; " + translation.INDEX_WELCOME;
			});
		}
	]
);

available_languages.push ({
	english_name: "German",
	native_name: "Deutsch",
	icon_file: "DE.png",
	short_code: "de-DE",
	active: true,

	translations: {

		APP_TITLE: 'Jeff\'s BattleTech Werkzeug',

		INDEX_WELCOME: 'Willkommen',
		INDEX_H3_CORE: 'Jeff\'s BattleTech Werkzeug',
		INDEX_BUTTON_MECH_CREATOR: 'BattleMech Hersteller',

		BM_MP_ABBR: "BP",

		BM_TONS: "tonnen",
		BM_TON: "tonne",
		BM_NO_ARMOR: "Keine rüstung",

		BM_WELCOME_TITLE: "Willkommen",
		BM_WELCOME_DESC: "",

		BM_STEP1_TITLE: "Schritt 1",
		BM_STEP1_DESC: "Gestalten sie das chassis",

		BM_STEP2_TITLE: "Schritt 2",
		BM_STEP2_DESC: "Installieren motor und steuerungssysteme",

		BM_STEP3_TITLE: "Schritt 3",
		BM_STEP3_DESC: "Fügen sie zusätzliche wärmesenken",

		BM_STEP4_TITLE: "Schritt 4",
		BM_STEP4_DESC: "In Rüstung",

		BM_STEP5_TITLE: "Schritt 5",
		BM_STEP5_DESC: "In waffen, munition und andere ausrüstung",

		BM_STEP6_TITLE: "Schritt 6",
		BM_STEP6_DESC: "Füllen sie das schaublatt",

		BM_SUMMARY_TITLE: "Der Auszug",
		BM_SUMMARY_DESC: "",

		BUTTON_LANG_EN: 'English',
		BUTTON_LANG_DE: 'German',
		BUTTON_LANG_BR: 'Brazilian'
	}

} );
available_languages.push ({
	english_name: "English",
	native_name: "English",
	icon_file: "US.png",
	short_code: "en-US",
	active: true,

	translations: {

		APP_TITLE: 'Jeff\'s BattleTech Tools',

		INDEX_WELCOME: 'Welcome',
		INDEX_H3_CORE: 'Jeff\'s BattleTech Tools',

		WELCOME_BUTTON_MECH_CREATOR: '\'Mech Creator',
		WELCOME_BUTTON_MECH_CREATOR_DESC: 'Create a BattleMech',
		WELCOME_H3_CORE: 'Jeff\'s BattleTech Tools',
		WELCOME_H3_CREATORS_CORE: 'BattleTech Creators',

		WELCOME_H3_FORCE_BUILDERS_CORE: 'BattleTech Force Builders',


		BM_MP_ABBR: "MP",

		BM_NEXT_STEP: "Next Step",
		BM_PREVIOUS_STEP: "Previous Step",
		BM_SUMMARY: "Summary",
		BM_BACK_TO_WELCOME: "Welcome",

		BUTTON_HOME_TITLE: "Home",
		BUTTON_HOME_DESC: "Back to the main screen",

		BM_INTRO_TITLE: "Welcome",
		BM_INTRO_DESC: "",
		BM_INTRO_TEXT: "<p>Welcome to a BattleTech 'mech builder.</p><p>This tool attempts to closely follow the steps in the BattleTech tech manual and the steps in that book should be referenced during 'mech creation</p>",

		BM_TONS: "tons",
		BM_TON: "ton",
		BM_NO_ARMOR: "No Armor",

		BM_REMAINING_TONS: "Remaining Tons",
		BM_UNALLOCATED_ARMOR: "Unallocated Armor",

		BM_STEP1_TITLE: "Step 1",
		BM_STEP1_DESC: "Design the Chassis",
		BM_STEP1_MECH_NAME: "Mech Model Name",
		BM_STEP1_MECH_TYPE: "Mech Type",
		BM_STEP1_MECH_ERA: "Mech Era",
		BM_STEP1_MECH_TONNAGE: "Mech Tonnage",
		BM_STEP1_MECH_TECH: "Mech Tech",

		BM_STEP2_TITLE: "Step 2",
		BM_STEP2_DESC: "Install engine and control systems",
		BM_STEP2_WALKING_MP: "Walking Movement Points",
		BM_STEP2_JUMPING_MP: "Jumping Movement Points",
		BM_STEP2_SELECT_JUMP: "Select Jumping MP",
		BM_STEP2_SELECT_WALK: "Select Walking MP",

		BM_STEP3_TITLE: "Step 3",
		BM_STEP3_DESC: "Add additional heat sinks",
		BM_STEP3_HS_TECH: "Heat Sink Technology",
		BM_STEP3_HS_ADD: "Add additional heat sinks",
		BM_STEP3_BM_INC_10_HS: "Your BattleMech includes 10 heat sinks.",
		BM_STEP3_BM_INC_10_DOUBLE_HS: "Your BattleMech includes 10 double heat sinks.",
		BM_STEP3_ADD_LABEL: "Additional heat sinks",
		BM_STEP3_CRITICAL_REQUIRED: "{hs_crits_required} critical slots are required for your engine class and selected heat sinks",
		BM_STEP3_CRITICAL_REQUIRED_NONE: "No additional critical slots are required for your engine class and selected heat sinks",
		BM_STEP3_CRITICAL_REQUIRED_SINGLE: "One critical slot is required for your engine class and selected heat sinks",
		BM_STEP3_SINGLE_HS: "Single Heat Sinks",
		BM_STEP3_DOUBLE_HS: "Double Heat Sinks",

		BM_STEP4_TITLE: "Step 4",
		BM_STEP4_DESC: "Add armor",
		BM_STEP4_ARMOR_WEIGHT: "Armor Weight",
		BM_STEP4_ARMOR_ALLOCATION: "Armor Allocation",
		BM_STEP4_MAX_ARMOR: "Maximum Armor",
		BM_STEP4_TOTAL_ARMOR: "Total Armor",
		BM_STEP4_UNALLOCATED_ARMOR: "Unallocated Armor",
		BM_STEP4_ALLOCATE_NONE: "Clear Armor",
		BM_STEP4_ALLOCATE_SANELY: "Allocate Sanely",
		BM_STEP4_ALLOCATE_MAX: "Allocate Max",

		BM_STEP5_TITLE: "Step 5",
		BM_STEP5_DESC: "Add weapons, ammunition and other equipment",
		BM_STEP5_ITEM_NAME: "Name",
		BM_STEP5_ITEM_CATEGORY: "Category",
		BM_STEP5_ITEM_SPACE: "Criticals",
		BM_STEP5_ITEM_WEIGHT: "Weight",
		BM_STEP5_ADD: "Add",
		BM_STEP5_ITEM_LOCATION: "Location",
		BM_STEP5_REMOVE: "Remove",
		BM_STEP5_INSTALLED_EQUIPMENT: "Installed Equipment",
		BM_STEP5_NO_EQUIPMENT_INSTALLED: "No equipment has been installed",
		BM_STEP5_SELECT_LOCATION: "Select Location",
		BM_STEP5_AVAILABLE_EQUIPMENT: "Available Equipment",

		BM_STEP6_TITLE: "Step 6",
		BM_STEP6_DESC: "Complete the record sheet",

		BM_SUMMARY_TITLE: "Summary",
		BM_SUMMARY_DESC: "",
		BM_SUMMARY_TRO: "Technical Read Out",
		BM_SUMMARY_BV_CALC: "Battle Value Calculations",
		BM_SUMMARY_AS_CALC: "Alpha Strike Calculations",

		TRO_TYPE: "Type",

		TRO_TECHNOLOGY_BASE: "Technology Base",
		TRO_ERA: "Era",
		TRO_TONNAGE: "Tonnage",
		TRO_BATTLE_VALUE: "Battle Value",
		TRO_ALPHA_STRIKE_VALUE: "Alpha Strike Value",
		TRO_CBILL_COST: "C-Bill Cost",

		TRO_EQUIPMENT: "Equipment",
		TRO_MASS: "Mass",

		TRO_NOT_AVAILABLE: "n/a",

		TRO_INTERNAL_STRUCTURE: "Internal Structure",
		TRO_ENGINE: "Engine",
		TRO_WALKING: "Walking",
		TRO_RUNNING: "Running",
		TRO_JUMPING: "Jumping",
		TRO_HEAT_SINKS: "Heat Sinks",

		TRO_GYRO: "Gyro",
		TRO_COCKPIT: "Cockpit",
		TRO_JUMP_JETS: "Jump Jets",

		TRO_ARMOR_FACTOR: "Armor Factor",

		TRO_ARMOR_IS: "Internal Structure",
		TRO_ARMOR_VALUE: "Armor Value",

		TRO_ARMOR_HD: "Head",
		TRO_ARMOR_CT: "Center Torso",
		TRO_ARMOR_CTR: "Center Torso (Rear)",
		TRO_ARMOR_RLT: "R/L Torso",
		TRO_ARMOR_RLTR: "R/L Torso (Rear)",
		TRO_ARMOR_RT: "Right Torso",
		TRO_ARMOR_RTR: "Right Torso (Rear)",
		TRO_ARMOR_LT: "Left Torso",
		TRO_ARMOR_LTR: "Left Torso (Rear)",
		TRO_ARMOR_RLA: "R/L Arm",
		TRO_ARMOR_RA: "Right Arm",
		TRO_ARMOR_LA: "Left Arm",
		TRO_ARMOR_RLL: "R/L Leg",
		TRO_ARMOR_RL: "Right Leg",
		TRO_ARMOR_LL: "Left Leg",
		TRO_ARMOR_RLFL: "R/L Front Leg",
		TRO_ARMOR_RLRL: "R/L Rear Leg",
		TRO_ARMOR_RFL: "Right Front Leg",
		TRO_ARMOR_LFL: "Left Front Leg",
		TRO_ARMOR_RRL: "Right Rear Leg",
		TRO_ARMOR_LRL: "Left Rear Leg",

		TRO_WEAPONS_AND_AMMO: "Weapons<br />and Ammo",
		TRO_LOCATION: "Location",
		TRO_CRITICAL: "Critical",

		BUTTON_LANG_EN: 'English',
		BUTTON_LANG_DE: 'German',
		BUTTON_LANG_BR: 'Brazilian'
	}

} );