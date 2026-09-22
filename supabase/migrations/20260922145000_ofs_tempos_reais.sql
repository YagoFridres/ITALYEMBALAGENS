-- Migration para adicionar colunas de tempo real na tabela ofs
-- Objetivo: Corrigir B6-3-e (Registrar Tempo) - colunas existiam no payload mas faltavam no schema
-- Horário: 2026-09-22 ~11:50 BRT

alter table if exists public.ofs add column if not exists tempo_setup_real integer;
alter table if exists public.ofs add column if not exists tempo_producao_real integer;
