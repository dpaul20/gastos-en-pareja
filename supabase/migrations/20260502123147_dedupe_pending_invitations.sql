-- Remove duplicate pending invitations without touching accepted ones.
-- Keep the newest pending row per couple/email pair and delete older duplicates.

with ranked_pending_invitations as (
	select
		id,
		row_number() over (
			partition by couple_id, lower(email)
			order by created_at desc, id desc
		) as duplicate_rank
	from public.invitations
	where accepted_at is null
)
delete from public.invitations invitations_to_delete
using ranked_pending_invitations ranked
where invitations_to_delete.id = ranked.id
	and ranked.duplicate_rank > 1;
