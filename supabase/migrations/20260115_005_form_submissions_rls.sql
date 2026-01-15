-- Enable RLS sur toutes les tables
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submission_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- form_submissions: Policies
-- ============================================================================

-- Back-office : accès complet à toutes les demandes
CREATE POLICY "Back-office full access to form_submissions" ON form_submissions
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_app_roles
    WHERE user_id = auth.uid() AND app = 'back-office'
  )
);

-- LinkMe : voir leurs propres demandes (sélections liées à leur affiliate via enseigne/organisation)
CREATE POLICY "LinkMe view own selection requests" ON form_submissions
FOR SELECT USING (
  form_type = 'selection_inquiry' AND
  source = 'linkme' AND
  EXISTS (
    SELECT 1 FROM user_app_roles uar
    JOIN linkme_affiliates la ON (
      (uar.enseigne_id IS NOT NULL AND uar.enseigne_id = la.enseigne_id) OR
      (uar.organisation_id IS NOT NULL AND uar.organisation_id = la.organisation_id)
    )
    JOIN linkme_selections ls ON ls.affiliate_id = la.id
    WHERE uar.user_id = auth.uid()
      AND uar.app = 'linkme'
      AND uar.is_active = true
      AND ls.id = form_submissions.source_reference_id
  )
);

-- Public : insert uniquement (soumission formulaire)
CREATE POLICY "Public can insert form_submissions" ON form_submissions
FOR INSERT WITH CHECK (true);

-- ============================================================================
-- form_submission_messages: Policies
-- ============================================================================

-- Back-office : accès complet aux messages
CREATE POLICY "Back-office full access to messages" ON form_submission_messages
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_app_roles
    WHERE user_id = auth.uid() AND app = 'back-office'
  )
);

-- LinkMe : voir les messages de leurs propres demandes
CREATE POLICY "LinkMe view messages for own requests" ON form_submission_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM form_submissions fs
    JOIN user_app_roles uar ON uar.user_id = auth.uid()
    JOIN linkme_affiliates la ON (
      (uar.enseigne_id IS NOT NULL AND uar.enseigne_id = la.enseigne_id) OR
      (uar.organisation_id IS NOT NULL AND uar.organisation_id = la.organisation_id)
    )
    JOIN linkme_selections ls ON ls.affiliate_id = la.id
    WHERE fs.id = form_submission_messages.form_submission_id
      AND fs.form_type = 'selection_inquiry'
      AND fs.source = 'linkme'
      AND uar.app = 'linkme'
      AND uar.is_active = true
      AND ls.id = fs.source_reference_id
  )
);

-- ============================================================================
-- form_types: Policies
-- ============================================================================

-- Back-office : accès complet (gestion configuration)
CREATE POLICY "Back-office full access to form_types" ON form_types
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_app_roles
    WHERE user_id = auth.uid() AND app = 'back-office'
  )
);

-- Public : lecture des types de formulaires actifs uniquement
CREATE POLICY "Public read enabled form_types" ON form_types
FOR SELECT USING (enabled = true);

-- ============================================================================
-- app_settings: Policies
-- ============================================================================

-- Back-office : accès complet aux settings
CREATE POLICY "Back-office full access to app_settings" ON app_settings
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_app_roles
    WHERE user_id = auth.uid() AND app = 'back-office'
  )
);

-- Public : lecture des settings publics uniquement
CREATE POLICY "Public read public settings" ON app_settings
FOR SELECT USING (is_public = true);
