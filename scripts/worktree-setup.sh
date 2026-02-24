#!/bin/sh
echo "🚀 Setting up worktree: $W_WORKSPACE_NAME"
echo "📁 Path: $W_WORKSPACE_PATH"
echo "🏠 Root: $W_ROOT_PATH"
echo "📦 Installing dependencies with bun..."
cd "$W_WORKSPACE_PATH" && bun install
