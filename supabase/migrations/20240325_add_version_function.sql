-- Add version function for connectivity testing
CREATE OR REPLACE FUNCTION public.version()
RETURNS text AS $$
BEGIN
    RETURN current_setting('server_version');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to anonymous users
GRANT EXECUTE ON FUNCTION public.version() TO anon; 