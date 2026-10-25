-- Dados da empresa vindos da consulta de CNPJ no cadastro de RT. A atividade (CNAE) e a cidade servem para o radar
-- regulatório e a IA dizerem quais empresas uma norma nova pode afetar.
alter table public.technical_responsibilities
  add column company_legal_name text,
  add column company_cnae text,
  add column company_cnae_description text,
  add column company_city text,
  add column company_state text;
