import React, { useState } from 'react';
import { Delivery, WorkItem, Sprint, TeamMember } from '../types';
import { v4 as uuidv4 } from 'uuid';


interface DeliveryTrackerProps {
  deliveries: Delivery[];
  workItems: WorkItem[];
  sprints: Sprint[];
  teamMembers: TeamMember[];
  onAddDelivery: (delivery: Delivery) => void;
  onUpdateDelivery: (delivery: Delivery) => void;
  onRemoveDelivery: (id: string) => void;
}

const DELIVERY_STATUS_OPTIONS: { value: Delivery['status']; label: string; color: string }[] = [
  { value: 'planned', label: 'Planerad', color: '#3730a3' },
  { value: 'in-progress', label: 'Pågående', color: '#92400e' },
  { value: 'at-risk', label: 'Risk', color: '#92400e' },
  { value: 'completed', label: 'Klar', color: '#065f46' },
  { value: 'delayed', label: 'Försenad', color: '#991b1b' },
];

const DeliveryTracker: React.FC<DeliveryTrackerProps> = ({
  deliveries,
  workItems,
  sprints,
  onAddDelivery,
  onUpdateDelivery,
  onRemoveDelivery
}) => {
  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const formatDateForDisplay = (date: Date): string => {
    return new Date(date).toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };



  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState<Delivery | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    targetDate: formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)), // 30 dagar fram
    status: 'planned' as Delivery['status'],
    workItemIds: [] as string[]
  });
  const [selectedWorkItems, setSelectedWorkItems] = useState<string[]>([]);



  const openAddModal = () => {
    setEditingDelivery(null);
    setFormData({
      name: '',
      description: '',
      targetDate: formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
      status: 'planned',
      workItemIds: []
    });
    setSelectedWorkItems([]);
    setIsModalOpen(true);
  };

  const openEditModal = (delivery: Delivery) => {
    setEditingDelivery(delivery);
    setFormData({
      name: delivery.name,
      description: delivery.description || '',
      targetDate: formatDate(new Date(delivery.targetDate)),
      status: delivery.status,
      workItemIds: [...delivery.workItemIds]
    });
    setSelectedWorkItems([...delivery.workItemIds]);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingDelivery(null);
    setSelectedWorkItems([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const delivery: Delivery = {
      id: editingDelivery?.id || uuidv4(),
      name: formData.name.trim(),
      description: formData.description.trim(),
      targetDate: new Date(formData.targetDate),
      status: formData.status,
      workItemIds: selectedWorkItems
    };

    if (editingDelivery) {
      onUpdateDelivery(delivery);
    } else {
      onAddDelivery(delivery);
    }
    
    closeModal();
  };

  const handleRemove = (id: string) => {
    const delivery = deliveries.find(d => d.id === id);
    if (delivery && delivery.workItemIds.length > 0) {
      if (!window.confirm('Denna leverans har arbetsuppgifter. Är du säker på att du vill ta bort den?')) {
        return;
      }
    } else if (!window.confirm('Är du säker på att du vill ta bort denna leverans?')) {
      return;
    }
    
    onRemoveDelivery(id);
  };

  // Beräkna leveransstatus baserat på arbetsuppgifter
  const getDeliveryProgress = (delivery: Delivery, allWorkItems: WorkItem[]): {
    totalHours: number;
    completedHours: number;
    totalTasks: number;
    completedTasks: number;
    progress: number;
    isOnTrack: boolean;
    estimatedCompletionDate?: Date;
  } => {
    const deliveryWorkItems = allWorkItems.filter(item => 
      delivery.workItemIds.includes(item.id)
    );
    
    const totalHours = deliveryWorkItems.reduce((sum, item) => sum + item.estimatedHours, 0);
    const completedHours = deliveryWorkItems
      .filter(item => item.status === 'done')
      .reduce((sum, item) => sum + item.estimatedHours, 0);
    
    const totalTasks = deliveryWorkItems.length;
    const completedTasks = deliveryWorkItems.filter(item => item.status === 'done').length;
    
    const progress = totalTasks > 0 ? completedTasks / totalTasks : 0;
    
    // Kontrollera om leveransen är på väg att bli klar i tid
    const today = new Date();
    const targetDate = new Date(delivery.targetDate);
    const daysUntilTarget = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    // Uppskatta när leveransen kommer att vara klar
    let estimatedCompletionDate: Date | undefined;
    if (totalHours > 0 && completedHours > 0) {
      const remainingHours = totalHours - completedHours;
      const currentVelocity = completedHours / Math.max(1, Math.ceil((today.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24)));
      const daysToComplete = remainingHours / Math.max(currentVelocity, 0.1);
      estimatedCompletionDate = new Date(today.getTime() + daysToComplete * 24 * 60 * 60 * 1000);
    }
    
    const isOnTrack = daysUntilTarget >= 0 && (
      progress >= 0.8 || 
      (estimatedCompletionDate && estimatedCompletionDate <= targetDate)
    );
    
    return {
      totalHours,
      completedHours,
      totalTasks,
      completedTasks,
      progress,
      isOnTrack: Boolean(isOnTrack),
      estimatedCompletionDate
    };
  };

  // Använd funktionen för att beräkna progress för alla leveranser
  const deliveriesWithProgress = deliveries.map(delivery => ({
    delivery,
    progress: getDeliveryProgress(delivery, workItems)
  }));



  // Sortera leveranser efter targetDate
  const sortedDeliveries = [...deliveries].sort((a, b) => 
    new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime()
  );

  // Gruppera leveranser efter status
  const deliveriesByStatus = {
    planned: sortedDeliveries.filter(d => d.status === 'planned'),
    'in-progress': sortedDeliveries.filter(d => d.status === 'in-progress'),
    'at-risk': sortedDeliveries.filter(d => d.status === 'at-risk'),
    completed: sortedDeliveries.filter(d => d.status === 'completed'),
    delayed: sortedDeliveries.filter(d => d.status === 'delayed')
  };

  // Beräkna totala leveransstatistik
  const totalDeliveries = deliveries.length;
  const completedDeliveries = deliveries.filter(d => d.status === 'completed').length;
  const atRiskDeliveries = deliveries.filter(d => d.status === 'at-risk' || d.status === 'delayed').length;

  // Beräkna total arbetsuppgiftsstatistik för leveranser
  const totalDeliveryHours = deliveries.reduce((sum, delivery) => {
    const deliveryWorkItems = workItems.filter(item => delivery.workItemIds.includes(item.id));
    return sum + deliveryWorkItems.reduce((itemSum, item) => itemSum + item.estimatedHours, 0);
  }, 0);

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Leveransspårning</h2>
        <div className="card-actions">
          <button className="btn btn-primary btn-sm" onClick={openAddModal}>
            + Ny leverans
          </button>
        </div>
      </div>

      {/* Sammanfattningskort */}
      <div className="grid grid-4 gap-3 mb-4">
        <div className="card">
          <h4 className="text-secondary text-sm mb-1">Totala leveranser</h4>
          <h3 className="text-2xl font-bold">{totalDeliveries}</h3>
          <p className="text-secondary text-sm">{completedDeliveries} klar</p>
        </div>
        
        <div className="card">
          <h4 className="text-secondary text-sm mb-1">Total arbetsbörda</h4>
          <h3 className="text-2xl font-bold">{Math.round(totalDeliveryHours)} tim</h3>
          <p className="text-secondary text-sm">för leveranser</p>
        </div>
        
        <div className="card">
          <h4 className="text-secondary text-sm mb-1">I riskzonen</h4>
          <h3 className="text-2xl font-bold text-warning">{atRiskDeliveries}</h3>
          <p className="text-secondary text-sm">leveranser</p>
        </div>
        
        <div className="card">
          <h4 className="text-secondary text-sm mb-1">Genomsnittlig framgång</h4>
          <h3 className="text-2xl font-bold">
            {totalDeliveries > 0 ? Math.round((completedDeliveries / totalDeliveries) * 100) : 0}%
          </h3>
          <p className="text-secondary text-sm">leveranser klar</p>
        </div>
      </div>

      {deliveries.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🚀</div>
          <div className="empty-state-title">Inga leveranser ännu</div>
          <p>Börja genom att skapa leveranser och koppla arbetsuppgifter till dem</p>
        </div>
      ) : (
        <>
          {/* Leveranser efter status */}
          {Object.entries(deliveriesByStatus).map(([status, statusDeliveries]) => {
            if (statusDeliveries.length === 0) return null;
            
            const statusOption = DELIVERY_STATUS_OPTIONS.find(o => o.value === status);
            
            return (
              <section key={status} className="mb-4">
                <h3 className="mb-2">
                  <span 
                    className="status-badge"
                    style={{ 
                      backgroundColor: statusOption?.color + '20', 
                      color: statusOption?.color 
                    }}
                  >
                    {statusOption?.label}
                  </span>
                </h3>
                
                <div className="grid grid-2 gap-3">
                  {statusDeliveries.map(delivery => {
                    const progress = getDeliveryProgress(delivery, workItems);
                    
                    // Hitta senaste sprint för denna leverans
                    const latestSprint = sprints
                      .filter((sprint: Sprint) => {
                        const sprintWorkItems = workItems.filter(item => 
                          item.sprintId === sprint.id && delivery.workItemIds.includes(item.id)
                        );
                        return sprintWorkItems.length > 0;
                      })
                      .sort((a: Sprint, b: Sprint) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())[0];

                    return (
                      <DeliveryCard
                        key={delivery.id}
                        delivery={delivery}
                        progress={progress}
                        latestSprint={latestSprint}
                        onEdit={openEditModal}
                        onRemove={handleRemove}
                      />
                    );
                  })}
                </div>
              </section>
            );
          })}

          {/* Tabellvy */}
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Namn</th>
                  <th>Måldatum</th>
                  <th>Status</th>
                  <th>Framgång</th>
                  <th>Arbetsuppgifter</th>
                  <th>Total tid</th>
                  <th>Senaste sprint</th>
                  <th>Åtgärder</th>
                </tr>
              </thead>
              <tbody>
                {sortedDeliveries.map(delivery => {
                  const deliveryWithProgress = deliveriesWithProgress.find(d => d.delivery.id === delivery.id);
                  const progress = deliveryWithProgress?.progress || getDeliveryProgress(delivery, workItems);
                  
                  // Hitta senaste sprint
                  const latestSprint = sprints
                    .filter((s: Sprint) => {
                      const sprintWorkItems = workItems.filter(item => 
                        item.sprintId === s.id && delivery.workItemIds.includes(item.id)
                      );
                      return sprintWorkItems.length > 0;
                    })
                    .sort((a: Sprint, b: Sprint) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())[0];
                  
                  const statusOption = DELIVERY_STATUS_OPTIONS.find(o => o.value === delivery.status);
                  
                  return (
                    <tr key={delivery.id}>
                      <td>
                        <strong>{delivery.name}</strong>
                        {delivery.description && (
                          <div className="text-secondary text-sm">{delivery.description.substring(0, 50)}...</div>
                        )}
                      </td>
                      <td>{formatDateForDisplay(delivery.targetDate)}</td>
                      <td>
                        <span 
                          className={`status-badge status-${delivery.status}`}
                          style={{ 
                            backgroundColor: statusOption?.color + '20', 
                            color: statusOption?.color 
                          }}
                        >
                          {statusOption?.label}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="progress-bar" style={{ width: '100px', height: '8px' }}>
                            <div 
                              className={`progress-fill ${
                                progress.progress >= 0.8 ? 'progress-success' : 
                                progress.progress >= 0.5 ? 'progress-warning' : 
                                'progress-danger'
                              }`}
                              style={{ width: `${Math.round(progress.progress * 100)}%` }}
                            />
                          </div>
                          <span className="text-sm">{Math.round(progress.progress * 100)}%</span>
                        </div>
                        {delivery.status !== 'completed' && !progress.isOnTrack && (
                          <span className="text-danger text-xs">Risk för försenad</span>
                        )}
                      </td>
                      <td>
                        {progress.completedTasks} / {progress.totalTasks} klar
                      </td>
                      <td>
                        {Math.round(progress.completedHours)} / {Math.round(progress.totalHours)} tim
                      </td>
                      <td>{latestSprint ? latestSprint.name : '-'}</td>
                      <td>
                        <div className="table-actions">
                          <button 
                            className="btn btn-outline btn-sm"
                            onClick={() => openEditModal(delivery)}
                          >
                            Redigera
                          </button>
                          <button 
                            className="btn btn-danger btn-sm"
                            onClick={() => handleRemove(delivery.id)}
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

      {/* Modal för att lägga till/redigera leverans */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingDelivery ? 'Redigera leverans' : 'Ny leverans'}
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
                    placeholder="t.ex. Produktlansering Q1"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Beskrivning</label>
                  <textarea
                    className="form-textarea"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Beskrivning av leveransen..."
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Måldatum *</label>
                    <input
                      type="date"
                      className="form-input"
                      value={formData.targetDate}
                      onChange={e => setFormData({ ...formData, targetDate: e.target.value })}
                      required
                      min={formatDate(new Date())}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select
                      className="form-select"
                      value={formData.status}
                      onChange={e => setFormData({ ...formData, status: e.target.value as Delivery['status'] })}
                    >
                      {DELIVERY_STATUS_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Arbetsuppgifter</label>
                  <p className="text-secondary text-sm mb-2">
                    Välj arbetsuppgifter som hör till denna leverans
                  </p>
                  
                  <div className="border border-gray-200 rounded-md p-3 mb-3">
                    <div className="flex gap-2 flex-wrap mb-2">
                      {selectedWorkItems.map(workItemId => {
                        const workItem = workItems.find(item => item.id === workItemId);
                        return workItem ? (
                          <span 
                            key={workItemId} 
                            className="btn btn-outline btn-sm"
                          >
                            {workItem.title}
                            <button
                              type="button"
                              className="ml-2 text-red-500"
                              onClick={() => setSelectedWorkItems(
                                selectedWorkItems.filter(id => id !== workItemId)
                              )}
                            >
                              ×
                            </button>
                          </span>
                        ) : null;
                      })}
                    </div>
                    
                    <select
                      className="form-select"
                      multiple
                      size={5}
                      value={selectedWorkItems}
                      onChange={e => {
                        const selected = Array.from(e.target.selectedOptions, option => option.value);
                        setSelectedWorkItems(selected);
                      }}
                    >
                      {workItems.map(item => (
                        <option key={item.id} value={item.id}>
                          {item.title} ({item.estimatedHours} tim) - 
                          {item.status === 'done' ? 'Klar' : item.status === 'in-progress' ? 'Pågående' : 'Ej påbörjad'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Snabbval för arbetsuppgifter */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => {
                      const allWorkItemIds = workItems.map(item => item.id);
                      setSelectedWorkItems(allWorkItemIds);
                    }}
                  >
                    Markera alla
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => setSelectedWorkItems([])}
                  >
                    Avmarkera alla
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => {
                      const doneWorkItemIds = workItems
                        .filter(item => item.status === 'done')
                        .map(item => item.id);
                      setSelectedWorkItems(doneWorkItemIds);
                    }}
                  >
                    Markera klarade
                  </button>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={closeModal}>
                  Avbryt
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingDelivery ? 'Spara ändringar' : 'Skapa leverans'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

interface DeliveryCardProps {
  delivery: Delivery;
  progress: any;
  latestSprint?: Sprint;
  onEdit: (delivery: Delivery) => void;
  onRemove: (id: string) => void;
}

const DeliveryCard: React.FC<DeliveryCardProps> = ({
  delivery,
  progress,
  latestSprint,
  onEdit,
  onRemove
}) => {
  const statusOption = DELIVERY_STATUS_OPTIONS.find(o => o.value === delivery.status);
  
  const formatDateForDisplay = (date: Date): string => {
    return new Date(date).toLocaleDateString('sv-SE', {
      month: 'short',
      day: 'numeric'
    });
  };

  if (!progress) return null;

  return (
    <div 
      className={`card ${progress && !progress.isOnTrack && delivery.status !== 'completed' && delivery.status !== 'delayed' ? 'border-warning' : ''}`}
    >
      <div className="card-header">
        <h4 className="card-title">{delivery.name}</h4>
        <span 
          className={`status-badge status-${delivery.status}`}
          style={{ 
            backgroundColor: statusOption?.color + '20', 
            color: statusOption?.color 
          }}
        >
          {statusOption?.label}
        </span>
      </div>

      <div className="mb-3">
        <p className="text-secondary text-sm">
          Måldatum: {formatDateForDisplay(delivery.targetDate)}
        </p>
        {latestSprint && (
          <p className="text-secondary text-sm">
            Senaste sprint: {latestSprint.name}
          </p>
        )}
      </div>

      <div className="mb-3">
        <div className="flex justify-between mb-1">
          <span className="text-sm text-secondary">Framgång</span>
          <span className="text-sm font-medium">
            {Math.round(progress.progress * 100)}%
          </span>
        </div>
        <div className="progress-bar">
          <div 
            className={`progress-fill ${
              progress.progress >= 0.8 ? 'progress-success' : 
              progress.progress >= 0.5 ? 'progress-warning' : 
              'progress-danger'
            }`}
            style={{ width: `${Math.round(progress.progress * 100)}%` }}
          />
        </div>
        <p className="text-sm text-secondary mt-1">
          {progress.completedTasks} av {progress.totalTasks} uppgifter klar
        </p>
      </div>

      <div className="mb-3">
        <div className="flex justify-between mb-1">
          <span className="text-sm text-secondary">Tid</span>
          <span className="text-sm font-medium">
            {Math.round(progress.completedHours)} / {Math.round(progress.totalHours)} tim
          </span>
        </div>
        <div className="progress-bar">
          <div 
            className={`progress-fill ${
              progress.completedHours >= progress.totalHours * 0.8 ? 'progress-success' : 
              progress.completedHours >= progress.totalHours * 0.5 ? 'progress-warning' : 
              'progress-danger'
            }`}
            style={{ width: `${Math.round((progress.completedHours / progress.totalHours) * 100) || 0}%` }}
          />
        </div>
      </div>

      {delivery.description && (
        <p className="text-sm text-secondary mb-3">{delivery.description.substring(0, 100)}...</p>
      )}

      {!progress.isOnTrack && delivery.status !== 'completed' && delivery.status !== 'delayed' && (
        <div className="alert alert-warning mb-3">
          <span>⚠️ Risk för försenad leverans</span>
        </div>
      )}

      <div className="flex gap-2">
        <button className="btn btn-outline btn-sm flex-1" onClick={() => onEdit(delivery)}>
          Redigera
        </button>
        <button className="btn btn-danger btn-sm flex-1" onClick={() => onRemove(delivery.id)}>
          Ta bort
        </button>
      </div>
    </div>
  );
};

export default DeliveryTracker;
