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

export const hierarchicalStructure2 = {
  "northern":{
    "mycorps":{
      "mydiv":{
        "mybde": [ "myunit", "unit1", "unit2", "unit3" ],
        "bde1": [ "unit4", "unit9", "unit6" ],
        "bde2": [ "unit7", "unit8" ]
      },
      "div1": {
        "bde1": [ "unit10", "unit11" ],
        "bde2": [ "unit12", "unit13" ]
      }
    },
    "corps1": {
      "div2": {
        "bde3": [ "unit14", "unit15" ],
        "bde4": [ "unit16", "unit17" ]
      },
      "div3": {
        "bde5": [ "unit18", "unit19" ],
        "bde6": [ "unit20", "unit21" ]
      }
    }
  },
  "western": {
    "corps2": {
      "div4": {
        "bde7": [ "unit22", "unit23" ],
        "bde8": [ "unit24", "unit25" ]
      },
      "div5": {
        "bde9": [ "unit26", "unit27" ],
        "bde10": [ "unit28", "unit29" ]
      }
    },
    "corps3": {
      "div6": {
        "bde11": [ "unit30", "unit31" ],
        "bde12": [ "unit32", "unit33" ]
      },
      "div7": {
        "bde13": [ "unit34", "unit35" ],
        "bde14": [ "unit36", "unit37" ]
      }
    }
  },
  "central": {
    "corps4": {
      "div8": {
        "bde15": [ "unit38", "unit39" ],
        "bde16": [ "unit40", "unit41" ]
      },
      "div9": {
        "bde17": [ "unit42", "unit43" ],
        "bde18": [ "unit44", "unit45" ]
      }
    },
    "corps5": {
      "div10": {
        "bde19": [ "unit46", "unit47" ],
        "bde20": [ "unit48", "unit49" ]
      },
      "div11": {
        "bde21": [ "unit50", "unit51" ],
        "bde22": [ "unit52", "unit53" ]
      }
    }
  },
  "eastern": {
    "corps6": {
      "div12": {
        "bde23": [ "unit54", "unit55" ],
        "bde24": [ "unit56", "unit57" ]
      },
      "div13": {
        "bde25": [ "unit58", "unit59" ],
        "bde26": [ "unit60", "unit61" ]
      }
    },
    "corps7": {
      "div14": {
        "bde27": [ "unit62", "unit63" ],
        "bde28": [ "unit64", "unit65" ]
      },
      "div15": {
        "bde29": [ "unit66", "unit67" ],
        "bde30": [ "unit68", "unit69" ]
      }
    }
  },
  "southern": {
    "corps8": {
      "div16": {
        "bde31": [ "unit70", "unit71" ],
        "bde32": [ "unit72", "unit73" ]
      },
      "div17": {
        "bde33": [ "unit74", "unit75" ],
        "bde34": [ "unit76", "unit77" ]
      }
    },
    "corps9": {
      "div18": {
        "bde35": [ "unit78", "unit79" ],
        "bde36": [ "unit80", "unit81" ]
      },
      "div19": {
        "bde37": [ "unit82", "unit83" ],
        "bde38": [ "unit84", "unit85" ]
      }
    }
  },
  "southwestern": {
    "corps10": {
      "div20": {
        "bde39": [ "unit86", "unit87" ],
        "bde40": [ "unit88", "unit89" ]
      },
      "div21": {
        "bde41": [ "unit90", "unit91" ],
        "bde42": [ "unit92", "unit93" ]
      }
    },
    "corps11": {
      "div22": {
        "bde43": [ "unit94", "unit95" ],
        "bde44": [ "unit96", "unit97" ]
      },
      "div23": {
        "bde45": [ "unit98", "unit99" ],
        "bde46": [ "unit100", "unit101" ]
      }
    }
  },
  "training": {
    "corps12": {
      "div24": {
        "bde47": [ "unit102", "unit103" ],
        "bde48": [ "unit104", "unit105" ]
      },
      "div25": {
        "bde49": [ "unit106", "unit107" ],
        "bde50": [ "unit108", "unit109" ]
      }
    },
    "corps13": {
      "div26": {
        "bde51": [ "unit110", "unit111" ],
        "bde52": [ "unit112", "unit113" ]
      },
      "div27": {
        "bde53": [ "unit114", "unit115" ],
        "bde54": [ "unit116", "unit117" ]
      }
    }
  }
};

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
];

export const matrixUnitOptions = [
  { label: "CI/CT", value: "HINTERLAND" },
  { label: "LC/AIOS/LAC/HAA/AGPL", value: "LC/AIOS/LAC/HAA/AGPL" },
  { label: "IS", value: "IS" },
  { label: "NM", value: "NM" },
];
