-- Allow tenants to cancel their own pending service requests
DROP POLICY IF EXISTS tenant_update_own_service_requests ON public.service_requests;

CREATE POLICY tenant_update_own_service_requests
ON public.service_requests
FOR UPDATE
TO authenticated
USING (
  tenant_id = auth.uid()
  AND status = 'pending'
)
WITH CHECK (
  tenant_id = auth.uid()
  AND status = 'cancelled'
);
