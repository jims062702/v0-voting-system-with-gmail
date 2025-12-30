-- Insert candidate parties and candidates
INSERT INTO public.candidates (name, party_name, is_independent, description, order_index) VALUES
  ('Juan Dela Cruz', 'Partido Demokratiko', false, 'Education and Healthcare Focus', 1),
  ('Maria Santos', 'Partido Demokratiko', false, 'Environmental Protection', 2),
  ('Pedro Reyes', 'Partido Nasyonal', false, 'Economic Development', 3),
  ('Rosa Garcia', 'Partido Nasyonal', false, 'Infrastructure Projects', 4),
  ('Carlos Lopez', 'Ang Bagong Pwersa', false, 'Anti-Corruption Campaign', 5),
  ('Ana Rodriguez', 'Ang Bagong Pwersa', false, 'Youth Programs', 6),
  ('Miguel Flores', 'Independent', true, 'Community-Driven Solutions', 7),
  ('Sofia Morales', 'Independent', true, 'Grassroots Development', 8);

-- Initialize voting status (closed)
INSERT INTO public.voting_status (is_open, start_time, end_time) VALUES
  (false, null, null);
