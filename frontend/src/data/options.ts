// import { VscArchive } from "react-icons/vsc";

export const awardTypeOptions: OptionType[] = [
  { value: "All", label: "All" },
  { value: "citation", label: "Citation" },
  { value: "appreciation", label: "Appreciation" },
];

export const unitOptions: OptionType[] = [
  { value: "", label: "All" },
  { value: "unit1", label: "Unit 1" },
  { value: "myunit", label: "My Unit" },
  { value: "unit2", label: "Unit 2" },
  { value: "unit3", label: "Unit 3" },
  { value: "unit4", label: "Unit 4" },
  { value: "unit5", label: "Unit 5" },
  { value: "unit6", label: "Unit 6" },
  { value: "unit7", label: "Unit 7" },
  { value: "unit8", label: "Unit 8" },
  { value: "unit9", label: "Unit 9" },
  { value: "unit10", label: "Unit 10" },
   { value: "unit11", label: "Unit 11" },
    { value: "unit12", label: "Unit 12" },
     { value: "unit13", label: "Unit 13" },
      { value: "unit14", label: "Unit 14" },
        { value: "unit15", label: "Unit 15" },
  { value: "unit16", label: "Unit 16" },
  { value: "unit17", label: "Unit 17" },
   { value: "unit18", label: "Unit 18" },
    { value: "unit19", label: "Unit 19" },
     { value: "ahcc", label: "AHCC" }
      
      
   
];

export const brigadeOptions: OptionType[] = [
  { value: "", label: "All" },
  { value: "mybde", label: "My Brigade" },
  { value: "brigade1", label: "Brigade 1" },
  { value: "brigade2", label: "Brigade 2" },
  { value: "brigade3", label: "Brigade 3" },
  { value: "brigade4", label: "Brigade 4" },
  { value: "brigade5", label: "Brigade 5" },
  { value: "brigade6", label: "Brigade 6" },
  { value: "brigade7", label: "Brigade 7" },
  { value: "brigade8", label: "Brigade 8" },
  { value: "brigade9", label: "Brigade 9" },
  { value: "brigade10", label: "Brigade 10" },
];

export const divisionOptions: OptionType[] = [
  { value: "", label: "All" },
  { value: "divison1", label: "Divison 1" },
  { value: "divison2", label: "Divison 2" },
  { value: "divison3", label: "Divison 3" },
  { value: "divison4", label: "Divison 4" },
  { value: "divison5", label: "Divison 5" },
  { value: "divison6", label: "Divison 6" },
  { value: "divison7", label: "Divison 7" },
  { value: "divison8", label: "Divison 8" },
  { value: "divison9", label: "Divison 9" },
  { value: "divison10", label: "Divison 10" },
  { value: "divison11", label: "Divison 11" },
  { value: "divison12", label: "Divison 12" },
  { value: "divison14", label: "Divison 14" },
  { value: "divison15", label: "Divison 15" },
  { value: "divison16", label: "Divison 16" },
  { value: "divison17", label: "Divison 17" },
  { value: "divison18", label: "Divison 18" },
  { value: "divison19", label: "Divison 19" },
  { value: "divison20", label: "Divison 20" },
  { value: "divison21", label: "Divison 21" },
  { value: "divison22", label: "Divison 22" },
  { value: "divison23", label: "Divison 23" },
  { value: "divison24", label: "Divison 24" },
  { value: "divison25", label: "Divison 25" },
  { value: "divison26", label: "Divison 26" },
  { value: "divison27", label: "Divison 27" },
  { value: "divison28", label: "Divison 28" },
  { value: "divison31", label: "Divison 31" },
  { value: "divison36", label: "Divison 36" },
  { value: "divison40", label: "Divison 40" },
  { value: "divison41", label: "Divison 41" },
  { value: "divison42", label: "Divison 42" },
  { value: "divison56", label: "Divison 56" },
  { value: "divison59", label: "Divison 59" },
  { value: "divison71", label: "Divison 71" },
  { value: "divison72", label: "Divison 72" },
];

export const corpsOptions: OptionType[] = [
  { value: "", label: "All" },
  { value: "mycorps", label: "My Corps" },
  { value: "corps1", label: "Corps 1" },
  { value: "corps2", label: "Corps 2" },
  { value: "corps3", label: "Corps 3" },
  { value: "corps4", label: "Corps 4" },
  { value: "corps9", label: "Corps 9" },
  { value: "corps10", label: "Corps 10" },
  { value: "corps11", label: "Corps 11" },
  { value: "corps14", label: "Corps 14" },
  { value: "corps15", label: "Corps 15" },
  { value: "corps16", label: "Corps 16" },
  { value: "corps17", label: "Corps 17" },
  { value: "corps33", label: "Corps 33" },
  { value: "corps21", label: "Corps 21" },
];

export const commandOptions: OptionType[] = [
  { value: "Southern Command", label: "Southern Command" },
  { value: "Eastern Command", label: "Eastern Command" },
  { value: "Western Command", label: "Western Command" },
  { value: "Central Command", label: "Central Command" },
  { value: "Northern Command", label: "Northern Command" },
  { value: "Artrac Command", label: "Artrac Command" },
  { value: "South Western Command", label: "South Western Command" },
];

export const hierarchicalStructure = [
  ["northern", "mycorps", "mydiv", "mybde", "myunit"],
  ["western", "corps1", "divison1", "brigade1", "unit1"],
  ["central", "corps2", "divison2", "brigade2", "unit2"],
  ["eastern", "corps3", "divison3", "brigade3", "unit3"],
  ["southern", "corps4", "divison4", "brigade4", "unit4"],
  ["training", "corps5", "divison5", "brigade5", "unit5"],
  ["southwestern", "corps6", "divison6", "brigade6", "unit6"],
  ["northern", "corps7", "divison7", "brigade7", "unit7"],
  ["western", "corps8", "divison8", "brigade8", "unit8"],
  ["central", "corps9", "divison9", "brigade9", "unit9"],
  ["eastern", "corps10", "divison10", "brigade10", "unit10"],
  ["southern", "corps11", "divison11", "brigade11", "unit11"],
  ["southwestern", "corps12", "divison12", "brigade12", "unit12"],
  ["training", "corps13", "divison13", "brigade13", "unit13"],
  ["northern", "corps14", "divison14", "brigade14", "unit14"],
  ["western", "corps15", "divison15", "brigade15", "unit15"],
  ["central", "corps16", "divison16", "brigade16", "unit16"],
  ["eastern", "corps17", "divison17", "brigade17", "unit17"],
  ["southern", "corps18", "divison18", "brigade18", "unit18"],
  ["southwestern", "corps19", "divison19", "brigade19", "unit19"],
  ["training", "corps20", "divison20", "brigade20", "unit20"],
  ["northern", "corps21", "divison21", "brigade21", "unit21"],
  ["western", "corps22", "divison22", "brigade22", "unit22"],
  ["central", "corps23", "divison23", "brigade23", "unit23"],
  ["eastern", "corps24", "divison24", "brigade24", "unit24"],
];

export const hierarchicalStructure2 = {
  northern: {
    mycorps: {
      mydiv: {
        mybde: ["myunit", "unit1", "unit2", "unit3"],
        bde1: ["unit4", "unit9", "unit6"],
        bde2: ["unit7", "unit8"],
      },
      div1: {
        bde1: ["unit10", "unit11"],
        bde2: ["unit12", "unit13"],
      },
    },
    corps1: {
      div2: {
        bde3: ["unit14", "unit15"],
        bde4: ["unit16", "unit17"],
      },
      div3: {
        bde5: ["unit18", "unit19"],
        bde6: ["unit20", "unit21"],
      },
    },
  },
  western: {
    corps2: {
      div4: {
        bde7: ["unit22", "unit23"],
        bde8: ["unit24", "unit25"],
      },
      div5: {
        bde9: ["unit26", "unit27"],
        bde10: ["unit28", "unit29"],
      },
    },
    corps3: {
      div6: {
        bde11: ["unit30", "unit31"],
        bde12: ["unit32", "unit33"],
      },
      div7: {
        bde13: ["unit34", "unit35"],
        bde14: ["unit36", "unit37"],
      },
    },
  },
  central: {
    corps4: {
      div8: {
        bde15: ["unit38", "unit39"],
        bde16: ["unit40", "unit41"],
      },
      div9: {
        bde17: ["unit42", "unit43"],
        bde18: ["unit44", "unit45"],
      },
    },
    corps5: {
      div10: {
        bde19: ["unit46", "unit47"],
        bde20: ["unit48", "unit49"],
      },
      div11: {
        bde21: ["unit50", "unit51"],
        bde22: ["unit52", "unit53"],
      },
    },
  },
  eastern: {
    corps6: {
      div12: {
        bde23: ["unit54", "unit55"],
        bde24: ["unit56", "unit57"],
      },
      div13: {
        bde25: ["unit58", "unit59"],
        bde26: ["unit60", "unit61"],
      },
    },
    corps7: {
      div14: {
        bde27: ["unit62", "unit63"],
        bde28: ["unit64", "unit65"],
      },
      div15: {
        bde29: ["unit66", "unit67"],
        bde30: ["unit68", "unit69"],
      },
    },
  },
  southern: {
    corps8: {
      div16: {
        bde31: ["unit70", "unit71"],
        bde32: ["unit72", "unit73"],
      },
      div17: {
        bde33: ["unit74", "unit75"],
        bde34: ["unit76", "unit77"],
      },
    },
    corps9: {
      div18: {
        bde35: ["unit78", "unit79"],
        bde36: ["unit80", "unit81"],
      },
      div19: {
        bde37: ["unit82", "unit83"],
        bde38: ["unit84", "unit85"],
      },
    },
  },
  southwestern: {
    corps10: {
      div20: {
        bde39: ["unit86", "unit87"],
        bde40: ["unit88", "unit89"],
      },
      div21: {
        bde41: ["unit90", "unit91"],
        bde42: ["unit92", "unit93"],
      },
    },
    corps11: {
      div22: {
        bde43: ["unit94", "unit95"],
        bde44: ["unit96", "unit97"],
      },
      div23: {
        bde45: ["unit98", "unit99"],
        bde46: ["unit100", "unit101"],
      },
    },
  },
  training: {
    corps12: {
      div24: {
        bde47: ["unit102", "unit103"],
        bde48: ["unit104", "unit105"],
      },
      div25: {
        bde49: ["unit106", "unit107"],
        bde50: ["unit108", "unit109"],
      },
    },
    corps13: {
      div26: {
        bde51: ["unit110", "unit111"],
        bde52: ["unit112", "unit113"],
      },
      div27: {
        bde53: ["unit114", "unit115"],
        bde54: ["unit116", "unit117"],
      },
    },
  },
};

export const roleOptions = [
  { label: "Unit", value: "unit" },
  { label: "Special Unit", value: "special_unit" },
  { label: "Brigade", value: "brigade" },
  { label: "Brigade (Member)", value: "brigade_member" },
  { label: "Division", value: "division" },
  { label: "Division (Member)", value: "division_member" },
  { label: "Corps", value: "corps" },
  { label: "Corps (Member)", value: "corps_member" },
  { label: "Command", value: "command" },
  { label: "Command (Member)", value: "command_member" },
  { label: "AGs Br/CW2/IHQ (Army)", value: "headquarter" },
  { label: "MO", value: "cw2_mo" },
  { label: "OL", value: "cw2_ol" },
  { label: "HR", value: "cw2_hr" },
  { label: "DV", value: "cw2_dv" },
  { label: "MP", value: "cw2_mp" },
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
  { label: "AAD", value: "AAD" },
  { label: "ARMD/MECH INF", value: "ARMD/MECH INF" },
  { label: "ARMY AVN", value: "ARMY AVN" },
  { label: "ARMY DOG UNIT", value: "ARMY DOG UNIT" },
  { label: "ARTY", value: "ARTY" },
  { label: "ASC", value: "ASC" },
  { label: "ASC (AT)", value: "ASC (AT)" },
  { label: "ASC (MT)", value: "ASC (MT)" },
  { label: "ASC (SUP)", value: "ASC (SUP)" },
  { label: "ASC (SUP/FOL)", value: "ASC (SUP/FOL)" },
  { label: "ASC 2nd & 3rd LINE TPT", value: "ASC 2nd & 3rd LINE TPT" },
  { label: "AVN", value: "AVN" },
  { label: "CMP", value: "CMP" },
  { label: "DENTAL", value: "DENTAL" },
  { label: "DSC", value: "DSC" },
  { label: "EME", value: "EME" },
  { label: "ENGRS", value: "ENGRS" },
  { label: "EW/SI", value: "EW/SI" },
  { label: "FD HOSP", value: "FD HOSP" },
  { label: "FFU", value: "FFU" },
  { label: "INFANTRY", value: "INFANTRY" },
  { label: "INT", value: "INT" },
  { label: "MED", value: "MED" },
  { label: "MED LESS FD HOSP", value: "MED LESS FD HOSP" },
  { label: "ORD", value: "ORD" },
  { label: "ORD (DOU)", value: "ORD (DOU)" },
  { label: "ORD (FAD)", value: "ORD (FAD)" },
  { label: "ORD (FOD)", value: "ORD (FOD)" },
  { label: "ORD (NCVD/VEH COY)", value: "ORD (NCVD/VEH COY)" },
  { label: "ORD AMN", value: "ORD AMN" },
  { label: "REGT/TRG", value: "REGT/TRG" },
  { label: "REGTL CENTRES & RECORDS", value: "REGTL CENTRES & RECORDS" },
  { label: "RVC", value: "RVC" },
  {
    label: "RVC (REMOUNT TRG SCHOOL & DEPOTS)",
    value: "RVC (REMOUNT TRG SCHOOL & DEPOTS)",
  },
  { label: "RVC : MIL VET HOSP", value: "RVC : MIL VET HOSP" },
  { label: "RVC UNITS CMVL", value: "RVC UNITS CMVL" },
  {
    label: "RVC UNITS(EQUINE BREEDING STUD)",
    value: "RVC UNITS(EQUINE BREEDING STUD)",
  },
  { label: "SATA", value: "SATA" },
  { label: "SIGNAL", value: "SIGNAL" },
  { label: "TA", value: "TA" },
  { label: "OTHERS", value: "OTHERS" },
];

export const matrixUnitOptions = [
  { label: "CI/CT", value: "HINTERLAND" },
  { label: "LC", value: "LC" },
  { label: "AIOS", value: "AIOS" },
  { label: "LAC", value: "LAC" },
  { label: "HAA", value: "HAA" },
  { label: "AGPL", value: "AGPL" },
  { label: "Internal Security (IS)", value: "IS" },
  { label: "Non Metrics (NM)", value: "NM" },
  { label: "Peace/Mod Fd", value: "Peace" },
];

export const rank = [
  { label: "Lt Gen", value: "Lt Gen" },
  { label: "Maj Gen", value: "Maj Gen" },
  { label: "Brig", value: "Brig" },
  { label: "Col", value: "Col" },
  { label: "Lt Col", value: "Lt Col" },
  { label: "Maj", value: "Maj" },
  { label: "Capt", value: "Capt" },
  { label: "Lt", value: "Lt" },
];

export const parameterArmService = [
  { label: "CI/CT", value: "HINTERLAND" },
  { label: "LC", value: "LC" },
  { label: "AIOS", value: "AIOS" },
  { label: "LAC", value: "LAC" },
  { label: "HAA", value: "HAA" },
  { label: "AGPL", value: "AGPL" },
  { label: "Internal Security (IS)", value: "IS" },
  { label: "Non Metrics (NM)", value: "NM" },
  { label: "Peace/Mod Fd", value: "Peace" },
  { label: "AAD", value: "AAD" },
  { label: "ARMD/MECH INF", value: "ARMD/MECH INF" },
  { label: "ARMY AVN", value: "ARMY AVN" },
  { label: "ARMY DOG UNIT", value: "ARMY DOG UNIT" },
  { label: "ARTY", value: "ARTY" },
  { label: "ASC", value: "ASC" },
  { label: "ASC (AT)", value: "ASC (AT)" },
  { label: "ASC (MT)", value: "ASC (MT)" },
  { label: "ASC (SUP)", value: "ASC (SUP)" },
  { label: "ASC (SUP/FOL)", value: "ASC (SUP/FOL)" },
  { label: "ASC 2nd & 3rd LINE TPT", value: "ASC 2nd & 3rd LINE TPT" },
  { label: "AVN", value: "AVN" },
  { label: "CMP", value: "CMP" },
  { label: "DENTAL", value: "DENTAL" },
  { label: "DSC", value: "DSC" },
  { label: "EME", value: "EME" },
  { label: "ENGRS", value: "ENGRS" },
  { label: "EW/SI", value: "EW/SI" },
  { label: "FD HOSP", value: "FD HOSP" },
  { label: "FFU", value: "FFU" },
  { label: "INFANTRY", value: "INFANTRY" },
  { label: "INT", value: "INT" },
  { label: "MED", value: "MED" },
  { label: "MED LESS FD HOSP", value: "MED LESS FD HOSP" },
  { label: "ORD", value: "ORD" },
  { label: "ORD (DOU)", value: "ORD (DOU)" },
  { label: "ORD (FAD)", value: "ORD (FAD)" },
  { label: "ORD (FOD)", value: "ORD (FOD)" },
  { label: "ORD (NCVD/VEH COY)", value: "ORD (NCVD/VEH COY)" },
  { label: "ORD AMN", value: "ORD AMN" },
  { label: "REGT/TRG", value: "REGT/TRG" },
  { label: "REGTL CENTRES & RECORDS", value: "REGTL CENTRES & RECORDS" },
  { label: "RVC", value: "RVC" },
  {
    label: "RVC (REMOUNT TRG SCHOOL & DEPOTS)",
    value: "RVC (REMOUNT TRG SCHOOL & DEPOTS)",
  },
  { label: "RVC : MIL VET HOSP", value: "RVC : MIL VET HOSP" },
  { label: "RVC UNITS CMVL", value: "RVC UNITS CMVL" },
  {
    label: "RVC UNITS(EQUINE BREEDING STUD)",
    value: "RVC UNITS(EQUINE BREEDING STUD)",
  },
  { label: "SATA", value: "SATA" },
  { label: "SIGNAL", value: "SIGNAL" },
  { label: "TA", value: "TA" },
  { label: "OTHERS", value: "OTHERS" },
];

export const cyclePeriodOptions: OptionType[] = [
  { value: "2024 - H1", label: "2024 - H1" },
  { value: "2024 - H2", label: "2024 - H2" },
  { value: "2025 - H1", label: "2025 - H1" },
  { value: "2025 - H2", label: "2025 - H2" },
];

export const getParamDisplay = (param: any) => {
  const { name, category, subcategory, subsubcategory } = param;

  if (name !== "no") {
    return {
      main: name,
      header: category ?? null,
      subheader: subcategory ?? null,
      subsubheader: subsubcategory ?? null,
    };
  }

  const main = subsubcategory ?? subcategory ?? category ?? null;

  return {
    main,
    header: subsubcategory ? category ?? null : null,
    subheader: subsubcategory ? subcategory ?? null : null,
    subsubheader: null,
  };
};

export const DisclaimerText = {
  unit: `I hereby confirm that the information provided by me is accurate and up-to-date. 
  I understand that it is my sole responsibility to ensure the correctness of the information and I accept 
  any consequences arising by providing false or outdated details.`,
  All: `I hereby declare that, I have thoroughly reviewed the application, channel of reporting and supporting documents. 
  My recommendation/decision is based solely on the information presented.`,
};
