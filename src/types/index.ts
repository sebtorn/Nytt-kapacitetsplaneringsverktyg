// Kapacitetsplaneringsverktyg - Typer

// Kompetensområden
export type Competency = 'frontend' | 'backend' | 'fullstack' | 'devops' | 'design' | 'test' | 'other';

// Teammedlem
export interface TeamMember {
  id: string;
  name: string;
  competencies: Competency[];
  weeklyCapacity: number; // Timmar per vecka (normalt 40)
  availability: number; // Andel tillgänglighet (0-1, där 1 = 100%)
  hourlyRate?: number; // Valfri: timkostnad för kalkyler
}

// Sprint
export interface Sprint {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  description?: string;
  isActive: boolean;
}

// Arbetsuppgift / Task
export interface WorkItem {
  id: string;
  title: string;
  description?: string;
  estimatedHours: number; // Uppskattade timmar
  actualHours?: number; // Faktiska timmar (valfri)
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'backlog' | 'planned' | 'in-progress' | 'done' | 'blocked';
  sprintId?: string; // Vilken sprint den tillhör
  assignedToId?: string; // Tilldelad till teammedlem
  deliveryId?: string; // Kopplad till leverans
  competenciesRequired: Competency[]; // Vilka kompetenser som krävs
}

// Leverans / Delivery
export interface Delivery {
  id: string;
  name: string;
  description?: string;
  targetDate: Date; // Mål-datum för leverans
  status: 'planned' | 'in-progress' | 'at-risk' | 'completed' | 'delayed';
  workItemIds: string[]; // Lista av arbetsuppgifter som hör till denna leverans
}

// Kapacitetsdata för visualisering
export interface CapacityData {
  sprintId: string;
  sprintName: string;
  totalCapacity: number; // Total tillgänglig kapacitet i timmar
  allocatedHours: number; // Allokerade timmar
  utilizationRate: number; // Utnyttjandegrad (0-1)
  isOverloaded: boolean; // Om sprinten är överbelastad
  members: {
    memberId: string;
    memberName: string;
    allocatedHours: number;
    capacity: number;
  }[];
}

// App-state
export interface AppState {
  teamMembers: TeamMember[];
  sprints: Sprint[];
  workItems: WorkItem[];
  deliveries: Delivery[];
}

// Hjälptyper
export type WorkItemStatus = WorkItem['status'];
export type Priority = WorkItem['priority'];
export type DeliveryStatus = Delivery['status'];

// Filter och sorteringsalternativ
export interface FilterOptions {
  sprintId?: string;
  assignedToId?: string;
  priority?: Priority[];
  status?: WorkItemStatus[];
  competency?: Competency[];
}

export interface SortOptions {
  field: 'title' | 'estimatedHours' | 'priority' | 'status' | 'dueDate';
  direction: 'asc' | 'desc';
}
