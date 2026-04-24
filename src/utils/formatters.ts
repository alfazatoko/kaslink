export const formatRp = (v: number) => 'Rp ' + (v || 0).toLocaleString('id-ID');

export const formatInput = (v: string) => {
  const num = v.replace(/\D/g, "");
  return num === "" ? "" : parseInt(num).toLocaleString("id-ID");
};

export const getInt = (v: string) => parseInt(v.replace(/\./g, "")) || 0;

export const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleString('id-ID', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric',
    hour: '2-digit', 
    minute: '2-digit' 
  });
};
