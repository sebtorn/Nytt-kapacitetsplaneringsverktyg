import React, { useState } from 'react';
import { Sprint, WorkItem, TeamMember } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { useCapacityData } from '../hooks';

interface SprintPlannerProps {
  sprints: Sprint[];
  workItems: WorkItem[];
  teamMembers: TeamMember[];
  onAddSprint: (sprint: Sprint) => void;
  onUpdateSprint: (sprint: Sprint) => void;
  onRemoveSprint: (id: string) => void;
}

const SprintPlanner: React.FC<SprintPlannerProps> = ({
  sprints,
  workItems,
  teamMembers,
  onAddSprint,
  onUpdateSprint,
  onRemoveSprint
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    description: '',
    isActive: false
  });

  const capacityData = useCapacityData(sprints, teamMembers, workItems);

  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const openAddModal = () => {
    setEditingSprint(null);
    const startDate = new Date();
    const endDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    setFormData({
      name: `Sprint ${sprints.length + 1}`,
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      description: '',
      isActive: false
    });
    setIsModalOpen(true);
  };

  const openEditModal = (sprint: Sprint) => {
    setEditingSprint(sprint);
    setFormData({
      name: sprint.name,
      startDate: formatDate(new Date(sprint.startDate)),
      endDate: formatDate(new Date(sprint.endDate)),
      description: sprint.description || '',
      isActive: sprint.isActive
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSprint(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const sprint: Sprint = {
      id: editingSprint?.id || uuidv4(),
      name: formData.name.trim(),
      startDate: new Date(formData.startDate),
      endDate: new Date(formData.endDate),
      description: formData.description.trim(),
      isActive: formData.isActive
    };

    if (sprint.startDate >= sprint.endDate) {
      alert('Startdatum måste vara före slutdatum');
      return;
    }

    if (editingSprint) {
      onUpdateSprint(sprint);
    } else {
      onAddSprint(sprint);
    }
    
    closeModal();
  };

  const handleRemove = (id: string) => {
    // Kontrollera om sprinten har arbetsuppgifter
    const sprintWorkItems = workItems.filter(item => item.sprintId === id);
    
    if (sprintWorkItems.length > 0) {
      if (!window.confirm('Denna sprint har arbetsuppgifter. Är du säker på att du vill ta bort den?')) {
        return;
      }
    } else if (!window.confirm('Är du säker på att du vill ta bort denna sprint?')) {
      return;
    }
    
    onRemoveSprint(id);
  };

  const formatDateForDisplay = (date: Date): string => {
    return new Date(date).toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateSprintDuration = (sprint: Sprint): number => {
    const start = new Date(sprint.startDate);
    const end = new Date(sprint.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Hitta nästa aktiva sprint
  const activeSprints = sprints.filter(s => s.isActive);
  const upcomingSprints = sprints
    .filter(s => !s.isActive && new Date(s.startDate) >= new Date())
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  const pastSprints = sprints
    .filter(s => !s.isActive && new Date(s.endDate) < new Date())
    .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Sprintplanering</h2>
        <div className="card-actions">
          <button className="btn btn-primary btn-sm" onClick={openAddModal}>
            + Ny sprint
          </button>
        </div>
      </div>

      {sprints.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📅</div>
          <div className="empty-state-title">Inga sprintar ännu</div>
          <p>Börja genom att skapa sprintar för ditt team</p>
        </div>
      ) : (
        <>
          {/* Aktiva sprintar */}
          {activeSprints.length > 0 && (
            <section className="mb-4">
              <h3 className="mb-2">Aktiva sprintar</h3>
              <div className="grid grid-2 gap-3">
                {activeSprints.map(sprint => {
                  const capacity = capacityData.find(c => c.sprintId === sprint.id);
                  return (
                    <SprintCard
                      key={sprint.id}
                      sprint={sprint}
                      capacity={capacity}
                      workItems={workItems}
                      onEdit={openEditModal}
                      onRemove={handleRemove}
                    />
                  );
                })}
              </div>
            </section>
          )}

          {/* Kommande sprintar */}
          {upcomingSprints.length > 0 && (
            <section className="mb-4">
              <h3 className="mb-2">Kommande sprintar</h3>
              <div className="grid grid-2 gap-3">
                {upcomingSprints.map(sprint => {
                  const capacity = capacityData.find(c => c.sprintId === sprint.id);
                  return (
                    <SprintCard
                      key={sprint.id}
                      sprint={sprint}
                      capacity={capacity}
                      workItems={workItems}
                      onEdit={openEditModal}
                      onRemove={handleRemove}
                    />
                  );
                })}
              </div>
            </section>
          )}

          {/* Tidigare sprintar */}
          {pastSprints.length > 0 && (
            <section className="mb-4">
              <h3 className="mb-2">Tidigare sprintar</h3>
              <div className="grid grid-2 gap-3">
                {pastSprints.map(sprint => {
                  const capacity = capacityData.find(c => c.sprintId === sprint.id);
                  return (
                    <SprintCard
                      key={sprint.id}
                      sprint={sprint}
                      capacity={capacity}
                      workItems={workItems}
                      onEdit={openEditModal}
                      onRemove={handleRemove}
                    />
                  );
                })}
              </div>
            </section>
          )}

          {/* Tabellvy */}
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Namn</th>
                  <th>Period</th>
                  <th>Varaktighet</th>
                  <th>Kapacitet</th>
                  <th>Allokerat</th>
                  <th>Status</th>
                  <th>Åtgärder</th>
                </tr>
              </thead>
              <tbody>
                {sprints.map(sprint => {
                  const capacity = capacityData.find(c => c.sprintId === sprint.id);
                  
                  return (
                    <tr key={sprint.id}>
                      <td><strong>{sprint.name}</strong></td>
                      <td>
                        {formatDateForDisplay(sprint.startDate)} - {formatDateForDisplay(sprint.endDate)}
                      </td>
                      <td>{calculateSprintDuration(sprint)} dagar</td>
                      <td>{capacity ? Math.round(capacity.totalCapacity) : 0} tim</td>
                      <td>{capacity ? Math.round(capacity.allocatedHours) : 0} tim</td>
                      <td>
                        {capacity && (
                          <span className={`status-badge ${
                            capacity.isOverloaded ? 'status-blocked' : 
                            capacity.utilizationRate > 0.8 ? 'status-in-progress' : 
                            'status-planned'
                          }`}>
                            {capacity.isOverloaded ? 'Överbelastad' : 
                             capacity.utilizationRate > 0.8 ? 'Nästan full' : 
                             sprint.isActive ? 'Aktiv' : 'Planerad'}
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="table-actions">
                          <button 
                            className="btn btn-outline btn-sm"
                            onClick={() => openEditModal(sprint)}
                          >
                            Redigera
                          </button>
                          <button 
                            className="btn btn-danger btn-sm"
                            onClick={() => handleRemove(sprint.id)}
                          >
                            Ta bort
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Modal för att lägga till/redigera sprint */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingSprint ? 'Redigera sprint' : 'Ny sprint'}
              </h3>
              <button className="modal-close" onClick={closeModal}>
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Namn *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="t.ex. Sprint 1 - MVP"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Startdatum *</label>
                    <input
                      type="date"
                      className="form-input"
                      value={formData.startDate}
                      onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Slutdatum *</label>
                    <input
                      type="date"
                      className="form-input"
                      value={formData.endDate}
                      onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                      required
                      min={formData.startDate}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Beskrivning</label>
                  <textarea
                    className="form-textarea"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Beskrivning av sprinten..."
                  />
                </div>

                <div className="form-group">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                      className="h-4 w-4"
                    />
                    <span className="form-label">Aktiv sprint</span>
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={closeModal}>
                  Avbryt
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingSprint ? 'Spara ändringar' : 'Skapa sprint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

interface SprintCardProps {
  sprint: Sprint;
  capacity?: any;
  workItems: WorkItem[];
  onEdit: (sprint: Sprint) => void;
  onRemove: (id: string) => void;
}

const SprintCard: React.FC<SprintCardProps> = ({ sprint, capacity, workItems, onEdit, onRemove }) => {
  const sprintWorkItems = workItems.filter(item => item.sprintId === sprint.id);
  const completionRate = sprintWorkItems.length > 0 
    ? sprintWorkItems.filter(item => item.status === 'done').length / sprintWorkItems.length 
    : 0;

  const formatDateForDisplay = (date: Date): string => {
    return new Date(date).toLocaleDateString('sv-SE', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="card">
      <div className="card-header">
        <h4 className="card-title">{sprint.name}</h4>
        <span className={`status-badge ${sprint.isActive ? 'status-in-progress' : 'status-planned'}`}>
          {sprint.isActive ? 'Aktiv' : 'Planerad'}
        </span>
      </div>
      
      <div className="mb-3">
        <p className="text-secondary">
          {formatDateForDisplay(sprint.startDate)} - {formatDateForDisplay(sprint.endDate)}
        </p>
      </div>

      {capacity && (
        <div className="mb-3">
          <div className="flex justify-between mb-1">
            <span className="text-sm text-secondary">Kapacitet</span>
            <span className="text-sm font-medium">
              {Math.round(capacity.allocatedHours)} / {Math.round(capacity.totalCapacity)} tim
            </span>
          </div>
          <div className="progress-bar">
            <div 
              className={`progress-fill ${
                capacity.isOverloaded ? 'progress-danger' : 
                capacity.utilizationRate > 0.8 ? 'progress-warning' : 
                'progress-success'
              }`}
              style={{ width: `${Math.min(capacity.utilizationRate * 100, 100)}%` }}
            />
          </div>
          {capacity.isOverloaded && (
            <p className="text-danger text-sm mt-1">Överbelastad!</p>
          )}
        </div>
      )}

      <div className="mb-3">
        <div className="flex justify-between mb-1">
          <span className="text-sm text-secondary">Arbetsuppgifter</span>
          <span className="text-sm font-medium">{sprintWorkItems.length}</span>
        </div>
        {sprintWorkItems.length > 0 && (
          <div className="progress-bar">
            <div 
              className="progress-fill progress-success"
              style={{ width: `${completionRate * 100}%` }}
            />
          </div>
        )}
      </div>

      {sprint.description && (
        <p className="text-sm text-secondary mb-3">{sprint.description}</p>
      )}

      <div className="flex gap-2">
        <button className="btn btn-outline btn-sm flex-1" onClick={() => onEdit(sprint)}>
          Redigera
        </button>
        <button className="btn btn-danger btn-sm flex-1" onClick={() => onRemove(sprint.id)}>
          Ta bort
        </button>
      </div>
    </div>
  );
};

export default SprintPlanner;
