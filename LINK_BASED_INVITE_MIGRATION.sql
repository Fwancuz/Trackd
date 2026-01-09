-- Link-based Friend System: Invite Links Migration
-- This migration creates the invite_links table and supporting functions
-- Replaces username-based friend discovery with link-based invitations

-- Create invite_links table
CREATE TABLE IF NOT EXISTS invite_links (
  id BIGSERIAL PRIMARY KEY,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_code TEXT NOT NULL UNIQUE,
  accepted_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  used BOOLEAN DEFAULT FALSE,
  
  CONSTRAINT invite_code_length CHECK (LENGTH(invite_code) >= 6 AND LENGTH(invite_code) <= 12),
  CONSTRAINT expires_after_created CHECK (expires_at IS NULL OR expires_at > created_at)
);

-- Create indexes for performance
CREATE INDEX idx_invite_code ON invite_links(invite_code);
CREATE INDEX idx_created_by ON invite_links(created_by);
CREATE INDEX idx_accepted_by ON invite_links(accepted_by);
CREATE INDEX idx_used ON invite_links(used);
CREATE INDEX idx_expires_at ON invite_links(expires_at);

-- Function to generate a unique random invite code
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists_count INT;
BEGIN
  LOOP
    -- Generate random 8-character alphanumeric code
    code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT), 1, 8));
    
    -- Check if it already exists
    SELECT COUNT(*) INTO exists_count FROM invite_links WHERE invite_code = code;
    
    -- Exit loop if unique
    EXIT WHEN exists_count = 0;
  END LOOP;
  
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function to create a new invite link
CREATE OR REPLACE FUNCTION create_invite_link(expires_in_hours INT DEFAULT 24)
RETURNS TABLE(id BIGINT, invite_code TEXT, created_at TIMESTAMP WITH TIME ZONE, expires_at TIMESTAMP WITH TIME ZONE) AS $$
DECLARE
  new_code TEXT;
  new_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Generate unique code
  new_code := generate_invite_code();
  
  -- Calculate expiration time
  new_expires_at := NOW() + (expires_in_hours || ' hours')::INTERVAL;
  
  -- Insert and return
  RETURN QUERY
  INSERT INTO invite_links (created_by, invite_code, expires_at)
  VALUES (auth.uid(), new_code, new_expires_at)
  RETURNING invite_links.id, invite_links.invite_code, invite_links.created_at, invite_links.expires_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to accept an invite and create friendship
CREATE OR REPLACE FUNCTION accept_invite_link(invite_code_param TEXT)
RETURNS TABLE(success BOOLEAN, message TEXT, friendship_id BIGINT) AS $$
DECLARE
  invite_record RECORD;
  new_friendship_id BIGINT;
  current_user UUID := auth.uid();
BEGIN
  -- Validate user is authenticated
  IF current_user IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Not authenticated', NULL::BIGINT;
    RETURN;
  END IF;

  -- Find the invite link
  SELECT * INTO invite_record FROM invite_links 
  WHERE invite_code = LOWER(invite_code_param) AND used = FALSE;

  -- Check if invite exists
  IF invite_record IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Invalid or expired invite code', NULL::BIGINT;
    RETURN;
  END IF;

  -- Check if invite has expired
  IF invite_record.expires_at IS NOT NULL AND NOW() > invite_record.expires_at THEN
    RETURN QUERY SELECT FALSE, 'Invite link has expired', NULL::BIGINT;
    RETURN;
  END IF;

  -- Check if user is trying to use their own invite
  IF invite_record.created_by = current_user THEN
    RETURN QUERY SELECT FALSE, 'Cannot use your own invite link', NULL::BIGINT;
    RETURN;
  END IF;

  -- Check if already friends
  IF EXISTS (
    SELECT 1 FROM friendships 
    WHERE (requester_id = invite_record.created_by AND receiver_id = current_user AND status = 'accepted')
       OR (requester_id = current_user AND receiver_id = invite_record.created_by AND status = 'accepted')
  ) THEN
    RETURN QUERY SELECT FALSE, 'Already friends with this user', NULL::BIGINT;
    RETURN;
  END IF;

  -- Create friendship (bidirectional)
  INSERT INTO friendships (requester_id, receiver_id, status)
  VALUES (invite_record.created_by, current_user, 'accepted')
  ON CONFLICT DO NOTHING
  RETURNING id INTO new_friendship_id;

  -- Mark invite as used
  UPDATE invite_links 
  SET used = TRUE, accepted_by = current_user 
  WHERE id = invite_record.id;

  RETURN QUERY SELECT TRUE, 'Successfully added as friend!', new_friendship_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get invite link details (for validation before accepting)
CREATE OR REPLACE FUNCTION get_invite_details(invite_code_param TEXT)
RETURNS TABLE(valid BOOLEAN, created_by_username TEXT, created_by_email TEXT, message TEXT) AS $$
DECLARE
  invite_record RECORD;
  profile_record RECORD;
BEGIN
  -- Find the invite link
  SELECT * INTO invite_record FROM invite_links 
  WHERE invite_code = LOWER(invite_code_param) AND used = FALSE;

  -- Check if invite exists and is valid
  IF invite_record IS NULL THEN
    RETURN QUERY SELECT FALSE, NULL::TEXT, NULL::TEXT, 'Invalid or already used invite code';
    RETURN;
  END IF;

  -- Check if invite has expired
  IF invite_record.expires_at IS NOT NULL AND NOW() > invite_record.expires_at THEN
    RETURN QUERY SELECT FALSE, NULL::TEXT, NULL::TEXT, 'Invite link has expired';
    RETURN;
  END IF;

  -- Get profile info of invite creator
  SELECT p.username, u.email INTO profile_record
  FROM profiles p
  LEFT JOIN auth.users u ON p.id = u.id
  WHERE p.id = invite_record.created_by;

  RETURN QUERY SELECT TRUE, profile_record.username, profile_record.email, 'Valid invite link';
END;
$$ LANGUAGE plpgsql;

-- Function to get all active invite links for current user
CREATE OR REPLACE FUNCTION get_my_invite_links()
RETURNS TABLE(id BIGINT, invite_code TEXT, used BOOLEAN, created_at TIMESTAMP WITH TIME ZONE, expires_at TIMESTAMP WITH TIME ZONE, accepted_by_email TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    il.id,
    il.invite_code,
    il.used,
    il.created_at,
    il.expires_at,
    COALESCE(u.email, '')::TEXT
  FROM invite_links il
  LEFT JOIN auth.users u ON il.accepted_by = u.id
  WHERE il.created_by = auth.uid()
  ORDER BY il.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Update RLS on invite_links table
ALTER TABLE invite_links ENABLE ROW LEVEL SECURITY;

-- Users can view invite links they created
CREATE POLICY "Users can view their own invite links"
  ON invite_links FOR SELECT
  USING (created_by = auth.uid());

-- Users can create invite links
CREATE POLICY "Users can create invite links"
  ON invite_links FOR INSERT
  WITH CHECK (created_by = auth.uid());

-- Only the creator can update/delete their invite links
CREATE POLICY "Users can manage their own invite links"
  ON invite_links FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own invite links"
  ON invite_links FOR DELETE
  USING (created_by = auth.uid());

-- Public can view invite link details (needed for join page)
-- This is safe because the endpoint only returns basic info and checks expiry
CREATE POLICY "Public can view basic invite details"
  ON invite_links FOR SELECT
  USING (used = FALSE AND (expires_at IS NULL OR expires_at > NOW()));
