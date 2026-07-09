-- Write Down Migration SQL Here
-- Write Down Migration SQL Here
ALTER TABLE shops 
  DROP COLUMN IF EXISTS coordinates,
  DROP COLUMN IF EXISTS business_hours,
  DROP COLUMN IF EXISTS payment_methods,
  DROP COLUMN IF EXISTS delivery,
  DROP COLUMN IF EXISTS social_media,
  DROP COLUMN IF EXISTS contact_details,
  DROP COLUMN IF EXISTS status,
  DROP COLUMN IF EXISTS verification;
