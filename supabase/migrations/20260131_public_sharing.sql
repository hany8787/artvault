-- Public sharing feature for artworks
-- Allows users to share individual artworks via public links

-- Add public sharing columns to artworks
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS public_views INTEGER DEFAULT 0;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS shared_at TIMESTAMP WITH TIME ZONE;

-- Create index for public artworks lookup
CREATE INDEX IF NOT EXISTS artworks_share_token_idx ON artworks(share_token) WHERE share_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS artworks_public_idx ON artworks(is_public) WHERE is_public = true;

-- Function to generate a unique share token
CREATE OR REPLACE FUNCTION generate_share_token()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..12 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to make an artwork public and generate share token
CREATE OR REPLACE FUNCTION make_artwork_public(p_artwork_id UUID, p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_token TEXT;
  v_existing_token TEXT;
BEGIN
  -- Check if artwork belongs to user
  SELECT share_token INTO v_existing_token
  FROM artworks
  WHERE id = p_artwork_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Artwork not found or not owned by user';
  END IF;

  -- If already has token, return it
  IF v_existing_token IS NOT NULL THEN
    UPDATE artworks SET is_public = true, shared_at = NOW()
    WHERE id = p_artwork_id;
    RETURN v_existing_token;
  END IF;

  -- Generate new unique token
  LOOP
    v_token := generate_share_token();
    BEGIN
      UPDATE artworks
      SET is_public = true, share_token = v_token, shared_at = NOW()
      WHERE id = p_artwork_id;
      EXIT; -- Success, exit loop
    EXCEPTION WHEN unique_violation THEN
      -- Token already exists, try again
    END;
  END LOOP;

  RETURN v_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to make an artwork private
CREATE OR REPLACE FUNCTION make_artwork_private(p_artwork_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE artworks
  SET is_public = false
  WHERE id = p_artwork_id AND user_id = p_user_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get public artwork by share token (no auth required)
CREATE OR REPLACE FUNCTION get_public_artwork(p_token TEXT)
RETURNS TABLE (
  id UUID,
  title TEXT,
  artist TEXT,
  year INTEGER,
  museum TEXT,
  museum_city TEXT,
  museum_country TEXT,
  medium TEXT,
  dimensions TEXT,
  period TEXT,
  style TEXT,
  description TEXT,
  image_url TEXT,
  curatorial_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  public_views INTEGER
) AS $$
BEGIN
  -- Increment view count
  UPDATE artworks SET public_views = COALESCE(public_views, 0) + 1
  WHERE share_token = p_token AND is_public = true;

  -- Return artwork data
  RETURN QUERY
  SELECT
    a.id, a.title, a.artist, a.year, a.museum, a.museum_city, a.museum_country,
    a.medium, a.dimensions, a.period, a.style, a.description, a.image_url,
    a.curatorial_note, a.created_at, a.public_views
  FROM artworks a
  WHERE a.share_token = p_token AND a.is_public = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS policy for public artworks (allow anyone to read public artworks)
CREATE POLICY "Public artworks are viewable by everyone" ON artworks
  FOR SELECT
  USING (is_public = true);

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION make_artwork_public(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION make_artwork_private(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_public_artwork(TEXT) TO anon, authenticated;
