import { useMemo } from 'react';
import { TeamMember, Sprint, WorkItem, CapacityData } from '../types';

/**
 * Beräknar total kapacitet för en sprint baserat på teammedlemmar
 */
export function calculateSprintCapacity(
  sprint: Sprint,
  teamMembers: TeamMember[],
  workItems: WorkItem[]
): CapacityData {
  // Beräkna sprintens längd i veckor
  const sprintDurationWeeks = calculateSprintDurationInWeeks(sprint);
  
  // Total kapacitet för alla teammedlemmar
  let totalCapacity = 0;
  const membersData = teamMembers.map(member => {
    const memberCapacity = member.weeklyCapacity * member.availability * sprintDurationWeeks;
    totalCapacity += memberCapacity;
    
    return {
      memberId: member.id,
      memberName: member.name,
      allocatedHours: 0, // Kommer att fyllas i nedan
      capacity: memberCapacity
    };
  });

  // Beräkna allokerade timmar för sprinten
  let allocatedHours = 0;
  const sprintWorkItems = workItems.filter(item => item.sprintId === sprint.id);
  
  sprintWorkItems.forEach(item => {
    allocatedHours += item.estimatedHours;
    
    // Uppdatera allokerade timmar för den tilldelade medarbetaren
    if (item.assignedToId) {
      const memberIndex = membersData.findIndex(m => m.memberId === item.assignedToId);
      if (memberIndex !== -1) {
        membersData[memberIndex].allocatedHours += item.estimatedHours;
      }
    }
  });

  // Beräkna utnyttjandegrad
  const utilizationRate = totalCapacity > 0 ? allocatedHours / totalCapacity : 0;
  
  // Kontrollera om sprinten är överbelastad
  const isOverloaded = allocatedHours > totalCapacity;

  return {
    sprintId: sprint.id,
    sprintName: sprint.name,
    totalCapacity,
    allocatedHours,
    utilizationRate,
    isOverloaded,
    members: membersData
  };
}

/**
 * Beräknar sprintens längd i veckor
 */
function calculateSprintDurationInWeeks(sprint: Sprint): number {
  const start = new Date(sprint.startDate);
  const end = new Date(sprint.endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays / 7; // Omvandla dagar till veckor
}

/**
 * Beräknar kapacitetsdata för alla sprintar
 */
export function useCapacityData(
  sprints: Sprint[],
  teamMembers: TeamMember[],
  workItems: WorkItem[]
): CapacityData[] {
  return useMemo(() => {
    return sprints.map(sprint => 
      calculateSprintCapacity(sprint, teamMembers, workItems)
    );
  }, [sprints, teamMembers, workItems]);
}

/**
 * Beräknar total kapacitet för hela teamet
 */
export function calculateTeamCapacity(teamMembers: TeamMember[]): number {
  return teamMembers.reduce((sum, member) => {
    return sum + (member.weeklyCapacity * member.availability);
  }, 0);
}

/**
 * Beräknar total allokerad tid för alla arbetsuppgifter
 */
export function calculateTotalAllocatedHours(workItems: WorkItem[]): number {
  return workItems.reduce((sum, item) => {
    return sum + item.estimatedHours;
  }, 0);
}

/**
 * Kontrollerar om en arbetsuppgift kan tilldelas till en sprint
 */
export function canAssignToSprint(
  workItem: WorkItem,
  sprintId: string,
  teamMembers: TeamMember[],
  workItems: WorkItem[]
): { canAssign: boolean; message?: string } {
  const sprint = workItems.find(item => item.sprintId === sprintId);
  if (!sprint) {
    return { canAssign: false, message: 'Sprinten finns inte' };
  }

  // Hitta sprinten i sprints-listan
  const targetSprint = { id: sprintId, name: sprint.title || sprintId } as Sprint;
  
  const capacityData = calculateSprintCapacity(targetSprint, teamMembers, workItems);
  
  // Om sprinten redan är överbelastad
  if (capacityData.isOverloaded) {
    return { 
      canAssign: false, 
      message: `Sprinten är redan överbelastad (${Math.round(capacityData.utilizationRate * 100)}% utnyttjad)` 
    };
  }

  // Kontrollera om arbetsuppgiften kräver kompetenser som finns i teamet
  const requiredCompetencies = workItem.competenciesRequired;
  if (requiredCompetencies.length > 0) {
    const availableCompetencies = new Set(teamMembers.flatMap(m => m.competencies));
    const missingCompetencies = requiredCompetencies.filter(c => !availableCompetencies.has(c));
    
    if (missingCompetencies.length > 0) {
      return {
        canAssign: false,
        message: `Saknar kompetenser: ${missingCompetencies.join(', ')}`
      };
    }
  }

  return { canAssign: true };
}

/**
 * Beräknar fördelningen av arbete per kompetensområde
 */
export function calculateCompetencyDistribution(
  workItems: WorkItem[]
): Record<string, { hours: number; count: number }> {
  const distribution: Record<string, { hours: number; count: number }> = {};
  
  workItems.forEach(item => {
    item.competenciesRequired.forEach(competency => {
      if (!distribution[competency]) {
        distribution[competency] = { hours: 0, count: 0 };
      }
      distribution[competency].hours += item.estimatedHours;
      distribution[competency].count += 1;
    });
  });
  
  return distribution;
}
