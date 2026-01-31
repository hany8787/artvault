-- Add more international museums (UK, Spain, Italy) and French cathedrals
-- Migration: 20260131_add_museums_cathedrals.sql

-- UK Museums (beyond London)
INSERT INTO museums (name, aliases, city, country, address, latitude, longitude, website, description) VALUES
('Ashmolean Museum', ARRAY['Ashmolean', 'ashmolean oxford'], 'Oxford', 'UK', 'Beaumont St, Oxford OX1 2PH', 51.7554, -1.2600, 'https://www.ashmolean.org', 'Plus ancien musée public du monde, fondé en 1683.'),
('Fitzwilliam Museum', ARRAY['Fitzwilliam', 'fitzwilliam cambridge'], 'Cambridge', 'UK', 'Trumpington St, Cambridge CB2 1RB', 52.2002, 0.1191, 'https://www.fitzmuseum.cam.ac.uk', 'Art et antiquités de l''Université de Cambridge.'),
('Walker Art Gallery', ARRAY['Walker Gallery', 'walker liverpool'], 'Liverpool', 'UK', 'William Brown St, Liverpool L3 8EL', 53.4100, -2.9796, 'https://www.liverpoolmuseums.org.uk', 'Galerie nationale du Nord de l''Angleterre.'),
('Manchester Art Gallery', ARRAY['Manchester Gallery', 'manchester art'], 'Manchester', 'UK', 'Mosley St, Manchester M2 3JL', 53.4792, -2.2418, 'https://manchesterartgallery.org', 'Art préraphaélite et contemporain.'),
('Birmingham Museum and Art Gallery', ARRAY['BMAG', 'birmingham museum'], 'Birmingham', 'UK', 'Chamberlain Square, Birmingham B3 3DH', 52.4800, -1.9038, 'https://www.birminghammuseums.org.uk', 'Plus grande collection préraphaélite au monde.'),
('National Museum Cardiff', ARRAY['Cardiff Museum', 'amgueddfa cardiff'], 'Cardiff', 'UK', 'Cathays Park, Cardiff CF10 3NP', 51.4862, -3.1767, 'https://museum.wales', 'Art et histoire naturelle du Pays de Galles.'),
('Kelvingrove Art Gallery and Museum', ARRAY['Kelvingrove', 'glasgow museum'], 'Glasgow', 'UK', 'Argyle St, Glasgow G3 8AG', 55.8689, -4.2906, 'https://www.glasgowlife.org.uk', 'L''un des musées les plus visités du Royaume-Uni.'),
('National Galleries of Scotland', ARRAY['NGS', 'scottish galleries'], 'Edinburgh', 'UK', 'The Mound, Edinburgh EH2 2EL', 55.9508, -3.1959, 'https://www.nationalgalleries.org', 'Art écossais et international.'),
('Dulwich Picture Gallery', ARRAY['Dulwich', 'dulwich gallery'], 'London', 'UK', 'Gallery Rd, Dulwich Village, London SE21 7AD', 51.4458, -0.0859, 'https://www.dulwichpicturegallery.org.uk', 'Première galerie d''art publique d''Angleterre.'),
('Wallace Collection', ARRAY['Wallace', 'wallace london'], 'London', 'UK', 'Hertford House, Manchester Square, London W1U 3BN', 51.5173, -0.1530, 'https://www.wallacecollection.org', 'Arts décoratifs et peintures anciennes.'),
('Whitworth Art Gallery', ARRAY['Whitworth', 'whitworth manchester'], 'Manchester', 'UK', 'Oxford Rd, Manchester M15 6ER', 53.4590, -2.2337, 'https://www.whitworth.manchester.ac.uk', 'Art moderne et textiles.'),
('Yorkshire Sculpture Park', ARRAY['YSP', 'yorkshire sculpture'], 'Wakefield', 'UK', 'West Bretton, Wakefield WF4 4LG', 53.6108, -1.5747, 'https://ysp.org.uk', 'Parc de sculptures en plein air.'),
('Hepworth Wakefield', ARRAY['Hepworth', 'hepworth gallery'], 'Wakefield', 'UK', 'Gallery Walk, Wakefield WF1 5AW', 53.6800, -1.4973, 'https://hepworthwakefield.org', 'Art moderne britannique.'),
('Baltic Centre for Contemporary Art', ARRAY['Baltic', 'baltic gateshead'], 'Gateshead', 'UK', 'South Shore Rd, Gateshead NE8 3BA', 54.9690, -1.6000, 'https://baltic.art', 'Centre d''art contemporain.'),
('Turner Contemporary', ARRAY['Turner Margate', 'turner gallery'], 'Margate', 'UK', 'Rendezvous, Margate CT9 1HG', 51.3875, 1.3757, 'https://turnercontemporary.org', 'Art contemporain inspiré par Turner.'),

-- SPAIN - Additional museums
('Museo de Bellas Artes de Valencia', ARRAY['Bellas Artes Valencia', 'mba valencia'], 'Valencia', 'Spain', 'C/ de Sant Pius V, 9, 46010 València', 39.4785, -0.3687, 'https://www.museobellasartesvalencia.gva.es', 'Deuxième plus grande pinacothèque d''Espagne.'),
('Instituto Valenciano de Arte Moderno', ARRAY['IVAM', 'ivam valencia'], 'Valencia', 'Spain', 'C/ de Guillem de Castro, 118, 46003 València', 39.4792, -0.3855, 'https://www.ivam.es', 'Art moderne et contemporain.'),
('Museo Picasso Barcelona', ARRAY['Picasso Barcelona', 'picasso bcn'], 'Barcelona', 'Spain', 'Carrer Montcada, 15-23, 08003 Barcelona', 41.3853, 2.1808, 'https://www.museupicasso.bcn.cat', 'Période de formation de Picasso.'),
('MACBA', ARRAY['macba barcelona', 'Museu d''Art Contemporani'], 'Barcelona', 'Spain', 'Plaça dels Àngels, 1, 08001 Barcelona', 41.3831, 2.1668, 'https://www.macba.cat', 'Art contemporain catalan.'),
('CaixaForum Barcelona', ARRAY['CaixaForum BCN', 'caixaforum barcelona'], 'Barcelona', 'Spain', 'Av. de Francesc Ferrer i Guàrdia, 6-8, 08038 Barcelona', 41.3710, 2.1492, 'https://caixaforum.org', 'Centre culturel et expositions.'),
('CaixaForum Madrid', ARRAY['CaixaForum Madrid', 'caixaforum'], 'Madrid', 'Spain', 'Paseo del Prado, 36, 28014 Madrid', 40.4113, -3.6927, 'https://caixaforum.org', 'Expositions dans une ancienne centrale électrique.'),
('Museo Carmen Thyssen Málaga', ARRAY['Carmen Thyssen', 'thyssen malaga'], 'Málaga', 'Spain', 'C. Compañía, 10, 29008 Málaga', 36.7210, -4.4244, 'https://www.carmenthyssenmalaga.org', 'Peinture espagnole du XIXe siècle.'),
('Centro Andaluz de Arte Contemporáneo', ARRAY['CAAC', 'caac sevilla'], 'Seville', 'Spain', 'Av. Américo Vespucio, 2, 41092 Sevilla', 37.3830, -6.0089, 'https://www.caac.es', 'Art contemporain andalou.'),
('Museo de Arte Abstracto Español', ARRAY['MAE Cuenca', 'arte abstracto cuenca'], 'Cuenca', 'Spain', 'C. Canónigos, s/n, 16001 Cuenca', 40.0789, -2.1298, 'https://www.march.es', 'Art abstrait espagnol dans les Casas Colgadas.'),
('Museo de Bellas Artes de Bilbao', ARRAY['MBA Bilbao', 'bellas artes bilbao'], 'Bilbao', 'Spain', 'Museo Plaza, 2, 48009 Bilbo', 43.2635, -2.9348, 'https://www.museobilbao.com', 'Art basque et espagnol.'),
('CAC Málaga', ARRAY['CAC Malaga', 'centro arte contemporaneo malaga'], 'Málaga', 'Spain', 'C. Alemania, 29001 Málaga', 36.7186, -4.4326, 'https://cacmalaga.eu', 'Art contemporain.'),
('Fundación Mapfre', ARRAY['Mapfre Madrid', 'fundacion mapfre'], 'Madrid', 'Spain', 'Paseo de Recoletos, 23, 28004 Madrid', 40.4225, -3.6926, 'https://www.fundacionmapfre.org', 'Photographie et art moderne.'),
('Museo Sorolla', ARRAY['Sorolla', 'museo sorolla'], 'Madrid', 'Spain', 'Paseo del General Martínez Campos, 37, 28010 Madrid', 40.4350, -3.6923, 'https://www.museosorolla.mcu.es', 'Maison-atelier de Joaquín Sorolla.'),
('Museo Lázaro Galdiano', ARRAY['Lazaro Galdiano', 'galdiano'], 'Madrid', 'Spain', 'C. Serrano, 122, 28006 Madrid', 40.4369, -3.6877, 'https://www.flg.es', 'Arts décoratifs et peintures.'),
('Real Academia de Bellas Artes de San Fernando', ARRAY['Academia San Fernando', 'rabasf'], 'Madrid', 'Spain', 'C. de Alcalá, 13, 28014 Madrid', 40.4181, -3.7014, 'https://www.realacademiabellasartessanfernando.com', 'Œuvres de Goya et académiciens.'),

-- ITALY - Additional museums
('Galleria dell''Accademia di Firenze', ARRAY['Accademia Florence', 'david florence'], 'Florence', 'Italy', 'Via Ricasoli, 58/60, 50129 Firenze', 43.7769, 11.2586, 'https://www.galleriaaccademiafirenze.it', 'Le David de Michel-Ange.'),
('Museo Archeologico Nazionale di Napoli', ARRAY['MANN', 'mann naples'], 'Naples', 'Italy', 'Piazza Museo, 19, 80135 Napoli', 40.8534, 14.2506, 'https://www.museoarcheologiconapoli.it', 'Art romain de Pompéi et Herculanum.'),
('Palazzo Ducale', ARRAY['Doge Palace', 'palazzo ducale venezia'], 'Venice', 'Italy', 'Piazza San Marco, 1, 30124 Venezia', 45.4337, 12.3401, 'https://palazzoducale.visitmuve.it', 'Palais des Doges de Venise.'),
('Peggy Guggenheim Collection', ARRAY['Guggenheim Venice', 'peggy guggenheim'], 'Venice', 'Italy', 'Dorsoduro, 701-704, 30123 Venezia', 45.4305, 12.3316, 'https://www.guggenheim-venice.it', 'Art moderne du XXe siècle.'),
('Galleria Nazionale d''Arte Antica', ARRAY['Palazzo Barberini', 'barberini rome'], 'Rome', 'Italy', 'Via delle Quattro Fontane, 13, 00184 Roma', 41.9027, 12.4906, 'https://www.barberinicorsini.org', 'Peinture italienne baroque.'),
('Museo e Galleria Borghese', ARRAY['Villa Borghese', 'borghese gallery'], 'Rome', 'Italy', 'Piazzale Scipione Borghese, 5, 00197 Roma', 41.9143, 12.4920, 'https://galleriaborghese.beniculturali.it', 'Sculptures du Bernin et peintures du Caravage.'),
('MAXXI', ARRAY['maxxi rome', 'museo arte xxi secolo'], 'Rome', 'Italy', 'Via Guido Reni, 4A, 00196 Roma', 41.9279, 12.4656, 'https://www.maxxi.art', 'Musée national des arts du XXIe siècle.'),
('Museo Poldi Pezzoli', ARRAY['Poldi Pezzoli', 'pezzoli milan'], 'Milan', 'Italy', 'Via Alessandro Manzoni, 12, 20121 Milano', 45.4690, 9.1924, 'https://museopoldipezzoli.it', 'Maison-musée d''arts décoratifs.'),
('Museo del Novecento', ARRAY['Novecento Milan', 'museo 900'], 'Milan', 'Italy', 'Via Marconi, 1, 20122 Milano', 45.4636, 9.1895, 'https://www.museodelnovecento.org', 'Art italien du XXe siècle.'),
('Fondazione Prada', ARRAY['Prada Milan', 'fondazione prada'], 'Milan', 'Italy', 'Largo Isarco, 2, 20139 Milano', 45.4444, 9.2047, 'https://www.fondazioneprada.org', 'Art contemporain.'),
('Museo di San Marco', ARRAY['San Marco Florence', 'fra angelico'], 'Florence', 'Italy', 'Piazza San Marco, 3, 50121 Firenze', 43.7785, 11.2588, 'https://www.polomusealetoscana.beniculturali.it', 'Fresques de Fra Angelico.'),
('Museo dell''Opera del Duomo', ARRAY['Opera Duomo Florence', 'duomo museum'], 'Florence', 'Italy', 'Piazza del Duomo, 9, 50122 Firenze', 43.7731, 11.2575, 'https://www.museumflorence.com', 'Sculptures originales du Duomo.'),
('Galleria Nazionale dell''Umbria', ARRAY['GNU Perugia', 'umbria gallery'], 'Perugia', 'Italy', 'Corso Pietro Vannucci, 19, 06123 Perugia', 43.1108, 12.3891, 'https://gallerianazionaleumbria.it', 'Art ombrien, Pérugin et Pinturicchio.'),
('Museo Civico di Siena', ARRAY['Palazzo Pubblico Siena', 'civic museum siena'], 'Siena', 'Italy', 'Piazza del Campo, 1, 53100 Siena', 43.3182, 11.3316, 'https://www.comune.siena.it', 'Fresques d''Ambrogio Lorenzetti.'),
('GAM Torino', ARRAY['GAM Turin', 'galleria arte moderna torino'], 'Turin', 'Italy', 'Via Magenta, 31, 10128 Torino', 45.0625, 7.6727, 'https://www.gamtorino.it', 'Art moderne et contemporain.'),

-- FRENCH CATHEDRALS AND CHURCHES
('Cathédrale Notre-Dame de Paris', ARRAY['Notre-Dame', 'notre dame paris'], 'Paris', 'France', 'Parvis Notre-Dame - Pl. Jean-Paul II, 75004 Paris', 48.8530, 2.3499, 'https://www.notredamedeparis.fr', 'Chef-d''œuvre de l''architecture gothique, en restauration.'),
('Cathédrale Notre-Dame de Chartres', ARRAY['Chartres', 'cathedrale chartres'], 'Chartres', 'France', '16 Cloître Notre Dame, 28000 Chartres', 48.4476, 1.4878, 'https://www.cathedrale-chartres.org', 'Vitraux médiévaux exceptionnels, patrimoine UNESCO.'),
('Cathédrale Notre-Dame de Reims', ARRAY['Reims', 'cathedrale reims'], 'Reims', 'France', 'Place du Cardinal Luçon, 51100 Reims', 49.2539, 4.0336, 'https://www.cathedrale-reims.culture.fr', 'Cathédrale des sacres des rois de France.'),
('Cathédrale Notre-Dame d''Amiens', ARRAY['Amiens', 'cathedrale amiens'], 'Amiens', 'France', '30 Place Notre Dame, 80000 Amiens', 49.8950, 2.3022, 'https://www.amiens-cathedrale.fr', 'Plus vaste cathédrale de France.'),
('Cathédrale Notre-Dame de Strasbourg', ARRAY['Strasbourg', 'cathedrale strasbourg'], 'Strasbourg', 'France', 'Place de la Cathédrale, 67000 Strasbourg', 48.5820, 7.7510, 'https://www.cathedrale-strasbourg.fr', 'Chef-d''œuvre de l''art gothique rhénan.'),
('Basilique du Sacré-Cœur', ARRAY['Sacré-Coeur', 'sacre coeur montmartre'], 'Paris', 'France', '35 Rue du Chevalier de la Barre, 75018 Paris', 48.8867, 2.3431, 'https://www.sacre-coeur-montmartre.com', 'Basilique romano-byzantine sur la butte Montmartre.'),
('Cathédrale Saint-Étienne de Bourges', ARRAY['Bourges', 'cathedrale bourges'], 'Bourges', 'France', 'Place Étienne Dolet, 18000 Bourges', 47.0824, 2.3991, 'https://www.cathedrale-bourges.fr', 'Portails et vitraux du XIIIe siècle, UNESCO.'),
('Abbaye du Mont-Saint-Michel', ARRAY['Mont Saint-Michel', 'mont-saint-michel'], 'Le Mont-Saint-Michel', 'France', '50170 Le Mont-Saint-Michel', 48.6360, -1.5114, 'https://www.abbaye-mont-saint-michel.fr', 'Abbaye bénédictine sur un îlot rocheux.'),
('Cathédrale Saint-Pierre de Beauvais', ARRAY['Beauvais', 'cathedrale beauvais'], 'Beauvais', 'France', 'Rue Saint-Pierre, 60000 Beauvais', 49.4312, 2.0810, 'https://www.cathedrale-beauvais.fr', 'Plus haute voûte gothique du monde.'),
('Cathédrale Notre-Dame de Rouen', ARRAY['Rouen', 'cathedrale rouen'], 'Rouen', 'France', 'Place de la Cathédrale, 76000 Rouen', 49.4401, 1.0940, 'https://www.cathedrale-rouen.net', 'Inspiratrice des tableaux de Monet.'),
('Cathédrale Saint-Jean-Baptiste de Lyon', ARRAY['Saint-Jean Lyon', 'primatiale lyon'], 'Lyon', 'France', '8 Place Saint-Jean, 69005 Lyon', 45.7606, 4.8268, 'https://www.primatiale.fr', 'Cathédrale primatiale des Gaules.'),
('Basilique Saint-Sernin', ARRAY['Saint-Sernin', 'basilique toulouse'], 'Toulouse', 'France', 'Place Saint-Sernin, 31000 Toulouse', 43.6080, 1.4418, 'https://www.basilique-saint-sernin.fr', 'Plus grande église romane conservée.'),
('Cathédrale Saint-André de Bordeaux', ARRAY['Saint-André Bordeaux', 'cathedrale bordeaux'], 'Bordeaux', 'France', 'Place Pey Berland, 33000 Bordeaux', 44.8378, -0.5762, 'https://www.cathedrale-bordeaux.fr', 'Cathédrale gothique, patrimoine UNESCO.'),
('Cathédrale Sainte-Cécile d''Albi', ARRAY['Albi', 'cathedrale albi'], 'Albi', 'France', 'Place Sainte-Cécile, 81000 Albi', 43.9276, 2.1430, 'https://www.cathedrale-albi.com', 'Plus grande cathédrale de briques au monde.'),
('Basilique Notre-Dame de Fourvière', ARRAY['Fourvière', 'basilique lyon'], 'Lyon', 'France', '8 Place de Fourvière, 69005 Lyon', 45.7622, 4.8222, 'https://www.fourviere.org', 'Basilique néo-byzantine dominant Lyon.'),
('Abbaye de Fontenay', ARRAY['Fontenay', 'abbaye fontenay'], 'Marmagne', 'France', '21500 Marmagne', 47.6395, 4.3894, 'https://www.abbayedefontenay.com', 'Abbaye cistercienne du XIIe siècle, UNESCO.'),
('Abbaye de Cluny', ARRAY['Cluny', 'abbaye cluny'], 'Cluny', 'France', 'Palais Jean de Bourbon, 71250 Cluny', 46.4342, 4.6594, 'https://www.cluny-abbaye.fr', 'Centre de l''ordre clunisien.'),
('Cathédrale Saint-Gatien de Tours', ARRAY['Tours', 'cathedrale tours'], 'Tours', 'France', 'Place de la Cathédrale, 37000 Tours', 47.3954, 0.6946, 'https://www.cathedrale-tours.fr', 'Gothique flamboyant et Renaissance.'),
('Cathédrale Notre-Dame de Laon', ARRAY['Laon', 'cathedrale laon'], 'Laon', 'France', 'Place du Parvis Gautier de Mortagne, 02000 Laon', 49.5637, 3.6245, 'https://www.laon-tourisme.com', 'Chef-d''œuvre du premier gothique.'),
('Sainte-Chapelle', ARRAY['Sainte Chapelle', 'sainte-chapelle paris'], 'Paris', 'France', '10 Boulevard du Palais, 75001 Paris', 48.8554, 2.3450, 'https://www.sainte-chapelle.fr', 'Joyau du gothique rayonnant, vitraux exceptionnels.'),
('Cathédrale Saint-Étienne de Metz', ARRAY['Metz', 'cathedrale metz'], 'Metz', 'France', 'Place d''Armes, 57000 Metz', 49.1200, 6.1753, 'https://cathedrale-metz.fr', 'Plus grande surface vitrée de cathédrale au monde.'),
('Cathédrale Saint-Pierre d''Angoulême', ARRAY['Angoulême', 'cathedrale angouleme'], 'Angoulême', 'France', 'Place Saint-Pierre, 16000 Angoulême', 45.6483, 0.1536, 'https://www.angouleme-tourisme.com', 'Façade romane sculptée remarquable.'),
('Abbaye de Sénanque', ARRAY['Sénanque', 'abbaye senanque'], 'Gordes', 'France', '84220 Gordes', 43.9294, 5.1861, 'https://www.senanque.fr', 'Abbaye cistercienne au milieu des lavandes.'),
('Cathédrale Saint-Corentin de Quimper', ARRAY['Quimper', 'cathedrale quimper'], 'Quimper', 'France', 'Place Saint-Corentin, 29000 Quimper', 47.9961, -4.1027, 'https://www.quimper.bzh', 'Cathédrale gothique bretonne.')

ON CONFLICT (id) DO NOTHING;

-- Add more museums from other countries for diversity
INSERT INTO museums (name, aliases, city, country, address, latitude, longitude, website, description) VALUES
-- Portugal
('Museu Nacional de Arte Antiga', ARRAY['MNAA', 'arte antiga lisbon'], 'Lisbon', 'Portugal', 'R. das Janelas Verdes, 1249-017 Lisboa', 38.7036, -9.1591, 'http://www.museudearteantiga.pt', 'Art portugais et européen du Moyen Âge au XIXe siècle.'),
('Museu Calouste Gulbenkian', ARRAY['Gulbenkian', 'gulbenkian lisbon'], 'Lisbon', 'Portugal', 'Av. de Berna, 45A, 1067-001 Lisboa', 38.7372, -9.1535, 'https://gulbenkian.pt', 'Collection privée exceptionnelle, de l''Antiquité au XXe siècle.'),
('Museu Nacional do Azulejo', ARRAY['Azulejo', 'museu azulejo'], 'Lisbon', 'Portugal', 'R. Me. Deus 4, 1900-312 Lisboa', 38.7252, -9.1142, 'http://www.museudoazulejo.pt', 'Histoire de l''azulejo portugais.'),
('Museu de Serralves', ARRAY['Serralves', 'serralves porto'], 'Porto', 'Portugal', 'R. Dom João de Castro, 210, 4150-417 Porto', 41.1594, -8.6594, 'https://www.serralves.pt', 'Art contemporain dans un parc.'),

-- Greece
('Musée de l''Acropole', ARRAY['Acropolis Museum', 'acropole athenes'], 'Athens', 'Greece', 'Dionysiou Areopagitou 15, Athina 117 42', 37.9685, 23.7286, 'https://www.theacropolismuseum.gr', 'Sculptures et vestiges de l''Acropole.'),
('Musée archéologique national d''Athènes', ARRAY['National Archaeological Museum Athens', 'musee archeologique athenes'], 'Athens', 'Greece', 'Patission 44, Athina 106 82', 37.9895, 23.7325, 'https://www.namuseum.gr', 'Antiquités grecques et égyptiennes.'),

-- Denmark
('Statens Museum for Kunst', ARRAY['SMK', 'smk copenhagen'], 'Copenhagen', 'Denmark', 'Sølvgade 48-50, 1307 København', 55.6885, 12.5791, 'https://www.smk.dk', 'Galerie nationale du Danemark.'),
('Louisiana Museum of Modern Art', ARRAY['Louisiana', 'louisiana copenhagen'], 'Humlebæk', 'Denmark', 'Gl Strandvej 13, 3050 Humlebæk', 55.9697, 12.5418, 'https://louisiana.dk', 'Art moderne dans un cadre exceptionnel.'),

-- Norway
('Nasjonalmuseet', ARRAY['National Museum Oslo', 'nasjonalmuseet'], 'Oslo', 'Norway', 'Brynjulf Bulls plass 3, 0250 Oslo', 59.9091, 10.7369, 'https://www.nasjonalmuseet.no', 'Plus grand musée d''art de Scandinavie.'),
('Munch Museum', ARRAY['Munch', 'munchmuseet'], 'Oslo', 'Norway', 'Edvard Munchs plass 1, 0194 Oslo', 59.9068, 10.7563, 'https://www.munchmuseet.no', 'Œuvres d''Edvard Munch dont Le Cri.'),

-- Sweden
('Nationalmuseum', ARRAY['Nationalmuseum Stockholm', 'nationalmuseum'], 'Stockholm', 'Sweden', 'Södra Blasieholmshamnen, 111 48 Stockholm', 59.3284, 18.0707, 'https://www.nationalmuseum.se', 'Art suédois et européen.'),
('Moderna Museet', ARRAY['Moderna Stockholm', 'moderna museet'], 'Stockholm', 'Sweden', 'Exercisplan 4, 111 49 Stockholm', 59.3263, 18.0847, 'https://www.modernamuseet.se', 'Art moderne et contemporain.'),

-- Czech Republic
('Galerie nationale de Prague', ARRAY['NGP', 'narodni galerie'], 'Prague', 'Czech Republic', 'Staroměstské nám. 12, 110 00 Praha 1', 50.0879, 14.4214, 'https://www.ngprague.cz', 'Plus grande collection d''art de République tchèque.'),

-- Poland
('Musée national de Varsovie', ARRAY['MNW', 'muzeum narodowe warszawa'], 'Warsaw', 'Poland', 'Al. Jerozolimskie 3, 00-495 Warszawa', 52.2318, 21.0247, 'https://www.mnw.art.pl', 'Art polonais et européen.'),
('Muzeum Sztuki', ARRAY['ms lodz', 'muzeum sztuki lodz'], 'Łódź', 'Poland', 'Więckowskiego 36, 90-734 Łódź', 51.7610, 19.4545, 'https://msl.org.pl', 'Art d''avant-garde polonais.'),

-- Hungary
('Szépművészeti Múzeum', ARRAY['Museum of Fine Arts Budapest', 'szepmuveszeti'], 'Budapest', 'Hungary', 'Dózsa György út 41, 1146 Budapest', 47.5152, 19.0764, 'https://www.szepmuveszeti.hu', 'Art européen du Moyen Âge au XIXe siècle.'),
('Ludwig Múzeum', ARRAY['Ludwig Budapest', 'ludwig muzeum'], 'Budapest', 'Hungary', 'Komor Marcell u. 1, 1095 Budapest', 47.4725, 19.0681, 'https://www.ludwigmuseum.hu', 'Art contemporain hongrois et international.'),

-- Ireland
('National Gallery of Ireland', ARRAY['NGI', 'national gallery dublin'], 'Dublin', 'Ireland', 'Merrion Square W, Dublin 2', 53.3407, -6.2528, 'https://www.nationalgallery.ie', 'Art irlandais et européen.'),
('Irish Museum of Modern Art', ARRAY['IMMA', 'imma dublin'], 'Dublin', 'Ireland', 'Royal Hospital, Military Rd, Kilmainham, Dublin 8', 53.3426, -6.3119, 'https://www.imma.ie', 'Art moderne et contemporain.')

ON CONFLICT (id) DO NOTHING;
