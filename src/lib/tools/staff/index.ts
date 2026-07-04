import { getStaffTool } from "@/lib/tools/staff/get-staff";
import { hireStaffTool } from "@/lib/tools/staff/hire-staff";
import { listStaffTool } from "@/lib/tools/staff/list-staff";
import { updateStaffTool } from "@/lib/tools/staff/update-staff";

export const staffTools = {
  hire_staff: hireStaffTool,
  list_staff: listStaffTool,
  get_staff: getStaffTool,
  update_staff: updateStaffTool,
} as const;
