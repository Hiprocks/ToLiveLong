-- Create the daily_logs table
create table public.daily_logs (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  date date not null default current_date,
  meal_type text not null check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  menu_name text not null,
  calories integer not null default 0,
  carbs integer default 0,
  protein integer default 0,
  fat integer default 0,
  image_url text
);

-- Enable Row Level Security (RLS)
alter table public.daily_logs enable row level security;

-- Create a policy that allows all operations for now (since it's a single user app, or you can restrict later)
create policy "Enable all access for all users" on public.daily_logs
for all using (true) with check (true);
