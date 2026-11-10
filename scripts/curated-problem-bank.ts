type Parameter = { name: string; type: 'int' | 'int[]' | 'int[][]' | 'string' | 'string[]' };
type Test = { input: unknown[]; expected: unknown };

export interface CuratedTemplate {
  key: string;
  title: string;
  description: string;
  constraints: string[];
  functionName: string;
  params: Parameter[];
  returnType: 'int' | 'int[]' | 'boolean';
  python: string;
  tests: Test[];
}

const make = (
  key: string,
  title: string,
  description: string,
  functionName: string,
  params: Parameter[],
  returnType: CuratedTemplate['returnType'],
  python: string,
  tests: Test[]
): CuratedTemplate => ({
  key,
  title,
  description,
  constraints: ['Inputs follow the parameter types shown in the method signature.', 'Return the result required by the problem statement.'],
  functionName,
  params,
  returnType,
  python,
  tests,
});

export const CURATED_TEMPLATES: CuratedTemplate[] = [
  make(
    'two-sum',
    'Pair Budget Match',
    'Given an integer array and a target, return the indices of two distinct values whose sum equals the target. Return an empty array if no pair exists.',
    'findPair',
    [{ name: 'values', type: 'int[]' }, { name: 'target', type: 'int' }],
    'int[]',
    `class Solution:
    def findPair(self, values, target):
        seen = {}
        for i, value in enumerate(values):
            if target - value in seen:
                return [seen[target - value], i]
            seen[value] = i
        return []`,
    [
      { input: [[2, 7, 11, 15], 9], expected: [0, 1] },
      { input: [[3, 2, 4], 6], expected: [1, 2] },
      { input: [[3, 3], 6], expected: [0, 1] },
      { input: [[1, 5, 8], 20], expected: [] },
      { input: [[-4, 9, 2, 7], 5], expected: [0, 1] },
    ]
  ),
  make(
    'first-unique',
    'First Unmatched Signal',
    'Given a string, return the index of its first character that occurs exactly once. Return -1 when every character repeats.',
    'firstUniqueIndex',
    [{ name: 'text', type: 'string' }],
    'int',
    `class Solution:
    def firstUniqueIndex(self, text):
        counts = {}
        for char in text:
            counts[char] = counts.get(char, 0) + 1
        for i, char in enumerate(text):
            if counts[char] == 1:
                return i
        return -1`,
    [
      { input: ['leetcode'], expected: 0 },
      { input: ['loveleetcode'], expected: 2 },
      { input: ['aabb'], expected: -1 },
      { input: ['z'], expected: 0 },
      { input: ['aabbccx'], expected: 6 },
    ]
  ),
  make(
    'max-subarray',
    'Maximum Contiguous Signal',
    'Given an integer array, find the largest sum obtainable from any non-empty contiguous subarray.',
    'maxSegmentSum',
    [{ name: 'values', type: 'int[]' }],
    'int',
    `class Solution:
    def maxSegmentSum(self, values):
        best = current = values[0]
        for value in values[1:]:
            current = max(value, current + value)
            best = max(best, current)
        return best`,
    [
      { input: [[-2, 1, -3, 4, -1, 2, 1, -5, 4]], expected: 6 },
      { input: [[1]], expected: 1 },
      { input: [[5, 4, -1, 7, 8]], expected: 23 },
      { input: [[-2, -1]], expected: -1 },
      { input: [[-8, 3, -2, 5, -1]], expected: 6 },
    ]
  ),
  make(
    'longest-unique',
    'Longest Distinct Window',
    'Given a string, return the length of its longest substring containing no repeated characters.',
    'longestDistinctWindow',
    [{ name: 'text', type: 'string' }],
    'int',
    `class Solution:
    def longestDistinctWindow(self, text):
        last = {}
        start = best = 0
        for i, char in enumerate(text):
            if char in last:
                start = max(start, last[char] + 1)
            last[char] = i
            best = max(best, i - start + 1)
        return best`,
    [
      { input: ['abcabcbb'], expected: 3 },
      { input: ['bbbbb'], expected: 1 },
      { input: ['pwwkew'], expected: 3 },
      { input: [''], expected: 0 },
      { input: ['abba'], expected: 2 },
    ]
  ),
  make(
    'next-greater',
    'Next Larger Reading',
    'For each value in an integer array, return the first larger value to its right, or -1 if none exists.',
    'nextLargerValues',
    [{ name: 'values', type: 'int[]' }],
    'int[]',
    `class Solution:
    def nextLargerValues(self, values):
        result = [-1] * len(values)
        stack = []
        for i, value in enumerate(values):
            while stack and values[stack[-1]] < value:
                result[stack.pop()] = value
            stack.append(i)
        return result`,
    [
      { input: [[2, 1, 2, 4, 3]], expected: [4, 2, 4, -1, -1] },
      { input: [[1, 2, 3]], expected: [2, 3, -1] },
      { input: [[3, 2, 1]], expected: [-1, -1, -1] },
      { input: [[]], expected: [] },
      { input: [[2, 2, 3]], expected: [3, 3, -1] },
    ]
  ),
  make(
    'binary-search',
    'Sorted Catalog Lookup',
    'Given a sorted integer array and a target, return the target index, or -1 when it is absent.',
    'findSortedIndex',
    [{ name: 'values', type: 'int[]' }, { name: 'target', type: 'int' }],
    'int',
    `class Solution:
    def findSortedIndex(self, values, target):
        left, right = 0, len(values) - 1
        while left <= right:
            mid = (left + right) // 2
            if values[mid] == target:
                return mid
            if values[mid] < target:
                left = mid + 1
            else:
                right = mid - 1
        return -1`,
    [
      { input: [[1, 3, 5, 7, 9], 7], expected: 3 },
      { input: [[1, 3, 5, 7, 9], 2], expected: -1 },
      { input: [[], 4], expected: -1 },
      { input: [[4], 4], expected: 0 },
      { input: [[-5, -1, 0, 8], -5], expected: 0 },
    ]
  ),
  make(
    'climb-stairs',
    'Two-Step Route Count',
    'A route has n steps. Each move advances either one or two steps. Return the number of distinct ways to reach the end.',
    'countRoutes',
    [{ name: 'steps', type: 'int' }],
    'int',
    `class Solution:
    def countRoutes(self, steps):
        a, b = 1, 1
        for _ in range(steps):
            a, b = b, a + b
        return a`,
    [
      { input: [2], expected: 2 },
      { input: [3], expected: 3 },
      { input: [1], expected: 1 },
      { input: [5], expected: 8 },
      { input: [10], expected: 89 },
    ]
  ),
  make(
    'islands',
    'Connected Land Regions',
    'A grid contains 1 for land and 0 for water. Count land regions connected horizontally or vertically.',
    'countRegions',
    [{ name: 'grid', type: 'string[]' }],
    'int',
    `class Solution:
    def countRegions(self, grid):
        if not grid:
            return 0
        rows, cols = len(grid), len(grid[0])
        seen = set()
        count = 0
        for r in range(rows):
            for c in range(cols):
                if grid[r][c] != '1' or (r, c) in seen:
                    continue
                count += 1
                stack = [(r, c)]
                seen.add((r, c))
                while stack:
                    x, y = stack.pop()
                    for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                        if 0 <= nx < rows and 0 <= ny < cols and grid[nx][ny] == '1' and (nx, ny) not in seen:
                            seen.add((nx, ny))
                            stack.append((nx, ny))
        return count`,
    [
      { input: [['11000', '11000', '00100', '00011']], expected: 3 },
      { input: [['1']], expected: 1 },
      { input: [['0']], expected: 0 },
      { input: [[]], expected: 0 },
      { input: [['101', '010', '101']], expected: 5 },
    ]
  ),
  make(
    'coin-change',
    'Minimum Token Exchange',
    'Given token denominations and a target amount, return the minimum number of tokens needed to make the amount, or -1 if it is impossible.',
    'minimumTokens',
    [{ name: 'coins', type: 'int[]' }, { name: 'amount', type: 'int' }],
    'int',
    `class Solution:
    def minimumTokens(self, coins, amount):
        best = [amount + 1] * (amount + 1)
        best[0] = 0
        for total in range(1, amount + 1):
            for coin in coins:
                if coin <= total:
                    best[total] = min(best[total], best[total - coin] + 1)
        return best[amount] if best[amount] <= amount else -1`,
    [
      { input: [[1, 2, 5], 11], expected: 3 },
      { input: [[2], 3], expected: -1 },
      { input: [[1], 0], expected: 0 },
      { input: [[1, 3, 4], 6], expected: 2 },
      { input: [[2, 5, 10], 27], expected: 4 },
    ]
  ),
  make(
    'topological-order',
    'Dependency Build Order',
    'There are n tasks numbered from 0 to n-1. Each pair [a, b] means task b must finish before task a. Return a valid task order, or an empty array if dependencies contain a cycle.',
    'buildOrder',
    [{ name: 'taskCount', type: 'int' }, { name: 'dependencies', type: 'int[][]' }],
    'int[]',
    `class Solution:
    def buildOrder(self, taskCount, dependencies):
        graph = [[] for _ in range(taskCount)]
        indegree = [0] * taskCount
        for task, prerequisite in dependencies:
            graph[prerequisite].append(task)
            indegree[task] += 1
        ready = [i for i, degree in enumerate(indegree) if degree == 0]
        order = []
        while ready:
            current = ready.pop(0)
            order.append(current)
            for neighbor in graph[current]:
                indegree[neighbor] -= 1
                if indegree[neighbor] == 0:
                    ready.append(neighbor)
                    ready.sort()
        return order if len(order) == taskCount else []`,
    [
      { input: [2, [[1, 0]]], expected: [0, 1] },
      { input: [4, [[1, 0], [2, 0], [3, 1], [3, 2]]], expected: [0, 1, 2, 3] },
      { input: [1, []], expected: [0] },
      { input: [2, [[0, 1], [1, 0]]], expected: [] },
      { input: [3, [[1, 0], [2, 1]]], expected: [0, 1, 2] },
    ]
  ),
  make(
    'sliding-maximum',
    'Peak in Every Window',
    'Given an integer array and a window size k, return the maximum value in each consecutive window of size k.',
    'windowMaximums',
    [{ name: 'values', type: 'int[]' }, { name: 'windowSize', type: 'int' }],
    'int[]',
    `class Solution:
    def windowMaximums(self, values, windowSize):
        from collections import deque
        queue = deque()
        result = []
        for i, value in enumerate(values):
            while queue and queue[0] <= i - windowSize:
                queue.popleft()
            while queue and values[queue[-1]] <= value:
                queue.pop()
            queue.append(i)
            if i >= windowSize - 1:
                result.append(values[queue[0]])
        return result`,
    [
      { input: [[1, 3, -1, -3, 5, 3, 6, 7], 3], expected: [3, 3, 5, 5, 6, 7] },
      { input: [[1], 1], expected: [1] },
      { input: [[9, 8, 7], 2], expected: [9, 8] },
      { input: [[2, 2, 2], 2], expected: [2, 2] },
      { input: [[4, 1, 5, 2], 4], expected: [5] },
    ]
  ),
  make(
    'prefix-function',
    'Repeated Prefix Matcher',
    'For each prefix of a string, return the length of its longest proper prefix that is also a suffix.',
    'prefixLengths',
    [{ name: 'text', type: 'string' }],
    'int[]',
    `class Solution:
    def prefixLengths(self, text):
        prefix = [0] * len(text)
        j = 0
        for i in range(1, len(text)):
            while j and text[i] != text[j]:
                j = prefix[j - 1]
            if text[i] == text[j]:
                j += 1
            prefix[i] = j
        return prefix`,
    [
      { input: ['ababaca'], expected: [0, 0, 1, 2, 3, 0, 1] },
      { input: ['aaaa'], expected: [0, 1, 2, 3] },
      { input: ['abc'], expected: [0, 0, 0] },
      { input: [''], expected: [] },
      { input: ['aabaaab'], expected: [0, 1, 0, 1, 2, 2, 3] },
    ]
  ),
  make(
    'merge-intervals',
    'Overlapping Service Windows',
    'Given intervals [start, end], merge every overlapping interval and return the merged intervals sorted by start.',
    'mergeWindows',
    [{ name: 'intervals', type: 'int[][]' }],
    'int[]',
    `class Solution:
    def mergeWindows(self, intervals):
        merged = []
        for start, end in sorted(intervals):
            if not merged or start > merged[-1][1]:
                merged.append([start, end])
            else:
                merged[-1][1] = max(merged[-1][1], end)
        return merged`,
    [
      { input: [[[1, 3], [2, 6], [8, 10], [15, 18]]], expected: [[1, 6], [8, 10], [15, 18]] },
      { input: [[[1, 4], [4, 5]]], expected: [[1, 5]] },
      { input: [[]], expected: [] },
      { input: [[[5, 7]]], expected: [[5, 7]] },
      { input: [[[1, 10], [2, 3], [9, 12]]], expected: [[1, 12]] },
    ]
  ),
  make(
    'range-sums',
    'Range Ledger Totals',
    'Given an integer array and inclusive index ranges, return the sum of the values in each range.',
    'rangeTotals',
    [{ name: 'values', type: 'int[]' }, { name: 'ranges', type: 'int[][]' }],
    'int[]',
    `class Solution:
    def rangeTotals(self, values, ranges):
        prefix = [0]
        for value in values:
            prefix.append(prefix[-1] + value)
        return [prefix[right + 1] - prefix[left] for left, right in ranges]`,
    [
      { input: [[2, 4, 6, 8], [[0, 1], [1, 3]]], expected: [6, 18] },
      { input: [[5], [[0, 0]]], expected: [5] },
      { input: [[-2, 3, 1], [[0, 2]]], expected: [2] },
      { input: [[1, 2, 3], []], expected: [] },
      { input: [[7, 0, -2, 4], [[2, 3], [0, 3]]], expected: [2, 9] },
    ]
  ),
  make(
    'bipartite',
    'Two-Team Assignment',
    'An undirected graph is given as an adjacency list. Return true if its vertices can be split into two teams so every connected edge joins different teams.',
    'canSplitTeams',
    [{ name: 'graph', type: 'int[][]' }],
    'boolean',
    `class Solution:
    def canSplitTeams(self, graph):
        colors = [0] * len(graph)
        for start in range(len(graph)):
            if colors[start]:
                continue
            colors[start] = 1
            queue = [start]
            while queue:
                node = queue.pop(0)
                for neighbor in graph[node]:
                    if colors[neighbor] == colors[node]:
                        return False
                    if not colors[neighbor]:
                        colors[neighbor] = -colors[node]
                        queue.append(neighbor)
        return True`,
    [
      { input: [[[1, 3], [0, 2], [1, 3], [0, 2]]], expected: true },
      { input: [[[1, 2, 3], [0, 2], [0, 1, 3], [0, 2]]], expected: false },
      { input: [[]], expected: true },
      { input: [[[], []]], expected: true },
      { input: [[[1], [0, 2], [1]]], expected: true },
    ]
  ),
];

export function templateForTopic(topic: string, index: number): CuratedTemplate {
  const normalized = topic.toLowerCase();
  const matchingKeys: string[] =
    /string|trie|kmp/.test(normalized) ? ['first-unique', 'longest-unique', 'prefix-function'] :
    /stack|monotonic/.test(normalized) ? ['next-greater', 'sliding-maximum'] :
    /window|deque|queue/.test(normalized) ? ['longest-unique', 'sliding-maximum'] :
    /binary.search/.test(normalized) ? ['binary-search'] :
    /interval/.test(normalized) ? ['merge-intervals'] :
    /graph|topological|network|flow|matching|union.find|shortest.path/.test(normalized) ? ['topological-order', 'islands', 'bipartite'] :
    /dynamic.program|dp|state|knapsack/.test(normalized) ? ['climb-stairs', 'coin-change'] :
    /range|segment|fenwick/.test(normalized) ? ['range-sums'] :
    /matrix/.test(normalized) ? ['islands'] :
    /heap|priority/.test(normalized) ? ['sliding-maximum'] :
    /two.pointer|greedy/.test(normalized) ? ['longest-unique', 'merge-intervals'] :
    /hash|array|count|bit|xor|in.place/.test(normalized) ? ['two-sum', 'max-subarray', 'first-unique'] :
    ['two-sum', 'max-subarray', 'binary-search'];

  const key = matchingKeys[index % matchingKeys.length];
  return CURATED_TEMPLATES.find((template) => template.key === key)!;
}

export function buildStarterCode(template: CuratedTemplate) {
  const typeNames: Record<Parameter['type'], { python: string; javascript: string; typescript: string; cpp: string; java: string }> = {
    int: { python: 'int', javascript: '', typescript: 'number', cpp: 'int', java: 'int' },
    'int[]': { python: 'list[int]', javascript: '', typescript: 'number[]', cpp: 'vector<int>', java: 'int[]' },
    'int[][]': { python: 'list[list[int]]', javascript: '', typescript: 'number[][]', cpp: 'vector<vector<int>>', java: 'int[][]' },
    string: { python: 'str', javascript: '', typescript: 'string', cpp: 'string', java: 'String' },
    'string[]': { python: 'list[str]', javascript: '', typescript: 'string[]', cpp: 'vector<string>', java: 'String[]' },
  };
  const returnTypes = {
    int: { python: 'int', typescript: 'number', cpp: 'int', java: 'int' },
    'int[]': { python: 'list[int]', typescript: 'number[]', cpp: 'vector<int>', java: 'int[]' },
    boolean: { python: 'bool', typescript: 'boolean', cpp: 'bool', java: 'boolean' },
  }[template.returnType];
  const names = template.params.map((param) => param.name);
  const pythonParams = template.params.map((param) => `${param.name}: ${typeNames[param.type].python}`).join(', ');
  const typedParams = template.params.map((param) => `${param.name}: ${typeNames[param.type].typescript}`).join(', ');
  const cppParams = template.params.map((param) => `${typeNames[param.type].cpp} ${param.name}`).join(', ');
  const javaParams = template.params.map((param) => `${typeNames[param.type].java} ${param.name}`).join(', ');

  return {
    python: `class Solution:\n    def ${template.functionName}(self, ${pythonParams}) -> ${returnTypes.python}:\n        pass`,
    javascript: `function ${template.functionName}(${names.join(', ')}) {\n  return null;\n}`,
    typescript: `function ${template.functionName}(${typedParams}): ${returnTypes.typescript} {\n  return null as ${returnTypes.typescript};\n}`,
    cpp: `#include <string>\n#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    ${returnTypes.cpp} ${template.functionName}(${cppParams}) {\n    }\n};`,
    java: `class Solution {\n    public ${returnTypes.java} ${template.functionName}(${javaParams}) {\n        return ${template.returnType === 'int' ? '0' : template.returnType === 'boolean' ? 'false' : 'new int[0]'};\n    }\n}`,
  };
}
