import React, { useState } from 'react';
import Modal from '../Common/Modal';
import { formatInput, getInt } from '../../utils/formatters';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tujuan: 'bank' | 'kas', nominal: number) => Promise<void>;
}

const DepositModal: React.FC<DepositModalProps> = ({ isOpen, onClose, onSave }) => {
  const [tujuan, setTujuan] = useState<'bank' | 'kas'>('bank');
  const [nominal, setNominal] = useState('');

  const handleSubmit = async () => {
    const nom = getInt(nominal);
    if (nom <= 0) return alert("Nominal harus diisi");
    try {
      await onSave(tujuan, nom);
      alert("Deposit Berhasil!");
      onClose();
      setNominal('');
    } catch (err: any) {
      alert("Gagal: " + err.message);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="🏦 Tambah Saldo">
      <div className="form-group">
        <label>Tujuan</label>
        <select 
          className="form-control" 
          value={tujuan} 
          onChange={(e) => setTujuan(e.target.value as 'bank' | 'kas')}
        >
          <option value="bank">Saldo Bank</option>
          <option value="kas">Kas Tunai</option>
        </select>
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
      <button className="btn-submit" onClick={handleSubmit}>SIMPAN DEPOSIT</button>
    </Modal>
  );
};

export default DepositModal;
