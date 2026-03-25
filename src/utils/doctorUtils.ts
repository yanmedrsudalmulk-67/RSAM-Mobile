export const checkIsCuti = (schedules: any[]) => {
  return schedules.some((j: any) => {
    if (j.status_dokter?.toLowerCase() !== 'cuti') return false;
    
    // If there are cuti dates, check if today is within the range
    if (j.tanggal_mulai_cuti && j.tanggal_selesai_cuti) {
      const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
      today.setHours(0, 0, 0, 0);
      const start = new Date(j.tanggal_mulai_cuti);
      start.setHours(0, 0, 0, 0);
      const end = new Date(j.tanggal_selesai_cuti);
      end.setHours(23, 59, 59, 999);
      
      return today >= start && today <= end;
    }
    
    // If no dates specified, they are just on leave
    return true;
  });
};
