-- Allow link-based invitations (email = null)
alter table invitations alter column email drop not null;

-- One active link invitation per couple at a time
create unique index invitations_one_active_link_per_couple
  on invitations (couple_id)
  where email is null and accepted_at is null;
