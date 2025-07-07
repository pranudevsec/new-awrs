export const awardTypeOptions: OptionType[] = [
  { value: "citation", label: "Citation" },
  { value: "appreciation", label: "Appreciation" },
];

export const unitOptions: OptionType[] = [
  { value: "n/a", label: "N/A" },
  { value: "unit1", label: "Unit 1" },
  { value: "myunit", label: "My Unit" },
  { value: "unit2", label: "Unit 2" },
  { value: "unit3", label: "Unit 3" },
  { value: "unit4", label: "Unit 4" },
  { value: "unit5", label: "Unit 5" },
];

export const brigadeOptions: OptionType[] = [
  { value: "n/a", label: "N/A" },
  { value: "mybde", label: "My Brigade" },
  { value: "brigade1", label: "Brigade 1" },
  { value: "brigade2", label: "Brigade 2" },
  { value: "brigade3", label: "Brigade 3" },
  { value: "brigade4", label: "Brigade 4" },
  { value: "brigade5", label: "Brigade 5" },
];

export const divisonOptions: OptionType[] = [
  { value: "n/a", label: "N/A" },
  { value: "mydiv", label: "My Division" },
  { value: "divison1", label: "Divison 1" },
  { value: "divison2", label: "Divison 2" },
  { value: "divison3", label: "Divison 3" },
  { value: "divison4", label: "Divison 4" },
  { value: "divison5", label: "Divison 5" },
];

export const divisionOptions: OptionType[] = [
  { value: "n/a", label: "N/A" },
  { value: "mydiv", label: "My Division" },
  { value: "divison1", label: "Divison 1" },
  { value: "divison2", label: "Divison 2" },
  { value: "divison3", label: "Divison 3" },
  { value: "divison4", label: "Divison 4" },
  { value: "divison5", label: "Divison 5" },
];

export const corpsOptions: OptionType[] = [
  { value: "n/a", label: "N/A" },
  { value: "mycorps", label: "My Corps" },
  { value: "corps1", label: "Corps 1" },
  { value: "corps2", label: "Corps 2" },
  { value: "corps3", label: "Corps 3" },
  { value: "corps4", label: "Corps 4" },
  { value: "corps5", label: "Corps 5" },
];

export const commandOptions: OptionType[] = [
  { value: "NC", label: "Northern Command" },
  { value: "WC", label: "Western Command" },
  { value: "CC", label: "Central Command" },
  { value: "EC", label: "Eastern Command" },
  { value: "SC", label: "Southern Command" },
  { value: "SWC", label: "South Western Command" },
  { value: "TC", label: "Training Command" },
];

export const hierarchicalStructure = [
  ["northern", "mycorps", "mydiv", "mybde", "myunit"],
  ["western", "corps1", "divison1", "brigade1", "unit1"],
  ["central", "corps2", "divison2", "brigade2", "unit2"],
  ["eastern", "corps3", "divison3", "brigade3", "unit3"],
  ["southern", "corps4", "divison4", "brigade4", "unit4"],
  ["training", "corps5", "divison5", "brigade5", "unit5"],
];

// export const roleOptions: OptionType[] = [
//   { value: "unit", label: "Unit" },
//   { value: "brigade", label: "Brigade" },
//   { value: "division", label: "Division" },
//   { value: "corps", label: "Corps" },
//   { value: "command", label: "Command" },
//   { value: "headquarter", label: "Headquarter" },
//   { value: "cw2", label: "CW2" },
//   { value: "admin", label: "Admin" },

// ];
export const roleOptions = [
  { label: "Unit", value: "unit" },
  { label: "Brigade", value: "brigade" },
  { label: "Division", value: "division" },
  { label: "Corps", value: "corps" },
  { label: "Command", value: "command" },
  { label: "AGs Br/CW2/IHQ (Army)", value: "headquarter" }, 
  { label: "MO", value: "cw2_mo" },
  { label: "OL", value: "cw2_ol" },
  { label: "HR", value: "cw2_hr" },
  { label: "DV", value: "cw2_dv" },
  { label: "MP", value: "cw2_mp" },
  { label: "Admin", value: "admin" },
];
export const roleOptions2: OptionType[] = [
  { value: "all", label: "All" },
  { value: "unit", label: "Unit" },
  { value: "brigade", label: "Brigade" },
  { value: "division", label: "Division" },
  { value: "corps", label: "Corps" },
  { value: "command", label: "Command" },
];

export const unitTypeOptions = [
<<<<<<< Updated upstream
  { label: "AC – Armoured Corps", value: "AC" },
  { label: "Arty – Artillery", value: "ARTY" },
  { label: "Army Avn – Army Aviation", value: "Army Avn" },
  { label: "Egrs – Engineers", value: "ENGRS" },
  { label: "Guards – Brigade of the Guards", value: "Guards" },
  { label: "Inf – Infantry", value: "Inf" },
  { label: "Int Corps – Intelligence Corps", value: "Int Corps" },
  { label: "AMC – Army Medical Corps", value: "AMC" },
  { label: "AAD", value: "AAD" }
=======
  { label: "RR", value: "RR" },
  { label: "SF", value: "SF" },
  { label: "ARTY", value: "ARTY" },
  { label: "INFANTRY", value: "INFANTRY" },
  { label: "ARMD", value: "ARMD" },
  { label: "MECH INF", value: "MECH INF" },
  { label: "SATA", value: "SATA" },
  { label: "ENGRS", value: "ENGRS" },
  { label: "SIGS", value: "SIGS" },
  { label: "EW", value: "EW" },
  { label: "SI", value: "SI" },
  { label: "AAD", value: "AAD" },
  { label: "ARMY AVN", value: "ARMY AVN" },
  { label: "INT", value: "INT" },
  { label: "ASC (MT)", value: "ASC (MT)" },
  { label: "ASC (AT)", value: "ASC (AT)" },
  { label: "ASC (SUP/FOL)", value: "ASC (SUP/FOL)" },
  { label: "MED", value: "MED" },
  { label: "FD HOSP", value: "FD HOSP" },
  { label: "ORD (FOD)", value: "ORD (FOD)" },
  { label: "ORD (DOU)", value: "ORD (DOU)" },
  { label: "ORD (FAD)", value: "ORD (FAD)" },
  { label: "ORD (NVCD/VEH COY)", value: "ORD (NVCD/VEH COY)" },
  { label: "EME", value: "EME" },
  { label: "RVC", value: "RVC" },
>>>>>>> Stashed changes
];

export const matrixUnitOptions = [
  { label: "CI/CT", value: "HINTERLAND" },
  { label: "LC", value: "LC" },
  { label: "LAC", value: "LAC" },
  { label: "IS", value: "IS" },
  { label: "NM", value: "NM" },
];