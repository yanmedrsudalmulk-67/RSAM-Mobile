-- Migration to add ICD-10 tables

-- 1. Create icd10_codes table
CREATE TABLE IF NOT EXISTS public.icd10_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create rekam_medis_diagnosa table
CREATE TABLE IF NOT EXISTS public.rekam_medis_diagnosa (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rekam_medis_id INTEGER REFERENCES public.rekam_medis(id) ON DELETE CASCADE,
    icd10_id UUID REFERENCES public.icd10_codes(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable RLS (Row Level Security)
ALTER TABLE public.icd10_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rekam_medis_diagnosa ENABLE ROW LEVEL SECURITY;

-- 4. Create policies for icd10_codes
DROP POLICY IF EXISTS "Allow public read access to icd10_codes" ON public.icd10_codes;
CREATE POLICY "Allow public read access to icd10_codes" 
ON public.icd10_codes FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert icd10_codes" ON public.icd10_codes;
CREATE POLICY "Allow authenticated users to insert icd10_codes" 
ON public.icd10_codes FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to update icd10_codes" ON public.icd10_codes;
CREATE POLICY "Allow authenticated users to update icd10_codes" 
ON public.icd10_codes FOR UPDATE 
USING (true);

-- 5. Create policies for rekam_medis_diagnosa
DROP POLICY IF EXISTS "Allow public read access to rekam_medis_diagnosa" ON public.rekam_medis_diagnosa;
CREATE POLICY "Allow public read access to rekam_medis_diagnosa" 
ON public.rekam_medis_diagnosa FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert rekam_medis_diagnosa" ON public.rekam_medis_diagnosa;
CREATE POLICY "Allow authenticated users to insert rekam_medis_diagnosa" 
ON public.rekam_medis_diagnosa FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to update rekam_medis_diagnosa" ON public.rekam_medis_diagnosa;
CREATE POLICY "Allow authenticated users to update rekam_medis_diagnosa" 
ON public.rekam_medis_diagnosa FOR UPDATE 
USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to delete rekam_medis_diagnosa" ON public.rekam_medis_diagnosa;
CREATE POLICY "Allow authenticated users to delete rekam_medis_diagnosa" 
ON public.rekam_medis_diagnosa FOR DELETE 
USING (true);

-- 6. Create obat_master table
CREATE TABLE IF NOT EXISTS public.obat_master (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nama_obat VARCHAR(255) NOT NULL,
    kategori VARCHAR(100),
    satuan VARCHAR(50),
    stok INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create resep_obat table
CREATE TABLE IF NOT EXISTS public.resep_obat (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rekam_medis_id INTEGER REFERENCES public.rekam_medis(id) ON DELETE CASCADE,
    obat_id UUID REFERENCES public.obat_master(id) ON DELETE RESTRICT,
    dosis VARCHAR(100),
    frekuensi VARCHAR(100),
    durasi VARCHAR(100),
    cara_pakai VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Enable RLS for new tables
ALTER TABLE public.obat_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resep_obat ENABLE ROW LEVEL SECURITY;

-- 9. Policies for obat_master
DROP POLICY IF EXISTS "Allow public read access to obat_master" ON public.obat_master;
CREATE POLICY "Allow public read access to obat_master" 
ON public.obat_master FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert obat_master" ON public.obat_master;
CREATE POLICY "Allow authenticated users to insert obat_master" 
ON public.obat_master FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to update obat_master" ON public.obat_master;
CREATE POLICY "Allow authenticated users to update obat_master" 
ON public.obat_master FOR UPDATE 
USING (true);

-- 10. Policies for resep_obat
DROP POLICY IF EXISTS "Allow public read access to resep_obat" ON public.resep_obat;
CREATE POLICY "Allow public read access to resep_obat" 
ON public.resep_obat FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert resep_obat" ON public.resep_obat;
CREATE POLICY "Allow authenticated users to insert resep_obat" 
ON public.resep_obat FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to update resep_obat" ON public.resep_obat;
CREATE POLICY "Allow authenticated users to update resep_obat" 
ON public.resep_obat FOR UPDATE 
USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to delete resep_obat" ON public.resep_obat;
CREATE POLICY "Allow authenticated users to delete resep_obat" 
ON public.resep_obat FOR DELETE 
USING (true);
