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
  const [katId, setKatId] = useState('');
  const [nom, setNom] = useState('');
  const [fee, setFee] = useState('0');
  const [ket, setKet] = useState('');

  React.useEffect(() => {
    if (isOpen && profile) {
      setKatId(profile.defaultCategory || (profile.categories[0]?.id || ''));
    }
  }, [isOpen, profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nominal = getInt(nom);
    const adminFee = getInt(fee);
    if (!katId) return alert("Pilih kategori");
    if (nominal <= 0) return alert("Nominal harus diisi");

    try {
      await onSave(katId, nominal, adminFee, ket);
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
            value={katId}
            onChange={(e) => setKatId(e.target.value)}
          >
            <option value="">-- Pilih Kategori --</option>
            {profile?.categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
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
