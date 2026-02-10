-- SQL function for atomic task move + activity log
-- Reduces round-trips from 2 queries to 1

CREATE OR REPLACE FUNCTION move_task_and_log(
  p_task_id UUID,
  p_new_status TEXT,
  p_old_status TEXT,
  p_task_title TEXT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update task
  UPDATE tasks 
  SET status = p_new_status, 
      updated_at = NOW() 
  WHERE id = p_task_id;
  
  -- Log activity
  INSERT INTO activity_logs (
    type,
    task_id,
    task_title,
    from_status,
    to_status,
    created_at
  ) VALUES (
    CASE WHEN p_new_status = 'done' THEN 'task_completed' ELSE 'task_moved' END,
    p_task_id,
    p_task_title,
    p_old_status,
    p_new_status,
    NOW()
  );
  
  RETURN;
END;
$$;

-- Grant execute to all users (since RLS is on tables)
GRANT EXECUTE ON FUNCTION move_task_and_log TO anon;
GRANT EXECUTE ON FUNCTION move_task_and_log TO authenticated;
