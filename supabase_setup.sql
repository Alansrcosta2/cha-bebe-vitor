-- 🚀 Script de Configuração do Supabase para Chá de Bebê do Vítor
-- Execute este SQL no editor SQL do seu projeto Supabase

-- 1. Criar tabela guests
create table if not exists guests (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  whatsapp text,
  acompanhantes integer default 0,
  fralda_tamanho text,
  observacao text,
  whatsapp_enviado boolean default false,
  status text default 'sim' check (status in ('sim','nao')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
-- 1.5. Criar tabela fraldas (inventory)
create table if not exists fraldas (
  size text primary key,
  quantity integer not null
);

-- Inserir quantidades iniciais de fraldas
insert into fraldas (size, quantity) values
  ('RN', 15),
  ('P', 15),
  ('M', 10),
  ('G', 10);

alter table guests add column if not exists fralda_tamanho text;
alter table guests add column if not exists whatsapp_enviado boolean default false;

-- 2. Criar tabela gifts
create table if not exists gifts (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  category text not null,
  status text default 'available' check (status in ('available', 'reserved')),
  reserved_by text,
  reserved_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Criar tabela messages
create table if not exists messages (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  message text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Habilitar RLS (Row Level Security)
alter table guests enable row level security;
alter table gifts enable row level security;
alter table messages enable row level security;

-- 5. Políticas para guests (inserção pública, leitura pública)
drop policy if exists "Allow public insert" on guests;
drop policy if exists "Allow public select" on guests;
drop policy if exists "Allow public update" on guests;
create policy "Allow public insert" on guests for insert with check (true);
create policy "Allow public select" on guests for select using (true);
create policy "Allow public update" on guests for update using (true) with check (true);

-- 6. Políticas para gifts (inserção pública, atualização pública, leitura pública)
drop policy if exists "Allow public insert" on gifts;
drop policy if exists "Allow public update" on gifts;
drop policy if exists "Allow public select" on gifts;
create policy "Allow public insert" on gifts for insert with check (true);
create policy "Allow public update" on gifts for update using (true);
create policy "Allow public select" on gifts for select using (true);

-- 7. Políticas para messages (inserção pública, leitura pública)
drop policy if exists "Allow public insert" on messages;
drop policy if exists "Allow public select" on messages;
create policy "Allow public insert" on messages for insert with check (true);
create policy "Allow public select" on messages for select using (true);

-- 8. Inserir presentes iniciais
insert into gifts (name, category) values
  ('Fraldas', 'fraldas');

-- 9. Habilitar Realtime para atualizações em tempo real (idempotente)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_rel pr
    JOIN pg_class c ON c.oid = pr.prrelid
    JOIN pg_publication p ON p.oid = pr.prpubid
    WHERE p.pubname = 'supabase_realtime' AND c.relname = 'guests'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE guests';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_rel pr
    JOIN pg_class c ON c.oid = pr.prrelid
    JOIN pg_publication p ON p.oid = pr.prpubid
    WHERE p.pubname = 'supabase_realtime' AND c.relname = 'gifts'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE gifts';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_rel pr
    JOIN pg_class c ON c.oid = pr.prrelid
    JOIN pg_publication p ON p.oid = pr.prpubid
    WHERE p.pubname = 'supabase_realtime' AND c.relname = 'messages'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE messages';
  END IF;
END $$;

-- ✅ Tudo configurado! Agora seu banco está pronto para o aplicativo.

-- 10. Add CHECK constraint for fralda_tamanho (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'guests_fralda_tamanho_allowed'
  ) THEN
    ALTER TABLE guests
      ADD CONSTRAINT guests_fralda_tamanho_allowed
      CHECK (fralda_tamanho IS NULL OR fralda_tamanho IN ('RN','P','M','G'));
  END IF;
END $$;

-- 11. Create RPC function to atomically decrement diaper inventory
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'decrement_fralda'
  ) THEN
    CREATE OR REPLACE FUNCTION decrement_fralda(p_size text)
    RETURNS boolean AS $$
    DECLARE
      updated_count integer;
    BEGIN
      UPDATE fraldas
      SET quantity = quantity - 1
      WHERE size = p_size AND quantity > 0
      RETURNING quantity INTO updated_count;

      IF FOUND THEN
        RETURN TRUE;
      ELSE
        RETURN FALSE;
      END IF;
    END;
    $$ LANGUAGE plpgsql;
  END IF;
END $$;
