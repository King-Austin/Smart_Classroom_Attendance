-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create face_embeddings table for separate storage of heavy vectors
CREATE TABLE IF NOT EXISTS public.face_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    embedding vector(512) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add face_enrolled flag to profiles for quick UI checks
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS face_enrolled BOOLEAN DEFAULT false;

-- Index for fast similarity search
CREATE INDEX IF NOT EXISTS face_embeddings_embedding_idx ON public.face_embeddings 
USING hnsw (embedding vector_cosine_ops);

-- Enable RLS on face_embeddings
ALTER TABLE public.face_embeddings ENABLE ROW LEVEL SECURITY;

-- Simple RLS: Users can only see/edit their own embeddings
CREATE POLICY "Users can manage their own embeddings" 
ON public.face_embeddings 
FOR ALL 
USING (auth.uid() = user_id);

-- RPC for identity verification (The Secure Gate)
CREATE OR REPLACE FUNCTION verify_student_biometrics(
  p_student_id UUID,
  p_incoming_vector vector(512),
  p_liveness_score FLOAT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated permissions to update attendance records
AS $$
DECLARE
  v_stored_vector vector(512);
  v_similarity FLOAT;
  v_threshold FLOAT := 0.85; -- Adjustable configuration
  v_is_match BOOLEAN;
BEGIN
  -- 1. Fetch the stored vector
  SELECT embedding INTO v_stored_vector 
  FROM public.face_embeddings 
  WHERE user_id = p_student_id 
  LIMIT 1;

  IF v_stored_vector IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No face signature found for this user.');
  END IF;

  -- 2. Calculate Cosine Similarity
  v_similarity := 1 - (v_stored_vector <=> p_incoming_vector);

  -- 3. The Protocol Gate
  v_is_match := (v_similarity >= v_threshold) AND (p_liveness_score >= v_threshold);

  IF v_is_match THEN
    -- Success logic can be added here (e.g., auto-marking attendance if needed)
    RETURN jsonb_build_object(
      'success', true, 
      'similarity', v_similarity, 
      'liveness', p_liveness_score
    );
  ELSE
    RETURN jsonb_build_object(
      'success', false, 
      'similarity', v_similarity, 
      'liveness', p_liveness_score,
      'error', 'Identity verification failed.'
    );
  END IF;
END;
$$;
