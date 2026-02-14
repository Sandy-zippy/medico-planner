-- projects table
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  clinic_type text not null,
  province text not null,
  city text not null default '',
  area_sqft integer not null,
  budget_range text not null,
  timeline text not null,
  rooms_json jsonb not null default '[]',
  notes text default '',
  upload_urls jsonb default '[]',
  existing_space boolean default false,
  address text default '',
  status text not null default 'draft',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- generations table
create table public.generations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  version integer not null,
  output_json jsonb not null,
  created_at timestamptz default now()
);

-- RLS
alter table public.projects enable row level security;
alter table public.generations enable row level security;

create policy "Users can CRUD own projects"
  on public.projects for all
  using (auth.uid() = user_id);

create policy "Users can read own generations"
  on public.generations for select
  using (project_id in (select id from public.projects where user_id = auth.uid()));

create policy "Users can insert own generations"
  on public.generations for insert
  with check (project_id in (select id from public.projects where user_id = auth.uid()));

-- indexes
create index idx_projects_user_id on public.projects(user_id);
create index idx_generations_project_id on public.generations(project_id);

-- storage bucket for uploads
insert into storage.buckets (id, name, public) values ('project-uploads', 'project-uploads', false);

create policy "Users can upload to own folder"
  on storage.objects for insert
  with check (bucket_id = 'project-uploads' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can read own uploads"
  on storage.objects for select
  using (bucket_id = 'project-uploads' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can delete own uploads"
  on storage.objects for delete
  using (bucket_id = 'project-uploads' and (storage.foldername(name))[1] = auth.uid()::text);
