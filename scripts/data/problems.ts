/**
 * Story 1.4b: 50 curated interview problems
 * 25 easy + 25 medium across Array, String, Hash Map, Trees, Dynamic Programming
 */

export interface TestCase {
  input: Record<string, unknown>;
  expectedOutput: unknown;
  isExample: boolean;
  isHidden: boolean;
  orderIndex: number;
}

export interface ProblemData {
  slug: string;
  title: string;
  description: string;
  difficulty: "easy" | "medium";
  category: string[];
  starterCode: {
    python: string;
    javascript: string;
    java: string;
  };
  solutionCode: {
    python: string;
    javascript: string;
    java: string;
  };
  testCases: TestCase[];
}

export const PROBLEMS: ProblemData[] = [
  // === EXISTING 3 (with hidden cases added) ===
  {
    slug: "two-sum",
    title: "Two Sum",
    description:
      "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nConstraints: 2 <= nums.length <= 10^4, -10^9 <= nums[i] <= 10^9",
    difficulty: "easy",
    category: ["Array", "Hash Map"],
    starterCode: {
      python:
        "def two_sum(nums: list[int], target: int) -> list[int]:\n    pass\n",
      javascript: "function twoSum(nums, target) {\n    return [];\n}\n",
      java: "public int[] twoSum(int[] nums, int target) {\n    return new int[0];\n}\n",
    },
    solutionCode: {
      python: `def two_sum(nums: list[int], target: int) -> list[int]:
    seen = {}
    for i, n in enumerate(nums):
        diff = target - n
        if diff in seen:
            return [seen[diff], i]
        seen[n] = i
    return []`,
      javascript: `function twoSum(nums, target) {
    const seen = new Map();
    for (let i = 0; i < nums.length; i++) {
        const diff = target - nums[i];
        if (seen.has(diff)) return [seen.get(diff), i];
        seen.set(nums[i], i);
    }
    return [];
}`,
      java: `public int[] twoSum(int[] nums, int target) {
    Map<Integer, Integer> seen = new HashMap<>();
    for (int i = 0; i < nums.length; i++) {
        int diff = target - nums[i];
        if (seen.containsKey(diff))
            return new int[]{seen.get(diff), i};
        seen.put(nums[i], i);
    }
    return new int[0];
}`,
    },
    testCases: [
      { input: { nums: [2, 7, 11, 15], target: 9 }, expectedOutput: [0, 1], isExample: true, isHidden: false, orderIndex: 1 },
      { input: { nums: [3, 2, 4], target: 6 }, expectedOutput: [1, 2], isExample: true, isHidden: false, orderIndex: 2 },
      { input: { nums: [0, 4, 3, 0], target: 0 }, expectedOutput: [0, 3], isExample: false, isHidden: true, orderIndex: 3 },
      { input: { nums: [-1, -2, -3, -4, -5], target: -8 }, expectedOutput: [2, 4], isExample: false, isHidden: true, orderIndex: 4 },
      { input: { nums: [1, 5, 3, 7], target: 10 }, expectedOutput: [1, 3], isExample: false, isHidden: true, orderIndex: 5 },
    ],
  },
  {
    slug: "valid-parentheses",
    title: "Valid Parentheses",
    description:
      "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n\nConstraints: 1 <= s.length <= 10^4",
    difficulty: "easy",
    category: ["String", "Stack"],
    starterCode: {
      python: "def is_valid(s: str) -> bool:\n    pass\n",
      javascript: "function isValid(s) {\n    return false;\n}\n",
      java: "public boolean isValid(String s) {\n    return false;\n}\n",
    },
    solutionCode: {
      python: `def is_valid(s: str) -> bool:
    stack = []
    pairs = {')': '(', '}': '{', ']': '['}
    for c in s:
        if c in pairs:
            if not stack or stack[-1] != pairs[c]:
                return False
            stack.pop()
        else:
            stack.append(c)
    return len(stack) == 0`,
      javascript: `function isValid(s) {
    const stack = [];
    const pairs = { ')': '(', '}': '{', ']': '[' };
    for (const c of s) {
        if (pairs[c]) {
            if (!stack.length || stack.pop() !== pairs[c]) return false;
        } else stack.push(c);
    }
    return stack.length === 0;
}`,
      java: `public boolean isValid(String s) {
    Deque<Character> stack = new ArrayDeque<>();
    Map<Character, Character> pairs = Map.of(')', '(', '}', '{', ']', '[');
    for (char c : s.toCharArray()) {
        if (pairs.containsKey(c)) {
            if (stack.isEmpty() || stack.pop() != pairs.get(c)) return false;
        } else stack.push(c);
    }
    return stack.isEmpty();
}`,
    },
    testCases: [
      { input: { s: "()" }, expectedOutput: true, isExample: true, isHidden: false, orderIndex: 1 },
      { input: { s: "()[]{}" }, expectedOutput: true, isExample: true, isHidden: false, orderIndex: 2 },
      { input: { s: "(]" }, expectedOutput: false, isExample: false, isHidden: true, orderIndex: 3 },
      { input: { s: "([)]" }, expectedOutput: false, isExample: false, isHidden: true, orderIndex: 4 },
      { input: { s: "{[]}" }, expectedOutput: true, isExample: false, isHidden: true, orderIndex: 5 },
    ],
  },
  {
    slug: "max-subarray",
    title: "Maximum Subarray",
    description:
      "Given an integer array nums, find the subarray with the largest sum, and return its sum.\n\nConstraints: 1 <= nums.length <= 10^5, -10^4 <= nums[i] <= 10^4",
    difficulty: "medium",
    category: ["Array", "Dynamic Programming"],
    starterCode: {
      python: "def max_subarray(nums: list[int]) -> int:\n    pass\n",
      javascript: "function maxSubarray(nums) {\n    return 0;\n}\n",
      java: "public int maxSubarray(int[] nums) {\n    return 0;\n}\n",
    },
    solutionCode: {
      python: `def max_subarray(nums: list[int]) -> int:
    best = curr = nums[0]
    for n in nums[1:]:
        curr = max(n, curr + n)
        best = max(best, curr)
    return best`,
      javascript: `function maxSubarray(nums) {
    let best = curr = nums[0];
    for (let i = 1; i < nums.length; i++) {
        curr = Math.max(nums[i], curr + nums[i]);
        best = Math.max(best, curr);
    }
    return best;
}`,
      java: `public int maxSubarray(int[] nums) {
    int best = nums[0], curr = nums[0];
    for (int i = 1; i < nums.length; i++) {
        curr = Math.max(nums[i], curr + nums[i]);
        best = Math.max(best, curr);
    }
    return best;
}`,
    },
    testCases: [
      { input: { nums: [-2, 1, -3, 4, -1, 2, 1, -5, 4] }, expectedOutput: 6, isExample: true, isHidden: false, orderIndex: 1 },
      { input: { nums: [1] }, expectedOutput: 1, isExample: true, isHidden: false, orderIndex: 2 },
      { input: { nums: [5, 4, -1, 7, 8] }, expectedOutput: 23, isExample: false, isHidden: true, orderIndex: 3 },
      { input: { nums: [-1, -2, -3] }, expectedOutput: -1, isExample: false, isHidden: true, orderIndex: 4 },
      { input: { nums: [1, 2, 3, 4, 5] }, expectedOutput: 15, isExample: false, isHidden: true, orderIndex: 5 },
    ],
  },
  // === 47 NEW PROBLEMS ===
  {
    slug: "best-time-buy-sell",
    title: "Best Time to Buy and Sell Stock",
    description:
      "You are given an array prices where prices[i] is the price of a given stock on the ith day. You want to maximize your profit by choosing a single day to buy and a different day to sell. Return the maximum profit.\n\nConstraints: 1 <= prices.length <= 10^5, 0 <= prices[i] <= 10^4",
    difficulty: "easy",
    category: ["Array", "Dynamic Programming"],
    starterCode: {
      python: "def max_profit(prices: list[int]) -> int:\n    pass\n",
      javascript: "function maxProfit(prices) {\n    return 0;\n}\n",
      java: "public int maxProfit(int[] prices) {\n    return 0;\n}\n",
    },
    solutionCode: {
      python: `def max_profit(prices: list[int]) -> int:
    min_price = float('inf')
    max_profit = 0
    for p in prices:
        min_price = min(min_price, p)
        max_profit = max(max_profit, p - min_price)
    return max_profit`,
      javascript: `function maxProfit(prices) {
    let minPrice = Infinity, maxProfit = 0;
    for (const p of prices) {
        minPrice = Math.min(minPrice, p);
        maxProfit = Math.max(maxProfit, p - minPrice);
    }
    return maxProfit;
}`,
      java: `public int maxProfit(int[] prices) {
    int minPrice = Integer.MAX_VALUE, maxProfit = 0;
    for (int p : prices) {
        minPrice = Math.min(minPrice, p);
        maxProfit = Math.max(maxProfit, p - minPrice);
    }
    return maxProfit;
}`,
    },
    testCases: [
      { input: { prices: [7, 1, 5, 3, 6, 4] }, expectedOutput: 5, isExample: true, isHidden: false, orderIndex: 1 },
      { input: { prices: [7, 6, 4, 3, 1] }, expectedOutput: 0, isExample: true, isHidden: false, orderIndex: 2 },
      { input: { prices: [1, 2] }, expectedOutput: 1, isExample: false, isHidden: true, orderIndex: 3 },
      { input: { prices: [2, 4, 1] }, expectedOutput: 2, isExample: false, isHidden: true, orderIndex: 4 },
      { input: { prices: [3, 2, 6, 5, 0, 3] }, expectedOutput: 4, isExample: false, isHidden: true, orderIndex: 5 },
    ],
  },
  {
    slug: "contains-duplicate",
    title: "Contains Duplicate",
    description:
      "Given an integer array nums, return true if any value appears at least twice in the array, and return false if every element is distinct.\n\nConstraints: 1 <= nums.length <= 10^5, -10^9 <= nums[i] <= 10^9",
    difficulty: "easy",
    category: ["Array", "Hash Map"],
    starterCode: {
      python: "def contains_duplicate(nums: list[int]) -> bool:\n    pass\n",
      javascript: "function containsDuplicate(nums) {\n    return false;\n}\n",
      java: "public boolean containsDuplicate(int[] nums) {\n    return false;\n}\n",
    },
    solutionCode: {
      python: `def contains_duplicate(nums: list[int]) -> bool:
    return len(nums) != len(set(nums))`,
      javascript: `function containsDuplicate(nums) {
    return new Set(nums).size !== nums.length;
}`,
      java: `public boolean containsDuplicate(int[] nums) {
    Set<Integer> seen = new HashSet<>();
    for (int n : nums) {
        if (!seen.add(n)) return true;
    }
    return false;
}`,
    },
    testCases: [
      { input: { nums: [1, 2, 3, 1] }, expectedOutput: true, isExample: true, isHidden: false, orderIndex: 1 },
      { input: { nums: [1, 2, 3, 4] }, expectedOutput: false, isExample: true, isHidden: false, orderIndex: 2 },
      { input: { nums: [1, 1, 1, 3, 3, 4, 3, 2, 4, 2] }, expectedOutput: true, isExample: false, isHidden: true, orderIndex: 3 },
      { input: { nums: [0] }, expectedOutput: false, isExample: false, isHidden: true, orderIndex: 4 },
      { input: { nums: [-1, -1, 0] }, expectedOutput: true, isExample: false, isHidden: true, orderIndex: 5 },
    ],
  },
  {
    slug: "single-number",
    title: "Single Number",
    description:
      "Given a non-empty array of integers nums, every element appears twice except for one. Find that single one.\n\nConstraints: 1 <= nums.length <= 3 * 10^4, -3 * 10^4 <= nums[i] <= 3 * 10^4",
    difficulty: "easy",
    category: ["Array", "Hash Map"],
    starterCode: {
      python: "def single_number(nums: list[int]) -> int:\n    pass\n",
      javascript: "function singleNumber(nums) {\n    return 0;\n}\n",
      java: "public int singleNumber(int[] nums) {\n    return 0;\n}\n",
    },
    solutionCode: {
      python: `def single_number(nums: list[int]) -> int:
    res = 0
    for n in nums:
        res ^= n
    return res`,
      javascript: `function singleNumber(nums) {
    return nums.reduce((a, b) => a ^ b, 0);
}`,
      java: `public int singleNumber(int[] nums) {
    int res = 0;
    for (int n : nums) res ^= n;
    return res;
}`,
    },
    testCases: [
      { input: { nums: [2, 2, 1] }, expectedOutput: 1, isExample: true, isHidden: false, orderIndex: 1 },
      { input: { nums: [4, 1, 2, 1, 2] }, expectedOutput: 4, isExample: true, isHidden: false, orderIndex: 2 },
      { input: { nums: [1] }, expectedOutput: 1, isExample: false, isHidden: true, orderIndex: 3 },
      { input: { nums: [1, 3, 1, -1, 3] }, expectedOutput: -1, isExample: false, isHidden: true, orderIndex: 4 },
      { input: { nums: [7, 7, 7, 7, 7, 7, 7] }, expectedOutput: 7, isExample: false, isHidden: true, orderIndex: 5 },
    ],
  },
  {
    slug: "valid-anagram",
    title: "Valid Anagram",
    description:
      "Given two strings s and t, return true if t is an anagram of s, and false otherwise.\n\nAn anagram is a word formed by rearranging the letters of a different word.\n\nConstraints: 1 <= s.length, t.length <= 5 * 10^4",
    difficulty: "easy",
    category: ["String", "Hash Map"],
    starterCode: {
      python: "def is_anagram(s: str, t: str) -> bool:\n    pass\n",
      javascript: "function isAnagram(s, t) {\n    return false;\n}\n",
      java: "public boolean isAnagram(String s, String t) {\n    return false;\n}\n",
    },
    solutionCode: {
      python: `def is_anagram(s: str, t: str) -> bool:
    return sorted(s) == sorted(t)`,
      javascript: `function isAnagram(s, t) {
    if (s.length !== t.length) return false;
    const cnt = {};
    for (const c of s) cnt[c] = (cnt[c] || 0) + 1;
    for (const c of t) {
        if (!cnt[c]) return false;
        cnt[c]--;
    }
    return true;
}`,
      java: `public boolean isAnagram(String s, String t) {
    if (s.length() != t.length()) return false;
    int[] cnt = new int[26];
    for (char c : s.toCharArray()) cnt[c - 'a']++;
    for (char c : t.toCharArray()) {
        if (--cnt[c - 'a'] < 0) return false;
    }
    return true;
}`,
    },
    testCases: [
      { input: { s: "anagram", t: "nagaram" }, expectedOutput: true, isExample: true, isHidden: false, orderIndex: 1 },
      { input: { s: "rat", t: "car" }, expectedOutput: false, isExample: true, isHidden: false, orderIndex: 2 },
      { input: { s: "a", t: "a" }, expectedOutput: true, isExample: false, isHidden: true, orderIndex: 3 },
      { input: { s: "a", t: "ab" }, expectedOutput: false, isExample: false, isHidden: true, orderIndex: 4 },
      { input: { s: "abc", t: "cba" }, expectedOutput: true, isExample: false, isHidden: true, orderIndex: 5 },
    ],
  },
  {
    slug: "remove-duplicates-sorted",
    title: "Remove Duplicates from Sorted Array",
    description:
      "Given an integer array nums sorted in non-decreasing order, remove the duplicates in-place such that each unique element appears only once. Return the number of unique elements.\n\nConstraints: 1 <= nums.length <= 3 * 10^4",
    difficulty: "easy",
    category: ["Array"],
    starterCode: {
      python: "def remove_duplicates(nums: list[int]) -> int:\n    pass\n",
      javascript: "function removeDuplicates(nums) {\n    return 0;\n}\n",
      java: "public int removeDuplicates(int[] nums) {\n    return 0;\n}\n",
    },
    solutionCode: {
      python: `def remove_duplicates(nums: list[int]) -> int:
    if not nums: return 0
    k = 1
    for i in range(1, len(nums)):
        if nums[i] != nums[i-1]:
            nums[k] = nums[i]
            k += 1
    return k`,
      javascript: `function removeDuplicates(nums) {
    if (!nums.length) return 0;
    let k = 1;
    for (let i = 1; i < nums.length; i++) {
        if (nums[i] !== nums[i-1]) nums[k++] = nums[i];
    }
    return k;
}`,
      java: `public int removeDuplicates(int[] nums) {
    if (nums.length == 0) return 0;
    int k = 1;
    for (int i = 1; i < nums.length; i++) {
        if (nums[i] != nums[i-1]) nums[k++] = nums[i];
    }
    return k;
}`,
    },
    testCases: [
      { input: { nums: [1, 1, 2] }, expectedOutput: 2, isExample: true, isHidden: false, orderIndex: 1 },
      { input: { nums: [0, 0, 1, 1, 1, 2, 2, 3, 3, 4] }, expectedOutput: 5, isExample: true, isHidden: false, orderIndex: 2 },
      { input: { nums: [1] }, expectedOutput: 1, isExample: false, isHidden: true, orderIndex: 3 },
      { input: { nums: [1, 1, 1] }, expectedOutput: 1, isExample: false, isHidden: true, orderIndex: 4 },
      { input: { nums: [1, 2, 3, 4, 5] }, expectedOutput: 5, isExample: false, isHidden: true, orderIndex: 5 },
    ],
  },
  {
    slug: "plus-one",
    title: "Plus One",
    description:
      "You are given a large integer represented as an integer array digits, where each digits[i] is the ith digit. The digits are ordered from most significant to least significant. Increment the large integer by one and return the resulting array.\n\nConstraints: 1 <= digits.length <= 100, 0 <= digits[i] <= 9",
    difficulty: "easy",
    category: ["Array"],
    starterCode: {
      python: "def plus_one(digits: list[int]) -> list[int]:\n    pass\n",
      javascript: "function plusOne(digits) {\n    return [];\n}\n",
      java: "public int[] plusOne(int[] digits) {\n    return new int[0];\n}\n",
    },
    solutionCode: {
      python: `def plus_one(digits: list[int]) -> list[int]:
    for i in range(len(digits)-1, -1, -1):
        digits[i] += 1
        if digits[i] < 10: return digits
        digits[i] = 0
    return [1] + digits`,
      javascript: `function plusOne(digits) {
    for (let i = digits.length - 1; i >= 0; i--) {
        digits[i]++;
        if (digits[i] < 10) return digits;
        digits[i] = 0;
    }
    return [1, ...digits];
}`,
      java: `public int[] plusOne(int[] digits) {
    for (int i = digits.length - 1; i >= 0; i--) {
        digits[i]++;
        if (digits[i] < 10) return digits;
        digits[i] = 0;
    }
    int[] res = new int[digits.length + 1];
    res[0] = 1;
    return res;
}`,
    },
    testCases: [
      { input: { digits: [1, 2, 3] }, expectedOutput: [1, 2, 4], isExample: true, isHidden: false, orderIndex: 1 },
      { input: { digits: [4, 3, 2, 1] }, expectedOutput: [4, 3, 2, 2], isExample: true, isHidden: false, orderIndex: 2 },
      { input: { digits: [9] }, expectedOutput: [1, 0], isExample: false, isHidden: true, orderIndex: 3 },
      { input: { digits: [9, 9, 9] }, expectedOutput: [1, 0, 0, 0], isExample: false, isHidden: true, orderIndex: 4 },
      { input: { digits: [0] }, expectedOutput: [1], isExample: false, isHidden: true, orderIndex: 5 },
    ],
  },
  {
    slug: "climbing-stairs",
    title: "Climbing Stairs",
    description:
      "You are climbing a staircase. It takes n steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?\n\nConstraints: 1 <= n <= 45",
    difficulty: "easy",
    category: ["Dynamic Programming"],
    starterCode: {
      python: "def climb_stairs(n: int) -> int:\n    pass\n",
      javascript: "function climbStairs(n) {\n    return 0;\n}\n",
      java: "public int climbStairs(int n) {\n    return 0;\n}\n",
    },
    solutionCode: {
      python: `def climb_stairs(n: int) -> int:
    a, b = 1, 1
    for _ in range(n - 1):
        a, b = b, a + b
    return b`,
      javascript: `function climbStairs(n) {
    let a = 1, b = 1;
    for (let i = 0; i < n - 1; i++) [a, b] = [b, a + b];
    return b;
}`,
      java: `public int climbStairs(int n) {
    int a = 1, b = 1;
    for (int i = 0; i < n - 1; i++) {
        int t = a + b;
        a = b;
        b = t;
    }
    return b;
}`,
    },
    testCases: [
      { input: { n: 2 }, expectedOutput: 2, isExample: true, isHidden: false, orderIndex: 1 },
      { input: { n: 3 }, expectedOutput: 3, isExample: true, isHidden: false, orderIndex: 2 },
      { input: { n: 1 }, expectedOutput: 1, isExample: false, isHidden: true, orderIndex: 3 },
      { input: { n: 4 }, expectedOutput: 5, isExample: false, isHidden: true, orderIndex: 4 },
      { input: { n: 5 }, expectedOutput: 8, isExample: false, isHidden: true, orderIndex: 5 },
    ],
  },
  {
    slug: "merge-sorted-array",
    title: "Merge Sorted Array",
    description:
      "You are given two integer arrays nums1 and nums2, sorted in non-decreasing order. Merge nums2 into nums1 as one sorted array. nums1 has length m+n where the first m elements are the elements to merge and the last n are zeros.\n\nConstraints: nums1.length == m + n, nums2.length == n, 0 <= m, n <= 200",
    difficulty: "easy",
    category: ["Array"],
    starterCode: {
      python: "def merge(nums1: list[int], m: int, nums2: list[int], n: int) -> None:\n    pass\n",
      javascript: "function merge(nums1, m, nums2, n) {\n}\n",
      java: "public void merge(int[] nums1, int m, int[] nums2, int n) {\n}\n",
    },
    solutionCode: {
      python: `def merge(nums1: list[int], m: int, nums2: list[int], n: int) -> None:
    i, j, k = m - 1, n - 1, m + n - 1
    while j >= 0:
        if i >= 0 and nums1[i] > nums2[j]:
            nums1[k] = nums1[i]
            i -= 1
        else:
            nums1[k] = nums2[j]
            j -= 1
        k -= 1`,
      javascript: `function merge(nums1, m, nums2, n) {
    let i = m - 1, j = n - 1, k = m + n - 1;
    while (j >= 0) {
        nums1[k--] = (i >= 0 && nums1[i] > nums2[j]) ? nums1[i--] : nums2[j--];
    }
}`,
      java: `public void merge(int[] nums1, int m, int[] nums2, int n) {
    int i = m - 1, j = n - 1, k = m + n - 1;
    while (j >= 0) {
        nums1[k--] = (i >= 0 && nums1[i] > nums2[j]) ? nums1[i--] : nums2[j--];
    }
}`,
    },
    testCases: [
      { input: { nums1: [1, 2, 3, 0, 0, 0], m: 3, nums2: [2, 5, 6], n: 3 }, expectedOutput: [1, 2, 2, 3, 5, 6], isExample: true, isHidden: false, orderIndex: 1 },
      { input: { nums1: [1], m: 1, nums2: [], n: 0 }, expectedOutput: [1], isExample: true, isHidden: false, orderIndex: 2 },
      { input: { nums1: [0], m: 0, nums2: [1], n: 1 }, expectedOutput: [1], isExample: false, isHidden: true, orderIndex: 3 },
      { input: { nums1: [2, 0], m: 1, nums2: [1], n: 1 }, expectedOutput: [1, 2], isExample: false, isHidden: true, orderIndex: 4 },
      { input: { nums1: [1, 2, 4, 5, 6, 0], m: 5, nums2: [3], n: 1 }, expectedOutput: [1, 2, 3, 4, 5, 6], isExample: false, isHidden: true, orderIndex: 5 },
    ],
  },
  {
    slug: "palindrome-number",
    title: "Palindrome Number",
    description:
      "Given an integer x, return true if x is a palindrome, and false otherwise.\n\nConstraints: -2^31 <= x <= 2^31 - 1",
    difficulty: "easy",
    category: ["Math"],
    starterCode: {
      python: "def is_palindrome(x: int) -> bool:\n    pass\n",
      javascript: "function isPalindrome(x) {\n    return false;\n}\n",
      java: "public boolean isPalindrome(int x) {\n    return false;\n}\n",
    },
    solutionCode: {
      python: `def is_palindrome(x: int) -> bool:
    if x < 0: return False
    s = str(x)
    return s == s[::-1]`,
      javascript: `function isPalindrome(x) {
    if (x < 0) return false;
    const s = String(x);
    return s === s.split('').reverse().join('');
}`,
      java: `public boolean isPalindrome(int x) {
    if (x < 0) return false;
    String s = String.valueOf(x);
    return s.equals(new StringBuilder(s).reverse().toString());
}`,
    },
    testCases: [
      { input: { x: 121 }, expectedOutput: true, isExample: true, isHidden: false, orderIndex: 1 },
      { input: { x: -121 }, expectedOutput: false, isExample: true, isHidden: false, orderIndex: 2 },
      { input: { x: 10 }, expectedOutput: false, isExample: false, isHidden: true, orderIndex: 3 },
      { input: { x: 0 }, expectedOutput: true, isExample: false, isHidden: true, orderIndex: 4 },
      { input: { x: 12321 }, expectedOutput: true, isExample: false, isHidden: true, orderIndex: 5 },
    ],
  },
  {
    slug: "longest-common-prefix",
    title: "Longest Common Prefix",
    description:
      "Write a function to find the longest common prefix string amongst an array of strings. If there is no common prefix, return an empty string.\n\nConstraints: 1 <= strs.length <= 200, 0 <= strs[i].length <= 200",
    difficulty: "easy",
    category: ["String"],
    starterCode: {
      python: "def longest_common_prefix(strs: list[str]) -> str:\n    pass\n",
      javascript: "function longestCommonPrefix(strs) {\n    return '';\n}\n",
      java: "public String longestCommonPrefix(String[] strs) {\n    return '';\n}\n",
    },
    solutionCode: {
      python: `def longest_common_prefix(strs: list[str]) -> str:
    if not strs: return ''
    prefix = strs[0]
    for s in strs[1:]:
        while not s.startswith(prefix):
            prefix = prefix[:-1]
            if not prefix: return ''
    return prefix`,
      javascript: `function longestCommonPrefix(strs) {
    if (!strs.length) return '';
    let prefix = strs[0];
    for (let i = 1; i < strs.length; i++) {
        while (!strs[i].startsWith(prefix)) {
            prefix = prefix.slice(0, -1);
            if (!prefix) return '';
        }
    }
    return prefix;
}`,
      java: `public String longestCommonPrefix(String[] strs) {
    if (strs.length == 0) return "";
    String prefix = strs[0];
    for (int i = 1; i < strs.length; i++) {
        while (!strs[i].startsWith(prefix)) {
            prefix = prefix.substring(0, prefix.length() - 1);
            if (prefix.isEmpty()) return "";
        }
    }
    return prefix;
}`,
    },
    testCases: [
      { input: { strs: ["flower", "flow", "flight"] }, expectedOutput: "fl", isExample: true, isHidden: false, orderIndex: 1 },
      { input: { strs: ["dog", "racecar", "car"] }, expectedOutput: "", isExample: true, isHidden: false, orderIndex: 2 },
      { input: { strs: ["a"] }, expectedOutput: "a", isExample: false, isHidden: true, orderIndex: 3 },
      { input: { strs: ["ab", "a"] }, expectedOutput: "a", isExample: false, isHidden: true, orderIndex: 4 },
      { input: { strs: ["", "b"] }, expectedOutput: "", isExample: false, isHidden: true, orderIndex: 5 },
    ],
  },
  {
    slug: "intersection-two-arrays",
    title: "Intersection of Two Arrays",
    description:
      "Given two integer arrays nums1 and nums2, return an array of their intersection. Each element in the result must be unique.\n\nConstraints: 1 <= nums1.length, nums2.length <= 1000",
    difficulty: "easy",
    category: ["Array", "Hash Map"],
    starterCode: {
      python: "def intersection(nums1: list[int], nums2: list[int]) -> list[int]:\n    pass\n",
      javascript: "function intersection(nums1, nums2) {\n    return [];\n}\n",
      java: "public int[] intersection(int[] nums1, int[] nums2) {\n    return new int[0];\n}\n",
    },
    solutionCode: {
      python: `def intersection(nums1: list[int], nums2: list[int]) -> list[int]:
    return list(set(nums1) & set(nums2))`,
      javascript: `function intersection(nums1, nums2) {
    const set1 = new Set(nums1);
    return [...new Set(nums2.filter(x => set1.has(x)))];
}`,
      java: `public int[] intersection(int[] nums1, int[] nums2) {
    Set<Integer> set1 = new HashSet<>();
    for (int n : nums1) set1.add(n);
    Set<Integer> res = new HashSet<>();
    for (int n : nums2) if (set1.contains(n)) res.add(n);
    return res.stream().mapToInt(i -> i).toArray();
}`,
    },
    testCases: [
      { input: { nums1: [1, 2, 2, 1], nums2: [2, 2] }, expectedOutput: [2], isExample: true, isHidden: false, orderIndex: 1 },
      { input: { nums1: [4, 9, 5], nums2: [9, 4, 9, 8, 4] }, expectedOutput: [9, 4], isExample: true, isHidden: false, orderIndex: 2 },
      { input: { nums1: [1], nums2: [1] }, expectedOutput: [1], isExample: false, isHidden: true, orderIndex: 3 },
      { input: { nums1: [1, 2], nums2: [3, 4] }, expectedOutput: [], isExample: false, isHidden: true, orderIndex: 4 },
      { input: { nums1: [1, 2, 3], nums2: [2, 3, 4] }, expectedOutput: [2, 3], isExample: false, isHidden: true, orderIndex: 5 },
    ],
  },
  // === MORE EASY (to reach 25 easy) ===
  {
    slug: "reverse-string",
    title: "Reverse String",
    description: "Write a function that reverses a string. The input string is given as an array of characters s. You must do this by modifying the input array in-place.\n\nConstraints: 1 <= s.length <= 10^5",
    difficulty: "easy",
    category: ["String"],
    starterCode: {
      python: "def reverse_string(s: list[str]) -> None:\n    pass\n",
      javascript: "function reverseString(s) {\n}\n",
      java: "public void reverseString(char[] s) {\n}\n",
    },
    solutionCode: {
      python: `def reverse_string(s: list[str]) -> None:
    s[:] = s[::-1]`,
      javascript: `function reverseString(s) {
    for (let i = 0, j = s.length - 1; i < j; i++, j--)
        [s[i], s[j]] = [s[j], s[i]];
}`,
      java: `public void reverseString(char[] s) {
    for (int i = 0, j = s.length - 1; i < j; i++, j--) {
        char t = s[i]; s[i] = s[j]; s[j] = t;
    }
}`,
    },
    testCases: [
      { input: { s: ["h", "e", "l", "l", "o"] }, expectedOutput: ["o", "l", "l", "e", "h"], isExample: true, isHidden: false, orderIndex: 1 },
      { input: { s: ["H", "a", "n", "n", "a", "h"] }, expectedOutput: ["h", "a", "n", "n", "a", "H"], isExample: true, isHidden: false, orderIndex: 2 },
      { input: { s: ["a"] }, expectedOutput: ["a"], isExample: false, isHidden: true, orderIndex: 3 },
      { input: { s: ["a", "b"] }, expectedOutput: ["b", "a"], isExample: false, isHidden: true, orderIndex: 4 },
      { input: { s: ["x", "y", "z"] }, expectedOutput: ["z", "y", "x"], isExample: false, isHidden: true, orderIndex: 5 },
    ],
  },
  {
    slug: "move-zeroes",
    title: "Move Zeroes",
    description: "Given an integer array nums, move all 0's to the end while maintaining the relative order of non-zero elements. Do this in-place.\n\nConstraints: 1 <= nums.length <= 10^4",
    difficulty: "easy",
    category: ["Array"],
    starterCode: {
      python: "def move_zeroes(nums: list[int]) -> None:\n    pass\n",
      javascript: "function moveZeroes(nums) {\n}\n",
      java: "public void moveZeroes(int[] nums) {\n}\n",
    },
    solutionCode: {
      python: `def move_zeroes(nums: list[int]) -> None:
    j = 0
    for i in range(len(nums)):
        if nums[i] != 0:
            nums[j], nums[i] = nums[i], nums[j]
            j += 1`,
      javascript: `function moveZeroes(nums) {
    let j = 0;
    for (let i = 0; i < nums.length; i++) {
        if (nums[i] !== 0) [nums[j++], nums[i]] = [nums[i], nums[j]];
    }
}`,
      java: `public void moveZeroes(int[] nums) {
    int j = 0;
    for (int i = 0; i < nums.length; i++) {
        if (nums[i] != 0) {
            int t = nums[j]; nums[j++] = nums[i]; nums[i] = t;
        }
    }
}`,
    },
    testCases: [
      { input: { nums: [0, 1, 0, 3, 12] }, expectedOutput: [1, 3, 12, 0, 0], isExample: true, isHidden: false, orderIndex: 1 },
      { input: { nums: [0] }, expectedOutput: [0], isExample: true, isHidden: false, orderIndex: 2 },
      { input: { nums: [1, 2, 3] }, expectedOutput: [1, 2, 3], isExample: false, isHidden: true, orderIndex: 3 },
      { input: { nums: [0, 0, 1] }, expectedOutput: [1, 0, 0], isExample: false, isHidden: true, orderIndex: 4 },
      { input: { nums: [1, 0, 1, 0, 1] }, expectedOutput: [1, 1, 1, 0, 0], isExample: false, isHidden: true, orderIndex: 5 },
    ],
  },
  {
    slug: "reverse-integer",
    title: "Reverse Integer",
    description: "Given a signed 32-bit integer x, return x with its digits reversed. If reversing causes overflow, return 0.\n\nConstraints: -2^31 <= x <= 2^31 - 1",
    difficulty: "easy",
    category: ["Math"],
    starterCode: {
      python: "def reverse(x: int) -> int:\n    pass\n",
      javascript: "function reverse(x) {\n    return 0;\n}\n",
      java: "public int reverse(int x) {\n    return 0;\n}\n",
    },
    solutionCode: {
      python: `def reverse(x: int) -> int:
    sign = 1 if x >= 0 else -1
    x = abs(x)
    res = 0
    while x:
        res = res * 10 + x % 10
        x //= 10
    res *= sign
    return res if -2**31 <= res <= 2**31 - 1 else 0`,
      javascript: `function reverse(x) {
    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x);
    let res = 0;
    while (x) {
        res = res * 10 + x % 10;
        x = Math.floor(x / 10);
    }
    res *= sign;
    return (res >= -(2**31) && res <= 2**31 - 1) ? res : 0;
}`,
      java: `public int reverse(int x) {
    long res = 0;
    while (x != 0) {
        res = res * 10 + x % 10;
        x /= 10;
    }
    return (res >= Integer.MIN_VALUE && res <= Integer.MAX_VALUE) ? (int) res : 0;
}`,
    },
    testCases: [
      { input: { x: 123 }, expectedOutput: 321, isExample: true, isHidden: false, orderIndex: 1 },
      { input: { x: -123 }, expectedOutput: -321, isExample: true, isHidden: false, orderIndex: 2 },
      { input: { x: 120 }, expectedOutput: 21, isExample: false, isHidden: true, orderIndex: 3 },
      { input: { x: 0 }, expectedOutput: 0, isExample: false, isHidden: true, orderIndex: 4 },
      { input: { x: 1534236469 }, expectedOutput: 0, isExample: false, isHidden: true, orderIndex: 5 },
    ],
  },
  {
    slug: "sqrtx",
    title: "Sqrt(x)",
    description: "Given a non-negative integer x, return the square root of x rounded down to the nearest integer.\n\nConstraints: 0 <= x <= 2^31 - 1",
    difficulty: "easy",
    category: ["Binary Search", "Math"],
    starterCode: {
      python: "def my_sqrt(x: int) -> int:\n    pass\n",
      javascript: "function mySqrt(x) {\n    return 0;\n}\n",
      java: "public int mySqrt(int x) {\n    return 0;\n}\n",
    },
    solutionCode: {
      python: `def my_sqrt(x: int) -> int:
    if x < 2: return x
    lo, hi = 2, x // 2
    while lo <= hi:
        mid = (lo + hi) // 2
        if mid * mid <= x: lo = mid + 1
        else: hi = mid - 1
    return hi`,
      javascript: `function mySqrt(x) {
    if (x < 2) return x;
    let lo = 2, hi = (x / 2) | 0;
    while (lo <= hi) {
        const mid = (lo + hi) >>> 1;
        if (mid * mid <= x) lo = mid + 1;
        else hi = mid - 1;
    }
    return hi;
}`,
      java: `public int mySqrt(int x) {
    if (x < 2) return x;
    long lo = 2, hi = x / 2;
    while (lo <= hi) {
        long mid = lo + (hi - lo) / 2;
        if (mid * mid <= x) lo = mid + 1;
        else hi = mid - 1;
    }
    return (int) hi;
}`,
    },
    testCases: [
      { input: { x: 4 }, expectedOutput: 2, isExample: true, isHidden: false, orderIndex: 1 },
      { input: { x: 8 }, expectedOutput: 2, isExample: true, isHidden: false, orderIndex: 2 },
      { input: { x: 0 }, expectedOutput: 0, isExample: false, isHidden: true, orderIndex: 3 },
      { input: { x: 1 }, expectedOutput: 1, isExample: false, isHidden: true, orderIndex: 4 },
      { input: { x: 16 }, expectedOutput: 4, isExample: false, isHidden: true, orderIndex: 5 },
    ],
  },
  {
    slug: "majority-element",
    title: "Majority Element",
    description: "Given an array nums of size n, return the majority element. The majority element appears more than n/2 times.\n\nConstraints: n == nums.length, 1 <= n <= 5 * 10^4",
    difficulty: "easy",
    category: ["Array", "Hash Map"],
    starterCode: {
      python: "def majority_element(nums: list[int]) -> int:\n    pass\n",
      javascript: "function majorityElement(nums) {\n    return 0;\n}\n",
      java: "public int majorityElement(int[] nums) {\n    return 0;\n}\n",
    },
    solutionCode: {
      python: `def majority_element(nums: list[int]) -> int:
    count, cand = 0, None
    for n in nums:
        if count == 0: cand = n
        count += 1 if n == cand else -1
    return cand`,
      javascript: `function majorityElement(nums) {
    let count = 0, cand;
    for (const n of nums) {
        if (count === 0) cand = n;
        count += n === cand ? 1 : -1;
    }
    return cand;
}`,
      java: `public int majorityElement(int[] nums) {
    int count = 0, cand = 0;
    for (int n : nums) {
        if (count == 0) cand = n;
        count += n == cand ? 1 : -1;
    }
    return cand;
}`,
    },
    testCases: [
      { input: { nums: [3, 2, 3] }, expectedOutput: 3, isExample: true, isHidden: false, orderIndex: 1 },
      { input: { nums: [2, 2, 1, 1, 1, 2, 2] }, expectedOutput: 2, isExample: true, isHidden: false, orderIndex: 2 },
      { input: { nums: [1] }, expectedOutput: 1, isExample: false, isHidden: true, orderIndex: 3 },
      { input: { nums: [3, 3, 4] }, expectedOutput: 3, isExample: false, isHidden: true, orderIndex: 4 },
      { input: { nums: [6, 5, 5] }, expectedOutput: 5, isExample: false, isHidden: true, orderIndex: 5 },
    ],
  },
  {
    slug: "excel-sheet-column-number",
    title: "Excel Sheet Column Number",
    description: "Given a string columnTitle that represents the column title as appears in an Excel sheet, return its corresponding column number. A=1, B=2, ..., Z=26, AA=27, etc.\n\nConstraints: 1 <= columnTitle.length <= 7",
    difficulty: "easy",
    category: ["String", "Math"],
    starterCode: {
      python: "def title_to_number(column_title: str) -> int:\n    pass\n",
      javascript: "function titleToNumber(columnTitle) {\n    return 0;\n}\n",
      java: "public int titleToNumber(String columnTitle) {\n    return 0;\n}\n",
    },
    solutionCode: {
      python: `def title_to_number(column_title: str) -> int:
    res = 0
    for c in column_title:
        res = res * 26 + (ord(c) - ord('A') + 1)
    return res`,
      javascript: `function titleToNumber(columnTitle) {
    let res = 0;
    for (const c of columnTitle)
        res = res * 26 + (c.charCodeAt(0) - 64);
    return res;
}`,
      java: `public int titleToNumber(String columnTitle) {
    int res = 0;
    for (char c : columnTitle.toCharArray())
        res = res * 26 + (c - 'A' + 1);
    return res;
}`,
    },
    testCases: [
      { input: { columnTitle: "A" }, expectedOutput: 1, isExample: true, isHidden: false, orderIndex: 1 },
      { input: { columnTitle: "AB" }, expectedOutput: 28, isExample: true, isHidden: false, orderIndex: 2 },
      { input: { columnTitle: "ZY" }, expectedOutput: 701, isExample: false, isHidden: true, orderIndex: 3 },
      { input: { columnTitle: "Z" }, expectedOutput: 26, isExample: false, isHidden: true, orderIndex: 4 },
      { input: { columnTitle: "FXSHRXW" }, expectedOutput: 2147483647, isExample: false, isHidden: true, orderIndex: 5 },
    ],
  },
  {
    slug: "happy-number",
    title: "Happy Number",
    description: "Write an algorithm to determine if a number n is happy. A happy number: replace n by sum of squares of digits, repeat until 1 or cycle.\n\nConstraints: 1 <= n <= 2^31 - 1",
    difficulty: "easy",
    category: ["Hash Map", "Math"],
    starterCode: {
      python: "def is_happy(n: int) -> bool:\n    pass\n",
      javascript: "function isHappy(n) {\n    return false;\n}\n",
      java: "public boolean isHappy(int n) {\n    return false;\n}\n",
    },
    solutionCode: {
      python: `def is_happy(n: int) -> bool:
    seen = set()
    while n != 1 and n not in seen:
        seen.add(n)
        n = sum(int(d)**2 for d in str(n))
    return n == 1`,
      javascript: `function isHappy(n) {
    const seen = new Set();
    while (n !== 1 && !seen.has(n)) {
        seen.add(n);
        n = String(n).split('').reduce((s, d) => s + (+d)**2, 0);
    }
    return n === 1;
}`,
      java: `public boolean isHappy(int n) {
    Set<Integer> seen = new HashSet<>();
    while (n != 1 && !seen.contains(n)) {
        seen.add(n);
        int sum = 0;
        while (n > 0) { sum += (n % 10) * (n % 10); n /= 10; }
        n = sum;
    }
    return n == 1;
}`,
    },
    testCases: [
      { input: { n: 19 }, expectedOutput: true, isExample: true, isHidden: false, orderIndex: 1 },
      { input: { n: 2 }, expectedOutput: false, isExample: true, isHidden: false, orderIndex: 2 },
      { input: { n: 1 }, expectedOutput: true, isExample: false, isHidden: true, orderIndex: 3 },
      { input: { n: 7 }, expectedOutput: true, isExample: false, isHidden: true, orderIndex: 4 },
      { input: { n: 3 }, expectedOutput: false, isExample: false, isHidden: true, orderIndex: 5 },
    ],
  },
  {
    slug: "missing-number",
    title: "Missing Number",
    description: "Given an array nums containing n distinct numbers in the range [0, n], return the only number in the range that is missing from the array.\n\nConstraints: n == nums.length, 1 <= n <= 10^4",
    difficulty: "easy",
    category: ["Array", "Hash Map"],
    starterCode: {
      python: "def missing_number(nums: list[int]) -> int:\n    pass\n",
      javascript: "function missingNumber(nums) {\n    return 0;\n}\n",
      java: "public int missingNumber(int[] nums) {\n    return 0;\n}\n",
    },
    solutionCode: {
      python: `def missing_number(nums: list[int]) -> int:
    n = len(nums)
    return n * (n + 1) // 2 - sum(nums)`,
      javascript: `function missingNumber(nums) {
    const n = nums.length;
    return n * (n + 1) / 2 - nums.reduce((a, b) => a + b, 0);
}`,
      java: `public int missingNumber(int[] nums) {
    int n = nums.length;
    int sum = n * (n + 1) / 2;
    for (int x : nums) sum -= x;
    return sum;
}`,
    },
    testCases: [
      { input: { nums: [3, 0, 1] }, expectedOutput: 2, isExample: true, isHidden: false, orderIndex: 1 },
      { input: { nums: [0, 1] }, expectedOutput: 2, isExample: true, isHidden: false, orderIndex: 2 },
      { input: { nums: [9, 6, 4, 2, 3, 5, 7, 0, 1] }, expectedOutput: 8, isExample: false, isHidden: true, orderIndex: 3 },
      { input: { nums: [0] }, expectedOutput: 1, isExample: false, isHidden: true, orderIndex: 4 },
      { input: { nums: [1] }, expectedOutput: 0, isExample: false, isHidden: true, orderIndex: 5 },
    ],
  },
  {
    slug: "binary-tree-max-depth",
    title: "Maximum Depth of Binary Tree",
    description: "Given the root of a binary tree, return its maximum depth. The root has structure {val, left, right} where left/right are subtrees or null.\n\nConstraints: 0 <= nodes <= 10^4",
    difficulty: "easy",
    category: ["Tree"],
    starterCode: {
      python: "def max_depth(root: dict | None) -> int:\n    pass\n",
      javascript: "function maxDepth(root) {\n    return 0;\n}\n",
      java: "public int maxDepth(TreeNode root) {\n    return 0;\n}\n",
    },
    solutionCode: {
      python: `def max_depth(root: dict | None) -> int:
    if not root: return 0
    return 1 + max(max_depth(root.get('left')), max_depth(root.get('right')))`,
      javascript: `function maxDepth(root) {
    if (!root) return 0;
    return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
}`,
      java: `public int maxDepth(TreeNode root) {
    if (root == null) return 0;
    return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
}`,
    },
    testCases: [
      { input: { root: { val: 3, left: { val: 9, left: null, right: null }, right: { val: 20, left: { val: 15, left: null, right: null }, right: { val: 7, left: null, right: null } } } }, expectedOutput: 3, isExample: true, isHidden: false, orderIndex: 1 },
      { input: { root: { val: 1, left: null, right: { val: 2, left: null, right: null } } }, expectedOutput: 2, isExample: true, isHidden: false, orderIndex: 2 },
      { input: { root: null }, expectedOutput: 0, isExample: false, isHidden: true, orderIndex: 3 },
      { input: { root: { val: 1, left: null, right: null } }, expectedOutput: 1, isExample: false, isHidden: true, orderIndex: 4 },
      { input: { root: { val: 1, left: { val: 2, left: null, right: null }, right: null } }, expectedOutput: 2, isExample: false, isHidden: true, orderIndex: 5 },
    ],
  },
  {
    slug: "invert-binary-tree",
    title: "Invert Binary Tree",
    description: "Given the root of a binary tree, invert the tree and return its root. Invert: swap left and right children.\n\nConstraints: 0 <= nodes <= 100",
    difficulty: "easy",
    category: ["Tree"],
    starterCode: {
      python: "def invert_tree(root: dict | None) -> dict | None:\n    pass\n",
      javascript: "function invertTree(root) {\n    return null;\n}\n",
      java: "public TreeNode invertTree(TreeNode root) {\n    return null;\n}\n",
    },
    solutionCode: {
      python: `def invert_tree(root: dict | None) -> dict | None:
    if not root: return None
    root['left'], root['right'] = invert_tree(root.get('right')), invert_tree(root.get('left'))
    return root`,
      javascript: `function invertTree(root) {
    if (!root) return null;
    [root.left, root.right] = [invertTree(root.right), invertTree(root.left)];
    return root;
}`,
      java: `public TreeNode invertTree(TreeNode root) {
    if (root == null) return null;
    TreeNode t = root.left;
    root.left = invertTree(root.right);
    root.right = invertTree(t);
    return root;
}`,
    },
    testCases: [
      {
        input: {
          root: {
            val: 4,
            left: { val: 2, left: { val: 1, left: null, right: null }, right: { val: 3, left: null, right: null } },
            right: { val: 7, left: { val: 6, left: null, right: null }, right: { val: 9, left: null, right: null } },
          },
        },
        expectedOutput: {
          val: 4,
          left: { val: 7, left: { val: 9, left: null, right: null }, right: { val: 6, left: null, right: null } },
          right: { val: 2, left: { val: 3, left: null, right: null }, right: { val: 1, left: null, right: null } },
        },
        isExample: true,
        isHidden: false,
        orderIndex: 1,
      },
      {
        input: {
          root: { val: 2, left: { val: 1, left: null, right: null }, right: { val: 3, left: null, right: null } },
        },
        expectedOutput: { val: 2, left: { val: 3, left: null, right: null }, right: { val: 1, left: null, right: null } },
        isExample: true,
        isHidden: false,
        orderIndex: 2,
      },
      {
        input: { root: { val: 1, left: null, right: null } },
        expectedOutput: { val: 1, left: null, right: null },
        isExample: false,
        isHidden: true,
        orderIndex: 4,
      },
      {
        input: { root: { val: 1, left: { val: 2, left: null, right: null }, right: null } },
        expectedOutput: { val: 1, left: null, right: { val: 2, left: null, right: null } },
        isExample: false,
        isHidden: true,
        orderIndex: 5,
      },
    ],
  },
  // === MEDIUM PROBLEMS (25 total) ===
  {
    slug: "longest-substring-no-repeat",
    title: "Longest Substring Without Repeating Characters",
    description: "Given a string s, find the length of the longest substring without repeating characters.\n\nConstraints: 0 <= s.length <= 5 * 10^4",
    difficulty: "medium",
    category: ["String", "Hash Map"],
    starterCode: {
      python: "def length_of_longest_substring(s: str) -> int:\n    pass\n",
      javascript: "function lengthOfLongestSubstring(s) {\n    return 0;\n}\n",
      java: "public int lengthOfLongestSubstring(String s) {\n    return 0;\n}\n",
    },
    solutionCode: {
      python: `def length_of_longest_substring(s: str) -> int:
    seen = {}
    start = 0
    best = 0
    for i, c in enumerate(s):
        if c in seen and seen[c] >= start:
            start = seen[c] + 1
        seen[c] = i
        best = max(best, i - start + 1)
    return best`,
      javascript: `function lengthOfLongestSubstring(s) {
    const seen = new Map();
    let start = 0, best = 0;
    for (let i = 0; i < s.length; i++) {
        if (seen.has(s[i]) && seen.get(s[i]) >= start)
            start = seen.get(s[i]) + 1;
        seen.set(s[i], i);
        best = Math.max(best, i - start + 1);
    }
    return best;
}`,
      java: `public int lengthOfLongestSubstring(String s) {
    Map<Character, Integer> seen = new HashMap<>();
    int start = 0, best = 0;
    for (int i = 0; i < s.length(); i++) {
        char c = s.charAt(i);
        if (seen.containsKey(c) && seen.get(c) >= start)
            start = seen.get(c) + 1;
        seen.put(c, i);
        best = Math.max(best, i - start + 1);
    }
    return best;
}`,
    },
    testCases: [
      { input: { s: "abcabcbb" }, expectedOutput: 3, isExample: true, isHidden: false, orderIndex: 1 },
      { input: { s: "bbbbb" }, expectedOutput: 1, isExample: true, isHidden: false, orderIndex: 2 },
      { input: { s: "pwwkew" }, expectedOutput: 3, isExample: false, isHidden: true, orderIndex: 3 },
      { input: { s: "" }, expectedOutput: 0, isExample: false, isHidden: true, orderIndex: 4 },
      { input: { s: "dvdf" }, expectedOutput: 3, isExample: false, isHidden: true, orderIndex: 5 },
    ],
  },
  {
    slug: "add-two-numbers",
    title: "Add Two Numbers",
    description: "You are given two non-empty linked lists representing two non-negative integers. The digits are stored in reverse order. Add the two numbers and return the sum as a linked list. Node: {val, next}.\n\nConstraints: 1 <= nodes <= 100, 0 <= Node.val <= 9",
    difficulty: "medium",
    category: ["Linked List", "Math"],
    starterCode: {
      python: "def add_two_numbers(l1: dict | None, l2: dict | None) -> dict | None:\n    pass\n",
      javascript: "function addTwoNumbers(l1, l2) {\n    return null;\n}\n",
      java: "public ListNode addTwoNumbers(ListNode l1, ListNode l2) {\n    return null;\n}\n",
    },
    solutionCode: {
      python: `def add_two_numbers(l1: dict | None, l2: dict | None) -> dict | None:
    dummy = {}
    cur = dummy
    carry = 0
    while l1 or l2 or carry:
        v = carry
        if l1: v += l1['val']; l1 = l1.get('next')
        if l2: v += l2['val']; l2 = l2.get('next')
        carry, v = divmod(v, 10)
        cur['next'] = {'val': v, 'next': None}
        cur = cur['next']
    return dummy.get('next')`,
      javascript: `function addTwoNumbers(l1, l2) {
    const dummy = {};
    let cur = dummy, carry = 0;
    while (l1 || l2 || carry) {
        let v = carry;
        if (l1) { v += l1.val; l1 = l1.next; }
        if (l2) { v += l2.val; l2 = l2.next; }
        carry = (v / 10) | 0;
        cur.next = { val: v % 10, next: null };
        cur = cur.next;
    }
    return dummy.next;
}`,
      java: `public ListNode addTwoNumbers(ListNode l1, ListNode l2) {
    ListNode dummy = new ListNode(0);
    ListNode cur = dummy;
    int carry = 0;
    while (l1 != null || l2 != null || carry != 0) {
        int v = carry;
        if (l1 != null) { v += l1.val; l1 = l1.next; }
        if (l2 != null) { v += l2.val; l2 = l2.next; }
        carry = v / 10;
        cur.next = new ListNode(v % 10);
        cur = cur.next;
    }
    return dummy.next;
}`,
    },
    testCases: [
      { input: { l1: { val: 2, next: { val: 4, next: { val: 3, next: null } } }, l2: { val: 5, next: { val: 6, next: { val: 4, next: null } } } }, expectedOutput: { val: 7, next: { val: 0, next: { val: 8, next: null } } }, isExample: true, isHidden: false, orderIndex: 1 },
      { input: { l1: { val: 0, next: null }, l2: { val: 0, next: null } }, expectedOutput: { val: 0, next: null }, isExample: true, isHidden: false, orderIndex: 2 },
      { input: { l1: { val: 9, next: { val: 9, next: { val: 9, next: null } } }, l2: { val: 9, next: null } }, expectedOutput: { val: 8, next: { val: 0, next: { val: 0, next: { val: 1, next: null } } } }, isExample: false, isHidden: true, orderIndex: 3 },
      { input: { l1: { val: 1, next: null }, l2: { val: 9, next: { val: 9, next: null } } }, expectedOutput: { val: 0, next: { val: 0, next: { val: 1, next: null } } }, isExample: false, isHidden: true, orderIndex: 4 },
      { input: { l1: { val: 5, next: null }, l2: { val: 5, next: null } }, expectedOutput: { val: 0, next: { val: 1, next: null } }, isExample: false, isHidden: true, orderIndex: 5 },
    ],
  },
  {
    slug: "three-sum",
    title: "3Sum",
    description: "Given an integer array nums, return all the triplets [nums[i], nums[j], nums[k]] such that i != j, i != k, j != k and nums[i] + nums[j] + nums[k] == 0. Solution set must not contain duplicate triplets.\n\nConstraints: 3 <= nums.length <= 3000",
    difficulty: "medium",
    category: ["Array", "Two Pointers"],
    starterCode: {
      python: "def three_sum(nums: list[int]) -> list[list[int]]:\n    pass\n",
      javascript: "function threeSum(nums) {\n    return [];\n}\n",
      java: "public List<List<Integer>> threeSum(int[] nums) {\n    return new ArrayList<>();\n}\n",
    },
    solutionCode: {
      python: `def three_sum(nums: list[int]) -> list[list[int]]:
    nums.sort()
    res = []
    for i in range(len(nums)-2):
        if i > 0 and nums[i] == nums[i-1]: continue
        lo, hi = i+1, len(nums)-1
        while lo < hi:
            s = nums[i] + nums[lo] + nums[hi]
            if s < 0: lo += 1
            elif s > 0: hi -= 1
            else:
                res.append([nums[i], nums[lo], nums[hi]])
                while lo < hi and nums[lo] == nums[lo+1]: lo += 1
                while lo < hi and nums[hi] == nums[hi-1]: hi -= 1
                lo += 1
                hi -= 1
    return res`,
      javascript: `function threeSum(nums) {
    nums.sort((a,b)=>a-b);
    const res = [];
    for (let i = 0; i < nums.length - 2; i++) {
        if (i > 0 && nums[i] === nums[i-1]) continue;
        let lo = i + 1, hi = nums.length - 1;
        while (lo < hi) {
            const s = nums[i] + nums[lo] + nums[hi];
            if (s < 0) lo++;
            else if (s > 0) hi--;
            else {
                res.push([nums[i], nums[lo], nums[hi]]);
                while (lo < hi && nums[lo] === nums[lo+1]) lo++;
                while (lo < hi && nums[hi] === nums[hi-1]) hi--;
                lo++; hi--;
            }
        }
    }
    return res;
}`,
      java: `public List<List<Integer>> threeSum(int[] nums) {
    Arrays.sort(nums);
    List<List<Integer>> res = new ArrayList<>();
    for (int i = 0; i < nums.length - 2; i++) {
        if (i > 0 && nums[i] == nums[i-1]) continue;
        int lo = i + 1, hi = nums.length - 1;
        while (lo < hi) {
            int s = nums[i] + nums[lo] + nums[hi];
            if (s < 0) lo++;
            else if (s > 0) hi--;
            else {
                res.add(Arrays.asList(nums[i], nums[lo], nums[hi]));
                while (lo < hi && nums[lo] == nums[lo+1]) lo++;
                while (lo < hi && nums[hi] == nums[hi-1]) hi--;
                lo++; hi--;
            }
        }
    }
    return res;
}`,
    },
    testCases: [
      { input: { nums: [-1, 0, 1, 2, -1, -4] }, expectedOutput: [[-1, -1, 2], [-1, 0, 1]], isExample: true, isHidden: false, orderIndex: 1 },
      { input: { nums: [0, 1, 1] }, expectedOutput: [], isExample: true, isHidden: false, orderIndex: 2 },
      { input: { nums: [0, 0, 0] }, expectedOutput: [[0, 0, 0]], isExample: false, isHidden: true, orderIndex: 3 },
      { input: { nums: [-2, 0, 1, 1, 2] }, expectedOutput: [[-2, 0, 2], [-2, 1, 1]], isExample: false, isHidden: true, orderIndex: 4 },
      { input: { nums: [-1, 0, 1] }, expectedOutput: [[-1, 0, 1]], isExample: false, isHidden: true, orderIndex: 5 },
    ],
  },
  {
    slug: "container-most-water",
    title: "Container With Most Water",
    description: "You are given an integer array height of length n. Find two lines that together with the x-axis form a container that holds the most water. Return the maximum amount of water.\n\nConstraints: n == height.length, 2 <= n <= 10^5",
    difficulty: "medium",
    category: ["Array", "Two Pointers"],
    starterCode: {
      python: "def max_area(height: list[int]) -> int:\n    pass\n",
      javascript: "function maxArea(height) {\n    return 0;\n}\n",
      java: "public int maxArea(int[] height) {\n    return 0;\n}\n",
    },
    solutionCode: {
      python: `def max_area(height: list[int]) -> int:
    lo, hi = 0, len(height) - 1
    best = 0
    while lo < hi:
        best = max(best, (hi - lo) * min(height[lo], height[hi]))
        if height[lo] < height[hi]: lo += 1
        else: hi -= 1
    return best`,
      javascript: `function maxArea(height) {
    let lo = 0, hi = height.length - 1, best = 0;
    while (lo < hi) {
        best = Math.max(best, (hi - lo) * Math.min(height[lo], height[hi]));
        if (height[lo] < height[hi]) lo++;
        else hi--;
    }
    return best;
}`,
      java: `public int maxArea(int[] height) {
    int lo = 0, hi = height.length - 1, best = 0;
    while (lo < hi) {
        best = Math.max(best, (hi - lo) * Math.min(height[lo], height[hi]));
        if (height[lo] < height[hi]) lo++;
        else hi--;
    }
    return best;
}`,
    },
    testCases: [
      { input: { height: [1, 8, 6, 2, 5, 4, 8, 3, 7] }, expectedOutput: 49, isExample: true, isHidden: false, orderIndex: 1 },
      { input: { height: [1, 1] }, expectedOutput: 1, isExample: true, isHidden: false, orderIndex: 2 },
      { input: { height: [1, 2, 1] }, expectedOutput: 2, isExample: false, isHidden: true, orderIndex: 3 },
      { input: { height: [4, 3, 2, 1, 4] }, expectedOutput: 16, isExample: false, isHidden: true, orderIndex: 4 },
      { input: { height: [2, 3, 4, 5, 18, 17, 6] }, expectedOutput: 17, isExample: false, isHidden: true, orderIndex: 5 },
    ],
  },
  {
    slug: "jump-game",
    title: "Jump Game",
    description: "You are given an integer array nums. You are initially positioned at the array's first index. Each element represents your maximum jump length. Return true if you can reach the last index, else false.\n\nConstraints: 1 <= nums.length <= 10^4, 0 <= nums[i] <= 10^5",
    difficulty: "medium",
    category: ["Array", "Dynamic Programming"],
    starterCode: {
      python: "def can_jump(nums: list[int]) -> bool:\n    pass\n",
      javascript: "function canJump(nums) {\n    return false;\n}\n",
      java: "public boolean canJump(int[] nums) {\n    return false;\n}\n",
    },
    solutionCode: {
      python: `def can_jump(nums: list[int]) -> bool:
    reach = 0
    for i, n in enumerate(nums):
        if i > reach: return False
        reach = max(reach, i + n)
    return True`,
      javascript: `function canJump(nums) {
    let reach = 0;
    for (let i = 0; i < nums.length; i++) {
        if (i > reach) return false;
        reach = Math.max(reach, i + nums[i]);
    }
    return true;
}`,
      java: `public boolean canJump(int[] nums) {
    int reach = 0;
    for (int i = 0; i < nums.length; i++) {
        if (i > reach) return false;
        reach = Math.max(reach, i + nums[i]);
    }
    return true;
}`,
    },
    testCases: [
      { input: { nums: [2, 3, 1, 1, 4] }, expectedOutput: true, isExample: true, isHidden: false, orderIndex: 1 },
      { input: { nums: [3, 2, 1, 0, 4] }, expectedOutput: false, isExample: true, isHidden: false, orderIndex: 2 },
      { input: { nums: [0] }, expectedOutput: true, isExample: false, isHidden: true, orderIndex: 3 },
      { input: { nums: [1, 0] }, expectedOutput: true, isExample: false, isHidden: true, orderIndex: 4 },
      { input: { nums: [1, 1, 1, 0] }, expectedOutput: true, isExample: false, isHidden: true, orderIndex: 5 },
    ],
  },
  {
    slug: "unique-paths",
    title: "Unique Paths",
    description: "A robot is located at the top-left corner of a m x n grid. The robot can only move either down or right. How many possible unique paths are there to reach the bottom-right corner?\n\nConstraints: 1 <= m, n <= 100",
    difficulty: "medium",
    category: ["Dynamic Programming"],
    starterCode: {
      python: "def unique_paths(m: int, n: int) -> int:\n    pass\n",
      javascript: "function uniquePaths(m, n) {\n    return 0;\n}\n",
      java: "public int uniquePaths(int m, int n) {\n    return 0;\n}\n",
    },
    solutionCode: {
      python: `def unique_paths(m: int, n: int) -> int:
    dp = [1] * n
    for _ in range(1, m):
        for j in range(1, n):
            dp[j] += dp[j-1]
    return dp[-1]`,
      javascript: `function uniquePaths(m, n) {
    const dp = Array(n).fill(1);
    for (let i = 1; i < m; i++)
        for (let j = 1; j < n; j++)
            dp[j] += dp[j-1];
    return dp[n-1];
}`,
      java: `public int uniquePaths(int m, int n) {
    int[] dp = new int[n];
    Arrays.fill(dp, 1);
    for (int i = 1; i < m; i++)
        for (int j = 1; j < n; j++)
            dp[j] += dp[j-1];
    return dp[n-1];
}`,
    },
    testCases: [
      { input: { m: 3, n: 7 }, expectedOutput: 28, isExample: true, isHidden: false, orderIndex: 1 },
      { input: { m: 3, n: 2 }, expectedOutput: 3, isExample: true, isHidden: false, orderIndex: 2 },
      { input: { m: 1, n: 1 }, expectedOutput: 1, isExample: false, isHidden: true, orderIndex: 3 },
      { input: { m: 2, n: 2 }, expectedOutput: 2, isExample: false, isHidden: true, orderIndex: 4 },
      { input: { m: 4, n: 4 }, expectedOutput: 20, isExample: false, isHidden: true, orderIndex: 5 },
    ],
  },
  {
    slug: "product-array-except-self",
    title: "Product of Array Except Self",
    description: "Given an integer array nums, return an array answer such that answer[i] is equal to the product of all elements of nums except nums[i]. Solve in O(n) time without division.\n\nConstraints: 2 <= nums.length <= 10^5, -30 <= nums[i] <= 30",
    difficulty: "medium",
    category: ["Array"],
    starterCode: {
      python: "def product_except_self(nums: list[int]) -> list[int]:\n    pass\n",
      javascript: "function productExceptSelf(nums) {\n    return [];\n}\n",
      java: "public int[] productExceptSelf(int[] nums) {\n    return new int[0];\n}\n",
    },
    solutionCode: {
      python: `def product_except_self(nums: list[int]) -> list[int]:
    n = len(nums)
    res = [1] * n
    left = 1
    for i in range(n):
        res[i] = left
        left *= nums[i]
    right = 1
    for i in range(n-1, -1, -1):
        res[i] *= right
        right *= nums[i]
    return res`,
      javascript: `function productExceptSelf(nums) {
    const n = nums.length;
    const res = Array(n).fill(1);
    let left = 1;
    for (let i = 0; i < n; i++) {
        res[i] = left;
        left *= nums[i];
    }
    let right = 1;
    for (let i = n - 1; i >= 0; i--) {
        res[i] *= right;
        right *= nums[i];
    }
    return res;
}`,
      java: `public int[] productExceptSelf(int[] nums) {
    int n = nums.length;
    int[] res = new int[n];
    int left = 1;
    for (int i = 0; i < n; i++) {
        res[i] = left;
        left *= nums[i];
    }
    int right = 1;
    for (int i = n - 1; i >= 0; i--) {
        res[i] *= right;
        right *= nums[i];
    }
    return res;
}`,
    },
    testCases: [
      { input: { nums: [1, 2, 3, 4] }, expectedOutput: [24, 12, 8, 6], isExample: true, isHidden: false, orderIndex: 1 },
      { input: { nums: [-1, 1, 0, -3, 3] }, expectedOutput: [0, 0, 9, 0, 0], isExample: true, isHidden: false, orderIndex: 2 },
      { input: { nums: [2, 3] }, expectedOutput: [3, 2], isExample: false, isHidden: true, orderIndex: 3 },
      { input: { nums: [1, 1, 1, 1] }, expectedOutput: [1, 1, 1, 1], isExample: false, isHidden: true, orderIndex: 4 },
      { input: { nums: [0, 0] }, expectedOutput: [0, 0], isExample: false, isHidden: true, orderIndex: 5 },
    ],
  },
  {
    slug: "search-rotated-sorted",
    title: "Search in Rotated Sorted Array",
    description: "There is an integer array nums sorted in ascending order (with distinct values). Prior to being passed, nums is possibly rotated. Given target, return the index of target if it is in nums, or -1 otherwise.\n\nConstraints: 1 <= nums.length <= 5000, -10^4 <= nums[i], target <= 10^4",
    difficulty: "medium",
    category: ["Array", "Binary Search"],
    starterCode: {
      python: "def search(nums: list[int], target: int) -> int:\n    pass\n",
      javascript: "function search(nums, target) {\n    return -1;\n}\n",
      java: "public int search(int[] nums, int target) {\n    return -1;\n}\n",
    },
    solutionCode: {
      python: `def search(nums: list[int], target: int) -> int:
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if nums[mid] == target: return mid
        if nums[lo] <= nums[mid]:
            if nums[lo] <= target < nums[mid]: hi = mid - 1
            else: lo = mid + 1
        else:
            if nums[mid] < target <= nums[hi]: lo = mid + 1
            else: hi = mid - 1
    return -1`,
      javascript: `function search(nums, target) {
    let lo = 0, hi = nums.length - 1;
    while (lo <= hi) {
        const mid = (lo + hi) >>> 1;
        if (nums[mid] === target) return mid;
        if (nums[lo] <= nums[mid]) {
            if (nums[lo] <= target && target < nums[mid]) hi = mid - 1;
            else lo = mid + 1;
        } else {
            if (nums[mid] < target && target <= nums[hi]) lo = mid + 1;
            else hi = mid - 1;
        }
    }
    return -1;
}`,
      java: `public int search(int[] nums, int target) {
    int lo = 0, hi = nums.length - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (nums[mid] == target) return mid;
        if (nums[lo] <= nums[mid]) {
            if (nums[lo] <= target && target < nums[mid]) hi = mid - 1;
            else lo = mid + 1;
        } else {
            if (nums[mid] < target && target <= nums[hi]) lo = mid + 1;
            else hi = mid - 1;
        }
    }
    return -1;
}`,
    },
    testCases: [
      { input: { nums: [4, 5, 6, 7, 0, 1, 2], target: 0 }, expectedOutput: 4, isExample: true, isHidden: false, orderIndex: 1 },
      { input: { nums: [4, 5, 6, 7, 0, 1, 2], target: 3 }, expectedOutput: -1, isExample: true, isHidden: false, orderIndex: 2 },
      { input: { nums: [1], target: 1 }, expectedOutput: 0, isExample: false, isHidden: true, orderIndex: 3 },
      { input: { nums: [3, 1], target: 1 }, expectedOutput: 1, isExample: false, isHidden: true, orderIndex: 4 },
      { input: { nums: [5, 1, 3], target: 5 }, expectedOutput: 0, isExample: false, isHidden: true, orderIndex: 5 },
    ],
  },
  {
    slug: "merge-intervals",
    title: "Merge Intervals",
    description: "Given an array of intervals where intervals[i] = [start_i, end_i], merge all overlapping intervals and return an array of non-overlapping intervals.\n\nConstraints: 1 <= intervals.length <= 10^4, intervals[i].length == 2",
    difficulty: "medium",
    category: ["Array"],
    starterCode: {
      python: "def merge_intervals(intervals: list[list[int]]) -> list[list[int]]:\n    pass\n",
      javascript: "function mergeIntervals(intervals) {\n    return [];\n}\n",
      java: "public int[][] merge(int[][] intervals) {\n    return new int[0][];\n}\n",
    },
    solutionCode: {
      python: `def merge_intervals(intervals: list[list[int]]) -> list[list[int]]:
    intervals.sort(key=lambda x: x[0])
    res = [intervals[0]]
    for s, e in intervals[1:]:
        if s <= res[-1][1]:
            res[-1][1] = max(res[-1][1], e)
        else:
            res.append([s, e])
    return res`,
      javascript: `function mergeIntervals(intervals) {
    intervals.sort((a,b) => a[0] - b[0]);
    const res = [intervals[0]];
    for (let i = 1; i < intervals.length; i++) {
        const [s, e] = intervals[i];
        if (s <= res[res.length-1][1])
            res[res.length-1][1] = Math.max(res[res.length-1][1], e);
        else res.push([s, e]);
    }
    return res;
}`,
      java: `public int[][] merge(int[][] intervals) {
    Arrays.sort(intervals, (a,b) -> a[0] - b[0]);
    List<int[]> res = new ArrayList<>();
    res.add(intervals[0]);
    for (int i = 1; i < intervals.length; i++) {
        int s = intervals[i][0], e = intervals[i][1];
        if (s <= res.get(res.size()-1)[1])
            res.get(res.size()-1)[1] = Math.max(res.get(res.size()-1)[1], e);
        else res.add(new int[]{s, e});
    }
    return res.toArray(new int[0][]);
}`,
    },
    testCases: [
      { input: { intervals: [[1, 3], [2, 6], [8, 10], [15, 18]] }, expectedOutput: [[1, 6], [8, 10], [15, 18]], isExample: true, isHidden: false, orderIndex: 1 },
      { input: { intervals: [[1, 4], [4, 5]] }, expectedOutput: [[1, 5]], isExample: true, isHidden: false, orderIndex: 2 },
      { input: { intervals: [[1, 4]] }, expectedOutput: [[1, 4]], isExample: false, isHidden: true, orderIndex: 3 },
      { input: { intervals: [[1, 4], [2, 3]] }, expectedOutput: [[1, 4]], isExample: false, isHidden: true, orderIndex: 4 },
      { input: { intervals: [[1, 2], [3, 4], [5, 6]] }, expectedOutput: [[1, 2], [3, 4], [5, 6]], isExample: false, isHidden: true, orderIndex: 5 },
    ],
  },
  {
    slug: "subarray-sum-equals-k",
    title: "Subarray Sum Equals K",
    description: "Given an integer array nums and an integer k, return the total number of subarrays whose sum equals k.\n\nConstraints: 1 <= nums.length <= 2 * 10^4, -1000 <= nums[i] <= 1000",
    difficulty: "medium",
    category: ["Array", "Hash Map"],
    starterCode: {
      python: "def subarray_sum(nums: list[int], k: int) -> int:\n    pass\n",
      javascript: "function subarraySum(nums, k) {\n    return 0;\n}\n",
      java: "public int subarraySum(int[] nums, int k) {\n    return 0;\n}\n",
    },
    solutionCode: {
      python: `def subarray_sum(nums: list[int], k: int) -> int:
    from collections import defaultdict
    cnt = defaultdict(int)
    cnt[0] = 1
    total = res = 0
    for n in nums:
        total += n
        res += cnt.get(total - k, 0)
        cnt[total] += 1
    return res`,
      javascript: `function subarraySum(nums, k) {
    const cnt = new Map();
    cnt.set(0, 1);
    let total = 0, res = 0;
    for (const n of nums) {
        total += n;
        res += cnt.get(total - k) || 0;
        cnt.set(total, (cnt.get(total) || 0) + 1);
    }
    return res;
}`,
      java: `public int subarraySum(int[] nums, int k) {
    Map<Integer, Integer> cnt = new HashMap<>();
    cnt.put(0, 1);
    int total = 0, res = 0;
    for (int n : nums) {
        total += n;
        res += cnt.getOrDefault(total - k, 0);
        cnt.put(total, cnt.getOrDefault(total, 0) + 1);
    }
    return res;
}`,
    },
    testCases: [
      { input: { nums: [1, 1, 1], k: 2 }, expectedOutput: 2, isExample: true, isHidden: false, orderIndex: 1 },
      { input: { nums: [1, 2, 3], k: 3 }, expectedOutput: 2, isExample: true, isHidden: false, orderIndex: 2 },
      { input: { nums: [1], k: 1 }, expectedOutput: 1, isExample: false, isHidden: true, orderIndex: 3 },
      { input: { nums: [-1, -1, 1], k: 0 }, expectedOutput: 1, isExample: false, isHidden: true, orderIndex: 4 },
      { input: { nums: [1, -1, 0], k: 0 }, expectedOutput: 3, isExample: false, isHidden: true, orderIndex: 5 },
    ],
  },
  {
    slug: "validate-bst",
    title: "Validate Binary Search Tree",
    description: "Given the root of a binary tree, determine if it is a valid BST. Left subtree < root < right subtree for all nodes.\n\nConstraints: 1 <= nodes <= 10^4",
    difficulty: "medium",
    category: ["Tree"],
    starterCode: {
      python: "def is_valid_bst(root: dict | None) -> bool:\n    pass\n",
      javascript: "function isValidBST(root) {\n    return false;\n}\n",
      java: "public boolean isValidBST(TreeNode root) {\n    return false;\n}\n",
    },
    solutionCode: {
      python: `def is_valid_bst(root: dict | None, lo=float('-inf'), hi=float('inf')) -> bool:
    if not root: return True
    v = root['val']
    if not (lo < v < hi): return False
    return is_valid_bst(root.get('left'), lo, v) and is_valid_bst(root.get('right'), v, hi)`,
      javascript: `function isValidBST(root, lo = -Infinity, hi = Infinity) {
    if (!root) return true;
    const v = root.val;
    if (v <= lo || v >= hi) return false;
    return isValidBST(root.left, lo, v) && isValidBST(root.right, v, hi);
}`,
      java: `public boolean isValidBST(TreeNode root) {
    return valid(root, Long.MIN_VALUE, Long.MAX_VALUE);
}
boolean valid(TreeNode n, long lo, long hi) {
    if (n == null) return true;
    if (n.val <= lo || n.val >= hi) return false;
    return valid(n.left, lo, n.val) && valid(n.right, n.val, hi);
}`,
    },
    testCases: [
      { input: { root: { val: 2, left: { val: 1, left: null, right: null }, right: { val: 3, left: null, right: null } } }, expectedOutput: true, isExample: true, isHidden: false, orderIndex: 1 },
      { input: { root: { val: 5, left: { val: 1, left: null, right: null }, right: { val: 4, left: { val: 3, left: null, right: null }, right: { val: 6, left: null, right: null } } } }, expectedOutput: false, isExample: true, isHidden: false, orderIndex: 2 },
      { input: { root: { val: 1, left: null, right: null } }, expectedOutput: true, isExample: false, isHidden: true, orderIndex: 3 },
      { input: { root: { val: 2, left: { val: 2, left: null, right: null }, right: null } }, expectedOutput: false, isExample: false, isHidden: true, orderIndex: 4 },
      { input: { root: { val: 5, left: { val: 4, left: null, right: null }, right: { val: 6, left: null, right: null } } }, expectedOutput: true, isExample: false, isHidden: true, orderIndex: 5 },
    ],
  },
  {
    slug: "binary-tree-level-order",
    title: "Binary Tree Level Order Traversal",
    description: "Given the root of a binary tree, return the level order traversal of its nodes' values (left to right, level by level).\n\nConstraints: 0 <= nodes <= 2000",
    difficulty: "medium",
    category: ["Tree"],
    starterCode: {
      python: "def level_order(root: dict | None) -> list[list[int]]:\n    pass\n",
      javascript: "function levelOrder(root) {\n    return [];\n}\n",
      java: "public List<List<Integer>> levelOrder(TreeNode root) {\n    return new ArrayList<>();\n}\n",
    },
    solutionCode: {
      python: `def level_order(root: dict | None) -> list[list[int]]:
    if not root: return []
    res, q = [], [root]
    while q:
        level = []
        for _ in range(len(q)):
            n = q.pop(0)
            level.append(n['val'])
            if n.get('left'): q.append(n['left'])
            if n.get('right'): q.append(n['right'])
        res.append(level)
    return res`,
      javascript: `function levelOrder(root) {
    if (!root) return [];
    const res = [];
    let q = [root];
    while (q.length) {
        const level = [];
        const next = [];
        for (const n of q) {
            level.push(n.val);
            if (n.left) next.push(n.left);
            if (n.right) next.push(n.right);
        }
        res.push(level);
        q = next;
    }
    return res;
}`,
      java: `public List<List<Integer>> levelOrder(TreeNode root) {
    List<List<Integer>> res = new ArrayList<>();
    if (root == null) return res;
    Queue<TreeNode> q = new LinkedList<>();
    q.offer(root);
    while (!q.isEmpty()) {
        List<Integer> level = new ArrayList<>();
        for (int sz = q.size(); sz > 0; sz--) {
            TreeNode n = q.poll();
            level.add(n.val);
            if (n.left != null) q.offer(n.left);
            if (n.right != null) q.offer(n.right);
        }
        res.add(level);
    }
    return res;
}`,
    },
    testCases: [
      { input: { root: { val: 3, left: { val: 9, left: null, right: null }, right: { val: 20, left: { val: 15, left: null, right: null }, right: { val: 7, left: null, right: null } } } }, expectedOutput: [[3], [9, 20], [15, 7]], isExample: true, isHidden: false, orderIndex: 1 },
      { input: { root: { val: 1, left: null, right: null } }, expectedOutput: [[1]], isExample: true, isHidden: false, orderIndex: 2 },
      { input: { root: null }, expectedOutput: [], isExample: false, isHidden: true, orderIndex: 3 },
      { input: { root: { val: 1, left: { val: 2, left: null, right: null }, right: null } }, expectedOutput: [[1], [2]], isExample: false, isHidden: true, orderIndex: 4 },
      { input: { root: { val: 1, left: null, right: { val: 2, left: null, right: null } } }, expectedOutput: [[1], [2]], isExample: false, isHidden: true, orderIndex: 5 },
    ],
  },
  {
    slug: "minimum-path-sum",
    title: "Minimum Path Sum",
    description: "Given a m x n grid filled with non-negative numbers, find a path from top-left to bottom-right which minimizes the sum of all numbers along its path. You can only move down or right.\n\nConstraints: 1 <= m, n <= 200, 0 <= grid[i][j] <= 100",
    difficulty: "medium",
    category: ["Dynamic Programming"],
    starterCode: {
      python: "def min_path_sum(grid: list[list[int]]) -> int:\n    pass\n",
      javascript: "function minPathSum(grid) {\n    return 0;\n}\n",
      java: "public int minPathSum(int[][] grid) {\n    return 0;\n}\n",
    },
    solutionCode: {
      python: `def min_path_sum(grid: list[list[int]]) -> int:
    m, n = len(grid), len(grid[0])
    for i in range(1, m): grid[i][0] += grid[i-1][0]
    for j in range(1, n): grid[0][j] += grid[0][j-1]
    for i in range(1, m):
        for j in range(1, n):
            grid[i][j] += min(grid[i-1][j], grid[i][j-1])
    return grid[-1][-1]`,
      javascript: `function minPathSum(grid) {
    const m = grid.length, n = grid[0].length;
    for (let i = 1; i < m; i++) grid[i][0] += grid[i-1][0];
    for (let j = 1; j < n; j++) grid[0][j] += grid[0][j-1];
    for (let i = 1; i < m; i++)
        for (let j = 1; j < n; j++)
            grid[i][j] += Math.min(grid[i-1][j], grid[i][j-1]);
    return grid[m-1][n-1];
}`,
      java: `public int minPathSum(int[][] grid) {
    int m = grid.length, n = grid[0].length;
    for (int i = 1; i < m; i++) grid[i][0] += grid[i-1][0];
    for (int j = 1; j < n; j++) grid[0][j] += grid[0][j-1];
    for (int i = 1; i < m; i++)
        for (int j = 1; j < n; j++)
            grid[i][j] += Math.min(grid[i-1][j], grid[i][j-1]);
    return grid[m-1][n-1];
}`,
    },
    testCases: [
      { input: { grid: [[1, 3, 1], [1, 5, 1], [4, 2, 1]] }, expectedOutput: 7, isExample: true, isHidden: false, orderIndex: 1 },
      { input: { grid: [[1, 2, 3], [4, 5, 6]] }, expectedOutput: 12, isExample: true, isHidden: false, orderIndex: 2 },
      { input: { grid: [[1]] }, expectedOutput: 1, isExample: false, isHidden: true, orderIndex: 3 },
      { input: { grid: [[1, 2], [1, 1]] }, expectedOutput: 3, isExample: false, isHidden: true, orderIndex: 4 },
      { input: { grid: [[1, 1, 1], [1, 1, 1], [1, 1, 1]] }, expectedOutput: 5, isExample: false, isHidden: true, orderIndex: 5 },
    ],
  },
  {
    slug: "generate-parentheses",
    title: "Generate Parentheses",
    description: "Given n pairs of parentheses, write a function to generate all combinations of well-formed parentheses.\n\nConstraints: 1 <= n <= 8",
    difficulty: "medium",
    category: ["String", "Backtracking"],
    starterCode: {
      python: "def generate_parenthesis(n: int) -> list[str]:\n    pass\n",
      javascript: "function generateParenthesis(n) {\n    return [];\n}\n",
      java: "public List<String> generateParenthesis(int n) {\n    return new ArrayList<>();\n}\n",
    },
    solutionCode: {
      python: `def generate_parenthesis(n: int) -> list[str]:
    res = []
    def bt(s, o, c):
        if len(s) == 2*n: res.append(s); return
        if o < n: bt(s+'(', o+1, c)
        if c < o: bt(s+')', o, c+1)
    bt('', 0, 0)
    return res`,
      javascript: `function generateParenthesis(n) {
    const res = [];
    function bt(s, o, c) {
        if (s.length === 2*n) { res.push(s); return; }
        if (o < n) bt(s+'(', o+1, c);
        if (c < o) bt(s+')', o, c+1);
    }
    bt('', 0, 0);
    return res;
}`,
      java: `public List<String> generateParenthesis(int n) {
    List<String> res = new ArrayList<>();
    bt(res, "", 0, 0, n);
    return res;
}
void bt(List<String> res, String s, int o, int c, int n) {
    if (s.length() == 2*n) { res.add(s); return; }
    if (o < n) bt(res, s+'(', o+1, c, n);
    if (c < o) bt(res, s+')', o, c+1, n);
}`,
    },
    testCases: [
      { input: { n: 3 }, expectedOutput: ["((()))", "(()())", "(())()", "()(())", "()()()"], isExample: true, isHidden: false, orderIndex: 1 },
      { input: { n: 1 }, expectedOutput: ["()"], isExample: true, isHidden: false, orderIndex: 2 },
      { input: { n: 2 }, expectedOutput: ["(())", "()()"], isExample: false, isHidden: true, orderIndex: 3 },
      { input: { n: 4 }, expectedOutput: ["(((())))", "((()()))", "((())())", "((()))()", "(()(()))", "(()()())", "(()())()", "(())(())", "(())()()", "()((()))", "()(()())", "()(())()", "()()(())", "()()()()"], isExample: false, isHidden: true, orderIndex: 4 },
      { input: { n: 1 }, expectedOutput: ["()"], isExample: false, isHidden: true, orderIndex: 5 },
    ],
  },
  {
    slug: "coin-change",
    title: "Coin Change",
    description: "You are given an integer array coins and an integer amount. Return the fewest number of coins needed to make that amount. If impossible, return -1.\n\nConstraints: 1 <= coins.length <= 12, 1 <= coins[i] <= 2^31-1, 0 <= amount <= 10^4",
    difficulty: "medium",
    category: ["Dynamic Programming"],
    starterCode: {
      python: "def coin_change(coins: list[int], amount: int) -> int:\n    pass\n",
      javascript: "function coinChange(coins, amount) {\n    return -1;\n}\n",
      java: "public int coinChange(int[] coins, int amount) {\n    return -1;\n}\n",
    },
    solutionCode: {
      python: `def coin_change(coins: list[int], amount: int) -> int:
    dp = [0] + [float('inf')] * amount
    for a in range(1, amount + 1):
        for c in coins:
            if a >= c: dp[a] = min(dp[a], dp[a-c] + 1)
    return dp[amount] if dp[amount] != float('inf') else -1`,
      javascript: `function coinChange(coins, amount) {
    const dp = [0, ...Array(amount).fill(Infinity)];
    for (let a = 1; a <= amount; a++)
        for (const c of coins)
            if (a >= c) dp[a] = Math.min(dp[a], dp[a-c] + 1);
    return dp[amount] === Infinity ? -1 : dp[amount];
}`,
      java: `public int coinChange(int[] coins, int amount) {
    int[] dp = new int[amount+1];
    Arrays.fill(dp, amount+1);
    dp[0] = 0;
    for (int a = 1; a <= amount; a++)
        for (int c : coins)
            if (a >= c) dp[a] = Math.min(dp[a], dp[a-c] + 1);
    return dp[amount] > amount ? -1 : dp[amount];
}`,
    },
    testCases: [
      { input: { coins: [1, 2, 5], amount: 11 }, expectedOutput: 3, isExample: true, isHidden: false, orderIndex: 1 },
      { input: { coins: [2], amount: 3 }, expectedOutput: -1, isExample: true, isHidden: false, orderIndex: 2 },
      { input: { coins: [1], amount: 0 }, expectedOutput: 0, isExample: false, isHidden: true, orderIndex: 3 },
      { input: { coins: [1, 2, 5], amount: 100 }, expectedOutput: 20, isExample: false, isHidden: true, orderIndex: 4 },
      { input: { coins: [2, 5, 10], amount: 3 }, expectedOutput: -1, isExample: false, isHidden: true, orderIndex: 5 },
    ],
  },
  {
    slug: "house-robber",
    title: "House Robber",
    description: "You are a robber planning to rob houses along a street. Each house has a certain amount of money. Adjacent houses have security - cannot rob two adjacent houses. Return the maximum amount you can rob.\n\nConstraints: 1 <= nums.length <= 100, 0 <= nums[i] <= 400",
    difficulty: "medium",
    category: ["Dynamic Programming"],
    starterCode: {
      python: "def rob(nums: list[int]) -> int:\n    pass\n",
      javascript: "function rob(nums) {\n    return 0;\n}\n",
      java: "public int rob(int[] nums) {\n    return 0;\n}\n",
    },
    solutionCode: {
      python: `def rob(nums: list[int]) -> int:
    a, b = 0, 0
    for n in nums:
        a, b = b, max(a + n, b)
    return b`,
      javascript: `function rob(nums) {
    let a = 0, b = 0;
    for (const n of nums) [a, b] = [b, Math.max(a + n, b)];
    return b;
}`,
      java: `public int rob(int[] nums) {
    int a = 0, b = 0;
    for (int n : nums) {
        int t = b;
        b = Math.max(a + n, b);
        a = t;
    }
    return b;
}`,
    },
    testCases: [
      { input: { nums: [1, 2, 3, 1] }, expectedOutput: 4, isExample: true, isHidden: false, orderIndex: 1 },
      { input: { nums: [2, 7, 9, 3, 1] }, expectedOutput: 12, isExample: true, isHidden: false, orderIndex: 2 },
      { input: { nums: [1] }, expectedOutput: 1, isExample: false, isHidden: true, orderIndex: 3 },
      { input: { nums: [2, 1, 1, 2] }, expectedOutput: 4, isExample: false, isHidden: true, orderIndex: 4 },
      { input: { nums: [1, 2] }, expectedOutput: 2, isExample: false, isHidden: true, orderIndex: 5 },
    ],
  },
  {
    slug: "number-of-islands",
    title: "Number of Islands",
    description: "Given a 2D grid of '1's (land) and '0's (water), return the number of islands. An island is surrounded by water and formed by connecting adjacent lands horizontally or vertically.\n\nConstraints: m == grid.length, n == grid[i].length, 1 <= m, n <= 300",
    difficulty: "medium",
    category: ["Array", "Graph"],
    starterCode: {
      python: "def num_islands(grid: list[list[str]]) -> int:\n    pass\n",
      javascript: "function numIslands(grid) {\n    return 0;\n}\n",
      java: "public int numIslands(char[][] grid) {\n    return 0;\n}\n",
    },
    solutionCode: {
      python: `def num_islands(grid: list[list[str]]) -> int:
    if not grid: return 0
    m, n = len(grid), len(grid[0])
    def dfs(i, j):
        if i<0 or i>=m or j<0 or j>=n or grid[i][j]=='0': return
        grid[i][j] = '0'
        for di,dj in [(0,1),(1,0),(0,-1),(-1,0)]: dfs(i+di, j+dj)
    count = 0
    for i in range(m):
        for j in range(n):
            if grid[i][j] == '1': dfs(i, j); count += 1
    return count`,
      javascript: `function numIslands(grid) {
    if (!grid.length) return 0;
    const m = grid.length, n = grid[0].length;
    function dfs(i, j) {
        if (i<0||i>=m||j<0||j>=n||grid[i][j]==='0') return;
        grid[i][j] = '0';
        dfs(i+1,j); dfs(i-1,j); dfs(i,j+1); dfs(i,j-1);
    }
    let count = 0;
    for (let i = 0; i < m; i++)
        for (let j = 0; j < n; j++)
            if (grid[i][j] === '1') { dfs(i,j); count++; }
    return count;
}`,
      java: `public int numIslands(char[][] grid) {
    if (grid.length == 0) return 0;
    int m = grid.length, n = grid[0].length, count = 0;
    for (int i = 0; i < m; i++)
        for (int j = 0; j < n; j++)
            if (grid[i][j] == '1') { dfs(grid, i, j, m, n); count++; }
    return count;
}
void dfs(char[][] g, int i, int j, int m, int n) {
    if (i<0||i>=m||j<0||j>=n||g[i][j]=='0') return;
    g[i][j] = '0';
    dfs(g,i+1,j,m,n); dfs(g,i-1,j,m,n); dfs(g,i,j+1,m,n); dfs(g,i,j-1,m,n);
}`,
    },
    testCases: [
      { input: { grid: [["1", "1", "1", "1", "0"], ["1", "1", "0", "1", "0"], ["1", "1", "0", "0", "0"], ["0", "0", "0", "0", "0"]] }, expectedOutput: 1, isExample: true, isHidden: false, orderIndex: 1 },
      { input: { grid: [["1", "1", "0", "0", "0"], ["1", "1", "0", "0", "0"], ["0", "0", "1", "0", "0"], ["0", "0", "0", "1", "1"]] }, expectedOutput: 3, isExample: true, isHidden: false, orderIndex: 2 },
      { input: { grid: [["1"]] }, expectedOutput: 1, isExample: false, isHidden: true, orderIndex: 3 },
      { input: { grid: [["0"]] }, expectedOutput: 0, isExample: false, isHidden: true, orderIndex: 4 },
      { input: { grid: [["1", "0", "1"], ["0", "1", "0"], ["1", "0", "1"]] }, expectedOutput: 5, isExample: false, isHidden: true, orderIndex: 5 },
    ],
  },
  {
    slug: "group-anagrams",
    title: "Group Anagrams",
    description: "Given an array of strings strs, group the anagrams together. An anagram is a word formed by rearranging letters.\n\nConstraints: 1 <= strs.length <= 10^4, 0 <= strs[i].length <= 100",
    difficulty: "medium",
    category: ["String", "Hash Map"],
    starterCode: {
      python: "def group_anagrams(strs: list[str]) -> list[list[str]]:\n    pass\n",
      javascript: "function groupAnagrams(strs) {\n    return [];\n}\n",
      java: "public List<List<String>> groupAnagrams(String[] strs) {\n    return new ArrayList<>();\n}\n",
    },
    solutionCode: {
      python: `def group_anagrams(strs: list[str]) -> list[list[str]]:
    from collections import defaultdict
    g = defaultdict(list)
    for s in strs:
        g[tuple(sorted(s))].append(s)
    return list(g.values())`,
      javascript: `function groupAnagrams(strs) {
    const g = new Map();
    for (const s of strs) {
        const key = [...s].sort().join('');
        if (!g.has(key)) g.set(key, []);
        g.get(key).push(s);
    }
    return [...g.values()];
}`,
      java: `public List<List<String>> groupAnagrams(String[] strs) {
    Map<String, List<String>> g = new HashMap<>();
    for (String s : strs) {
        char[] c = s.toCharArray();
        Arrays.sort(c);
        String key = String.valueOf(c);
        g.computeIfAbsent(key, k -> new ArrayList<>()).add(s);
    }
    return new ArrayList<>(g.values());
}`,
    },
    testCases: [
      { input: { strs: ["eat", "tea", "tan", "ate", "nat", "bat"] }, expectedOutput: [["eat", "tea", "ate"], ["tan", "nat"], ["bat"]], isExample: true, isHidden: false, orderIndex: 1 },
      { input: { strs: [""] }, expectedOutput: [[""]], isExample: true, isHidden: false, orderIndex: 2 },
      { input: { strs: ["a"] }, expectedOutput: [["a"]], isExample: false, isHidden: true, orderIndex: 3 },
      { input: { strs: ["a", "a"] }, expectedOutput: [["a", "a"]], isExample: false, isHidden: true, orderIndex: 4 },
      { input: { strs: ["abc", "bca", "cab"] }, expectedOutput: [["abc", "bca", "cab"]], isExample: false, isHidden: true, orderIndex: 5 },
    ],
  },
  {
    slug: "kth-largest-element",
    title: "Kth Largest Element in an Array",
    description: "Given an integer array nums and an integer k, return the kth largest element in the array. Note: it is the kth largest in sorted order, not the kth distinct element.\n\nConstraints: 1 <= k <= nums.length <= 10^5",
    difficulty: "medium",
    category: ["Array"],
    starterCode: {
      python: "def find_kth_largest(nums: list[int], k: int) -> int:\n    pass\n",
      javascript: "function findKthLargest(nums, k) {\n    return 0;\n}\n",
      java: "public int findKthLargest(int[] nums, int k) {\n    return 0;\n}\n",
    },
    solutionCode: {
      python: `def find_kth_largest(nums: list[int], k: int) -> int:
    return sorted(nums, reverse=True)[k-1]`,
      javascript: `function findKthLargest(nums, k) {
    nums.sort((a,b) => b - a);
    return nums[k-1];
}`,
      java: `public int findKthLargest(int[] nums, int k) {
    Arrays.sort(nums);
    return nums[nums.length - k];
}`,
    },
    testCases: [
      { input: { nums: [3, 2, 1, 5, 6, 4], k: 2 }, expectedOutput: 5, isExample: true, isHidden: false, orderIndex: 1 },
      { input: { nums: [3, 2, 3, 1, 2, 4, 5, 5, 6], k: 4 }, expectedOutput: 4, isExample: true, isHidden: false, orderIndex: 2 },
      { input: { nums: [1], k: 1 }, expectedOutput: 1, isExample: false, isHidden: true, orderIndex: 3 },
      { input: { nums: [2, 1], k: 1 }, expectedOutput: 2, isExample: false, isHidden: true, orderIndex: 4 },
      { input: { nums: [5, 5, 5, 5], k: 2 }, expectedOutput: 5, isExample: false, isHidden: true, orderIndex: 5 },
    ],
  },
  {
    slug: "letter-combinations-phone",
    title: "Letter Combinations of a Phone Number",
    description: "Given a string containing digits from 2-9, return all possible letter combinations that the number could represent. Mapping: 2=abc, 3=def, 4=ghi, 5=jkl, 6=mno, 7=pqrs, 8=tuv, 9=wxyz.\n\nConstraints: 0 <= digits.length <= 4",
    difficulty: "medium",
    category: ["String", "Backtracking"],
    starterCode: {
      python: "def letter_combinations(digits: str) -> list[str]:\n    pass\n",
      javascript: "function letterCombinations(digits) {\n    return [];\n}\n",
      java: "public List<String> letterCombinations(String digits) {\n    return new ArrayList<>();\n}\n",
    },
    solutionCode: {
      python: `def letter_combinations(digits: str) -> list[str]:
    if not digits: return []
    m = {'2':'abc','3':'def','4':'ghi','5':'jkl','6':'mno','7':'pqrs','8':'tuv','9':'wxyz'}
    res = []
    def bt(i, path):
        if i == len(digits): res.append(path); return
        for c in m[digits[i]]: bt(i+1, path+c)
    bt(0, '')
    return res`,
      javascript: `function letterCombinations(digits) {
    if (!digits.length) return [];
    const m = {'2':'abc','3':'def','4':'ghi','5':'jkl','6':'mno','7':'pqrs','8':'tuv','9':'wxyz'};
    const res = [];
    function bt(i, path) {
        if (i === digits.length) { res.push(path); return; }
        for (const c of m[digits[i]]) bt(i+1, path+c);
    }
    bt(0, '');
    return res;
}`,
      java: `public List<String> letterCombinations(String digits) {
    if (digits.isEmpty()) return new ArrayList<>();
    String[] m = {"","","abc","def","ghi","jkl","mno","pqrs","tuv","wxyz"};
    List<String> res = new ArrayList<>();
    bt(res, digits, m, 0, "");
    return res;
}
void bt(List<String> res, String d, String[] m, int i, String path) {
    if (i == d.length()) { res.add(path); return; }
    for (char c : m[d.charAt(i)-'0'].toCharArray()) bt(res, d, m, i+1, path+c);
}`,
    },
    testCases: [
      { input: { digits: "23" }, expectedOutput: ["ad", "ae", "af", "bd", "be", "bf", "cd", "ce", "cf"], isExample: true, isHidden: false, orderIndex: 1 },
      { input: { digits: "" }, expectedOutput: [], isExample: true, isHidden: false, orderIndex: 2 },
      { input: { digits: "2" }, expectedOutput: ["a", "b", "c"], isExample: false, isHidden: true, orderIndex: 3 },
      { input: { digits: "9" }, expectedOutput: ["w", "x", "y", "z"], isExample: false, isHidden: true, orderIndex: 4 },
      { input: { digits: "22" }, expectedOutput: ["aa", "ab", "ac", "ba", "bb", "bc", "ca", "cb", "cc"], isExample: false, isHidden: true, orderIndex: 5 },
    ],
  },
  {
    slug: "find-minimum-rotated",
    title: "Find Minimum in Rotated Sorted Array",
    description: "Suppose an array of length n sorted in ascending order is rotated between 1 and n times. Given the sorted rotated array nums of unique elements, return the minimum element.\n\nConstraints: n == nums.length, 1 <= n <= 5000, -5000 <= nums[i] <= 5000",
    difficulty: "medium",
    category: ["Array", "Binary Search"],
    starterCode: {
      python: "def find_min(nums: list[int]) -> int:\n    pass\n",
      javascript: "function findMin(nums) {\n    return 0;\n}\n",
      java: "public int findMin(int[] nums) {\n    return 0;\n}\n",
    },
    solutionCode: {
      python: `def find_min(nums: list[int]) -> int:
    lo, hi = 0, len(nums) - 1
    while lo < hi:
        mid = (lo + hi) // 2
        if nums[mid] > nums[hi]: lo = mid + 1
        else: hi = mid
    return nums[lo]`,
      javascript: `function findMin(nums) {
    let lo = 0, hi = nums.length - 1;
    while (lo < hi) {
        const mid = (lo + hi) >>> 1;
        if (nums[mid] > nums[hi]) lo = mid + 1;
        else hi = mid;
    }
    return nums[lo];
}`,
      java: `public int findMin(int[] nums) {
    int lo = 0, hi = nums.length - 1;
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (nums[mid] > nums[hi]) lo = mid + 1;
        else hi = mid;
    }
    return nums[lo];
}`,
    },
    testCases: [
      { input: { nums: [3, 4, 5, 1, 2] }, expectedOutput: 1, isExample: true, isHidden: false, orderIndex: 1 },
      { input: { nums: [4, 5, 6, 7, 0, 1, 2] }, expectedOutput: 0, isExample: true, isHidden: false, orderIndex: 2 },
      { input: { nums: [11, 13, 15, 17] }, expectedOutput: 11, isExample: false, isHidden: true, orderIndex: 3 },
      { input: { nums: [1] }, expectedOutput: 1, isExample: false, isHidden: true, orderIndex: 4 },
      { input: { nums: [2, 1] }, expectedOutput: 1, isExample: false, isHidden: true, orderIndex: 5 },
    ],
  },
  {
    slug: "same-tree",
    title: "Same Tree",
    description: "Given the roots of two binary trees p and q, write a function to check if they are the same or not. Same: structurally identical and nodes have the same value.\n\nConstraints: 0 <= nodes <= 100",
    difficulty: "easy",
    category: ["Tree"],
    starterCode: {
      python: "def is_same_tree(p: dict | None, q: dict | None) -> bool:\n    pass\n",
      javascript: "function isSameTree(p, q) {\n    return false;\n}\n",
      java: "public boolean isSameTree(TreeNode p, TreeNode q) {\n    return false;\n}\n",
    },
    solutionCode: {
      python: `def is_same_tree(p: dict | None, q: dict | None) -> bool:
    if not p and not q: return True
    if not p or not q: return False
    return p['val'] == q['val'] and is_same_tree(p.get('left'), q.get('left')) and is_same_tree(p.get('right'), q.get('right'))`,
      javascript: `function isSameTree(p, q) {
    if (!p && !q) return true;
    if (!p || !q) return false;
    return p.val === q.val && isSameTree(p.left, q.left) && isSameTree(p.right, q.right);
}`,
      java: `public boolean isSameTree(TreeNode p, TreeNode q) {
    if (p == null && q == null) return true;
    if (p == null || q == null) return false;
    return p.val == q.val && isSameTree(p.left, q.left) && isSameTree(p.right, q.right);
}`,
    },
    testCases: [
      { input: { p: { val: 1, left: { val: 2, left: null, right: null }, right: { val: 3, left: null, right: null } }, q: { val: 1, left: { val: 2, left: null, right: null }, right: { val: 3, left: null, right: null } } }, expectedOutput: true, isExample: true, isHidden: false, orderIndex: 1 },
      { input: { p: { val: 1, left: { val: 2, left: null, right: null }, right: null }, q: { val: 1, left: null, right: { val: 2, left: null, right: null } } }, expectedOutput: false, isExample: true, isHidden: false, orderIndex: 2 },
      { input: { p: null, q: null }, expectedOutput: true, isExample: false, isHidden: true, orderIndex: 3 },
      { input: { p: { val: 1, left: null, right: null }, q: { val: 1, left: null, right: null } }, expectedOutput: true, isExample: false, isHidden: true, orderIndex: 4 },
      { input: { p: { val: 1, left: null, right: null }, q: { val: 2, left: null, right: null } }, expectedOutput: false, isExample: false, isHidden: true, orderIndex: 5 },
    ],
  },
  {
    slug: "symmetric-tree",
    title: "Symmetric Tree",
    description: "Given the root of a binary tree, check whether it is a mirror of itself (symmetric around its center).\n\nConstraints: 1 <= nodes <= 1000",
    difficulty: "easy",
    category: ["Tree"],
    starterCode: {
      python: "def is_symmetric(root: dict | None) -> bool:\n    pass\n",
      javascript: "function isSymmetric(root) {\n    return false;\n}\n",
      java: "public boolean isSymmetric(TreeNode root) {\n    return false;\n}\n",
    },
    solutionCode: {
      python: `def is_symmetric(root: dict | None) -> bool:
    def mirror(a, b):
        if not a and not b: return True
        if not a or not b: return False
        return a['val'] == b['val'] and mirror(a.get('left'), b.get('right')) and mirror(a.get('right'), b.get('left'))
    return mirror(root, root) if root else True`,
      javascript: `function isSymmetric(root) {
    function mirror(a, b) {
        if (!a && !b) return true;
        if (!a || !b) return false;
        return a.val === b.val && mirror(a.left, b.right) && mirror(a.right, b.left);
    }
    return root ? mirror(root.left, root.right) : true;
}`,
      java: `public boolean isSymmetric(TreeNode root) {
    return root == null || mirror(root.left, root.right);
}
boolean mirror(TreeNode a, TreeNode b) {
    if (a == null && b == null) return true;
    if (a == null || b == null) return false;
    return a.val == b.val && mirror(a.left, b.right) && mirror(a.right, b.left);
}`,
    },
    testCases: [
      { input: { root: { val: 1, left: { val: 2, left: { val: 3, left: null, right: null }, right: { val: 4, left: null, right: null } }, right: { val: 2, left: { val: 4, left: null, right: null }, right: { val: 3, left: null, right: null } } } }, expectedOutput: true, isExample: true, isHidden: false, orderIndex: 1 },
      { input: { root: { val: 1, left: { val: 2, left: null, right: { val: 3, left: null, right: null } }, right: { val: 2, left: null, right: { val: 3, left: null, right: null } } } }, expectedOutput: false, isExample: true, isHidden: false, orderIndex: 2 },
      { input: { root: null }, expectedOutput: true, isExample: false, isHidden: true, orderIndex: 3 },
      { input: { root: { val: 1, left: null, right: null } }, expectedOutput: true, isExample: false, isHidden: true, orderIndex: 4 },
      { input: { root: { val: 1, left: { val: 2, left: null, right: null }, right: { val: 2, left: null, right: null } } }, expectedOutput: true, isExample: false, isHidden: true, orderIndex: 5 },
    ],
  },
  {
    slug: "power-of-two",
    title: "Power of Two",
    description: "Given an integer n, return true if it is a power of two. Otherwise return false. An integer n is a power of two if there exists an integer x such that n == 2^x.\n\nConstraints: -2^31 <= n <= 2^31 - 1",
    difficulty: "easy",
    category: ["Math", "Bit Manipulation"],
    starterCode: {
      python: "def is_power_of_two(n: int) -> bool:\n    pass\n",
      javascript: "function isPowerOfTwo(n) {\n    return false;\n}\n",
      java: "public boolean isPowerOfTwo(int n) {\n    return false;\n}\n",
    },
    solutionCode: {
      python: `def is_power_of_two(n: int) -> bool:
    return n > 0 and (n & (n - 1)) == 0`,
      javascript: `function isPowerOfTwo(n) {
    return n > 0 && (n & (n - 1)) === 0;
}`,
      java: `public boolean isPowerOfTwo(int n) {
    return n > 0 && (n & (n - 1)) == 0;
}`,
    },
    testCases: [
      { input: { n: 1 }, expectedOutput: true, isExample: true, isHidden: false, orderIndex: 1 },
      { input: { n: 16 }, expectedOutput: true, isExample: true, isHidden: false, orderIndex: 2 },
      { input: { n: 3 }, expectedOutput: false, isExample: false, isHidden: true, orderIndex: 3 },
      { input: { n: 0 }, expectedOutput: false, isExample: false, isHidden: true, orderIndex: 4 },
      { input: { n: 1024 }, expectedOutput: true, isExample: false, isHidden: true, orderIndex: 5 },
    ],
  },
  {
    slug: "counting-bits",
    title: "Counting Bits",
    description: "Given an integer n, return an array ans of length n + 1 such that for each i (0 <= i <= n), ans[i] is the number of 1's in the binary representation of i.\n\nConstraints: 0 <= n <= 10^5",
    difficulty: "easy",
    category: ["Dynamic Programming", "Bit Manipulation"],
    starterCode: {
      python: "def count_bits(n: int) -> list[int]:\n    pass\n",
      javascript: "function countBits(n) {\n    return [];\n}\n",
      java: "public int[] countBits(int n) {\n    return new int[0];\n}\n",
    },
    solutionCode: {
      python: `def count_bits(n: int) -> list[int]:
    res = [0] * (n + 1)
    for i in range(1, n + 1):
        res[i] = res[i >> 1] + (i & 1)
    return res`,
      javascript: `function countBits(n) {
    const res = Array(n + 1).fill(0);
    for (let i = 1; i <= n; i++) res[i] = res[i >> 1] + (i & 1);
    return res;
}`,
      java: `public int[] countBits(int n) {
    int[] res = new int[n + 1];
    for (int i = 1; i <= n; i++) res[i] = res[i >> 1] + (i & 1);
    return res;
}`,
    },
    testCases: [
      { input: { n: 2 }, expectedOutput: [0, 1, 1], isExample: true, isHidden: false, orderIndex: 1 },
      { input: { n: 5 }, expectedOutput: [0, 1, 1, 2, 1, 2], isExample: true, isHidden: false, orderIndex: 2 },
      { input: { n: 0 }, expectedOutput: [0], isExample: false, isHidden: true, orderIndex: 3 },
      { input: { n: 1 }, expectedOutput: [0, 1], isExample: false, isHidden: true, orderIndex: 4 },
      { input: { n: 3 }, expectedOutput: [0, 1, 1, 2], isExample: false, isHidden: true, orderIndex: 5 },
    ],
  },
  {
    slug: "pascals-triangle",
    title: "Pascal's Triangle",
    description: "Given an integer numRows, return the first numRows of Pascal's triangle. In Pascal's triangle, each number is the sum of the two numbers directly above it.\n\nConstraints: 1 <= numRows <= 30",
    difficulty: "easy",
    category: ["Array", "Dynamic Programming"],
    starterCode: {
      python: "def generate(num_rows: int) -> list[list[int]]:\n    pass\n",
      javascript: "function generate(numRows) {\n    return [];\n}\n",
      java: "public List<List<Integer>> generate(int numRows) {\n    return new ArrayList<>();\n}\n",
    },
    solutionCode: {
      python: `def generate(num_rows: int) -> list[list[int]]:
    if num_rows == 0: return []
    res = [[1]]
    for _ in range(num_rows - 1):
        prev = res[-1]
        res.append([1] + [prev[i] + prev[i+1] for i in range(len(prev)-1)] + [1])
    return res`,
      javascript: `function generate(numRows) {
    if (numRows === 0) return [];
    const res = [[1]];
    for (let i = 1; i < numRows; i++) {
        const prev = res[i-1];
        const row = [1];
        for (let j = 0; j < prev.length - 1; j++) row.push(prev[j] + prev[j+1]);
        row.push(1);
        res.push(row);
    }
    return res;
}`,
      java: `public List<List<Integer>> generate(int numRows) {
    List<List<Integer>> res = new ArrayList<>();
    if (numRows == 0) return res;
    res.add(Arrays.asList(1));
    for (int i = 1; i < numRows; i++) {
        List<Integer> prev = res.get(i-1);
        List<Integer> row = new ArrayList<>();
        row.add(1);
        for (int j = 0; j < prev.size() - 1; j++) row.add(prev.get(j) + prev.get(j+1));
        row.add(1);
        res.add(row);
    }
    return res;
}`,
    },
    testCases: [
      { input: { numRows: 5 }, expectedOutput: [[1], [1, 1], [1, 2, 1], [1, 3, 3, 1], [1, 4, 6, 4, 1]], isExample: true, isHidden: false, orderIndex: 1 },
      { input: { numRows: 1 }, expectedOutput: [[1]], isExample: true, isHidden: false, orderIndex: 2 },
      { input: { numRows: 2 }, expectedOutput: [[1], [1, 1]], isExample: false, isHidden: true, orderIndex: 3 },
      { input: { numRows: 3 }, expectedOutput: [[1], [1, 1], [1, 2, 1]], isExample: false, isHidden: true, orderIndex: 4 },
      { input: { numRows: 4 }, expectedOutput: [[1], [1, 1], [1, 2, 1], [1, 3, 3, 1]], isExample: false, isHidden: true, orderIndex: 5 },
    ],
  },
];

