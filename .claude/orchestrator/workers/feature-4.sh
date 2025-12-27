#!/bin/bash
set -e
cd '/Users/dustinober/Projects/Adria_Cross_Edit'
PROMPT=$(cat '/Users/dustinober/Projects/Adria_Cross_Edit/.claude/orchestrator/workers/feature-4.prompt')
claude -p "$PROMPT" --allowedTools Bash,Read,Write,Edit,Glob,Grep 2>&1 | tee '/Users/dustinober/Projects/Adria_Cross_Edit/.claude/orchestrator/workers/feature-4.log'
echo 'WORKER_EXITED' >> '/Users/dustinober/Projects/Adria_Cross_Edit/.claude/orchestrator/workers/feature-4.log'
