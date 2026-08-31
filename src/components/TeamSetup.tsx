import React, { useState } from 'react';
import { TeamMember, Competency } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface TeamSetupProps {
  teamMembers: TeamMember[];
  onAddMember: (member: TeamMember) => void;
  onUpdateMember: (member: TeamMember) => void;
  onRemoveMember: (id: string) => void;
}

const COMPETENCY_OPTIONS: { value: Competency; label: string }[] = [
  { value: 'frontend', label: 'Frontend' },
  { value: 'backend', label: 'Backend' },
  { value: 'fullstack', label: 'Fullstack' },
  { value: 'devops', label: 'DevOps' },
  { value: 'design', label: 'Design' },
  { value: 'test', label: 'Test' },
  { value: 'other', label: 'Annan' },
];

const DEFAULT_WEEKLY_CAPACITY = 40;

const TeamSetup: React.FC<TeamSetupProps> = ({
  teamMembers,
  onAddMember,
  onUpdateMember,
  onRemoveMember
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    competencies: [] as Competency[],
    weeklyCapacity: DEFAULT_WEEKLY_CAPACITY,
    availability: 1
  });

  const openAddModal = () => {
    setEditingMember(null);
    setFormData({
      name: '',
      competencies: [],
      weeklyCapacity: DEFAULT_WEEKLY_CAPACITY,
      availability: 1
    });
    setIsModalOpen(true);
  };

  const openEditModal = (member: TeamMember) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      competencies: [...member.competencies],
      weeklyCapacity: member.weeklyCapacity,
      availability: member.availability
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingMember(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const member: TeamMember = {
      id: editingMember?.id || uuidv4(),
      name: formData.name.trim(),
      competencies: formData.competencies,
      weeklyCapacity: formData.weeklyCapacity,
      availability: Math.min(Math.max(formData.availability, 0), 1) // Clamp between 0 and 1
    };

    if (editingMember) {
      onUpdateMember(member);
    } else {
      onAddMember(member);
    }
    
    closeModal();
  };

  const handleRemove = (id: string) => {
    if (window.confirm('Är du säker på att du vill ta bort denna teammedlem?')) {
      onRemoveMember(id);
    }
  };

  const handleCompetencyChange = (competency: Competency) => {
    setFormData(prev => {
      const newCompetencies = [...prev.competencies];
      const index = newCompetencies.indexOf(competency);
      
      if (index === -1) {
        newCompetencies.push(competency);
      } else {
        newCompetencies.splice(index, 1);
      }
      
      return { ...prev, competencies: newCompetencies };
    });
  };

  const totalCapacity = teamMembers.reduce((sum, member) => {
    return sum + (member.weeklyCapacity * member.availability);
  }, 0);

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Team Setup</h2>
        <div className="card-actions">
          <button className="btn btn-primary btn-sm" onClick={openAddModal}>
            + Lägg till medlem
          </button>
        </div>
      </div>

      <div className="mb-3">
        <p className="text-secondary">
          Total veckokapacitet: <strong>{totalCapacity} timmar</strong>
        </p>
      </div>

      {teamMembers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👥</div>
          <div className="empty-state-title">Inga teammedlemmar ännu</div>
          <p>Börja genom att lägga till teammedlemmar</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Namn</th>
                <th>Kompetenser</th>
                <th>Veckotimmar</th>
                <th>Tillgänglighet</th>
                <th>Veckokapacitet</th>
                <th>Åtgärder</th>
              </tr>
            </thead>
            <tbody>
              {teamMembers.map(member => (
                <tr key={member.id}>
                  <td>
                    <strong>{member.name}</strong>
                  </td>
                  <td>
                    {member.competencies.map(comp => (
                      <span 
                        key={comp} 
                        className={`competency-tag competency-${comp}`}
                      >
                        {COMPETENCY_OPTIONS.find(c => c.value === comp)?.label || comp}
                      </span>
                    ))}
                  </td>
                  <td>{member.weeklyCapacity}</td>
                  <td>{Math.round(member.availability * 100)}%</td>
                  <td>{Math.round(member.weeklyCapacity * member.availability)} tim</td>
                  <td>
                    <div className="table-actions">
                      <button 
                        className="btn btn-outline btn-sm"
                        onClick={() => openEditModal(member)}
                      >
                        Redigera
                      </button>
                      <button 
                        className="btn btn-danger btn-sm"
                        onClick={() => handleRemove(member.id)}
                      >
                        Ta bort
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal för att lägga till/redigera medlem */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingMember ? 'Redigera teammedlem' : 'Ny teammedlem'}
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
                    placeholder="t.ex. Anna Andersson"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Kompetenser</label>
                  <div className="flex gap-2 flex-wrap">
                    {COMPETENCY_OPTIONS.map(option => (
                      <label key={option.value} className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={formData.competencies.includes(option.value)}
                          onChange={() => handleCompetencyChange(option.value)}
                          className="h-4 w-4"
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Veckotimmar</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.weeklyCapacity}
                      onChange={e => setFormData({ 
                        ...formData, 
                        weeklyCapacity: parseInt(e.target.value) || 0 
                      })}
                      min="0"
                      max="100"
                      placeholder="40"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Tillgänglighet (%)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.availability * 100}
                      onChange={e => setFormData({ 
                        ...formData, 
                        availability: (parseInt(e.target.value) || 0) / 100 
                      })}
                      min="0"
                      max="100"
                      placeholder="100"
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={closeModal}>
                  Avbryt
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingMember ? 'Spara ändringar' : 'Lägg till'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamSetup;
