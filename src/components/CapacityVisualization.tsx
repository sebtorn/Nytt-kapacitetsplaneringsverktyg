import React from 'react';
import { Sprint, TeamMember, WorkItem } from '../types';
import { useCapacityData, calculateTeamCapacity, calculateTotalAllocatedHours } from '../hooks';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';

interface CapacityVisualizationProps {
  sprints: Sprint[];
  teamMembers: TeamMember[];
  workItems: WorkItem[];
}

const CapacityVisualization: React.FC<CapacityVisualizationProps> = ({
  sprints,
  teamMembers,
  workItems
}) => {
  const capacityData = useCapacityData(sprints, teamMembers, workItems);
  const teamCapacity = calculateTeamCapacity(teamMembers);
  const totalAllocatedHours = calculateTotalAllocatedHours(workItems);

  // Beräkna total kapacitet för alla sprintar
  const totalSprintCapacity = capacityData.reduce((sum, data) => sum + data.totalCapacity, 0);
  const totalSprintAllocated = capacityData.reduce((sum, data) => sum + data.allocatedHours, 0);

  // Förbered data för sprintkapacitetsdiagram
  const sprintCapacityChartData = capacityData.map(data => ({
    name: data.sprintName,
    capacity: Math.round(data.totalCapacity),
    allocated: Math.round(data.allocatedHours),
    overloaded: data.isOverloaded ? Math.round(data.allocatedHours - data.totalCapacity) : 0
  }));

  // Förbered data för teammedlemmars kapacitet
  const memberCapacityData = teamMembers.map(member => ({
    name: member.name,
    capacity: Math.round(member.weeklyCapacity * member.availability),
    allocated: workItems
      .filter(item => item.assignedToId === member.id)
      .reduce((sum, item) => sum + item.estimatedHours, 0)
  }));

  // Förbered data för kompetensfördelning
  const competencyData = Object.entries(
    workItems.reduce((acc, item) => {
      item.competenciesRequired.forEach(comp => {
        acc[comp] = (acc[comp] || 0) + item.estimatedHours;
      });
      return acc;
    }, {} as Record<string, number>)
  ).map(([competency, hours]) => ({
    name: competency,
    hours: Math.round(hours)
  }));

  // Färger för diagram
  const COLORS = ['#2563eb', '#7c3aed', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6'];

  // Status för sprintar
  const sprintStatusData = [
    { name: 'Normal', value: capacityData.filter(d => !d.isOverloaded && d.utilizationRate <= 0.8).length },
    { name: 'Nästan full', value: capacityData.filter(d => !d.isOverloaded && d.utilizationRate > 0.8).length },
    { name: 'Överbelastad', value: capacityData.filter(d => d.isOverloaded).length }
  ];

  // Beräkna genomsnittlig utnyttjandegrad


  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Kapacitetsvisualisering</h2>
      </div>

      {/* Sammanfattningskort */}
      <div className="grid grid-4 gap-3 mb-4">
        <div className="card">
          <h4 className="text-secondary text-sm mb-1">Teamkapacitet</h4>
          <h3 className="text-2xl font-bold">{Math.round(teamCapacity)} tim/vecka</h3>
          <p className="text-secondary text-sm">{teamMembers.length} medlemmar</p>
        </div>
        
        <div className="card">
          <h4 className="text-secondary text-sm mb-1">Total allokering</h4>
          <h3 className="text-2xl font-bold">{Math.round(totalAllocatedHours)} tim</h3>
          <p className="text-secondary text-sm">{workItems.length} uppgifter</p>
        </div>
        
        <div className="card">
          <h4 className="text-secondary text-sm mb-1">Sprintutnyttjande</h4>
          <h3 className="text-2xl font-bold">
            {Math.round((totalSprintAllocated / totalSprintCapacity) * 100) || 0}%
          </h3>
          <p className="text-secondary text-sm">
            {Math.round(totalSprintAllocated)} / {Math.round(totalSprintCapacity)} tim
          </p>
        </div>
        
        <div className="card">
          <h4 className="text-secondary text-sm mb-1">Överbelastade sprintar</h4>
          <h3 className="text-2xl font-bold text-danger">
            {capacityData.filter(d => d.isOverloaded).length}
          </h3>
          <p className="text-secondary text-sm">av {capacityData.length} sprintar</p>
        </div>
      </div>

      {/* Sprintkapacitetsdiagram */}
      <div className="mb-4">
        <h3 className="mb-2">Sprintkapacitet</h3>
        <p className="text-secondary text-sm mb-3">
          Jämförelse mellan tillgänglig kapacitet och allokerade timmar per sprint
        </p>
        
        {sprints.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📊</div>
            <p>Skapa sprintar för att se kapacitetsdata</p>
          </div>
        ) : (
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sprintCapacityChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    `${value} tim`, 
                    name === 'capacity' ? 'Kapacitet' : name === 'allocated' ? 'Allokerat' : 'Överbelastat'
                  ]}
                />
                <Bar dataKey="capacity" name="Kapacitet" stackId="a" fill="#2563eb">
                  {sprintCapacityChartData.map((_entry, index) => (
                    <Cell 
                      key={`cell-capacity-${index}`} 
                      fill={sprintCapacityChartData[index].overloaded > 0 ? '#ef4444' : '#2563eb'}
                    />
                  ))}
                </Bar>
                <Bar dataKey="allocated" name="Allokerat" stackId="a" fill="#7c3aed">
                  {sprintCapacityChartData.map((_entry, index) => (
                    <Cell 
                      key={`cell-allocated-${index}`} 
                      fill={sprintCapacityChartData[index].overloaded > 0 ? '#991b1b' : '#7c3aed'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Teammedlemmars kapacitetsfördelning */}
      <div className="mb-4">
        <h3 className="mb-2">Teammedlemmars arbetsbelastning</h3>
        <p className="text-secondary text-sm mb-3">
          Hur arbetsuppgifterna är fördelade bland teammedlemmarna
        </p>
        
        {teamMembers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <p>Lägg till teammedlemmar för att se arbetsfördelning</p>
          </div>
        ) : (
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={memberCapacityData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={150} />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    `${value} tim`, 
                    name === 'capacity' ? 'Kapacitet' : 'Allokerat'
                  ]}
                />
                <Bar dataKey="capacity" name="Kapacitet" fill="#2563eb" />
                <Bar dataKey="allocated" name="Allokerat" fill="#7c3aed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Kompetensfördelning */}
      <div className="mb-4">
        <div className="grid grid-2 gap-4">
          <div>
            <h3 className="mb-2">Kompetensfördelning</h3>
            <p className="text-secondary text-sm mb-3">
              Fördelning av arbetsuppgifter efter kompetensområde
            </p>
            
            {competencyData.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🎯</div>
                <p>Lägg till arbetsuppgifter med kompetenskrav för att se fördelning</p>
              </div>
            ) : (
              <div className="chart-container" style={{ height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={competencyData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="hours"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {competencyData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div>
            <h3 className="mb-2">Sprintstatus</h3>
            <p className="text-secondary text-sm mb-3">
              Status för alla sprintar
            </p>
            
            {sprints.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📅</div>
                <p>Skapa sprintar för att se statusfördelning</p>
              </div>
            ) : (
              <div className="chart-container" style={{ height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sprintStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      <Cell key="cell-normal" fill="#10b981" />
                      <Cell key="cell-near-full" fill="#f59e0b" />
                      <Cell key="cell-overloaded" fill="#ef4444" />
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detaljerad sprintinformation */}
      {capacityData.length > 0 && (
        <div className="mb-4">
          <h3 className="mb-2">Detaljerad sprintinformation</h3>
          <div className="grid grid-2 gap-3">
            {capacityData.map(data => {
              const sprint = sprints.find(s => s.id === data.sprintId);
              return (
                <div key={data.sprintId} className={`card ${data.isOverloaded ? 'border-danger' : ''}`}>
                  <h4 className="card-title">{data.sprintName}</h4>
                  <p className="text-secondary text-sm mb-2">
                    {sprint && new Date(sprint.startDate).toLocaleDateString('sv-SE')} - 
                    {sprint && new Date(sprint.endDate).toLocaleDateString('sv-SE')}
                  </p>
                  
                  <div className="mb-2">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-secondary">Kapacitet</span>
                      <span className="text-sm font-medium">
                        {Math.round(data.allocatedHours)} / {Math.round(data.totalCapacity)} tim
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className={`progress-fill ${
                          data.isOverloaded ? 'progress-danger' : 
                          data.utilizationRate > 0.8 ? 'progress-warning' : 
                          'progress-success'
                        }`}
                        style={{ width: `${Math.min(data.utilizationRate * 100, 100)}%` }}
                      />
                    </div>
                    <p className="text-sm text-secondary mt-1">
                      {Math.round(data.utilizationRate * 100)}% utnyttjad
                    </p>
                  </div>

                  {data.isOverloaded && (
                    <div className="alert alert-danger">
                      <span>⚠️ Överbelastad med {Math.round(data.allocatedHours - data.totalCapacity)} timmar</span>
                    </div>
                  )}

                  <div className="mt-2">
                    <h5 className="text-sm font-medium mb-1">Teammedlemmar</h5>
                    {data.members.map(member => (
                      <div key={member.memberId} className="mb-1">
                        <div className="flex justify-between text-sm">
                          <span>{member.memberName}</span>
                          <span>
                            {Math.round(member.allocatedHours)} / {Math.round(member.capacity)} tim
                          </span>
                        </div>
                        <div className="progress-bar" style={{ height: '4px' }}>
                          <div 
                            className={`progress-fill ${
                              member.allocatedHours > member.capacity ? 'progress-danger' : 
                              member.allocatedHours / member.capacity > 0.8 ? 'progress-warning' : 
                              'progress-success'
                            }`}
                            style={{ 
                              width: `${Math.min((member.allocatedHours / member.capacity) * 100, 100)}%` 
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CapacityVisualization;
