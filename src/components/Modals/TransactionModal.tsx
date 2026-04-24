import React, { useState } from 'react';
import { UserProfile } from '../../types';
import Modal from '../Common/Modal';
import { formatInput, getInt } from '../../utils/formatters';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile | null;
  onSave: (kat: string, nom: number, fee: number, ket: string) => Promise<void>;
}

const TransactionModal: React.FC<TransactionModalProps> = ({ isOpen, onClose, profile, onSave }) => {
  const [kat, setKat] = useState(profile?.defaultCategory || '');
  const [nom, setNom] = useState('');
  const [fee, setFee] = useState('0');
  const [ket, setKet] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nominal = getInt(nom);
    const adminFee = getInt(fee);
    if (nominal <= 0) return alert("Nominal harus diisi");

    try {
      await onSave(kat, nominal, adminFee, ket);
      alert("Transaksi Berhasil!");
      onClose();
      setNom('');
      setFee('0');
      setKet('');
    } catch (err: any) {
      alert("Gagal: " + err.message);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="💸 Transaksi Baru">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Kategori</label>
          <select 
            className="form-control"
            value={kat}
            onChange={(e) => setKat(e.target.value)}
          >
            {profile?.categories.map(c => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Nominal (Rp)</label>
          <input 
            type="text" 
            className="form-control" 
            inputMode="numeric"
            value={nom}
            onChange={(e) => setNom(formatInput(e.target.value))}
            placeholder="0" 
            required 
          />
        </div>
        <div className="form-group">
          <label>Admin Fee (Laba)</label>
          <input 
            type="text" 
            className="form-control" 
            inputMode="numeric"
            value={fee}
            onChange={(e) => setFee(formatInput(e.target.value))}
          />
        </div>
        <div className="form-group">
          <label>Keterangan</label>
          <input 
            type="text" 
            className="form-control" 
            placeholder="..."
            value={ket}
            onChange={(e) => setKet(e.target.value)}
          />
        </div>
        <button type="submit" className="btn-submit">SIMPAN TRANSAKSI</button>
      </form>
    </Modal>
  );
};

export default TransactionModal;
