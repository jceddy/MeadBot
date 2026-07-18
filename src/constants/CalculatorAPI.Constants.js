// CalculatorAPI.Constants.js

// error types
exports.ErrorTypes = {
	UNKNOWN: 0,
	IS_NAN: 1,
	RANGE: 2,
	INVALID_ARGUMENTS: 3
};

// string names corresponding to error types
exports.ErrorTypeStrings = [];
exports.ErrorTypeStrings[exports.ErrorTypes.UNKNOWN] = 'unknown';
exports.ErrorTypeStrings[exports.ErrorTypes.IS_NAN] = 'isNaN';
exports.ErrorTypeStrings[exports.ErrorTypes.RANGE] = 'range';
exports.ErrorTypeStrings[exports.ErrorTypes.INVALID_ARGUMENTS] = 'invalid arguments';

// volume unit identifiers
exports.VOLUME_UNITS = { LITERS: 0, GALLONS_US: 1, GALLONS_IMP: 2, FL_OUNCES_US: 3, FL_OUNCES_IMP: 4, PINTS_US: 5, PINTS_IMP: 6, QUARTS_US: 7, QUARTS_IMP: 8, CUPS_US: 9, CUPS_IMP: 10, CUPS_METRIC: 11 };

// volume unit info mapped from identifiers
exports.VOLUME_UNIT_INFO = [
	{ name: 'Liter(s)', conversion: 1.0 },
	{ name: 'Gallon(s) US', conversion: 3.7854117891 },
	{ name: 'Gallon(s) Imp', conversion: 4.546091886873 },
	{ name: 'Fl Ounce(s) US', conversion: 0.0295735295641118736222 },
	{ name: 'Fl Ounce(s) Imp', conversion: 0.0284130742283722207737 },
	{ name: 'Pint(s) US', conversion: 0.4731764727459200098390 },
	{ name: 'Pint(s) Imp', conversion: 0.5682614845674444154745 },
	{ name: 'Quart(s) US', conversion: 0.9463529454918400196781 },
	{ name: 'Quart(s) Imp', conversion: 1.1365229691348888309489 },
	{ name: 'Cup(s) US', conversion: 0.2365882363729600049195 },
	{ name: 'Cup(s) Imp', conversion: 0.284130624982675667887 },
	{ name: 'Cup(s) Metric', conversion: 0.25 }
];

// honey unit identifiers
exports.HONEY_UNITS = { KILOGRAMS: 0, POUNDS: 1, LITERS: 2, GALLONS_US: 3, GALLONS_IMP: 4, OUNCES: 5, CUPS_US: 6, CUPS_IMP: 7, CUPS_METRIC: 8, FL_OUNCES_US: 9, FL_OUNCES_IMP: 10, PINTS_US: 11, PINTS_IMP: 12, QUARTS_US: 13, QUARTS_IMP: 14 };

// honey unit info mapped from identifiers
exports.HONEY_UNIT_INFO = [
	{ name: 'Kilogram(s)', conversion: 1.0 },
	{ name: 'Pound(s)', conversion: 0.45359237038 },
	{ name: 'Liter(s)', conversion: 1.4379171305280134085 },
	{ name: 'Gallon(s) US', conversion: 5.44310844456453957639 },
	{ name: 'Gallon(s) Imp', conversion: 6.5369033865223141589149 },
	{ name: 'Ounce(s)', conversion: 0.0283499767411440240053 },
	{ name: 'Cup(s) US', conversion: 0.3401942777852837235244 },
	{ name: 'Cup(s) Imp', conversion: 0.4085562923813757040209 },
	{ name: 'Cup(s) Metric', conversion: 0.3594792822521458326230 },
	{ name: 'Fl Ounce(s) US', conversion: 0.0425242847231604654406 },
	{ name: 'Fl Ounce(s) Imp', conversion: 0.0408556461657641887027 },
	{ name: 'Pint(s) US', conversion: 0.6803885555705674470491 },
	{ name: 'Pint(s) Imp', conversion: 0.8171129233152837740547 },
	{ name: 'Quart(s) US', conversion: 1.3607771111411348940981 },
	{ name: 'Quart(s) Imp', conversion: 1.6342258466305675481094 }
];

// temperature unit identifiers
exports.TEMPERATURE_UNITS = { CELSIUS: 0, FAHRENHEIT: 1 };

// temperature unit names
exports.TEMPERATURE_UNIT_NAMES = [ 'Celsius', 'Fahrenheit' ];

// identifiers for yeast YAN requirements
exports.YAN_REQUIREMENT = { VERY_LOW: 0, LOW: 1, MEDIUM: 2, HIGH: 3, KVEIK: 4 };

// human readable strings for yeast YAN requirements
exports.YAN_REQUIREMENT_STRING = [ 'Very Low', 'Low', 'Medium', 'High', 'Kveik' ];

// (incomplete) list if YAN requirements for different yeasts
exports.YAN_REQUIREMENT_BY_YEAST = {
	'Lalvin 71B': exports.YAN_REQUIREMENT.LOW,
	'Lalvin BA 11': exports.YAN_REQUIREMENT.HIGH,
	'Lalvin BM45': exports.YAN_REQUIREMENT.MEDIUM,
	'Lalvin BM4X4': exports.YAN_REQUIREMENT.HIGH,
	'Lalvin CLOS': exports.YAN_REQUIREMENT.MEDIUM,
	'Lalvin CY3079': exports.YAN_REQUIREMENT.HIGH,
	'Lalvin D21': exports.YAN_REQUIREMENT.LOW,
	'Lalvin D254': exports.YAN_REQUIREMENT.MEDIUM,
	'Lalvin D80': exports.YAN_REQUIREMENT.MEDIUM,
	'Lalvin DV10': exports.YAN_REQUIREMENT.LOW,
	'Lalvin EC-1118 (OG >= 1.120)': exports.YAN_REQUIREMENT.MEDIUM,
	'Lalvin EC-1118 (OG < 1.120)': exports.YAN_REQUIREMENT.LOW,
	'Lalvin K1V-1116': exports.YAN_REQUIREMENT.MEDIUM,
	'Lalvin QA23': exports.YAN_REQUIREMENT.LOW,
	'Lalvin R2': exports.YAN_REQUIREMENT.MEDIUM,
	'Lalvin RC212': exports.YAN_REQUIREMENT.MEDIUM,
	'Lalvin Rhone 2226': exports.YAN_REQUIREMENT.HIGH,
	'Red Star Cote Des Blancs': exports.YAN_REQUIREMENT.HIGH,
	'Red Star Montrachet': exports.YAN_REQUIREMENT.LOW,
	'Red Star Pasteur Champange': exports.YAN_REQUIREMENT.LOW,
	'Red Star Pasteur Red': exports.YAN_REQUIREMENT.MEDIUM,
	'Red Star Premier Cuvee': exports.YAN_REQUIREMENT.MEDIUM,
	'Uvaferm 43': exports.YAN_REQUIREMENT.LOW,
	'Uvaferm BDX': exports.YAN_REQUIREMENT.MEDIUM,
	'Uvaferm SVG': exports.YAN_REQUIREMENT.MEDIUM,
	'Uvaferm VRB': exports.YAN_REQUIREMENT.MEDIUM,
	'Viti Levur 58W3': exports.YAN_REQUIREMENT.LOW,
	'Ale/Lager Yeast': exports.YAN_REQUIREMENT.LOW,
	'Kveik': exports.YAN_REQUIREMENT.KVEIK
};

// sugar source identifiers that index into the SUGAR_SOURCE_INFO array
exports.SUGAR_SOURCES = {
	HONEY: 0,
	SUGAR: 1,
	ACEROLA: 2,
	APPLES: 3,
	APRICOTS: 4,
	APRICOTS_DRIED: 5,
	BANANAS: 6,
	BLACKBERRY: 7,
	BLUEBERRY: 8,
	BOYSENBERRY: 9,
	CANTALOUPE: 10,
	CARAMBOLA: 11,
	CARROTS: 12,
	CASABA_MELON: 13,
	CASHEWS: 14,
	CELERY: 15,
	CHERRY_DARK_SWEET: 16,
	CHERRY_MONTMORENCY: 17,
	CRABAPPLES: 18,
	CRANBERRY: 19,
	CURRANT_BLACK: 20,
	CURRANT_RED: 21,
	DATES: 22,
	DATES_DRIED: 23,
	DEWBERRY: 24,
	ELDERBERRY: 25,
	FIGS: 26,
	FIGS_DRIED: 27,
	GOOSEBERRY: 28,
	GRAPE_CONCORD: 29,
	GRAPES: 30,
	GRAPEFRUIT: 31,
	GUANABANA: 32,
	GUAVAS: 33,
	HONEYDEW_MELON: 34,
	JACKFRUIT: 35,
	KIWIS: 36,
	LEMON_JUICE: 37,
	LIME_JUICE: 38,
	LYCHEE_LITCHI: 39,
	LOGANBERRY: 40,
	MANGOS: 41,
	MAPLE_SYRUP: 42,
	MAPLE_SAP: 43,
	MULBERRY: 44,
	NECTARINES: 45,
	ORANGE_JUICE: 46,
	PAPAYA: 47,
	PASSIONFRUIT: 48,
	PEACHES: 49,
	PEARS: 50,
	PERSIMMON: 51,
	PINEAPPLES: 52,
	PLUMS: 53,
	POMEGRANATES: 54,
	PRICKLY_PEAR: 55,
	PRUNES_DRIED: 56,
	QUINCES: 57,
	RAISINS_DRIED: 58,
	RASPBERRY_BLACK: 59,
	RASPBERRY_RED: 60,
	RHUBARB: 61,
	STRAWBERRY: 62,
	SULTANAS: 63,
	TANGERINES: 64,
	TANGELO: 65,
	TOMATOES: 66,
	WATERMELONS: 67,
	YOUNGBERRY: 68,
	DME: 69,
	LME: 70,
	APPLE_JUICE: 71,
	CRANBERRY_JUICE: 72
};

// sugar sources that the calculator function knows about, along with estimated sugar content and YAN provided
exports.SUGAR_SOURCE_INFO = [
	{ name: 'Honey', percent: 79.6, yan: 0 },
	{ name: 'Sugar', percent: 100, yan: 0 },
	{ name: 'Acerola', percent: 3.33, yan: 0.5 },
	{ name: 'Apple(s)', percent: 12.4, yan: 0.237 },
	{ name: 'Apricot(s)', percent: 9.1, yan: 0.5 },
	{ name: 'Apricots (dried)', percent: 39.8, yan: 0.5 },
	{ name: 'Banana(s)', percent: 15.5, yan: 0.5 },
	{ name: 'Blackberry', percent: 8.0, yan: 0.5 },
	{ name: 'Blueberry', percent: 9.8, yan: 0.5 },
	{ name: 'Boysenberry', percent: 5.56, yan: 0.5 },
	{ name: 'Cantaloupe', percent: 7.6, yan: 0.5 },
	{ name: 'Carambola', percent: 4.33, yan: 0.5 },
	{ name: 'Carrot(s)', percent: 4.44, yan: 0.5 },
	{ name: 'Casaba Melon', percent: 4.17, yan: 0.5 },
	{ name: 'Cashew(s)', percent: 6.67, yan: 0.5 },
	{ name: 'Celery', percent: 1.72, yan: 0.5 },
	{ name: 'Cherry, dark sweet', percent: 14.2, yan: 0.5 },
	{ name: 'Cherry, Montmorency', percent: 7.9, yan: 0.5 },
	{ name: 'Crabapple(s)', percent: 8.56, yan: 0.5 },
	{ name: 'Cranberry', percent: 4.17, yan: -1 },
	{ name: 'Currant, black', percent: 9.3, yan: 0.5 },
	{ name: 'Currant, red', percent: 6.0, yan: 0.5 },
	{ name: 'Dates', percent: 10.28, yan: 0.5 },
	{ name: 'Dates (dried)', percent: 64.2, yan: 0.5 },
	{ name: 'Dewberry', percent: 5.56, yan: 0.5 },
	{ name: 'Elderberry', percent: 6.11, yan: 0.5 },
	{ name: 'Fig(s)', percent: 11.8, yan: 0.5 },
	{ name: 'Figs (dried)', percent: 66.5, yan: 0.5 },
	{ name: 'Gooseberry', percent: 11.0, yan: 0.5 },
	{ name: 'Grape, concord', percent: 8.89, yan: 0.5 },
	{ name: 'Grape(s)', percent: 15.9, yan: 0.55 },
	{ name: 'Grapefruit', percent: 6.1, yan: 0.5 },
	{ name: 'Guanabana', percent: 8.89, yan: 0.5 },
	{ name: 'Guava(s)', percent: 6.2, yan: 0.5 },
	{ name: 'Honeydew Melon', percent: 10, yan: 0.5 },
	{ name: 'Jackfruit', percent: 18.4, yan: 0.5 },
	{ name: 'Kiwi(s)', percent: 12.8, yan: 0.5 },
	{ name: 'Lemon Juice', percent: 2.2, yan: 0.5 },
	{ name: 'Lime Juice', percent: 1.0, yan: 0.5 },
	{ name: 'Lychee (Litchi)', percent: 17.0, yan: 0.5 },
	{ name: 'Loganberry', percent: 5.83, yan: 0.5 },
	{ name: 'Mango(s)', percent: 11.4, yan: 0.5 },
	{ name: 'Maple Syrup', percent: 66.2, yan: 0 },
	{ name: 'Maple Sap', percent: 2.0, yan: 0 },
	{ name: 'Mulberry', percent: 13.5, yan: 0.5 },
	{ name: 'Nectarines', percent: 7.5, yan: 0.5 },
	{ name: 'Orange Juice', percent: 10.7, yan: 0.5 },
	{ name: 'Papaya', percent: 6.39, yan: 0.5 },
	{ name: 'Passionfruit', percent: 11.1, yan: 0.5 },
	{ name: 'Peach(es)', percent: 8.8, yan: 0.5 },
	{ name: 'Pear(s)', percent: 10.1, yan: 0.5 },
	{ name: 'Persimmon', percent: 14.0, yan: 0.5 },
	{ name: 'Pineapple(s)', percent: 12.0, yan: 0.5 },
	{ name: 'Plum(s)', percent: 9.8, yan: 0.5 },
	{ name: 'Pomegranate(s)', percent: 11.6, yan: 0.5 },
	{ name: 'Prickly Pear', percent: 11, yan: 0.5 },
	{ name: 'Prunes (dried)', percent: 44.0, yan: 0.5 },
	{ name: 'Quince(s)', percent: 1.0, yan: 0.5 },
	{ name: 'Raisins (dried)', percent: 65, yan: 0.5 },
	{ name: 'Raspberry, black', percent: 6.17, yan: 0.5 },
	{ name: 'Raspberry, red', percent: 5.11, yan: 0.5 },
	{ name: 'Rhubarb', percent: 0.9, yan: 0.5 },
	{ name: 'Strawberry', percent: 6.6, yan: 0.5 },
	{ name: 'Sultanas', percent: 19.0, yan: 0.5 },
	{ name: 'Tangerine(s)', percent: 6.56, yan: 0.5 },
	{ name: 'Tangelo', percent: 7.4, yan: 0.5 },
	{ name: 'Tomato(es)', percent: 2.78, yan: 0.5 },
	{ name: 'Watermelon(s)', percent: 9.0, yan: 0.5 },
	{ name: 'Youngberry', percent: 5.56, yan: 0.5 },
	{ name: 'Dry Malt Extract', percent: 94, yan: 0.5 },
	{ name: 'Liquid Malt Extract', percent: 92, yan: 0.5 },
	{ name: 'Apple Juice', percent: 9.5, yan: 0.237 },
	{ name: 'Cranberry Juice', percent: 7.3, yan: -1 }
];

// nutrien factords for extra low/low/medium/high/kveik requirements
exports.NUTRIENT_FACTOR = [ 0.5, 0.75, 0.9, 1.25, 1.875 ];

// different nutrient regimens that the calculator knows about
exports.NUTRIENT_REGIMEN = { TOSNA: 0, K_DAP: 1, BLOUNT_ELLIOTT: 2, TOSNA_K: 3, O_K: 4, ADVANCED: 5 };

// human-readable strings for the nutrient regimens
exports.NUTRIENT_REGIMEN_STRING = [ 'TOSNA', 'Fermaid K + DAP', 'Blount-Elliott', 'TOSNA (K)', 'Fermaid O/K', 'Advanced' ];

// gravity unit identifiers
exports.GRAVITY_UNITS = { SG: 0, BRIX: 1, BAUME: 2 };

// human-readable gravity units
exports.GRAVITY_UNIT_NAMES = [ 'SG', 'BRIX', 'Baume' ];

// alcohol content unit identifiers
exports.ABV_UNITS = { ABV: 0, ABW: 1 };

// human-readable alcohol content units
exports.ABV_UNIT_NAMES = [ '%ABV', '%ABW' ];

// units identifiers for the blending calculator
exports.BLEND_UNITS = { SG: 0, BRIX: 1, BAUME: 2, ABV: 3, ABW: 4, OTHER: 5 };

// human-redable blending calculator units
exports.BLEND_UNIT_NAMES = [ 'SG', 'BRIX', 'Baume', '%ABV', '%ABW', 'Value' ];

// field identifiers for the blending calculator
exports.BLEND_FIELDS = { VALUE1: 0, VALUE2: 1, BLENDED_VALUE: 2, VOLUME1: 3, VOLUME2: 4, TOTAL_VOLUME: 5 };

// types of units that control various defaults and displays
exports.UNITS = { METRIC: 0, US: 1, IMPERIAL: 2 };

// human-readable unit names
exports.UNIT_NAMES = [ 'Metric', 'US', 'Imperial' ];

// OGs for dry FG estimate
exports.DRY_FG_OG_VALUES = [ 1.000, 1.040, 1.100, 1.144 ];

// FGs for dry FG esimate
exports.DRY_FG_FG_VALUES = [ 1.000, 0.998, 0.995, 0.990 ];
