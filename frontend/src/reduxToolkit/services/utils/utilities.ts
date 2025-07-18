import { toast } from "react-hot-toast";
export const checkUnitProfileFields = (profile: any) => {
    if (!profile?.unit) return false;
    const requiredFields = ["bde","comd","corps","div","location", "matrix_unit", "unit_type","name"];
    for (const field of requiredFields) {
      if (
        profile.unit[field] === undefined ||
        profile.unit[field] === null ||
        (typeof profile.unit[field] === "string" && profile.unit[field].trim() === "") ||
        (Array.isArray(profile.unit[field]) && profile.unit[field].length === 0)
      ) {
        toast.error("Please complete profile setting. Every field is mandatory.");
        return false;
      }
    }
    return true;
  };