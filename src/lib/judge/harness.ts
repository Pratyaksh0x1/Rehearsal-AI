/**
 * Wraps user-submitted solution code with a test harness for function-based DSA problems
 * when running against test case inputs. If the user's code already includes a `main` function
 * or reads from stdin directly, it is executed without modification (competitive style).
 */
export function buildExecutableCode(code: string, language: string): string {
  const lang = language.toLowerCase();

  if (lang === 'python' || lang === 'py') {
    // If code already contains standalone competitive script (sys.stdin or input())
    // and no class Solution/def solve, execute directly
    if (
      (code.includes('sys.stdin') || code.includes('input(')) &&
      !code.includes('def solve') &&
      !code.includes('class Solution')
    ) {
      return code;
    }

    // Function-based harness with robust argument parsing
    return `${code}

import sys, json, re

def _clean_input_arg(arg_str):
    arg_str = arg_str.strip()
    m = re.match(r'^[a-zA-Z_]\\w*\\s*=\\s*(.*)$', arg_str, re.DOTALL)
    if m:
        return m.group(1).strip()
    return arg_str

def _parse_args(raw):
    raw = raw.strip()
    if not raw:
        return []

    # Try direct JSON parse after wrapping in brackets
    try:
        val = json.loads(f"[{raw}]")
        if isinstance(val, list):
            return val
    except Exception:
        pass

    parts = []
    current = []
    in_quote = False
    quote_char = ''
    bracket_depth = 0

    lines = [l.strip() for l in raw.split('\\n') if l.strip()]
    if len(lines) > 1 and all('=' in l or l.endswith(',') for l in lines):
        raw = ', '.join([l.rstrip(',') for l in lines])

    for i, c in enumerate(raw):
        if in_quote:
            current.append(c)
            if c == quote_char and (i == 0 or raw[i-1] != '\\\\'):
                in_quote = False
        elif c in ('"', "'"):
            in_quote = True
            quote_char = c
            current.append(c)
        elif c in ('[', '{', '('):
            bracket_depth += 1
            current.append(c)
        elif c in (']', '}', ')'):
            bracket_depth -= 1
            current.append(c)
        elif (c == ',' or c == '\\n') and bracket_depth == 0:
            token = "".join(current).strip()
            if token:
                parts.append(token)
            current = []
        else:
            current.append(c)
    last_token = "".join(current).strip()
    if last_token:
        parts.append(last_token)

    parsed = []
    for p in parts:
        p = _clean_input_arg(p)
        try:
            if p.startswith("'") and p.endswith("'"):
                val = p[1:-1]
            else:
                val = json.loads(p)
            parsed.append(val)
        except Exception:
            if p.lower() == 'true':
                parsed.append(True)
            elif p.lower() == 'false':
                parsed.append(False)
            elif p.lower() in ('null', 'none'):
                parsed.append(None)
            else:
                if (p.startswith('"') and p.endswith('"')) or (p.startswith("'") and p.endswith("'")):
                    p = p[1:-1]
                parsed.append(p)
    return parsed

def _judge_harness():
    raw = sys.stdin.read().strip() if hasattr(sys.stdin, 'read') else ''
    if not raw:
        return
    fn = None
    if 'Solution' in globals():
        inst = Solution()
        known_methods = [
            'solve', 'twoSum', 'isAnagram', 'containsDuplicate', 'maxProfit', 'maxArea',
            'minDistance', 'findOrder', 'cutRibbon', 'evalRPN', 'lengthOfLongestSubstring',
            'maxSubArray', 'search', 'numIslands', 'trap', 'longestCommonPrefix', 'merge',
            'canJump', 'climbStairs', 'coinChange', 'wordBreak'
        ]
        for m in known_methods:
            if hasattr(inst, m) and callable(getattr(inst, m)):
                fn = getattr(inst, m)
                break
        if fn is None:
            methods = [getattr(inst, m) for m in dir(inst) if not m.startswith('_') and callable(getattr(inst, m))]
            if methods:
                fn = methods[0]
    if fn is None:
        if 'solve' in globals() and callable(globals()['solve']):
            fn = globals()['solve']
        else:
            for k, v in list(globals().items()):
                if not k.startswith('_') and callable(v) and k not in ['_judge_harness', '_clean_input_arg', '_parse_args', 'Solution', 'sys', 'json', 're']:
                    fn = v
                    break

    if fn is None:
        return

    args = _parse_args(raw)
    try:
        res = fn(*args) if isinstance(args, list) else fn(args)
    except TypeError:
        # If function expects 0 arguments or single argument directly
        if len(args) == 1:
            res = fn(args[0])
        elif len(args) == 0:
            res = fn()
        else:
            raise

    if isinstance(res, bool):
        print("true" if res else "false")
    elif isinstance(res, (list, dict)):
        print(json.dumps(res))
    else:
        print(res)

if __name__ == '__main__':
    _judge_harness()
`;
  }

  if (lang === 'javascript' || lang === 'js' || lang === 'typescript' || lang === 'ts') {
    if (code.includes('process.stdin') && !code.includes('solve(') && !code.includes('function solve')) {
      return code;
    }

    return `${code}

const fs = require('fs');

function _cleanInputArg(argStr) {
    argStr = (argStr || '').trim();
    const m = argStr.match(/^[a-zA-Z_]\\w*\\s*=\\s*(.*)$/s);
    return m ? m[1].trim() : argStr;
}

function _parseArgs(raw) {
    raw = (raw || '').trim();
    if (!raw) return [];
    try {
        const val = JSON.parse('[' + raw + ']');
        if (Array.isArray(val)) return val;
    } catch (e) {}

    const parts = [];
    let current = [];
    let inQuote = false;
    let quoteChar = '';
    let bracketDepth = 0;

    const lines = raw.split('\\n').map(l => l.trim()).filter(Boolean);
    if (lines.length > 1 && lines.every(l => l.includes('=') || l.endsWith(','))) {
        raw = lines.map(l => l.replace(/,$/, '')).join(', ');
    }

    for (let i = 0; i < raw.length; i++) {
        const c = raw[i];
        if (inQuote) {
            current.push(c);
            if (c === quoteChar && (i === 0 || raw[i-1] !== '\\\\')) {
                inQuote = false;
            }
        } else if (c === '"' || c === "'") {
            inQuote = true;
            quoteChar = c;
            current.push(c);
        } else if (c === '[' || c === '{' || c === '(') {
            bracketDepth++;
            current.push(c);
        } else if (c === ']' || c === '}' || c === ')') {
            bracketDepth--;
            current.push(c);
        } else if ((c === ',' || c === '\\n') && bracketDepth === 0) {
            const tok = current.join('').trim();
            if (tok) parts.push(tok);
            current = [];
        } else {
            current.push(c);
        }
    }
    const lastTok = current.join('').trim();
    if (lastTok) parts.push(lastTok);

    return parts.map(p => {
        p = _cleanInputArg(p);
        try {
            if (p.startsWith("'") && p.endsWith("'")) return p.slice(1, -1);
            return JSON.parse(p);
        } catch (e) {
            if (p.toLowerCase() === 'true') return true;
            if (p.toLowerCase() === 'false') return false;
            if (p.toLowerCase() === 'null') return null;
            if ((p.startsWith('"') && p.endsWith('"')) || (p.startsWith("'") && p.endsWith("'"))) {
                return p.slice(1, -1);
            }
            const num = Number(p);
            return isNaN(num) ? p : num;
        }
    });
}

function _judge_harness() {
    let fn = typeof solve === 'function' ? solve : null;
    const candidates = [
        'solve', 'twoSum', 'isAnagram', 'containsDuplicate', 'maxProfit', 'maxArea',
        'minDistance', 'findOrder', 'cutRibbon', 'evalRPN', 'lengthOfLongestSubstring',
        'maxSubArray', 'search', 'numIslands', 'trap', 'longestCommonPrefix'
    ];

    if (!fn && typeof Solution === 'function') {
        try {
            const inst = new Solution();
            for (const c of candidates) {
                if (typeof inst[c] === 'function') {
                    fn = inst[c].bind(inst);
                    break;
                }
            }
            if (!fn) {
                const proto = Object.getPrototypeOf(inst);
                const methods = Object.getOwnPropertyNames(proto).filter(m => m !== 'constructor' && typeof inst[m] === 'function');
                if (methods.length > 0) {
                    fn = inst[methods[0]].bind(inst);
                }
            }
        } catch (e) {}
    }
    if (!fn) {
        for (const c of candidates) {
            try {
                const found = eval('typeof ' + c + ' === "function" ? ' + c + ' : null');
                if (found) {
                    fn = found;
                    break;
                }
            } catch (e) {}
        }
    }
    if (!fn) return;

    let raw = '';
    try {
        raw = fs.readFileSync(0, 'utf-8').trim();
    } catch (e) {
        return;
    }
    if (!raw) return;

    const args = _parseArgs(raw);
    let res;
    try {
        res = Array.isArray(args) ? fn(...args) : fn(args);
    } catch (err) {
        if (args.length === 1) res = fn(args[0]);
        else throw err;
    }

    if (typeof res === 'boolean') {
        console.log(res ? 'true' : 'false');
    } else if (typeof res === 'object' && res !== null) {
        console.log(JSON.stringify(res));
    } else {
        console.log(res);
    }
}

_judge_harness();
`;
  }

  if (lang === 'cpp' || lang === 'c++') {
    if (code.includes('int main(')) {
      return code;
    }

    const classMatch = code.match(/class\s+Solution\s*\{[\s\S]*?\};/);
    const searchIn = classMatch ? classMatch[0] : code;
    const m = searchIn.match(/(?:public:\s*)?([a-zA-Z0-9_<>\s*&]+?)\s+([a-zA-Z_]\w*)\s*\(([^)]*)\)\s*\{/);

    if (!m) {
      return `#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <algorithm>

using namespace std;

${code}

int main() {
    return 0;
}
`;
    }

    const methodName = m[2].trim();
    const rawParams = m[3].split(',').map((p) => p.trim()).filter(Boolean);

    const argParsers = rawParams.map((p, idx) => {
      const pClean = p.replace(/\s+/g, ' ');
      if (pClean.includes('vector<int>')) {
        return `auto arg${idx} = _judge_parseVectorInt(args.size() > ${idx} ? args[${idx}] : "");`;
      }
      if (pClean.includes('vector<string>')) {
        return `auto arg${idx} = _judge_parseVectorString(args.size() > ${idx} ? args[${idx}] : "");`;
      }
      if (pClean.includes('vector<vector<int>>')) {
        return `auto arg${idx} = _judge_parseVectorVectorInt(args.size() > ${idx} ? args[${idx}] : "");`;
      }
      if (pClean.includes('vector<vector<char>>')) {
        return `auto arg${idx} = _judge_parseVectorVectorChar(args.size() > ${idx} ? args[${idx}] : "");`;
      }
      if (pClean.includes('string')) {
        return `auto arg${idx} = _judge_parseString(args.size() > ${idx} ? args[${idx}] : "");`;
      }
      if (pClean.includes('long long')) {
        return `auto arg${idx} = _judge_parseLongLong(args.size() > ${idx} ? args[${idx}] : "");`;
      }
      if (pClean.includes('double')) {
        return `auto arg${idx} = _judge_parseDouble(args.size() > ${idx} ? args[${idx}] : "");`;
      }
      return `auto arg${idx} = _judge_parseInt(args.size() > ${idx} ? args[${idx}] : "");`;
    });

    const argNames = rawParams.map((_, idx) => `arg${idx}`);

    return `#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <algorithm>
#include <cctype>

using namespace std;

${code}

static string _judge_trim(const string& s) {
    size_t start = s.find_first_not_of(" \\t\\r\\n");
    if (start == string::npos) return "";
    size_t end = s.find_last_not_of(" \\t\\r\\n");
    return s.substr(start, end - start + 1);
}

static string _judge_stripParamName(const string& s) {
    string t = _judge_trim(s);
    size_t eqPos = t.find('=');
    if (eqPos != string::npos && eqPos < 30) {
        bool inQ = false;
        int depth = 0;
        bool validParam = true;
        for (size_t i = 0; i < eqPos; i++) {
            char c = t[i];
            if (c == '"' || c == '\\'') inQ = !inQ;
            else if (c == '[' || c == '{') depth++;
            else if (c == ']' || c == '}') depth--;
            else if (!isalnum(c) && c != '_' && c != ' ') validParam = false;
        }
        if (!inQ && depth == 0 && validParam) {
            return _judge_trim(t.substr(eqPos + 1));
        }
    }
    return t;
}

static vector<string> _judge_splitArgs(const string& str) {
    vector<string> parts;
    string cur = "";
    bool inQuote = false;
    char qChar = 0;
    int depth = 0;
    for (size_t i = 0; i < str.size(); i++) {
        char c = str[i];
        if (inQuote) {
            cur += c;
            if (c == qChar && i > 0 && str[i - 1] != '\\\\') inQuote = false;
        } else if (c == '"' || c == '\\'') {
            inQuote = true;
            qChar = c;
            cur += c;
        } else if (c == '[' || c == '{' || c == '(') {
            depth++;
            cur += c;
        } else if (c == ']' || c == '}' || c == ')') {
            depth--;
            cur += c;
        } else if ((c == ',' || c == '\\n') && depth == 0) {
            string cleaned = _judge_stripParamName(cur);
            if (!cleaned.empty()) parts.push_back(cleaned);
            cur = "";
        } else {
            cur += c;
        }
    }
    string lastCleaned = _judge_stripParamName(cur);
    if (!lastCleaned.empty()) parts.push_back(lastCleaned);
    return parts;
}

static string _judge_parseString(const string& s) {
    string t = _judge_stripParamName(s);
    if (t.size() >= 2 && ((t.front() == '"' && t.back() == '"') || (t.front() == '\\'' && t.back() == '\\''))) {
        return t.substr(1, t.size() - 2);
    }
    return t;
}

static int _judge_parseInt(const string& s) {
    string t = _judge_stripParamName(s);
    try { return stoi(t); } catch (...) { return 0; }
}

static long long _judge_parseLongLong(const string& s) {
    string t = _judge_stripParamName(s);
    try { return stoll(t); } catch (...) { return 0LL; }
}

static double _judge_parseDouble(const string& s) {
    string t = _judge_stripParamName(s);
    try { return stod(t); } catch (...) { return 0.0; }
}

static vector<int> _judge_parseVectorInt(const string& s) {
    vector<int> res;
    string clean = _judge_stripParamName(s);
    if (clean.empty()) return res;
    if (clean.front() == '[') clean = clean.substr(1);
    if (!clean.empty() && clean.back() == ']') clean.pop_back();
    stringstream ss(clean);
    string token;
    while (getline(ss, token, ',')) {
        string t = _judge_trim(token);
        if (!t.empty()) {
            try { res.push_back(stoi(t)); } catch (...) {}
        }
    }
    return res;
}

static vector<string> _judge_parseVectorString(const string& s) {
    vector<string> res;
    string clean = _judge_stripParamName(s);
    if (clean.empty()) return res;
    if (clean.front() == '[') clean = clean.substr(1);
    if (!clean.empty() && clean.back() == ']') clean.pop_back();
    vector<string> tokens = _judge_splitArgs(clean);
    for (const auto& tok : tokens) {
        res.push_back(_judge_parseString(tok));
    }
    return res;
}

static vector<vector<int>> _judge_parseVectorVectorInt(const string& s) {
    vector<vector<int>> res;
    string clean = _judge_stripParamName(s);
    if (clean.empty()) return res;
    if (clean.front() == '[') clean = clean.substr(1);
    if (!clean.empty() && clean.back() == ']') clean.pop_back();
    vector<string> subArrays = _judge_splitArgs(clean);
    for (const auto& sub : subArrays) {
        res.push_back(_judge_parseVectorInt(sub));
    }
    return res;
}

static vector<vector<char>> _judge_parseVectorVectorChar(const string& s) {
    vector<vector<char>> res;
    string clean = _judge_stripParamName(s);
    if (clean.empty()) return res;
    if (clean.front() == '[') clean = clean.substr(1);
    if (!clean.empty() && clean.back() == ']') clean.pop_back();
    vector<string> subArrays = _judge_splitArgs(clean);
    for (const auto& sub : subArrays) {
        vector<string> chars = _judge_splitArgs(sub);
        vector<char> row;
        for (const auto& c : chars) {
            string str = _judge_parseString(c);
            if (!str.empty()) row.push_back(str[0]);
        }
        res.push_back(row);
    }
    return res;
}

static void _judge_printResult(bool val) {
    cout << (val ? "true" : "false") << "\\n";
}

static void _judge_printResult(int val) {
    cout << val << "\\n";
}

static void _judge_printResult(long long val) {
    cout << val << "\\n";
}

static void _judge_printResult(double val) {
    cout << val << "\\n";
}

static void _judge_printResult(const string& val) {
    cout << val << "\\n";
}

static void _judge_printResult(const vector<int>& val) {
    cout << "[";
    for (size_t i = 0; i < val.size(); i++) {
        if (i > 0) cout << ",";
        cout << val[i];
    }
    cout << "]\\n";
}

static void _judge_printResult(const vector<string>& val) {
    cout << "[";
    for (size_t i = 0; i < val.size(); i++) {
        if (i > 0) cout << ",";
        cout << "\\"" << val[i] << "\\"";
    }
    cout << "]\\n";
}

int main() {
    Solution sol;
    string fullInput, line;
    while (getline(cin, line)) {
        if (!fullInput.empty()) fullInput += "\\n";
        fullInput += line;
    }
    fullInput = _judge_trim(fullInput);
    if (fullInput.empty()) return 0;

    vector<string> args = _judge_splitArgs(fullInput);
    ${argParsers.join('\n    ')}
    auto res = sol.${methodName}(${argNames.join(', ')});
    _judge_printResult(res);
    return 0;
}
`;
  }

  if (lang === 'java') {
    if (code.includes('public static void main(')) {
      return code;
    }

    return `import java.util.*;
import java.io.*;

${code}

public class Main {
    public static void main(String[] args) {
        // Runner
    }
}
`;
  }

  return code;
}
