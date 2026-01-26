-- Add additional columns to museums table
ALTER TABLE museums ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE museums ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE museums ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);
ALTER TABLE museums ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE museums ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE museums ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE museums ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create indexes for geolocation queries
CREATE INDEX IF NOT EXISTS museums_location_idx ON museums(latitude, longitude);

-- Add is_favorite column to artworks if not exists
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS artworks_favorite_idx ON artworks(user_id, is_favorite) WHERE is_favorite = true;

-- Clear existing museums and insert comprehensive list
TRUNCATE TABLE museums CASCADE;

-- Insert 100+ world-renowned museums with complete data
INSERT INTO museums (name, aliases, city, country, address, latitude, longitude, website, description) VALUES

-- FRANCE
('Musée du Louvre', ARRAY['Louvre', 'Le Louvre', 'louvre'], 'Paris', 'France', 'Rue de Rivoli, 75001 Paris', 48.8606, 2.3376, 'https://www.louvre.fr', 'Le plus grand musée d''art du monde, abritant la Joconde et la Vénus de Milo.'),
('Musée d''Orsay', ARRAY['Orsay', 'orsay', 'Musee d''Orsay'], 'Paris', 'France', '1 Rue de la Légion d''Honneur, 75007 Paris', 48.8600, 2.3266, 'https://www.musee-orsay.fr', 'Musée dédié à l''art impressionniste et post-impressionniste.'),
('Centre Pompidou', ARRAY['Pompidou', 'Beaubourg', 'Centre Georges Pompidou'], 'Paris', 'France', 'Place Georges-Pompidou, 75004 Paris', 48.8607, 2.3524, 'https://www.centrepompidou.fr', 'Centre national d''art et de culture, art moderne et contemporain.'),
('Musée de l''Orangerie', ARRAY['Orangerie', 'orangerie'], 'Paris', 'France', 'Jardin des Tuileries, 75001 Paris', 48.8637, 2.3226, 'https://www.musee-orangerie.fr', 'Écrin des Nymphéas de Monet et collection Walter-Guillaume.'),
('Musée Rodin', ARRAY['Rodin', 'rodin museum'], 'Paris', 'France', '77 Rue de Varenne, 75007 Paris', 48.8553, 2.3158, 'https://www.musee-rodin.fr', 'Musée dédié à l''œuvre du sculpteur Auguste Rodin.'),
('Musée Picasso', ARRAY['Picasso Paris', 'picasso'], 'Paris', 'France', '5 Rue de Thorigny, 75003 Paris', 48.8596, 2.3625, 'https://www.museepicassoparis.fr', 'Plus grande collection d''œuvres de Pablo Picasso.'),
('Grand Palais', ARRAY['grand palais', 'Grand Palais Paris'], 'Paris', 'France', '3 Avenue du Général Eisenhower, 75008 Paris', 48.8661, 2.3125, 'https://www.grandpalais.fr', 'Monument historique accueillant des expositions majeures.'),
('Musée du quai Branly', ARRAY['Quai Branly', 'branly'], 'Paris', 'France', '37 Quai Branly, 75007 Paris', 48.8611, 2.2977, 'https://www.quaibranly.fr', 'Arts et civilisations d''Afrique, d''Asie, d''Océanie et des Amériques.'),
('Petit Palais', ARRAY['petit palais', 'Musée des Beaux-Arts de la Ville de Paris'], 'Paris', 'France', 'Avenue Winston Churchill, 75008 Paris', 48.8660, 2.3141, 'https://www.petitpalais.paris.fr', 'Musée des beaux-arts de la Ville de Paris.'),
('Musée Marmottan Monet', ARRAY['Marmottan', 'marmottan monet'], 'Paris', 'France', '2 Rue Louis Boilly, 75016 Paris', 48.8579, 2.2669, 'https://www.marmottan.fr', 'Plus grande collection d''œuvres de Claude Monet.'),
('Musée de Cluny', ARRAY['Cluny', 'Musée national du Moyen Âge'], 'Paris', 'France', '28 Rue du Sommerard, 75005 Paris', 48.8508, 2.3440, 'https://www.musee-moyenage.fr', 'Art et histoire du Moyen Âge, abrite la Dame à la licorne.'),
('Palais de Tokyo', ARRAY['palais tokyo', 'Tokyo Paris'], 'Paris', 'France', '13 Avenue du Président Wilson, 75116 Paris', 48.8640, 2.2970, 'https://www.palaisdetokyo.com', 'Centre d''art contemporain.'),
('Fondation Louis Vuitton', ARRAY['Louis Vuitton', 'FLV'], 'Paris', 'France', '8 Avenue du Mahatma Gandhi, 75116 Paris', 48.8805, 2.2649, 'https://www.fondationlouisvuitton.fr', 'Musée d''art moderne et contemporain.'),
('Musée Carnavalet', ARRAY['Carnavalet', 'carnavalet'], 'Paris', 'France', '16 Rue des Francs Bourgeois, 75003 Paris', 48.8573, 2.3621, 'https://www.carnavalet.paris.fr', 'Musée de l''histoire de Paris.'),
('Musée des Arts Décoratifs', ARRAY['Arts Décoratifs', 'MAD Paris'], 'Paris', 'France', '107 Rue de Rivoli, 75001 Paris', 48.8628, 2.3335, 'https://madparis.fr', 'Arts décoratifs, mode et publicité.'),

-- FRANCE (autres villes)
('Musée des Beaux-Arts de Lyon', ARRAY['MBA Lyon', 'Beaux-Arts Lyon'], 'Lyon', 'France', '20 Place des Terreaux, 69001 Lyon', 45.7676, 4.8344, 'https://www.mba-lyon.fr', 'L''un des plus importants musées français.'),
('MuCEM', ARRAY['mucem', 'Musée des Civilisations'], 'Marseille', 'France', '7 Promenade Robert Laffont, 13002 Marseille', 43.2966, 5.3606, 'https://www.mucem.org', 'Civilisations de l''Europe et de la Méditerranée.'),
('Musée Unterlinden', ARRAY['Unterlinden', 'Colmar museum'], 'Colmar', 'France', 'Place Unterlinden, 68000 Colmar', 48.0801, 7.3557, 'https://www.musee-unterlinden.com', 'Retable d''Issenheim de Grünewald.'),
('Musée Fabre', ARRAY['Fabre', 'fabre montpellier'], 'Montpellier', 'France', '39 Boulevard Bonne Nouvelle, 34000 Montpellier', 43.6114, 3.8780, 'https://museefabre.montpellier3m.fr', 'L''un des plus riches musées de province.'),
('Musée des Beaux-Arts de Bordeaux', ARRAY['MBA Bordeaux'], 'Bordeaux', 'France', '20 Cours d''Albret, 33000 Bordeaux', 44.8372, -0.5791, 'https://www.musba-bordeaux.fr', 'Peintures du XVe au XXe siècle.'),

-- ITALIE
('Galleria degli Uffizi', ARRAY['Uffizi', 'uffizi', 'Uffizi Gallery'], 'Florence', 'Italy', 'Piazzale degli Uffizi, 50122 Firenze', 43.7677, 11.2553, 'https://www.uffizi.it', 'L''une des plus anciennes galeries d''art du monde.'),
('Musei Vaticani', ARRAY['Vatican Museums', 'Musées du Vatican', 'vatican'], 'Vatican City', 'Vatican', 'Viale Vaticano, 00165 Roma', 41.9065, 12.4536, 'https://www.museivaticani.va', 'Chapelle Sixtine et immenses collections pontificales.'),
('Galleria Borghese', ARRAY['Borghese', 'Villa Borghese museum'], 'Rome', 'Italy', 'Piazzale Scipione Borghese, 5, 00197 Roma', 41.9143, 12.4920, 'https://galleriaborghese.beniculturali.it', 'Chefs-d''œuvre de Bernin et Caravage.'),
('Gallerie dell''Accademia', ARRAY['Accademia Venice', 'accademia venezia'], 'Venice', 'Italy', 'Campo della Carità, 1050, 30123 Venezia', 45.4314, 12.3277, 'https://www.gallerieaccademia.it', 'Art vénitien du XIVe au XVIIIe siècle.'),
('Pinacoteca di Brera', ARRAY['Brera', 'brera milan'], 'Milan', 'Italy', 'Via Brera, 28, 20121 Milano', 45.4721, 9.1880, 'https://pinacotecabrera.org', 'Collection majeure de peinture italienne.'),
('Museo Nazionale del Bargello', ARRAY['Bargello', 'bargello florence'], 'Florence', 'Italy', 'Via del Proconsolo, 4, 50122 Firenze', 43.7707, 11.2582, 'https://www.bargellomusei.beniculturali.it', 'Sculptures de la Renaissance, Donatello, Michel-Ange.'),
('Galleria Nazionale d''Arte Moderna', ARRAY['GNAM Rome', 'arte moderna roma'], 'Rome', 'Italy', 'Viale delle Belle Arti, 131, 00196 Roma', 41.9169, 12.4822, 'https://lagallerianazionale.com', 'Art moderne et contemporain italien.'),
('Museo di Capodimonte', ARRAY['Capodimonte', 'capodimonte naples'], 'Naples', 'Italy', 'Via Miano, 2, 80131 Napoli', 40.8677, 14.2503, 'https://www.museocapodimonte.beniculturali.it', 'L''un des plus grands musées d''Italie.'),
('Palazzo Pitti', ARRAY['Pitti', 'pitti palace'], 'Florence', 'Italy', 'Piazza de'' Pitti, 1, 50125 Firenze', 43.7652, 11.2500, 'https://www.uffizi.it/palazzo-pitti', 'Ancien palais des Médicis, plusieurs musées.'),
('Museo Egizio', ARRAY['Egyptian Museum Turin', 'egizio torino'], 'Turin', 'Italy', 'Via Accademia delle Scienze, 6, 10123 Torino', 45.0688, 7.6843, 'https://museoegizio.it', 'Plus importante collection égyptienne hors d''Égypte.'),

-- ESPAGNE
('Museo del Prado', ARRAY['Prado', 'prado', 'El Prado'], 'Madrid', 'Spain', 'Calle de Ruiz de Alarcón, 23, 28014 Madrid', 40.4138, -3.6921, 'https://www.museodelprado.es', 'L''un des plus grands musées d''art du monde.'),
('Museo Nacional Centro de Arte Reina Sofía', ARRAY['Reina Sofia', 'reina sofía', 'MNCARS'], 'Madrid', 'Spain', 'Calle de Santa Isabel, 52, 28012 Madrid', 40.4087, -3.6942, 'https://www.museoreinasofia.es', 'Art moderne espagnol, Guernica de Picasso.'),
('Museo Thyssen-Bornemisza', ARRAY['Thyssen', 'thyssen'], 'Madrid', 'Spain', 'Paseo del Prado, 8, 28014 Madrid', 40.4161, -3.6949, 'https://www.museothyssen.org', 'Collection privée exceptionnelle.'),
('Museo Picasso Málaga', ARRAY['Picasso Malaga', 'picasso málaga'], 'Málaga', 'Spain', 'Palacio de Buenavista, C. San Agustín, 8, 29015 Málaga', 36.7214, -4.4188, 'https://www.museopicassomalaga.org', 'Œuvres de Picasso dans sa ville natale.'),
('Museo Guggenheim Bilbao', ARRAY['Guggenheim Bilbao', 'bilbao'], 'Bilbao', 'Spain', 'Abandoibarra Etorb., 2, 48009 Bilbo', 43.2687, -2.9340, 'https://www.guggenheim-bilbao.eus', 'Architecture emblématique de Frank Gehry.'),
('Museo Nacional d''Art de Catalunya', ARRAY['MNAC', 'mnac barcelona'], 'Barcelona', 'Spain', 'Palau Nacional, Parc de Montjuïc, 08038 Barcelona', 41.3685, 2.1535, 'https://www.museunacional.cat', 'Art catalan du roman au XXe siècle.'),
('Fundació Joan Miró', ARRAY['Miró', 'miro barcelona'], 'Barcelona', 'Spain', 'Parc de Montjuïc, 08038 Barcelona', 41.3687, 2.1599, 'https://www.fmirobcn.org', 'Œuvres de Joan Miró.'),
('Museo de Bellas Artes de Sevilla', ARRAY['Bellas Artes Sevilla'], 'Seville', 'Spain', 'Pl. del Museo, 9, 41001 Sevilla', 37.3926, -5.9979, 'https://www.museosdeandalucia.es', 'Art sévillan et peinture espagnole.'),

-- ROYAUME-UNI
('British Museum', ARRAY['british museum', 'BM London'], 'London', 'UK', 'Great Russell St, London WC1B 3DG', 51.5194, -0.1269, 'https://www.britishmuseum.org', 'Histoire et culture humaine, Pierre de Rosette.'),
('National Gallery', ARRAY['national gallery london', 'NG London'], 'London', 'UK', 'Trafalgar Square, London WC2N 5DN', 51.5089, -0.1283, 'https://www.nationalgallery.org.uk', 'Peinture européenne du XIIIe au XIXe siècle.'),
('Tate Modern', ARRAY['Tate', 'tate modern'], 'London', 'UK', 'Bankside, London SE1 9TG', 51.5076, -0.0994, 'https://www.tate.org.uk/visit/tate-modern', 'Art moderne et contemporain international.'),
('Tate Britain', ARRAY['Tate Britain', 'tate britain'], 'London', 'UK', 'Millbank, London SW1P 4RG', 51.4910, -0.1278, 'https://www.tate.org.uk/visit/tate-britain', 'Art britannique du XVIe siècle à nos jours.'),
('Victoria and Albert Museum', ARRAY['V&A', 'V and A', 'victoria albert'], 'London', 'UK', 'Cromwell Rd, London SW7 2RL', 51.4966, -0.1722, 'https://www.vam.ac.uk', 'Arts décoratifs et design.'),
('Natural History Museum', ARRAY['NHM London', 'natural history'], 'London', 'UK', 'Cromwell Rd, London SW7 5BD', 51.4967, -0.1764, 'https://www.nhm.ac.uk', 'Sciences naturelles et histoire naturelle.'),
('National Portrait Gallery', ARRAY['NPG London', 'portrait gallery'], 'London', 'UK', 'St Martin''s Pl, London WC2H 0HE', 51.5094, -0.1281, 'https://www.npg.org.uk', 'Portraits de personnalités britanniques.'),
('Royal Academy of Arts', ARRAY['RA London', 'Royal Academy'], 'London', 'UK', 'Burlington House, Piccadilly, London W1J 0BD', 51.5092, -0.1395, 'https://www.royalacademy.org.uk', 'Expositions d''art et académie.'),
('Courtauld Gallery', ARRAY['Courtauld', 'courtauld'], 'London', 'UK', 'Somerset House, Strand, London WC2R 0RN', 51.5108, -0.1172, 'https://courtauld.ac.uk/gallery', 'Impressionnisme et post-impressionnisme.'),
('Scottish National Gallery', ARRAY['SNG Edinburgh', 'scottish gallery'], 'Edinburgh', 'UK', 'The Mound, Edinburgh EH2 2EL', 55.9508, -3.1959, 'https://www.nationalgalleries.org', 'Art écossais et européen.'),

-- PAYS-BAS
('Rijksmuseum', ARRAY['rijks', 'Rijks Museum', 'rijksmuseum amsterdam'], 'Amsterdam', 'Netherlands', 'Museumstraat 1, 1071 XX Amsterdam', 52.3600, 4.8852, 'https://www.rijksmuseum.nl', 'Chefs-d''œuvre hollandais, La Ronde de nuit.'),
('Van Gogh Museum', ARRAY['Van Gogh', 'vangogh', 'van gogh amsterdam'], 'Amsterdam', 'Netherlands', 'Museumplein 6, 1071 DJ Amsterdam', 52.3584, 4.8811, 'https://www.vangoghmuseum.nl', 'Plus grande collection Van Gogh au monde.'),
('Stedelijk Museum', ARRAY['Stedelijk', 'stedelijk amsterdam'], 'Amsterdam', 'Netherlands', 'Museumplein 10, 1071 DJ Amsterdam', 52.3580, 4.8799, 'https://www.stedelijk.nl', 'Art moderne et contemporain.'),
('Mauritshuis', ARRAY['mauritshuis', 'Mauritshuis Den Haag'], 'The Hague', 'Netherlands', 'Plein 29, 2511 CS Den Haag', 52.0803, 4.3143, 'https://www.mauritshuis.nl', 'La Jeune Fille à la perle de Vermeer.'),
('Museum Boijmans Van Beuningen', ARRAY['Boijmans', 'boijmans rotterdam'], 'Rotterdam', 'Netherlands', 'Museumpark 18-20, 3015 CX Rotterdam', 51.9149, 4.4728, 'https://www.boijmans.nl', 'Art européen du Moyen Âge au XXIe siècle.'),
('Kröller-Müller Museum', ARRAY['Kröller-Müller', 'kroller muller'], 'Otterlo', 'Netherlands', 'Houtkampweg 6, 6731 AW Otterlo', 52.0956, 5.8167, 'https://krollermuller.nl', 'Van Gogh et jardin de sculptures.'),

-- ALLEMAGNE
('Gemäldegalerie', ARRAY['Gemaldegalerie', 'gemaldegalerie berlin'], 'Berlin', 'Germany', 'Matthäikirchplatz, 10785 Berlin', 52.5086, 13.3661, 'https://www.smb.museum', 'Peinture européenne du XIIIe au XVIIIe siècle.'),
('Alte Nationalgalerie', ARRAY['Alte Nationalgalerie', 'nationalgalerie berlin'], 'Berlin', 'Germany', 'Bodestraße 1-3, 10178 Berlin', 52.5209, 13.3988, 'https://www.smb.museum', 'Art du XIXe siècle.'),
('Neues Museum', ARRAY['Neues Museum', 'neues museum berlin'], 'Berlin', 'Germany', 'Bodestraße 1-3, 10178 Berlin', 52.5202, 13.3978, 'https://www.smb.museum', 'Buste de Néfertiti.'),
('Pergamonmuseum', ARRAY['Pergamon', 'pergamon museum'], 'Berlin', 'Germany', 'Bodestraße 1-3, 10178 Berlin', 52.5212, 13.3969, 'https://www.smb.museum', 'Antiquités et art islamique.'),
('Hamburger Kunsthalle', ARRAY['Kunsthalle Hamburg', 'kunsthalle'], 'Hamburg', 'Germany', 'Glockengießerwall 5, 20095 Hamburg', 53.5530, 10.0027, 'https://www.hamburger-kunsthalle.de', 'Art du Moyen Âge à aujourd''hui.'),
('Alte Pinakothek', ARRAY['Alte Pinakothek', 'pinakothek munich'], 'Munich', 'Germany', 'Barer Str. 27, 80333 München', 48.1482, 11.5700, 'https://www.pinakothek.de', 'Maîtres anciens européens.'),
('Neue Pinakothek', ARRAY['Neue Pinakothek', 'neue pinakothek munich'], 'Munich', 'Germany', 'Barer Str. 29, 80799 München', 48.1498, 11.5701, 'https://www.pinakothek.de', 'Art du XVIIIe au début du XXe siècle.'),
('Pinakothek der Moderne', ARRAY['Pinakothek Moderne', 'moderne munich'], 'Munich', 'Germany', 'Barer Str. 40, 80333 München', 48.1472, 11.5722, 'https://www.pinakothek.de', 'Art moderne et contemporain, design.'),
('Städel Museum', ARRAY['Stadel', 'städel frankfurt'], 'Frankfurt', 'Germany', 'Dürerstraße 2, 60596 Frankfurt am Main', 50.1050, 8.6719, 'https://www.staedelmuseum.de', '700 ans d''art européen.'),
('Museum Ludwig', ARRAY['Ludwig', 'ludwig cologne'], 'Cologne', 'Germany', 'Heinrich-Böll-Platz, 50667 Köln', 50.9405, 6.9581, 'https://www.museum-ludwig.de', 'Art moderne et contemporain, Pop Art.'),

-- AUTRICHE
('Kunsthistorisches Museum', ARRAY['KHM Vienna', 'kunsthistorisches'], 'Vienna', 'Austria', 'Maria-Theresien-Platz, 1010 Wien', 48.2036, 16.3613, 'https://www.khm.at', 'Collections impériales des Habsbourg.'),
('Belvedere', ARRAY['Belvedere Vienna', 'belvedere wien'], 'Vienna', 'Austria', 'Prinz Eugen-Straße 27, 1030 Wien', 48.1915, 16.3805, 'https://www.belvedere.at', 'Le Baiser de Klimt.'),
('Albertina', ARRAY['Albertina Vienna', 'albertina wien'], 'Vienna', 'Austria', 'Albertinaplatz 1, 1010 Wien', 48.2047, 16.3682, 'https://www.albertina.at', 'Dessins et estampes, Monet à Picasso.'),
('Leopold Museum', ARRAY['Leopold', 'leopold vienna'], 'Vienna', 'Austria', 'Museumsplatz 1, 1070 Wien', 48.2033, 16.3586, 'https://www.leopoldmuseum.org', 'Art autrichien, Schiele et Klimt.'),
('mumok', ARRAY['mumok vienna', 'Museum moderner Kunst'], 'Vienna', 'Austria', 'Museumsplatz 1, 1070 Wien', 48.2035, 16.3577, 'https://www.mumok.at', 'Art moderne et contemporain.'),

-- SUISSE
('Kunsthaus Zürich', ARRAY['Kunsthaus', 'kunsthaus zurich'], 'Zurich', 'Switzerland', 'Heimplatz 1, 8001 Zürich', 47.3703, 8.5480, 'https://www.kunsthaus.ch', 'Plus important musée d''art de Suisse.'),
('Fondation Beyeler', ARRAY['Beyeler', 'beyeler basel'], 'Basel', 'Switzerland', 'Baselstrasse 101, 4125 Riehen', 47.5906, 7.6481, 'https://www.fondationbeyeler.ch', 'Art moderne et contemporain.'),
('Kunstmuseum Basel', ARRAY['Kunstmuseum Basel', 'basel museum'], 'Basel', 'Switzerland', 'St. Alban-Graben 16, 4051 Basel', 47.5544, 7.5943, 'https://www.kunstmuseumbasel.ch', 'L''un des plus anciens musées publics.'),

-- BELGIQUE
('Musées royaux des Beaux-Arts de Belgique', ARRAY['MRBAB', 'Beaux-Arts Bruxelles'], 'Brussels', 'Belgium', 'Rue de la Régence 3, 1000 Bruxelles', 50.8419, 4.3579, 'https://www.fine-arts-museum.be', 'Art ancien et moderne.'),
('Musée Magritte', ARRAY['Magritte', 'magritte brussels'], 'Brussels', 'Belgium', 'Rue de la Régence 3, 1000 Bruxelles', 50.8419, 4.3579, 'https://www.musee-magritte-museum.be', 'Plus grande collection Magritte.'),
('MAS Antwerp', ARRAY['MAS', 'mas antwerp'], 'Antwerp', 'Belgium', 'Hanzestedenplaats 1, 2000 Antwerpen', 51.2290, 4.4047, 'https://www.mas.be', 'Musée aan de Stroom.'),
('Musée royal des Beaux-Arts d''Anvers', ARRAY['KMSKA', 'kmska antwerp'], 'Antwerp', 'Belgium', 'Leopold de Waelplaats 2, 2000 Antwerpen', 51.2079, 4.3955, 'https://www.kmska.be', 'Rubens et maîtres flamands.'),

-- ÉTATS-UNIS
('The Metropolitan Museum of Art', ARRAY['Met', 'MET', 'Metropolitan', 'Met Museum'], 'New York', 'USA', '1000 5th Ave, New York, NY 10028', 40.7794, -73.9632, 'https://www.metmuseum.org', 'L''un des plus grands musées du monde.'),
('Museum of Modern Art', ARRAY['MoMA', 'MOMA', 'moma', 'Modern Art Museum'], 'New York', 'USA', '11 W 53rd St, New York, NY 10019', 40.7614, -73.9776, 'https://www.moma.org', 'Art moderne et contemporain.'),
('Solomon R. Guggenheim Museum', ARRAY['Guggenheim', 'Guggenheim NY'], 'New York', 'USA', '1071 5th Ave, New York, NY 10128', 40.7830, -73.9590, 'https://www.guggenheim.org', 'Architecture de Frank Lloyd Wright.'),
('Whitney Museum of American Art', ARRAY['Whitney', 'whitney museum'], 'New York', 'USA', '99 Gansevoort St, New York, NY 10014', 40.7396, -74.0089, 'https://whitney.org', 'Art américain du XXe et XXIe siècle.'),
('The Frick Collection', ARRAY['Frick', 'frick collection'], 'New York', 'USA', '1 E 70th St, New York, NY 10021', 40.7711, -73.9673, 'https://www.frick.org', 'Maîtres anciens dans un hôtel particulier.'),
('Brooklyn Museum', ARRAY['Brooklyn', 'brooklyn museum'], 'New York', 'USA', '200 Eastern Pkwy, Brooklyn, NY 11238', 40.6713, -73.9637, 'https://www.brooklynmuseum.org', 'Art égyptien et contemporain.'),
('National Gallery of Art', ARRAY['NGA Washington', 'National Gallery DC'], 'Washington DC', 'USA', '6th & Constitution Ave NW, Washington, DC 20565', 38.8913, -77.0199, 'https://www.nga.gov', 'L''une des plus grandes galeries d''art.'),
('Smithsonian American Art Museum', ARRAY['SAAM', 'Smithsonian Art'], 'Washington DC', 'USA', 'F St NW &, 8th St NW, Washington, DC 20004', 38.8979, -77.0230, 'https://americanart.si.edu', 'Art américain.'),
('Art Institute of Chicago', ARRAY['AIC', 'Art Institute'], 'Chicago', 'USA', '111 S Michigan Ave, Chicago, IL 60603', 41.8796, -87.6237, 'https://www.artic.edu', 'Impressionnisme et art américain.'),
('Los Angeles County Museum of Art', ARRAY['LACMA', 'lacma'], 'Los Angeles', 'USA', '5905 Wilshire Blvd, Los Angeles, CA 90036', 34.0639, -118.3592, 'https://www.lacma.org', 'Plus grand musée d''art de l''ouest américain.'),
('Getty Center', ARRAY['Getty', 'getty museum'], 'Los Angeles', 'USA', '1200 Getty Center Dr, Los Angeles, CA 90049', 34.0780, -118.4741, 'https://www.getty.edu', 'Art européen et photographies.'),
('Museum of Fine Arts Boston', ARRAY['MFA Boston', 'mfa'], 'Boston', 'USA', '465 Huntington Ave, Boston, MA 02115', 42.3394, -71.0940, 'https://www.mfa.org', 'L''une des plus grandes collections américaines.'),
('Philadelphia Museum of Art', ARRAY['PMA', 'philadelphia museum'], 'Philadelphia', 'USA', '2600 Benjamin Franklin Pkwy, Philadelphia, PA 19130', 39.9656, -75.1810, 'https://philamuseum.org', 'Art européen et américain.'),
('San Francisco Museum of Modern Art', ARRAY['SFMOMA', 'sfmoma'], 'San Francisco', 'USA', '151 3rd St, San Francisco, CA 94103', 37.7857, -122.4011, 'https://www.sfmoma.org', 'Art moderne et contemporain.'),
('Cleveland Museum of Art', ARRAY['CMA Cleveland', 'cleveland museum'], 'Cleveland', 'USA', '11150 East Blvd, Cleveland, OH 44106', 41.5090, -81.6121, 'https://www.clevelandart.org', 'Collections encyclopédiques.'),
('Detroit Institute of Arts', ARRAY['DIA', 'detroit museum'], 'Detroit', 'USA', '5200 Woodward Ave, Detroit, MI 48202', 42.3594, -83.0645, 'https://www.dia.org', 'Murales de Diego Rivera.'),

-- CANADA
('Musée des beaux-arts de Montréal', ARRAY['MBAM', 'Montreal Museum'], 'Montreal', 'Canada', '1380 Rue Sherbrooke O, Montréal, QC H3G 1J5', 45.4986, -73.5795, 'https://www.mbam.qc.ca', 'Plus ancien musée canadien.'),
('Art Gallery of Ontario', ARRAY['AGO', 'ago toronto'], 'Toronto', 'Canada', '317 Dundas St W, Toronto, ON M5T 1G4', 43.6536, -79.3925, 'https://ago.ca', 'Art canadien et européen.'),
('National Gallery of Canada', ARRAY['NGC', 'national gallery ottawa'], 'Ottawa', 'Canada', '380 Sussex Dr, Ottawa, ON K1N 9N4', 45.4295, -75.6989, 'https://www.gallery.ca', 'Art canadien et international.'),

-- RUSSIE
('Musée de l''Ermitage', ARRAY['Hermitage', 'Ermitage', 'hermitage'], 'Saint Petersburg', 'Russia', 'Palace Square, 2, St Petersburg', 59.9398, 30.3146, 'https://www.hermitagemuseum.org', 'L''un des plus grands musées du monde.'),
('Musée Pouchkine', ARRAY['Pushkin Museum', 'pouchkine'], 'Moscow', 'Russia', 'Ulitsa Volkhonka, 12, Moscow', 55.7471, 37.6051, 'https://pushkinmuseum.art', 'Art européen à Moscou.'),
('Galerie Tretiakov', ARRAY['Tretyakov', 'tretiakov'], 'Moscow', 'Russia', 'Lavrushinsky Ln, 10, Moscow', 55.7415, 37.6208, 'https://www.tretyakovgallery.ru', 'Art russe du XIe au XXe siècle.'),

-- JAPON
('Tokyo National Museum', ARRAY['TNM', 'tokyo museum'], 'Tokyo', 'Japan', '13-9 Uenokoen, Taito City, Tokyo 110-8712', 35.7189, 139.7765, 'https://www.tnm.jp', 'Art et archéologie japonais.'),
('National Museum of Western Art', ARRAY['NMWA Tokyo', 'western art tokyo'], 'Tokyo', 'Japan', '7-7 Uenokoen, Taito City, Tokyo 110-0007', 35.7153, 139.7758, 'https://www.nmwa.go.jp', 'Art occidental au Japon.'),
('Mori Art Museum', ARRAY['Mori', 'mori tokyo'], 'Tokyo', 'Japan', '6 Chome-10-1 Roppongi, Minato City, Tokyo 106-6150', 35.6602, 139.7293, 'https://www.mori.art.museum', 'Art contemporain.'),
('21st Century Museum of Contemporary Art', ARRAY['21st Century Kanazawa', 'kanazawa museum'], 'Kanazawa', 'Japan', '1-2-1 Hirosaka, Kanazawa, Ishikawa 920-8509', 36.5608, 136.6565, 'https://www.kanazawa21.jp', 'Art contemporain.'),

-- CHINE
('National Museum of China', ARRAY['NMC Beijing', 'national museum beijing'], 'Beijing', 'China', '16 E Chang''an Ave, Dongcheng, Beijing', 39.9042, 116.3912, 'http://en.chnmuseum.cn', 'Histoire et art chinois.'),
('Palace Museum', ARRAY['Forbidden City', 'Palace Museum Beijing'], 'Beijing', 'China', '4 Jingshan Front St, Dongcheng, Beijing', 39.9163, 116.3972, 'https://en.dpm.org.cn', 'Cité Interdite, art impérial.'),
('Shanghai Museum', ARRAY['shanghai museum'], 'Shanghai', 'China', '201 Renmin Ave, Huangpu, Shanghai', 31.2286, 121.4738, 'https://www.shanghaimuseum.net', 'Art et artisanat chinois.'),

-- AUSTRALIE
('National Gallery of Victoria', ARRAY['NGV', 'ngv melbourne'], 'Melbourne', 'Australia', '180 St Kilda Rd, Melbourne VIC 3006', -37.8226, 144.9689, 'https://www.ngv.vic.gov.au', 'Plus ancien musée d''Australie.'),
('Art Gallery of New South Wales', ARRAY['AGNSW', 'agnsw sydney'], 'Sydney', 'Australia', 'Art Gallery Rd, Sydney NSW 2000', -33.8688, 151.2170, 'https://www.artgallery.nsw.gov.au', 'Art australien et international.'),
('Museum of Contemporary Art Australia', ARRAY['MCA Sydney', 'mca australia'], 'Sydney', 'Australia', '140 George St, The Rocks NSW 2000', -33.8599, 151.2090, 'https://www.mca.com.au', 'Art contemporain.'),

-- MEXIQUE
('Museo Nacional de Antropología', ARRAY['MNA Mexico', 'antropologia mexico'], 'Mexico City', 'Mexico', 'Av. Paseo de la Reforma s/n, Chapultepec Polanco', 19.4260, -99.1863, 'https://www.mna.inah.gob.mx', 'Civilisations préhispaniques.'),
('Museo Frida Kahlo', ARRAY['Casa Azul', 'Frida Kahlo'], 'Mexico City', 'Mexico', 'Londres 247, Del Carmen, Coyoacán', 19.3550, -99.1625, 'https://www.museofridakahlo.org.mx', 'Maison-musée de Frida Kahlo.'),
('Museo Soumaya', ARRAY['Soumaya', 'soumaya'], 'Mexico City', 'Mexico', 'Blvd. Miguel de Cervantes Saavedra, Granada', 19.4403, -99.2046, 'https://www.soumaya.com.mx', 'Art européen et mexicain.'),

-- BRÉSIL
('Museu de Arte de São Paulo', ARRAY['MASP', 'masp'], 'São Paulo', 'Brazil', 'Av. Paulista, 1578 - Bela Vista, São Paulo', -23.5614, -46.6558, 'https://masp.org.br', 'Plus important musée d''Amérique latine.'),
('Pinacoteca do Estado de São Paulo', ARRAY['Pinacoteca', 'pinacoteca sp'], 'São Paulo', 'Brazil', 'Praça da Luz, 2 - Luz, São Paulo', -23.5342, -46.6334, 'https://pinacoteca.org.br', 'Art brésilien du XIXe siècle.'),

-- AUTRES
('Museo Nacional de Bellas Artes', ARRAY['MNBA Buenos Aires', 'bellas artes buenos aires'], 'Buenos Aires', 'Argentina', 'Av. del Libertador 1473, Buenos Aires', -34.5837, -58.3935, 'https://www.bellasartes.gob.ar', 'Art argentin et international.'),
('National Museum of Korea', ARRAY['NMK Seoul', 'korea museum'], 'Seoul', 'South Korea', '137 Seobinggo-ro, Yongsan-gu, Seoul', 37.5239, 126.9806, 'https://www.museum.go.kr', 'Art et histoire coréens.'),
('Israel Museum', ARRAY['israel museum jerusalem'], 'Jerusalem', 'Israel', 'Derech Ruppin 11, Jerusalem', 31.7741, 35.2042, 'https://www.imj.org.il', 'Manuscrits de la mer Morte.'),
('Museo Nacional del Prado', ARRAY['prado', 'Prado'], 'Madrid', 'Spain', 'C. de Ruiz de Alarcón, 23, 28014 Madrid', 40.4138, -3.6921, 'https://www.museodelprado.es', 'L''un des plus grands musées d''art du monde.');

-- Function to match museum from AI response
CREATE OR REPLACE FUNCTION match_museum_from_text(
  p_museum_name TEXT,
  p_city TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_museum_id UUID;
  v_search_name TEXT := LOWER(TRIM(COALESCE(p_museum_name, '')));
  v_search_city TEXT := LOWER(TRIM(COALESCE(p_city, '')));
BEGIN
  IF v_search_name = '' THEN
    RETURN NULL;
  END IF;

  -- Try exact name match first
  SELECT id INTO v_museum_id
  FROM museums
  WHERE LOWER(name) = v_search_name
  LIMIT 1;

  IF v_museum_id IS NOT NULL THEN
    RETURN v_museum_id;
  END IF;

  -- Try alias match
  SELECT id INTO v_museum_id
  FROM museums
  WHERE v_search_name = ANY(SELECT LOWER(unnest(aliases)))
  LIMIT 1;

  IF v_museum_id IS NOT NULL THEN
    RETURN v_museum_id;
  END IF;

  -- Try partial name match with city
  IF v_search_city != '' THEN
    SELECT id INTO v_museum_id
    FROM museums
    WHERE LOWER(city) = v_search_city
      AND (LOWER(name) LIKE '%' || v_search_name || '%' OR v_search_name LIKE '%' || LOWER(name) || '%')
    LIMIT 1;

    IF v_museum_id IS NOT NULL THEN
      RETURN v_museum_id;
    END IF;
  END IF;

  -- Try partial name match without city
  SELECT id INTO v_museum_id
  FROM museums
  WHERE LOWER(name) LIKE '%' || v_search_name || '%'
     OR v_search_name LIKE '%' || LOWER(name) || '%'
  ORDER BY LENGTH(name)
  LIMIT 1;

  RETURN v_museum_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
