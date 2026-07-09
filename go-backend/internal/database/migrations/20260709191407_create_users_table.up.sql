-- Write Up Migration SQL Here
-- Write Up Migration SQL Here
ALTER TABLE shops 
  ADD COLUMN IF NOT EXISTS coordinates JSONB NOT NULL DEFAULT '{"lat": 14.5995, "lng": 120.9842}',
  ADD COLUMN IF NOT EXISTS business_hours JSONB NOT NULL DEFAULT '{"openTime": "09:00", "closeTime": "18:00", "days": ["Mon","Tue","Wed","Thu","Fri"]}',
  ADD COLUMN IF NOT EXISTS payment_methods JSONB NOT NULL DEFAULT '{"cash": true, "gcash": false, "paymaya": false, "card": false}',
  ADD COLUMN IF NOT EXISTS delivery JSONB NOT NULL DEFAULT '{"available": false, "radius": 0.0, "fee": 0.0, "minOrder": 0.0}',
  ADD COLUMN IF NOT EXISTS social_media JSONB NOT NULL DEFAULT '{"facebook": "", "instagram": ""}',
  ADD COLUMN IF NOT EXISTS contact_details JSONB NOT NULL DEFAULT '{"phone": "", "email": "", "address": ""}',
  ADD COLUMN IF NOT EXISTS status JSONB NOT NULL DEFAULT '{"isActive": true}',
  ADD COLUMN IF NOT EXISTS verification JSONB NOT NULL DEFAULT '{"isVerified": false, "verifiedDate": null, "verificationId": ""}';
