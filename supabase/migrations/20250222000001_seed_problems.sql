-- Story 1.4a: Seed 3 test problems for API verification

INSERT INTO public.problems (slug, title, description, difficulty, category, starter_code, has_solution)
VALUES
  (
    'two-sum',
    'Two Sum',
    'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.',
    'easy',
    ARRAY['Array', 'Hash Map'],
    '{"python": "def two_sum(nums: list[int], target: int) -> list[int]:\n    pass\n", "javascript": "function twoSum(nums, target) {\n    return [];\n}\n", "java": "public int[] twoSum(int[] nums, int target) {\n    return new int[0];\n}\n"}'::jsonb,
    TRUE
  ),
  (
    'valid-parentheses',
    'Valid Parentheses',
    'Given a string s containing just the characters ''('', '')'', ''{'', ''}'', ''['' and '']'', determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.',
    'easy',
    ARRAY['String', 'Stack'],
    '{"python": "def is_valid(s: str) -> bool:\n    pass\n", "javascript": "function isValid(s) {\n    return false;\n}\n", "java": "public boolean isValid(String s) {\n    return false;\n}\n"}'::jsonb,
    TRUE
  ),
  (
    'max-subarray',
    'Maximum Subarray',
    'Given an integer array nums, find the subarray with the largest sum, and return its sum.',
    'medium',
    ARRAY['Array', 'Dynamic Programming'],
    '{"python": "def max_subarray(nums: list[int]) -> int:\n    pass\n", "javascript": "function maxSubarray(nums) {\n    return 0;\n}\n", "java": "public int maxSubarray(int[] nums) {\n    return 0;\n}\n"}'::jsonb,
    TRUE
  )
ON CONFLICT (slug) DO NOTHING;

-- Example test cases (visible to users)
INSERT INTO public.test_cases (problem_id, input, expected_output, is_example, is_hidden, order_index)
SELECT p.id, '{"nums": [2, 7, 11, 15], "target": 9}'::jsonb, '[0, 1]'::jsonb, TRUE, FALSE, 1
FROM public.problems p WHERE p.slug = 'two-sum'
;

INSERT INTO public.test_cases (problem_id, input, expected_output, is_example, is_hidden, order_index)
SELECT p.id, '{"nums": [3, 2, 4], "target": 6}'::jsonb, '[1, 2]'::jsonb, TRUE, FALSE, 2
FROM public.problems p WHERE p.slug = 'two-sum'
;

INSERT INTO public.test_cases (problem_id, input, expected_output, is_example, is_hidden, order_index)
SELECT p.id, '{"s": "()"}'::jsonb, 'true'::jsonb, TRUE, FALSE, 1
FROM public.problems p WHERE p.slug = 'valid-parentheses'
;

INSERT INTO public.test_cases (problem_id, input, expected_output, is_example, is_hidden, order_index)
SELECT p.id, '{"nums": [-2, 1, -3, 4, -1, 2, 1, -5, 4]}'::jsonb, '6'::jsonb, TRUE, FALSE, 1
FROM public.problems p WHERE p.slug = 'max-subarray';
