import React, { useState } from 'react';
import { Kasbon } from '../../types';
import Modal from '../Common/Modal';
import { formatRp, formatInput, getInt } from '../../utils/formatters';

interface KasbonModalProps {
  isOpen: boolean;
  onClose: () => void;
  kasbonList: Kasbon[];
  onAdd: (nama: string, nominal: number) => Promise<void>;
  onPay: (id: string, nominal: number, nama: string) => Promise<void>;
}

const KasbonModal: React.FC<KasbonModalProps> = ({ isOpen, onClose, kasbonList, onAdd, onPay }) => {
  const [nama, setNama] = useState('');
  const [nominal, setNominal] = useState('');

  const handleAdd = async () => {
    const nom = getInt(nominal);
    if (!nama || nom <= 0) return alert("Nama & Nominal harus diisi");
    try {
      await onAdd(nama, nom);
      alert("Kasbon Ditambahkan!");
      setNama('');
      setNominal('');
    } catch (err: any) {
      alert("Gagal: " + err.message);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="💰 Kasbon Aktif">
      <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '15px' }}>
        {kasbonList.map(k => (
          <div key={k.id} className="history-item">
            <div className="history-info">
              <div style={{ fontWeight: 700 }}>{k.nama}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{k.tgl}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ fontWeight: 800 }}>{formatRp(k.nominal)}</div>
              <button 
                onClick={() => onPay(k.id!, k.nominal, k.nama)}
                style={{ background: 'var(--success)', color: 'white', border: 'none', borderRadius: '8px', padding: '4px 8px', fontSize: '10px', cursor: 'pointer' }}
              >
                BAYAR
              </button>
            </div>
          </div>
        ))}
        {kasbonList.length === 0 && <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>Tidak ada kasbon aktif</div>}
      </div>
      
      <div className="form-group">
        <label>Nama Pelanggan</label>
        <input 
          type="text" 
          className="form-control" 
          value={nama} 
          onChange={(e) => setNama(e.target.value)} 
        />
      </div>
      <div className="form-group">
        <label>Nominal</label>
        <input 
          type="text" 
          className="form-control" 
          inputMode="numeric" 
          value={nominal} 
          onChange={(e) => setNominal(formatInput(e.target.value))} 
        />
      </div>
      <button className="btn-submit" onClick={handleAdd}>TAMBAH KASBON</button>
    </Modal>
  );
};

export default KasbonModal;
