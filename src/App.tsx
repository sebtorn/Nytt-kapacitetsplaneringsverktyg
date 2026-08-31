import React, { useState, useEffect } from 'react';
import { TeamMember, Sprint, WorkItem, Delivery } from './types';
import { useAppState, clearAllData, exportState, importState } from './hooks';
import {
  TeamSetup,
  SprintPlanner,
  WorkItems,
  CapacityVisualization,
  DeliveryTracker
} from './components';
import { v4 as uuidv4 } from 'uuid';

const App: React.FC = () => {
  const [appState, setAppState] = useAppState();
  const [activeTab, setActiveTab] = useState<'team' | 'sprints' | 'work-items' | 'capacity' | 'deliveries'>('team');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [importError, setImportError] = useState('');

  // Ladda demo-data om det inte finns någon data
  useEffect(() => {
    if (appState.teamMembers.length === 0 && 
        appState.sprints.length === 0 && 
        appState.workItems.length === 0 && 
        appState.deliveries.length === 0) {
      // Fråga om användaren vill ladda demo-data
      const shouldLoadDemo = window.confirm(
        'Vill du ladda demo-data för att komma igång snabbt?'
      );
      if (shouldLoadDemo) {
        loadDemoData();
      }
    }
  }, []);

  const loadDemoData = () => {
    const demoTeamMembers: TeamMember[] = [
      {
        id: uuidv4(),
        name: 'Anna Andersson',
        competencies: ['frontend', 'fullstack'],
        weeklyCapacity: 40,
        availability: 1
      },
      {
        id: uuidv4(),
        name: 'Björn Berg',
        competencies: ['backend', 'devops'],
        weeklyCapacity: 40,
        availability: 0.8
      },
      {
        id: uuidv4(),
        name: 'Cecilia Carlsson',
        competencies: ['frontend', 'design'],
        weeklyCapacity: 35,
        availability: 1
      },
      {
        id: uuidv4(),
        name: 'David Davidsson',
        competencies: ['backend', 'fullstack'],
        weeklyCapacity: 40,
        availability: 1
      },
      {
        id: uuidv4(),
        name: 'Eva Eriksson',
        competencies: ['test', 'frontend'],
        weeklyCapacity: 30,
        availability: 0.9
      }
    ];

    const today = new Date();
    const sprint1Start = new Date(today);
    const sprint1End = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
    const sprint2Start = new Date(sprint1End.getTime() + 1 * 24 * 60 * 60 * 1000);
    const sprint2End = new Date(sprint2Start.getTime() + 14 * 24 * 60 * 60 * 1000);
    const sprint3Start = new Date(sprint2End.getTime() + 1 * 24 * 60 * 60 * 1000);
    const sprint3End = new Date(sprint3Start.getTime() + 14 * 24 * 60 * 60 * 1000);

    const demoSprints: Sprint[] = [
      {
        id: uuidv4(),
        name: 'Sprint 1 - Grundfunktioner',
        startDate: sprint1Start,
        endDate: sprint1End,
        description: 'Implementering av grundläggande funktioner',
        isActive: true
      },
      {
        id: uuidv4(),
        name: 'Sprint 2 - Avancerade funktioner',
        startDate: sprint2Start,
        endDate: sprint2End,
        description: 'Utveckling av avancerade funktioner',
        isActive: false
      },
      {
        id: uuidv4(),
        name: 'Sprint 3 - Optimering',
        startDate: sprint3Start,
        endDate: sprint3End,
        description: 'Optimering och buggfixar',
        isActive: false
      }
    ];

    const demoWorkItems: WorkItem[] = [
      {
        id: uuidv4(),
        title: 'Implementera inloggningssystem',
        description: 'Skapa inloggning med JWT-autentisering',
        estimatedHours: 24,
        priority: 'high',
        status: 'in-progress',
        sprintId: demoSprints[0].id,
        assignedToId: demoTeamMembers[3].id,
        competenciesRequired: ['backend', 'frontend']
      },
      {
        id: uuidv4(),
        title: 'Skapa användargränssnitt',
        description: 'Designa och implementera UI för huvudvyerna',
        estimatedHours: 32,
        priority: 'high',
        status: 'planned',
        sprintId: demoSprints[0].id,
        assignedToId: demoTeamMembers[0].id,
        competenciesRequired: ['frontend', 'design']
      },
      {
        id: uuidv4(),
        title: 'Databasdesign',
        description: 'Designa och implementera databasschema',
        estimatedHours: 16,
        priority: 'high',
        status: 'done',
        sprintId: demoSprints[0].id,
        assignedToId: demoTeamMembers[1].id,
        competenciesRequired: ['backend', 'devops']
      },
      {
        id: uuidv4(),
        title: 'API-integrering',
        description: 'Integrera externa API:er',
        estimatedHours: 20,
        priority: 'medium',
        status: 'backlog',
        sprintId: demoSprints[1].id,
        assignedToId: demoTeamMembers[3].id,
        competenciesRequired: ['backend']
      },
      {
        id: uuidv4(),
        title: 'Enhetstester',
        description: 'Skriva enhetstester för alla funktioner',
        estimatedHours: 12,
        priority: 'medium',
        status: 'planned',
        sprintId: demoSprints[1].id,
        assignedToId: demoTeamMembers[4].id,
        competenciesRequired: ['test']
      },
      {
        id: uuidv4(),
        title: 'Performance optimering',
        description: 'Optimera applikationens prestanda',
        estimatedHours: 8,
        priority: 'low',
        status: 'backlog',
        sprintId: demoSprints[2].id,
        assignedToId: demoTeamMembers[1].id,
        competenciesRequired: ['backend', 'devops']
      },
      {
        id: uuidv4(),
        title: 'Användartester',
        description: 'Genomföra användartester',
        estimatedHours: 10,
        priority: 'medium',
        status: 'backlog',
        sprintId: demoSprints[2].id,
        assignedToId: demoTeamMembers[4].id,
        competenciesRequired: ['test']
      },
      {
        id: uuidv4(),
        title: 'Dokumentation',
        description: 'Skriva teknisk dokumentation',
        estimatedHours: 8,
        priority: 'low',
        status: 'backlog',
        sprintId: demoSprints[2].id,
        assignedToId: demoTeamMembers[0].id,
        competenciesRequired: ['frontend', 'backend']
      }
    ];

    const demoDeliveries: Delivery[] = [
      {
        id: uuidv4(),
        name: 'MVP Release',
        description: 'Första version med grundläggande funktioner',
        targetDate: new Date(sprint1End.getTime() + 7 * 24 * 60 * 60 * 1000),
        status: 'in-progress',
        workItemIds: [
          demoWorkItems[0].id,
          demoWorkItems[1].id,
          demoWorkItems[2].id
        ]
      },
      {
        id: uuidv4(),
        name: 'Avancerad Release',
        description: 'Version med avancerade funktioner',
        targetDate: new Date(sprint2End.getTime() + 7 * 24 * 60 * 60 * 1000),
        status: 'planned',
        workItemIds: [
          demoWorkItems[3].id,
          demoWorkItems[4].id
        ]
      },
      {
        id: uuidv4(),
        name: 'Final Release',
        description: 'Slutgiltig version med alla funktioner',
        targetDate: new Date(sprint3End.getTime() + 14 * 24 * 60 * 60 * 1000),
        status: 'planned',
        workItemIds: [
          demoWorkItems[5].id,
          demoWorkItems[6].id,
          demoWorkItems[7].id
        ]
      }
    ];

    setAppState(prev => ({
      ...prev,
      teamMembers: demoTeamMembers,
      sprints: demoSprints,
      workItems: demoWorkItems,
      deliveries: demoDeliveries
    }));
  };

  const handleAddTeamMember = (member: TeamMember) => {
    setAppState(prev => ({
      ...prev,
      teamMembers: [...prev.teamMembers, member]
    }));
  };

  const handleUpdateTeamMember = (member: TeamMember) => {
    setAppState(prev => ({
      ...prev,
      teamMembers: prev.teamMembers.map(m => m.id === member.id ? member : m)
    }));
  };

  const handleRemoveTeamMember = (id: string) => {
    // Ta bort arbetsuppgifter som är tilldelade till denna medlem
    setAppState(prev => {
      const updatedWorkItems = prev.workItems.map(item => 
        item.assignedToId === id ? { ...item, assignedToId: undefined } : item
      );
      
      return {
        ...prev,
        teamMembers: prev.teamMembers.filter(m => m.id !== id),
        workItems: updatedWorkItems
      };
    });
  };

  const handleAddSprint = (sprint: Sprint) => {
    setAppState(prev => ({
      ...prev,
      sprints: [...prev.sprints, sprint]
    }));
  };

  const handleUpdateSprint = (sprint: Sprint) => {
    setAppState(prev => ({
      ...prev,
      sprints: prev.sprints.map(s => s.id === sprint.id ? sprint : s)
    }));
  };

  const handleRemoveSprint = (id: string) => {
    // Ta bort arbetsuppgifter som tillhör denna sprint
    setAppState(prev => {
      const updatedWorkItems = prev.workItems.map(item => 
        item.sprintId === id ? { ...item, sprintId: undefined } : item
      );
      
      return {
        ...prev,
        sprints: prev.sprints.filter(s => s.id !== id),
        workItems: updatedWorkItems
      };
    });
  };

  const handleAddWorkItem = (workItem: WorkItem) => {
    setAppState(prev => ({
      ...prev,
      workItems: [...prev.workItems, workItem]
    }));
  };

  const handleUpdateWorkItem = (workItem: WorkItem) => {
    setAppState(prev => ({
      ...prev,
      workItems: prev.workItems.map(item => item.id === workItem.id ? workItem : item)
    }));
  };

  const handleRemoveWorkItem = (id: string) => {
    // Ta bort referenser till denna arbetsuppgift i leveranser
    setAppState(prev => {
      const updatedDeliveries = prev.deliveries.map(delivery => ({
        ...delivery,
        workItemIds: delivery.workItemIds.filter(itemId => itemId !== id)
      }));
      
      return {
        ...prev,
        workItems: prev.workItems.filter(item => item.id !== id),
        deliveries: updatedDeliveries
      };
    });
  };

  const handleAddDelivery = (delivery: Delivery) => {
    setAppState(prev => ({
      ...prev,
      deliveries: [...prev.deliveries, delivery]
    }));
  };

  const handleUpdateDelivery = (delivery: Delivery) => {
    setAppState(prev => ({
      ...prev,
      deliveries: prev.deliveries.map(d => d.id === delivery.id ? delivery : d)
    }));
  };

  const handleRemoveDelivery = (id: string) => {
    setAppState(prev => ({
      ...prev,
      deliveries: prev.deliveries.filter(d => d.id !== id)
    }));
  };

  const handleImport = () => {
    try {
      const importedState = importState(importJson);
      setAppState(() => importedState);
      setShowImportModal(false);
      setImportJson('');
      setImportError('');
      window.location.reload();
    } catch (error) {
      setImportError('Ogiltigt JSON-format. Var god kontrollera datan.');
    }
  };

  const handleExport = () => {
    const json = exportState(appState);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `capacity-planner-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClearAll = () => {
    if (window.confirm('Är du säker på att du vill ta bort ALL data? Denna åtgärd kan inte ångras.')) {
      clearAllData();
    }
  };

  // Beräkna totalstatistik
  const totalTeamCapacity = appState.teamMembers.reduce((sum, member) => 
    sum + (member.weeklyCapacity * member.availability), 0
  );
  
  const totalAllocatedHours = appState.workItems.reduce((sum, item) => sum + item.estimatedHours, 0);
  const totalWorkItems = appState.workItems.length;
  const totalSprints = appState.sprints.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="header">
        <div className="flex justify-between items-center">
          <div>
            <h1>Kapacitetsplanerare</h1>
            <p>Planera och spåra ditt teams kapacitet och leveranser</p>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-outline" onClick={handleExport}>
              📥 Exportera
            </button>
            <button className="btn btn-outline" onClick={() => setShowImportModal(true)}>
              📤 Importera
            </button>
            <button className="btn btn-danger" onClick={handleClearAll}>
              🗑️ Rensa all data
            </button>
          </div>
        </div>
      </header>

      <div className="container">
        {/* Sammanfattningskort */}
        <div className="grid grid-4 gap-3 mb-4">
          <div className="card">
            <h4 className="text-secondary text-sm mb-1">Teammedlemmar</h4>
            <h3 className="text-2xl font-bold">{appState.teamMembers.length}</h3>
            <p className="text-secondary text-sm">{Math.round(totalTeamCapacity)} tim/vecka</p>
          </div>
          
          <div className="card">
            <h4 className="text-secondary text-sm mb-1">Sprintar</h4>
            <h3 className="text-2xl font-bold">{totalSprints}</h3>
            <p className="text-secondary text-sm">
              {appState.sprints.filter(s => s.isActive).length} aktiva
            </p>
          </div>
          
          <div className="card">
            <h4 className="text-secondary text-sm mb-1">Arbetsuppgifter</h4>
            <h3 className="text-2xl font-bold">{totalWorkItems}</h3>
            <p className="text-secondary text-sm">{Math.round(totalAllocatedHours)} tim</p>
          </div>
          
          <div className="card">
            <h4 className="text-secondary text-sm mb-1">Leveranser</h4>
            <h3 className="text-2xl font-bold">{appState.deliveries.length}</h3>
            <p className="text-secondary text-sm">
              {appState.deliveries.filter(d => d.status === 'completed').length} klar
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'team' ? 'active' : ''}`}
            onClick={() => setActiveTab('team')}
          >
            👥 Team
          </button>
          <button 
            className={`tab ${activeTab === 'sprints' ? 'active' : ''}`}
            onClick={() => setActiveTab('sprints')}
          >
            📅 Sprintar
          </button>
          <button 
            className={`tab ${activeTab === 'work-items' ? 'active' : ''}`}
            onClick={() => setActiveTab('work-items')}
          >
            📝 Arbetsuppgifter
          </button>
          <button 
            className={`tab ${activeTab === 'capacity' ? 'active' : ''}`}
            onClick={() => setActiveTab('capacity')}
          >
            📊 Kapacitet
          </button>
          <button 
            className={`tab ${activeTab === 'deliveries' ? 'active' : ''}`}
            onClick={() => setActiveTab('deliveries')}
          >
            🚀 Leveranser
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content active">
          {activeTab === 'team' && (
            <TeamSetup
              teamMembers={appState.teamMembers}
              onAddMember={handleAddTeamMember}
              onUpdateMember={handleUpdateTeamMember}
              onRemoveMember={handleRemoveTeamMember}
            />
          )}

          {activeTab === 'sprints' && (
            <SprintPlanner
              sprints={appState.sprints}
              workItems={appState.workItems}
              teamMembers={appState.teamMembers}
              onAddSprint={handleAddSprint}
              onUpdateSprint={handleUpdateSprint}
              onRemoveSprint={handleRemoveSprint}
            />
          )}

          {activeTab === 'work-items' && (
            <WorkItems
              workItems={appState.workItems}
              sprints={appState.sprints}
              teamMembers={appState.teamMembers}
              deliveries={appState.deliveries}
              onAddWorkItem={handleAddWorkItem}
              onUpdateWorkItem={handleUpdateWorkItem}
              onRemoveWorkItem={handleRemoveWorkItem}
            />
          )}

          {activeTab === 'capacity' && (
            <CapacityVisualization
              sprints={appState.sprints}
              teamMembers={appState.teamMembers}
              workItems={appState.workItems}
            />
          )}

          {activeTab === 'deliveries' && (
            <DeliveryTracker
              deliveries={appState.deliveries}
              workItems={appState.workItems}
              sprints={appState.sprints}
              teamMembers={appState.teamMembers}
              onAddDelivery={handleAddDelivery}
              onUpdateDelivery={handleUpdateDelivery}
              onRemoveDelivery={handleRemoveDelivery}
            />
          )}
        </div>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="modal-overlay" onClick={() => setShowImportModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Importera data</h3>
              <button className="modal-close" onClick={() => setShowImportModal(false)}>
                &times;
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">JSON-data</label>
                <textarea
                  className="form-textarea"
                  value={importJson}
                  onChange={e => {
                    setImportJson(e.target.value);
                    setImportError('');
                  }}
                  placeholder="Klistra in JSON-datan här..."
                  rows={10}
                />
              </div>

              {importError && (
                <div className="alert alert-danger">
                  {importError}
                </div>
              )}

              <div className="text-secondary text-sm">
                <p>Exporterad data från Kapacitetsplaneraren kan importeras här.</p>
                <p>Var försiktig - detta kommer att ersätta all nuvarande data.</p>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-outline" 
                onClick={() => setShowImportModal(false)}
              >
                Avbryt
              </button>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={handleImport}
                disabled={!importJson.trim()}
              >
                Importera
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="text-center py-4 text-secondary text-sm">
        <p>Kapacitetsplanerare | Byggt med React och TypeScript</p>
      </footer>
    </div>
  );
};

export default App;
