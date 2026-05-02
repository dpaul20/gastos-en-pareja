-- Enforce at most one pending invitation per couple/email.
-- Accepted invitations are excluded from this constraint.

create unique index if not exists invitations_one_pending_per_couple_email_idx
	on public.invitations (couple_id, lower(email))
	where accepted_at is null;
