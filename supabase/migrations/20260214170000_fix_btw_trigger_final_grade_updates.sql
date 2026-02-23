-- Ensure BTW grant trigger also runs when admins update final_grade directly.
DROP TRIGGER IF EXISTS grant_btw_credits_trigger ON public.enrollments;

CREATE TRIGGER grant_btw_credits_trigger
BEFORE INSERT OR UPDATE OF grade, final_grade, status
ON public.enrollments
FOR EACH ROW
EXECUTE FUNCTION public.grant_btw_credits_on_completion();
