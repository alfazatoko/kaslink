import React, { useState } from 'react';
import { Kontak } from '../../types';
import Modal from '../Common/Modal';
import { Trash2, MessageSquare } from 'lucide-react';

interface KontakModalProps {
  isOpen: boolean;
  onClose: () => void;
  kontakList: Kontak[];
  onAdd: (nama: string, wa: string, catatan: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const KontakModal: React.FC<KontakModalProps> = ({ isOpen, onClose, kontakList, onAdd, onDelete }) => {
  const [nama, setNama] = useState('');
  const [wa, setWa] = useState('');
  const [catatan, setCatatan] = useState('');

  const handleAdd = async () => {
    if (!nama) return alert("Nama harus diisi");
    try {
      await onAdd(nama, wa, catatan);
      alert("Kontak & Catatan Tersimpan!");
      setNama(''); setWa(''); setCatatan('');
    } catch (err: any) {
      alert("Gagal: " + err.message);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="👥 Kontak & Catatan">
      <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '15px' }}>
        {kontakList.map(k => (
          <div key={k.id} className="history-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '5px' }}>
              <div style={{ fontWeight: 700 }}>{k.nama}</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <a href={`https://wa.me/${k.wa.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">
                  <MessageSquare size={16} color="var(--success)" />
                </a>
                <button onClick={() => onDelete(k.id!)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <Trash2 size={16} color="var(--danger)" />
                </button>
              </div>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{k.wa} • {k.catatan}</div>
          </div>
        ))}
      </div>
      
      <div className="form-group">
        <label>Nama / Ket</label>
        <input type="text" className="form-control" value={nama} onChange={(e) => setNama(e.target.value)} />
      </div>
      <div className="form-group">
        <label>No HP / Rekening</label>
        <input type="text" className="form-control" value={wa} onChange={(e) => setWa(e.target.value)} />
      </div>
      <div className="form-group">
        <label>Catatan</label>
        <textarea className="form-control" rows={2} value={catatan} onChange={(e) => setCatatan(e.target.value)} />
      </div>
      <button className="btn-submit" onClick={handleAdd}>SIMPAN KONTAK</button>
    </Modal>
  );
};

export default KontakModal;
