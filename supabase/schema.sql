-- ============ 1. ХҮСНЭГТҮҮД ============
create table profiles(
  id uuid primary key references auth.users on delete cascade,
  full_name text, phone text,
  role text not null default 'user' check (role in ('user','admin')),
  created_at timestamptz default now());
create table categories(id uuid primary key default gen_random_uuid(), name text not null, slug text unique not null);
create table products(
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories on delete set null,
  name text not null, description text,
  price numeric not null check (price > 0),
  material text, stock int not null default 0 check (stock >= 0),
  image_url text, is_active boolean default true,
  created_at timestamptz default now());
create table tags(id uuid primary key default gen_random_uuid(), name text unique not null,
  type text not null check (type in ('occasion','style','recipient','material')));
create table product_tags(
  product_id uuid references products on delete cascade,
  tag_id uuid references tags on delete cascade,
  primary key (product_id, tag_id));
create table quiz_questions(id uuid primary key default gen_random_uuid(), question_text text unique not null, sort_order int default 0);
create table quiz_options(id uuid primary key default gen_random_uuid(),
  question_id uuid references quiz_questions on delete cascade,
  label text not null, tag_id uuid references tags on delete cascade);
create table sets(id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade default auth.uid(),
  name text not null, total_price numeric default 0, created_at timestamptz default now());
create table set_items(
  set_id uuid references sets on delete cascade,
  product_id uuid references products on delete cascade,
  quantity int not null default 1 check (quantity > 0),
  primary key (set_id, product_id));
create table cart_items(id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade default auth.uid(),
  product_id uuid references products on delete cascade,
  set_id uuid references sets on delete cascade,
  quantity int not null default 1 check (quantity > 0),
  check ((product_id is null) <> (set_id is null)));
create table orders(id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles default auth.uid(),
  total numeric not null default 0,
  status text not null default 'pending' check (status in ('pending','paid')),
  created_at timestamptz default now());
create table order_items(id uuid primary key default gen_random_uuid(),
  order_id uuid references orders on delete cascade,
  product_id uuid references products, quantity int not null, price numeric not null);

-- ============ 2. ТУСЛАХ ФУНКЦҮҮД ============
create function public.is_admin() returns boolean language sql security definer stable set search_path=public
as $$ select exists(select 1 from profiles where id = auth.uid() and role = 'admin') $$;
create function public.my_role() returns text language sql security definer stable set search_path=public
as $$ select role from profiles where id = auth.uid() $$;

create function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into profiles(id, full_name) values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

-- Хослол хадгалах: нийт үнийг серверт products.price-аас дахин бодно
create function public.save_set(p_name text, p_items jsonb) returns uuid language plpgsql as $$
declare v_id uuid;
begin
  insert into sets(user_id, name) values (auth.uid(), p_name) returning id into v_id;
  insert into set_items(set_id, product_id, quantity)
    select v_id, (i->>'product_id')::uuid, greatest((i->>'quantity')::int, 1)
    from jsonb_array_elements(p_items) i;
  update sets set total_price = (select coalesce(sum(p.price * si.quantity), 0)
    from set_items si join products p on p.id = si.product_id where si.set_id = v_id) where id = v_id;
  return v_id;
end $$;

-- ============ 3. RLS ============
do $$ declare t text; begin
  foreach t in array array['categories','products','tags','product_tags','quiz_questions','quiz_options'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy "read %1$s" on %1$I for select using (true)', t);
    execute format('create policy "admin write %1$s" on %1$I for all using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

alter table profiles enable row level security;
create policy "profiles select" on profiles for select using (id = auth.uid() or public.is_admin());
create policy "profiles update" on profiles for update using (id = auth.uid())
  with check (id = auth.uid() and role = public.my_role());   -- өөрийгөө admin болгож болохгүй

alter table sets enable row level security;
create policy "own sets" on sets for all using (user_id = auth.uid()) with check (user_id = auth.uid());
alter table set_items enable row level security;
create policy "own set_items" on set_items for all
  using (exists (select 1 from sets s where s.id = set_id and s.user_id = auth.uid()))
  with check (exists (select 1 from sets s where s.id = set_id and s.user_id = auth.uid()));
alter table cart_items enable row level security;
create policy "own cart" on cart_items for all using (user_id = auth.uid()) with check (user_id = auth.uid());
alter table orders enable row level security;
create policy "own orders" on orders for select using (user_id = auth.uid() or public.is_admin());
create policy "insert own orders" on orders for insert with check (user_id = auth.uid());
alter table order_items enable row level security;
create policy "own order_items" on order_items for select
  using (exists (select 1 from orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())));

-- ============ 4. STORAGE ============
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('product-images','product-images', true, 2097152, array['image/jpeg','image/png','image/webp']);
create policy "img read" on storage.objects for select using (bucket_id = 'product-images');
create policy "img admin insert" on storage.objects for insert with check (bucket_id = 'product-images' and public.is_admin());
create policy "img admin update" on storage.objects for update using (bucket_id = 'product-images' and public.is_admin());
create policy "img admin delete" on storage.objects for delete using (bucket_id = 'product-images' and public.is_admin());
