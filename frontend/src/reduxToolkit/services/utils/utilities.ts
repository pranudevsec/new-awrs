
export const checkUnitProfileFields = (profile: any) => {
    if (!profile?.unit) return false;
    let requiredFields = ["bde","comd","corps","div","location", "matrix_unit", "unit_type","name"];
    if(profile?.user?.is_special_unit) {
        requiredFields = ["name", "location", "unit_type", "matrix_unit","comd"];
    }
    for (const field of requiredFields) {
      if (
        profile.unit[field] === undefined ||
        profile.unit[field] === null ||
        (typeof profile.unit[field] === "string" && profile.unit[field].trim() === "") ||
        (Array.isArray(profile.unit[field]) && profile.unit[field].length === 0)
      ) {
        
        return false;
      }
    }
    return true;
  };