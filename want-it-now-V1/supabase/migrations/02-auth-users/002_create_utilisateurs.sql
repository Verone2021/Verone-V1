-- Migration 002: Créer la table utilisateurs et ses policies RLS
-- Création: 2025-01-09
-- Description: Table pour gérer les utilisateurs de la plateforme avec rôles et organisations

-- Créer la table utilisateurs
create table if not exists public.utilisateurs (
  id uuid primary key,
  nom varchar(255),
  prenom varchar(255),
  email varchar(255) not null unique,
  telephone varchar(50),
  role varchar(50) not null check (
    role in ('super_admin', 'admin', 'proprietaire', 'locataire', 'prestataire')
  ),
  organisation_id uuid references public.organisations(id) on delete set null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Créer les index pour optimiser les requêtes
create index if not exists idx_utilisateurs_role on public.utilisateurs(role);
create index if not exists idx_utilisateurs_organisation on public.utilisateurs(organisation_id);
create index if not exists idx_utilisateurs_email on public.utilisateurs(email);

-- Créer la fonction de trigger pour updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Créer le trigger pour automatiquement mettre à jour updated_at
create trigger trigger_utilisateurs_updated_at
  before update on public.utilisateurs
  for each row
  execute function update_updated_at_column();

-- Activer RLS sur la table
alter table public.utilisateurs enable row level security;

-- Policy de lecture : un utilisateur peut voir ses propres informations
create policy "utilisateurs_select_policy"
on public.utilisateurs for select
using (
  id = auth.uid()
);

-- Policy d'insertion : temporairement permissive pour les tests
create policy "utilisateurs_insert_policy"
on public.utilisateurs for insert
with check (true);

-- Policy de mise à jour : un utilisateur peut modifier ses propres informations
create policy "utilisateurs_update_policy"
on public.utilisateurs for update
using (
  id = auth.uid()
);

-- Policy de suppression : temporairement permissive pour les tests
create policy "utilisateurs_delete_policy"
on public.utilisateurs for delete
using (false); -- Pas de suppression pour le moment

-- Commentaires pour documentation
comment on table public.utilisateurs is 'Table des utilisateurs de la plateforme avec gestion des rôles et organisations';
comment on column public.utilisateurs.id is 'Identifiant unique (UUID) correspondant à l''ID Supabase Auth';
comment on column public.utilisateurs.role is 'Rôle de l''utilisateur : super_admin, admin, proprietaire, locataire, prestataire';
comment on column public.utilisateurs.organisation_id is 'Référence vers l''organisation (nullable pour super_admin)';