-- Seed data for organisations table
-- Description: Sample organizations for development and testing

-- Insert sample organisations for different countries
INSERT INTO organisations (nom, pays, description, adresse_siege, telephone, email, site_web) VALUES
(
    'Want It Now France',
    'FR',
    'Filiale française spécialisée dans la sous-location et la gestion locative',
    '123 Avenue des Champs-Élysées, 75008 Paris',
    '+33 1 42 00 00 00',
    'contact@wantitnow.fr',
    'https://wantitnow.fr'
),
(
    'Want It Now España',
    'ES',
    'Filial española especializada en subarrendamiento y gestión de alquileres',
    'Calle Gran Vía 28, 28013 Madrid',
    '+34 91 000 00 00',
    'contacto@wantitnow.es',
    'https://wantitnow.es'
),
(
    'Want It Now Deutschland',
    'DE',
    'Deutsche Tochtergesellschaft für Untervermietung und Mietverwaltung',
    'Unter den Linden 1, 10117 Berlin',
    '+49 30 000 000 00',
    'kontakt@wantitnow.de',
    'https://wantitnow.de'
),
(
    'Want It Now Italia',
    'IT',
    'Filiale italiana specializzata in subaffitti e gestione locative',
    'Via del Corso 123, 00186 Roma',
    '+39 06 000 000 00',
    'contatti@wantitnow.it',
    'https://wantitnow.it'
);

-- Note: In production, this seed data should be replaced with actual organization data
-- The created_by and updated_by fields will be automatically set to the user running the seed