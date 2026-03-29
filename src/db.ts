const fetchWithErr = async (url: string, options?: RequestInit) => {
  const fetchOptions = {
    ...options,
    cache: 'no-store' as RequestCache
  };
  const res = await fetch(url, fetchOptions);
  if (!res.ok) {
    let errMsg = `Request failed with status ${res.status}`;
    try {
      const errData = await res.json();
      if (errData.error) errMsg = errData.error;
      else if (errData.message) errMsg = errData.message;
    } catch (e) {
      // Ignore JSON parse error if response is not JSON
    }
    throw new Error(errMsg);
  }
  return res.json();
};

export const getAppointmentsDB = async () => {
  try {
    return await fetchWithErr('/api/appointments');
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const saveAppointmentsDB = async (data: any) => {
  return await fetchWithErr('/api/appointments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
};

export const updateAppointmentStatusDB = async (id: string, status: string) => {
  return await fetchWithErr(`/api/appointments/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
};

export const updateMedicalRecordDB = async (id: string, data: any) => {
  return await fetchWithErr(`/api/appointments/${id}/medical-record`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
};

export const getMedicalRecordDB = async (id: string) => {
  try {
    return await fetchWithErr(`/api/appointments/${id}/medical-record`);
  } catch (error) {
    console.error('Error fetching medical record:', error);
    return {
      keluhan: '',
      pemeriksaan: '',
      tekanan_darah: '',
      nadi: '',
      respirasi: '',
      suhu: '',
      saturasi: '',
      diagnosa: '',
      tindakan: '',
      obat: '',
      dosis: ''
    };
  }
};

export const getDiagnosaDB = async () => {
  try {
    return await fetchWithErr('/api/icd10');
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const getObatDB = async () => {
  try {
    return await fetchWithErr('/api/obat');
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const saveObatDB = async (data: any) => {
  return await fetchWithErr('/api/obat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
};

export const getVaccineStocksDB = async () => {
  try {
    return await fetchWithErr('/api/vaccine-stocks');
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const saveVaccineStocksDB = async (data: any) => {
  return await fetchWithErr('/api/vaccine-stocks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
};

export const getEIcvStockDB = async () => {
  try {
    const data = await fetchWithErr('/api/eicv-stock');
    return data || { jumlah_stok: 0, terakhir_update: '' };
  } catch (error) {
    console.error(error);
    return { jumlah_stok: 0, terakhir_update: '' };
  }
};

export const saveEIcvStockDB = async (data: any) => {
  return await fetchWithErr('/api/eicv-stock', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
};

export const getPoliklinikDB = async () => {
  try {
    return await fetchWithErr('/api/poliklinik');
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const savePoliklinikDB = async (data: any) => {
  return await fetchWithErr('/api/poliklinik', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
};

export const updatePoliklinikDB = async (id: string, data: any) => {
  return await fetchWithErr(`/api/poliklinik/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
};

export const getDokterDB = async () => {
  try {
    return await fetchWithErr('/api/dokter');
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const saveDokterDB = async (data: any) => {
  return await fetchWithErr('/api/dokter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
};

export const updateDokterDB = async (id: string, data: any) => {
  return await fetchWithErr(`/api/dokter/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
};

export const getJadwalDokterDB = async () => {
  try {
    return await fetchWithErr('/api/jadwal_dokter');
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const saveJadwalDokterDB = async (data: any) => {
  return await fetchWithErr('/api/jadwal_dokter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
};

export const updateJadwalDokterDB = async (id: string, data: any) => {
  return await fetchWithErr(`/api/jadwal_dokter/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
};

export const deleteJadwalDokterDB = async (id: string) => {
  return await fetchWithErr(`/api/jadwal_dokter/${id}`, {
    method: 'DELETE'
  });
};

export const getJadwalLayananDB = async () => {
  try {
    return await fetchWithErr('/api/jadwal_layanan');
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const saveJadwalLayananDB = async (data: any) => {
  return await fetchWithErr('/api/jadwal_layanan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
};

export const updateJadwalLayananDB = async (id: string, data: any) => {
  return await fetchWithErr(`/api/jadwal_layanan/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
};

export const getPatientsDB = async () => {
  try {
    return await fetchWithErr('/api/patients');
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const updatePatientDB = async (id: number, data: any) => {
  return await fetchWithErr(`/api/patients/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...data,
      nomor_bpjs: data.no_bpjs || data.nomor_bpjs // Handle both field names
    })
  });
};

export const deletePatientDB = async (id: number) => {
  return await fetchWithErr(`/api/patients/${id}`, {
    method: 'DELETE'
  });
};

export const getLaporanBulananDB = async () => {
  try {
    return await fetchWithErr('/api/laporan/bulanan');
  } catch (error) {
    console.error(error);
    return { totalKunjungan: 0, statistikPoli: [], topPoli: [] };
  }
};

// --- ARTIKEL PORTAL API ---

export const getArticlesDB = async () => {
  try {
    return await fetchWithErr('/api/articles');
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const getFeaturedArticlesDB = async () => {
  try {
    return await fetchWithErr('/api/articles/featured');
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const saveArticleDB = async (data: any) => {
  return await fetchWithErr('/api/articles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
};

export const updateArticleDB = async (id: string, data: any) => {
  return await fetchWithErr(`/api/articles/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
};

export const deleteArticleDB = async (id: string) => {
  return await fetchWithErr(`/api/articles/${id}`, {
    method: 'DELETE'
  });
};

export const incrementArticleViewDB = async (id: string) => {
  return await fetchWithErr(`/api/articles/${id}/view`, {
    method: 'PUT'
  });
};

export const getArticleStatsDB = async () => {
  try {
    return await fetchWithErr('/api/articles/stats');
  } catch (error) {
    console.error(error);
    return { topArticles: [], totalViews: 0, totalArticles: 0 };
  }
};

export const uploadArticleImageDB = async (base64Image: string) => {
  return await fetchWithErr('/api/upload-article-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: base64Image })
  });
};
