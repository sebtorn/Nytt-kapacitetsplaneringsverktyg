import React, { useState } from 'react';
import { WorkItem, Sprint, TeamMember, Competency, Delivery } from '../types';
import { v4 as uuidv4 } from 'uuid';


interface WorkItemsProps {
  workItems: WorkItem[];
  sprints: Sprint[];
  teamMembers: TeamMember[];
  deliveries: Delivery[];
  onAddWorkItem: (workItem: WorkItem) => void;
  onUpdateWorkItem: (workItem: WorkItem) => void;
  onRemoveWorkItem: (id: string) => void;
}

const PRIORITY_OPTIONS: { value: WorkItem['priority']; label: string; color: string }[] = [
  { value: 'low', label: 'Låg', color: '#3730a3' },
  { value: 'medium', label: 'Medium', color: '#92400e' },
  { value: 'high', label: 'Hög', color: '#92400e' },
  { value: 'critical', label: 'Kritisk', color: '#991b1b' },
];

const STATUS_OPTIONS: { value: WorkItem['status']; label: string }[] = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'planned', label: 'Planerad' },
  { value: 'in-progress', label: 'Pågående' },
  { value: 'done', label: 'Klar' },
  { value: 'blocked', label: 'Blockerad' },
];

const COMPETENCY_OPTIONS: { value: Competency; label: string }[] = [
  { value: 'frontend', label: 'Frontend' },
  { value: 'backend', label: 'Backend' },
  { value: 'fullstack', label: 'Fullstack' },
  { value: 'devops', label: 'DevOps' },
  { value: 'design', label: 'Design' },
  { value: 'test', label: 'Test' },
  { value: 'other', label: 'Annan' },
];

const WorkItems: React.FC<WorkItemsProps> = ({
  workItems,
  sprints,
  teamMembers,
  deliveries,
  onAddWorkItem,
  onUpdateWorkItem,
  onRemoveWorkItem
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WorkItem | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    estimatedHours: 0,
    priority: 'medium' as WorkItem['priority'],
    status: 'backlog' as WorkItem['status'],
    sprintId: '',
    assignedToId: '',
    deliveryId: '',
    competenciesRequired: [] as Competency[]
  });
  const [filterSprint, setFilterSprint] = useState('');
  const [filterStatus, setFilterStatus] = useState<WorkItem['status'][]>([]);
  const [filterPriority, setFilterPriority] = useState<WorkItem['priority'][]>([]);
  const [filterAssigned, setFilterAssigned] = useState('');



  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      title: '',
      description: '',
      estimatedHours: 0,
      priority: 'medium',
      status: 'backlog',
      sprintId: '',
      assignedToId: '',
      deliveryId: '',
      competenciesRequired: []
    });
    setIsModalOpen(true);
  };

  const openEditModal = (workItem: WorkItem) => {
    setEditingItem(workItem);
    setFormData({
      title: workItem.title,
      description: workItem.description || '',
      estimatedHours: workItem.estimatedHours,
      priority: workItem.priority,
      status: workItem.status,
      sprintId: workItem.sprintId || '',
      assignedToId: workItem.assignedToId || '',
      deliveryId: workItem.deliveryId || '',
      competenciesRequired: [...workItem.competenciesRequired]
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const workItem: WorkItem = {
      id: editingItem?.id || uuidv4(),
      title: formData.title.trim(),
      description: formData.description.trim(),
      estimatedHours: formData.estimatedHours,
      priority: formData.priority,
      status: formData.status,
      sprintId: formData.sprintId || undefined,
      assignedToId: formData.assignedToId || undefined,
      deliveryId: formData.deliveryId || undefined,
      competenciesRequired: formData.competenciesRequired
    };

    if (editingItem) {
      onUpdateWorkItem(workItem);
    } else {
      onAddWorkItem(workItem);
    }
    
    closeModal();
  };

  const handleRemove = (id: string) => {
    if (window.confirm('Är du säker på att du vill ta bort denna arbetsuppgift?')) {
      onRemoveWorkItem(id);
    }
  };

  const handleCompetencyChange = (competency: Competency) => {
    setFormData(prev => {
      const newCompetencies = [...prev.competenciesRequired];
      const index = newCompetencies.indexOf(competency);
      
      if (index === -1) {
        newCompetencies.push(competency);
      } else {
        newCompetencies.splice(index, 1);
      }
      
      return { ...prev, competenciesRequired: newCompetencies };
    });
  };

  // Filtrera arbetsuppgifter
  const filteredWorkItems = workItems.filter(item => {
    if (filterSprint && item.sprintId !== filterSprint) return false;
    if (filterStatus.length > 0 && !filterStatus.includes(item.status)) return false;
    if (filterPriority.length > 0 && !filterPriority.includes(item.priority)) return false;
    if (filterAssigned && item.assignedToId !== filterAssigned) return false;
    return true;
  });

  // Beräkna totala timmar
  const totalEstimatedHours = filteredWorkItems.reduce((sum, item) => sum + item.estimatedHours, 0);
  const totalActualHours = filteredWorkItems.reduce((sum, item) => sum + (item.actualHours || 0), 0);

  // Gruppera efter status
  const statusCounts = {
    backlog: 0,
    planned: 0,
    'in-progress': 0,
    done: 0,
    blocked: 0
  };
  
  filteredWorkItems.forEach(item => {
    statusCounts[item.status]++;
  });

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Arbetsuppgifter</h2>
        <div className="card-actions">
          <button className="btn btn-primary btn-sm" onClick={openAddModal}>
            + Ny uppgift
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="card mb-3">
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Sprint</label>
            <select
              className="form-select"
              value={filterSprint}
              onChange={e => setFilterSprint(e.target.value)}
            >
              <option value="">Alla sprintar</option>
              {sprints.map(sprint => (
                <option key={sprint.id} value={sprint.id}>
                  {sprint.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Status</label>
            <select
              className="form-select"
              multiple
              value={filterStatus}
              onChange={e => {
                const selected = Array.from(e.target.selectedOptions, option => option.value as WorkItem['status']);
                setFilterStatus(selected);
              }}
            >
              {STATUS_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Prioritet</label>
            <select
              className="form-select"
              multiple
              value={filterPriority}
              onChange={e => {
                const selected = Array.from(e.target.selectedOptions, option => option.value as WorkItem['priority']);
                setFilterPriority(selected);
              }}
            >
              {PRIORITY_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Tilldelad till</label>
            <select
              className="form-select"
              value={filterAssigned}
              onChange={e => setFilterAssigned(e.target.value)}
            >
              <option value="">Alla</option>
              {teamMembers.map(member => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filterSprint || filterStatus.length > 0 || filterPriority.length > 0 || filterAssigned ? (
          <button 
            className="btn btn-outline btn-sm mt-2"
            onClick={() => {
              setFilterSprint('');
              setFilterStatus([]);
              setFilterPriority([]);
              setFilterAssigned('');
            }}
          >
            Rensa filter
          </button>
        ) : null}
      </div>

      {/* Sammanfattning */}
      <div className="grid grid-4 gap-3 mb-4">
        <div className="card">
          <h4 className="text-secondary text-sm mb-1">Totalt</h4>
          <h3 className="text-2xl font-bold">{filteredWorkItems.length}</h3>
          <p className="text-secondary text-sm">uppgifter</p>
        </div>
        
        <div className="card">
          <h4 className="text-secondary text-sm mb-1">Uppskattad tid</h4>
          <h3 className="text-2xl font-bold">{totalEstimatedHours} tim</h3>
          <p className="text-secondary text-sm">estimering</p>
        </div>
        
        <div className="card">
          <h4 className="text-secondary text-sm mb-1">Faktisk tid</h4>
          <h3 className="text-2xl font-bold">{totalActualHours} tim</h3>
          <p className="text-secondary text-sm">rapporterad</p>
        </div>
        
        <div className="card">
          <h4 className="text-secondary text-sm mb-1">Komplett</h4>
          <h3 className="text-2xl font-bold">
            {Math.round((statusCounts.done / filteredWorkItems.length) * 100) || 0}%
          </h3>
          <p className="text-secondary text-sm">{statusCounts.done} av {filteredWorkItems.length}</p>
        </div>
      </div>

      {/* Status fördelning */}
      <div className="mb-4">
        <h4 className="mb-2">Status</h4>
        <div className="flex gap-2 flex-wrap">
          {Object.entries(statusCounts).map(([status, count]) => {
            if (count === 0) return null;
            const option = STATUS_OPTIONS.find(o => o.value === status);
            return (
              <div key={status} className="flex items-center gap-2">
                <span className={`status-badge status-${status}`}>
                  {option?.label || status}
                </span>
                <span className="text-secondary">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {filteredWorkItems.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📝</div>
          <div className="empty-state-title">Inga arbetsuppgifter matchar filtren</div>
          <p>Prova att ändra filterinställningarna</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Titel</th>
                <th>Prioritet</th>
                <th>Status</th>
                <th>Estimerad tid</th>
                <th>Sprint</th>
                <th>Tilldelad</th>
                <th>Kompetenser</th>
                <th>Leverans</th>
                <th>Åtgärder</th>
              </tr>
            </thead>
            <tbody>
              {filteredWorkItems.map(item => {
                const sprint = sprints.find(s => s.id === item.sprintId);
                const assignedMember = teamMembers.find(m => m.id === item.assignedToId);
                const delivery = deliveries.find(d => d.id === item.deliveryId);
                const priorityOption = PRIORITY_OPTIONS.find(p => p.value === item.priority);
                
                return (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.title}</strong>
                      {item.description && (
                        <div className="text-secondary text-sm">{item.description.substring(0, 50)}...</div>
                      )}
                    </td>
                    <td>
                      <span 
                        className={`priority-badge priority-${item.priority}`}
                        style={{ backgroundColor: priorityOption?.color + '20', color: priorityOption?.color }}
                      >
                        {priorityOption?.label}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge status-${item.status}`}>
                        {STATUS_OPTIONS.find(s => s.value === item.status)?.label}
                      </span>
                    </td>
                    <td>{item.estimatedHours} tim</td>
                    <td>{sprint ? sprint.name : '-'}</td>
                    <td>{assignedMember ? assignedMember.name : '-'}</td>
                    <td>
                      {item.competenciesRequired.slice(0, 2).map(comp => (
                        <span key={comp} className={`competency-tag competency-${comp}`}>
                          {COMPETENCY_OPTIONS.find(c => c.value === comp)?.label}
                        </span>
                      ))}
                      {item.competenciesRequired.length > 2 && (
                        <span className="text-secondary text-xs">+{item.competenciesRequired.length - 2} mer</span>
                      )}
                    </td>
                    <td>{delivery ? delivery.name : '-'}</td>
                    <td>
                      <div className="table-actions">
                        <button 
                          className="btn btn-outline btn-sm"
                          onClick={() => openEditModal(item)}
                        >
                          Redigera
                        </button>
                        <button 
                          className="btn btn-danger btn-sm"
                          onClick={() => handleRemove(item.id)}
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
      )}

      {/* Modal för att lägga till/redigera arbetsuppgift */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingItem ? 'Redigera arbetsuppgift' : 'Ny arbetsuppgift'}
              </h3>
              <button className="modal-close" onClick={closeModal}>
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Titel *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    required
                    placeholder="t.ex. Implementera inloggning"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Beskrivning</label>
                  <textarea
                    className="form-textarea"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Detaljerad beskrivning av arbetsuppgiften..."
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Estimerad tid (timmar) *</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.estimatedHours}
                      onChange={e => setFormData({ 
                        ...formData, 
                        estimatedHours: parseInt(e.target.value) || 0 
                      })}
                      min="0"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Prioritet</label>
                    <select
                      className="form-select"
                      value={formData.priority}
                      onChange={e => setFormData({ ...formData, priority: e.target.value as WorkItem['priority'] })}
                    >
                      {PRIORITY_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select
                      className="form-select"
                      value={formData.status}
                      onChange={e => setFormData({ ...formData, status: e.target.value as WorkItem['status'] })}
                    >
                      {STATUS_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Sprint</label>
                    <select
                      className="form-select"
                      value={formData.sprintId}
                      onChange={e => setFormData({ ...formData, sprintId: e.target.value })}
                    >
                      <option value="">Ingen sprint</option>
                      {sprints.map(sprint => (
                        <option key={sprint.id} value={sprint.id}>
                          {sprint.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Tilldelad till</label>
                    <select
                      className="form-select"
                      value={formData.assignedToId}
                      onChange={e => setFormData({ ...formData, assignedToId: e.target.value })}
                    >
                      <option value="">Ej tilldelad</option>
                      {teamMembers.map(member => (
                        <option key={member.id} value={member.id}>
                          {member.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Leverans</label>
                    <select
                      className="form-select"
                      value={formData.deliveryId}
                      onChange={e => setFormData({ ...formData, deliveryId: e.target.value })}
                    >
                      <option value="">Ingen leverans</option>
                      {deliveries.map(delivery => (
                        <option key={delivery.id} value={delivery.id}>
                          {delivery.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Krävda kompetenser</label>
                  <div className="flex gap-2 flex-wrap">
                    {COMPETENCY_OPTIONS.map(option => (
                      <label key={option.value} className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={formData.competenciesRequired.includes(option.value)}
                          onChange={() => handleCompetencyChange(option.value)}
                          className="h-4 w-4"
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={closeModal}>
                  Avbryt
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingItem ? 'Spara ändringar' : 'Lägg till'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkItems;
