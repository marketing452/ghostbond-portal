export interface Task {
  id: string;
  name: string;
  status: string;
  channel: string[];
  creativeType: string[];
  assignedTo: string[];
  requestedBy: string[]; // Strict Email from mapping
  dueDate: string | null;
  effort: string | null;
  deliverable: string | null;
  brief: string | null;
  fileLink: string | null;
}
