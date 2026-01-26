-- Create museums reference table
CREATE TABLE museums (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  aliases TEXT[] DEFAULT '{}',
  city TEXT,
  country TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour recherche rapide sur les aliases
CREATE INDEX museums_aliases_idx ON museums USING GIN(aliases);
CREATE INDEX museums_name_idx ON museums(LOWER(name));

-- Quelques musées de base
INSERT INTO museums (name, aliases, city, country) VALUES
('Museum of Modern Art', ARRAY['MoMA', 'MOMA', 'moma', 'Modern Art Museum'], 'New York', 'USA'),
('Musée du Louvre', ARRAY['Louvre', 'Le Louvre', 'louvre'], 'Paris', 'France'),
('Musée d''Orsay', ARRAY['Orsay', 'orsay', 'Musee d''Orsay'], 'Paris', 'France'),
('Van Gogh Museum', ARRAY['Van Gogh', 'vangogh'], 'Amsterdam', 'Netherlands'),
('The Metropolitan Museum of Art', ARRAY['Met', 'MET', 'Metropolitan', 'Met Museum'], 'New York', 'USA'),
('British Museum', ARRAY['british museum'], 'London', 'UK'),
('National Gallery', ARRAY['national gallery london'], 'London', 'UK'),
('Rijksmuseum', ARRAY['rijks', 'Rijks Museum'], 'Amsterdam', 'Netherlands'),
('Museo del Prado', ARRAY['Prado', 'prado', 'El Prado'], 'Madrid', 'Spain'),
('Galleria degli Uffizi', ARRAY['Uffizi', 'uffizi', 'Uffizi Gallery'], 'Florence', 'Italy');

-- RLS
ALTER TABLE museums ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Museums are viewable by everyone" ON museums FOR SELECT USING (true);

-- Add museum_id to artworks table
ALTER TABLE artworks ADD COLUMN museum_id UUID REFERENCES museums(id);
CREATE INDEX artworks_museum_id_idx ON artworks(museum_id);

-- Function to find or create a museum
CREATE OR REPLACE FUNCTION find_or_create_museum(
  p_name TEXT,
  p_city TEXT DEFAULT NULL,
  p_country TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_museum_id UUID;
  v_search_term TEXT := LOWER(TRIM(p_name));
BEGIN
  -- Chercher par nom exact ou alias
  SELECT id INTO v_museum_id
  FROM museums
  WHERE LOWER(name) = v_search_term
     OR v_search_term = ANY(SELECT LOWER(unnest(aliases)));

  -- Si pas trouvé, créer
  IF v_museum_id IS NULL THEN
    INSERT INTO museums (name, city, country, aliases)
    VALUES (p_name, p_city, p_country, ARRAY[LOWER(p_name)])
    RETURNING id INTO v_museum_id;
  END IF;

  RETURN v_museum_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
